-- Complete the next layer of vertical workflows without changing existing tenant data.
-- Existing sales, stock and specialist routes remain backward compatible.

-- Fashion: cancellation restoration must include exact size/colour allocations.
alter table public.online_order_variant_allocations
  add column if not exists released_at timestamptz;

alter table public.online_order_stock_allocations add column if not exists fulfilled_at timestamptz;
alter table public.online_order_batch_allocations add column if not exists fulfilled_at timestamptz;
alter table public.online_order_variant_allocations add column if not exists released_at timestamptz;
alter table public.online_order_variant_allocations add column if not exists fulfilled_at timestamptz;

create or replace function public.mark_online_order_allocations_fulfilled()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.status in ('shipped','completed') and old.status not in ('shipped','completed') then
    update public.online_order_stock_allocations set fulfilled_at=coalesce(fulfilled_at,now())
      where order_id=new.id and released_at is null;
    update public.online_order_variant_allocations set fulfilled_at=coalesce(fulfilled_at,now())
      where order_id=new.id and released_at is null;
    update public.online_order_batch_allocations set fulfilled_at=coalesce(fulfilled_at,now())
      where order_id=new.id and released_at is null;
  end if;
  return new;
end;
$function$;
revoke all on function public.mark_online_order_allocations_fulfilled() from public,anon,authenticated;
drop trigger if exists mark_online_order_allocations_fulfilled on public.online_orders;
create trigger mark_online_order_allocations_fulfilled
after update of status on public.online_orders
for each row execute function public.mark_online_order_allocations_fulfilled();

create or replace function public.release_online_order_stock()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    update public.branch_stock bs
       set quantity = bs.quantity + a.quantity, updated_at = now()
      from public.online_order_stock_allocations a
     where a.order_id = new.id
       and a.released_at is null
       and a.fulfilled_at is null
       and bs.branch_id = a.branch_id
       and bs.product_id = a.product_id
       and bs.store_id = a.store_id;

    update public.online_order_stock_allocations
       set released_at = now()
     where order_id = new.id and released_at is null and fulfilled_at is null;

    update public.fashion_variant_stock fvs
       set quantity = fvs.quantity + a.quantity, updated_at = now()
      from public.online_order_variant_allocations a
     where a.order_id = new.id
       and a.released_at is null
       and a.fulfilled_at is null
       and a.fashion_variant_stock_id = fvs.id
       and a.store_id = fvs.store_id
       and a.branch_id = fvs.branch_id
       and a.product_id = fvs.product_id;

    update public.online_order_variant_allocations
       set released_at = now()
     where order_id = new.id and released_at is null and fulfilled_at is null;

    update public.inventory_batches ib
       set quantity = ib.quantity + a.quantity,
           status = case
             when ib.expiry_date is not null and ib.expiry_date < current_date then 'expired'
             else 'active'
           end,
           updated_at = now()
      from public.online_order_batch_allocations a
     where a.order_id = new.id
       and a.released_at is null
       and a.fulfilled_at is null
       and a.batch_id = ib.id
       and a.store_id = ib.store_id
       and a.branch_id = ib.branch_id
       and a.product_id = ib.product_id;

    update public.online_order_batch_allocations
       set released_at = now()
     where order_id = new.id and released_at is null and fulfilled_at is null;
  end if;
  return new;
end;
$function$;

revoke all on function public.release_online_order_stock() from public, anon, authenticated;

-- Food service: fractional ingredient quantities and explicit units.
alter table public.food_recipe_ingredients
  alter column quantity_per_serving type numeric(12,4)
  using quantity_per_serving::numeric(12,4);
alter table public.food_recipe_ingredients
  add column if not exists unit text not null default 'unit';
alter table public.food_recipe_ingredients
  add constraint food_recipe_ingredients_unit_nonempty
  check (length(btrim(unit)) between 1 and 32);

create table if not exists public.food_ingredient_stock (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,4) not null default 0 check (quantity >= 0),
  unit text not null check (length(btrim(unit)) between 1 and 32),
  unit_cost numeric(14,6) not null default 0 check (unit_cost >= 0),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique(store_id,branch_id,product_id)
);
create index if not exists food_ingredient_stock_branch_idx
  on public.food_ingredient_stock(store_id,branch_id,product_id);

-- Move existing recipe ingredient stock out of retail branch stock so it cannot
-- be sold twice after recipe deductions switch to the measured ingredient ledger.
do $migration$
begin
  if exists (
    select 1
      from public.food_recipe_ingredients
     group by store_id,branch_id,ingredient_product_id
    having count(distinct unit)>1
  ) then
    raise exception 'A food ingredient is configured with multiple stock units in one branch. Reconcile its recipe units before applying this migration.';
  end if;
end;
$migration$;

insert into public.food_ingredient_stock(store_id,branch_id,product_id,quantity,unit,unit_cost)
select bs.store_id,bs.branch_id,bs.product_id,bs.quantity::numeric,min(r.unit),coalesce(p.cost,0)
  from public.branch_stock bs
  join public.food_recipe_ingredients r
    on r.store_id=bs.store_id and r.branch_id=bs.branch_id and r.ingredient_product_id=bs.product_id
  join public.products p on p.id=bs.product_id and p.store_id=bs.store_id
 group by bs.store_id,bs.branch_id,bs.product_id,bs.quantity,p.cost
on conflict(store_id,branch_id,product_id) do nothing;

update public.branch_stock bs
   set quantity=0,updated_at=now()
 where exists (
   select 1 from public.food_recipe_ingredients r
    where r.store_id=bs.store_id and r.branch_id=bs.branch_id and r.ingredient_product_id=bs.product_id
 );

alter table public.food_waste_records
  alter column quantity type numeric(14,4) using quantity::numeric(14,4);

drop function if exists public.receive_food_ingredient_stock(uuid,uuid,uuid,numeric,text);
create or replace function public.receive_food_ingredient_stock(
  _store_id uuid,_branch_id uuid,_product_id uuid,_quantity numeric,_unit text,_unit_cost numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.has_store_role(_store_id,v_user_id,array['owner','manager']::public.store_role[]) then
    raise exception 'Only a store owner or manager can receive ingredient stock';
  end if;
  if _quantity is null or _quantity <= 0 or _quantity > 100000 then raise exception 'Enter a valid received quantity'; end if;
  if length(btrim(coalesce(_unit,'')))=0 or length(btrim(_unit))>32 then raise exception 'Enter a valid stock unit'; end if;
  if _unit_cost is null or _unit_cost < 0 then raise exception 'Unit cost cannot be negative'; end if;
  if not exists(select 1 from public.branches b where b.id=_branch_id and b.store_id=_store_id) then raise exception 'Invalid branch'; end if;
  if not exists(select 1 from public.products p where p.id=_product_id and p.store_id=_store_id) then raise exception 'Invalid ingredient'; end if;
  insert into public.food_ingredient_stock(store_id,branch_id,product_id,quantity,unit,unit_cost)
    values(_store_id,_branch_id,_product_id,_quantity,btrim(_unit),_unit_cost)
    on conflict(store_id,branch_id,product_id) do update
      set unit_cost=case
            when public.food_ingredient_stock.quantity+excluded.quantity > 0
            then ((public.food_ingredient_stock.quantity*public.food_ingredient_stock.unit_cost)+(excluded.quantity*excluded.unit_cost))/(public.food_ingredient_stock.quantity+excluded.quantity)
            else excluded.unit_cost
          end,
          quantity=public.food_ingredient_stock.quantity+excluded.quantity,
          updated_at=now()
      where public.food_ingredient_stock.unit=excluded.unit
    returning id into v_id;
  if v_id is null then raise exception 'Ingredient stock unit does not match the existing stock unit'; end if;
  return v_id;
end;
$function$;
revoke all on function public.receive_food_ingredient_stock(uuid,uuid,uuid,numeric,text,numeric) from public,anon;
grant execute on function public.receive_food_ingredient_stock(uuid,uuid,uuid,numeric,text,numeric) to authenticated;

drop function if exists public.record_food_waste(uuid,uuid,uuid,integer,text);
create or replace function public.record_food_waste_fractional(
  _store_id uuid,_branch_id uuid,_ingredient_product_id uuid,_quantity numeric,_reason text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_available numeric;
  v_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
  if _quantity is null or _quantity<=0 then raise exception 'Waste quantity must be greater than zero'; end if;
  if length(btrim(coalesce(_reason,'')))<3 then raise exception 'Enter a waste reason'; end if;
  select quantity into v_available from public.food_ingredient_stock
   where store_id=_store_id and branch_id=_branch_id and product_id=_ingredient_product_id
   for update;
  if not found or v_available<_quantity then raise exception 'Not enough ingredient stock to record this waste'; end if;
  update public.food_ingredient_stock set quantity=quantity-_quantity,updated_at=now()
   where store_id=_store_id and branch_id=_branch_id and product_id=_ingredient_product_id;
  insert into public.food_waste_records(store_id,branch_id,ingredient_product_id,quantity,reason,recorded_by)
   values(_store_id,_branch_id,_ingredient_product_id,_quantity,btrim(_reason),v_user_id)
   returning id into v_id;
  return v_id;
end;
$function$;
revoke all on function public.record_food_waste_fractional(uuid,uuid,uuid,numeric,text) from public,anon;
grant execute on function public.record_food_waste_fractional(uuid,uuid,uuid,numeric,text) to authenticated;

create or replace function public.record_food_waste(
  _store_id uuid,_branch_id uuid,_ingredient_product_id uuid,_quantity integer,_reason text
)
returns uuid
language sql
security definer
set search_path to ''
as $function$
  select public.record_food_waste_fractional(_store_id,_branch_id,_ingredient_product_id,_quantity::numeric,_reason);
$function$;
revoke all on function public.record_food_waste(uuid,uuid,uuid,integer,text) from public,anon;
grant execute on function public.record_food_waste(uuid,uuid,uuid,integer,text) to authenticated;


-- Electronics: track repair payments separately from repair estimates/final cost.
alter table public.electronics_repairs
  add column if not exists paid_amount numeric(12,2) not null default 0
  check (paid_amount >= 0);

create table if not exists public.electronics_repair_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  repair_id uuid not null references public.electronics_repairs(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','card','transfer')),
  reference text not null,
  note text not null default '',
  received_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(store_id, reference)
);
create index if not exists electronics_repair_payments_repair_idx
  on public.electronics_repair_payments(store_id, repair_id, created_at desc);

create or replace function public.record_electronics_repair_payment(
  _store_id uuid,
  _repair_id uuid,
  _amount numeric,
  _payment_method text,
  _reference text,
  _note text default ''
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_repair public.electronics_repairs%rowtype;
  v_payment_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.has_store_role(_store_id, v_user_id, array['owner','manager','cashier']::public.store_role[]) then
    raise exception 'Not authorized for this store';
  end if;
  if _amount is null or _amount <= 0 then raise exception 'Payment amount must be greater than zero'; end if;
  if _payment_method not in ('cash','card','transfer') then raise exception 'Invalid payment method'; end if;
  if length(btrim(coalesce(_reference,''))) < 3 then raise exception 'Enter a payment reference'; end if;

  select * into v_repair
    from public.electronics_repairs
   where id = _repair_id and store_id = _store_id
   for update;
  if not found then raise exception 'Repair job not found'; end if;
  if v_repair.status not in ('received','diagnosing','waiting_parts','ready') then
    raise exception 'Payments cannot be recorded for this repair status';
  end if;
  if v_repair.paid_amount + _amount > greatest(v_repair.final_cost, v_repair.estimated_cost) then
    raise exception 'Payment exceeds the current repair amount due';
  end if;

  insert into public.electronics_repair_payments
    (store_id,repair_id,amount,payment_method,reference,note,received_by)
  values
    (_store_id,_repair_id,_amount,_payment_method,btrim(_reference),btrim(coalesce(_note,'')),v_user_id)
  returning id into v_payment_id;

  perform pg_catalog.set_config('app.allow_vertical_balance_update','on',true);
  update public.electronics_repairs
     set paid_amount = paid_amount + _amount, updated_at = now()
   where id = _repair_id and store_id = _store_id;
  perform pg_catalog.set_config('app.allow_vertical_balance_update','off',true);
  return v_payment_id;
end;
$function$;
revoke all on function public.record_electronics_repair_payment(uuid,uuid,numeric,text,text,text) from public, anon;
grant execute on function public.record_electronics_repair_payment(uuid,uuid,numeric,text,text,text) to authenticated;

-- Pharmacy: product-specific dispensing rules, traceable lots and recall history.
create table if not exists public.pharmacy_product_profiles (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  requires_prescription boolean not null default false,
  controlled_class text,
  minimum_patient_age integer check (minimum_patient_age between 0 and 120),
  dosage_form text not null default '',
  strength text not null default '',
  instructions text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, product_id)
);

create table if not exists public.pharmacy_batches (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  batch_number text not null,
  manufacturer text not null default '',
  supplier_name text not null default '',
  received_quantity integer not null check (received_quantity > 0),
  available_quantity integer not null check (available_quantity >= 0),
  expiry_date date not null,
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  recall_status text not null default 'clear' check (recall_status in ('clear','quarantined','recalled')),
  received_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, branch_id, product_id, batch_number),
  check (available_quantity <= received_quantity)
);
create index if not exists pharmacy_batches_fefo_idx
  on public.pharmacy_batches(store_id, branch_id, product_id, expiry_date, received_at)
  where available_quantity > 0 and recall_status = 'clear';

create table if not exists public.pharmacy_dispensing_records (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  batch_id uuid not null references public.pharmacy_batches(id) on delete restrict,
  sale_item_id uuid not null references public.sale_items(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  prescription_reference text not null default '',
  patient_name text not null default '',
  dispensed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists pharmacy_dispensing_sale_item_idx
  on public.pharmacy_dispensing_records(store_id, sale_item_id);

create table if not exists public.pharmacy_recalls (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  batch_id uuid not null references public.pharmacy_batches(id) on delete restrict,
  reason text not null,
  authority_reference text not null default '',
  status text not null default 'open' check (status in ('open','contained','resolved')),
  reported_by uuid not null references auth.users(id),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- Fashion returns: record real refund settlement separately from stock restocking.
alter table public.sale_returns
  add column if not exists refunded_amount numeric(12,2) not null default 0 check (refunded_amount >= 0),
  add column if not exists refund_status text not null default 'unpaid' check (refund_status in ('unpaid','partially_refunded','refunded')),
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists replacement_sale_id uuid references public.sales(id) on delete set null;

create table if not exists public.sale_return_refunds (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  return_id uuid not null references public.sale_returns(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','card','transfer')),
  reference text not null,
  note text not null default '',
  received_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(store_id,reference)
);
create index if not exists sale_return_refunds_return_idx
  on public.sale_return_refunds(store_id,return_id,created_at desc);

create or replace function public.record_sale_return_refund(
  _store_id uuid,_return_id uuid,_amount numeric,_payment_method text,_reference text,_note text default ''
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_return public.sale_returns%rowtype;
  v_refund_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
  if _amount is null or _amount<=0 then raise exception 'Refund amount must be greater than zero'; end if;
  if _payment_method not in ('cash','card','transfer') then raise exception 'Invalid refund method'; end if;
  if length(btrim(coalesce(_reference,'')))<3 then raise exception 'Enter a refund reference'; end if;
  select * into v_return from public.sale_returns where id=_return_id and store_id=_store_id for update;
  if not found then raise exception 'Return record not found'; end if;
  if v_return.refunded_amount+_amount>v_return.total_amount then raise exception 'Refund exceeds the remaining return value'; end if;
  insert into public.sale_return_refunds(store_id,return_id,amount,payment_method,reference,note,received_by)
    values(_store_id,_return_id,_amount,_payment_method,btrim(_reference),btrim(coalesce(_note,'')),v_user_id)
    returning id into v_refund_id;
  perform pg_catalog.set_config('app.allow_sale_return_refund_update','on',true);
  update public.sale_returns
     set refunded_amount=refunded_amount+_amount,
         refund_status=case when refunded_amount+_amount>=total_amount then 'refunded' else 'partially_refunded' end,
         updated_at=now()
   where id=_return_id and store_id=_store_id;
  perform pg_catalog.set_config('app.allow_sale_return_refund_update','off',true);
  return v_refund_id;
end;
$function$;
revoke all on function public.record_sale_return_refund(uuid,uuid,numeric,text,text,text) from public,anon;
grant execute on function public.record_sale_return_refund(uuid,uuid,numeric,text,text,text) to authenticated;

create or replace function public.link_sale_return_replacement_sale(
  _store_id uuid,_return_id uuid,_replacement_sale_reference text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_return public.sale_returns%rowtype;
  v_replacement_id uuid;
begin
  if v_user_id is null or not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then
    raise exception 'Not authorized for this store';
  end if;
  if length(btrim(coalesce(_replacement_sale_reference,'')))<3 then raise exception 'Enter the replacement receipt reference'; end if;
  select * into v_return from public.sale_returns where id=_return_id and store_id=_store_id for update;
  if not found then raise exception 'Return record not found'; end if;
  if v_return.replacement_sale_id is not null then raise exception 'A replacement sale is already linked to this return'; end if;
  select id into v_replacement_id from public.sales
   where store_id=_store_id and reference=btrim(_replacement_sale_reference) and id<>v_return.sale_id;
  if not found then raise exception 'Replacement sale not found in this store'; end if;
  perform pg_catalog.set_config('app.allow_sale_return_replacement_update','on',true);
  update public.sale_returns set replacement_sale_id=v_replacement_id,updated_at=now()
   where id=_return_id and store_id=_store_id;
  perform pg_catalog.set_config('app.allow_sale_return_replacement_update','off',true);
  return v_replacement_id;
end;
$function$;
revoke all on function public.link_sale_return_replacement_sale(uuid,uuid,text) from public,anon;
grant execute on function public.link_sale_return_replacement_sale(uuid,uuid,text) to authenticated;

create or replace function public.guard_sale_return_refund_balance()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if (new.refunded_amount is distinct from old.refunded_amount or new.refund_status is distinct from old.refund_status)
     and pg_catalog.current_setting('app.allow_sale_return_refund_update',true) is distinct from 'on' then
    raise exception 'Refund totals can only be changed by the refund ledger';
  end if;
  if new.replacement_sale_id is distinct from old.replacement_sale_id
     and pg_catalog.current_setting('app.allow_sale_return_replacement_update',true) is distinct from 'on' then
    raise exception 'Replacement sales can only be linked by the exchange workflow';
  end if;
  return new;
end;
$function$;
revoke all on function public.guard_sale_return_refund_balance() from public,anon,authenticated;
drop trigger if exists guard_sale_return_refund_balance on public.sale_returns;
create trigger guard_sale_return_refund_balance
before update of refunded_amount,refund_status on public.sale_returns
for each row execute function public.guard_sale_return_refund_balance();

-- Beauty: service catalogue, appointments and auditable consumable usage.
create table if not exists public.beauty_services (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  description text not null default '',
  duration_minutes integer not null check (duration_minutes between 5 and 1440),
  price numeric(12,2) not null check (price >= 0),
  buffer_minutes integer not null default 0 check (buffer_minutes between 0 and 240),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, name)
);

create table if not exists public.beauty_appointments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  assigned_staff_id uuid references auth.users(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked'
    check (status in ('booked','confirmed','checked_in','in_progress','completed','cancelled','no_show')),
  notes text not null default '',
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (length(btrim(customer_name)) > 0),
  check (length(btrim(customer_phone)) > 0)
);
create index if not exists beauty_appointments_calendar_idx
  on public.beauty_appointments(store_id, branch_id, starts_at, status);

alter table public.beauty_appointments
  add column if not exists paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0);

create table if not exists public.beauty_appointment_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  appointment_id uuid not null references public.beauty_appointments(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','card','transfer')),
  reference text not null,
  received_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(store_id,reference)
);

create or replace function public.record_beauty_appointment_payment(
  _store_id uuid,_appointment_id uuid,_amount numeric,_payment_method text,_reference text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_appointment public.beauty_appointments%rowtype;
  v_total numeric(12,2);
  v_payment_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
  if _amount is null or _amount <= 0 then raise exception 'Payment must be greater than zero'; end if;
  if _payment_method not in ('cash','card','transfer') then raise exception 'Invalid payment method'; end if;
  if length(btrim(coalesce(_reference,''))) < 3 then raise exception 'Enter a payment reference'; end if;
  select * into v_appointment from public.beauty_appointments
   where id=_appointment_id and store_id=_store_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  if v_appointment.status in ('cancelled','no_show') then raise exception 'Cannot take payment for a cancelled or missed appointment'; end if;
  select coalesce(sum(unit_price*quantity),0)::numeric(12,2) into v_total
    from public.beauty_appointment_services
   where appointment_id=_appointment_id and store_id=_store_id;
  v_total := greatest(v_total, v_appointment.deposit_amount);
  if v_total <= 0 then raise exception 'Add a priced service or deposit before taking payment'; end if;
  if v_appointment.paid_amount + _amount > v_total then raise exception 'Payment exceeds the appointment balance'; end if;
  insert into public.beauty_appointment_payments(store_id,appointment_id,amount,payment_method,reference,received_by)
    values(_store_id,_appointment_id,_amount,_payment_method,btrim(_reference),v_user_id)
    returning id into v_payment_id;
  perform pg_catalog.set_config('app.allow_vertical_balance_update','on',true);
  update public.beauty_appointments set paid_amount=paid_amount+_amount,updated_at=now()
   where id=_appointment_id and store_id=_store_id;
  perform pg_catalog.set_config('app.allow_vertical_balance_update','off',true);
  return v_payment_id;
end;
$function$;
revoke all on function public.record_beauty_appointment_payment(uuid,uuid,numeric,text,text) from public,anon;
grant execute on function public.record_beauty_appointment_payment(uuid,uuid,numeric,text,text) to authenticated;

create or replace function public.list_store_staff(_store_id uuid)
returns table(user_id uuid, display_name text, role text)
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null or not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then
    raise exception 'Not authorized for this store';
  end if;
  return query
    select sm.user_id,
      coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),u.email,'Team member')::text,
      sm.role::text
    from public.store_members sm
    join auth.users u on u.id=sm.user_id
    where sm.store_id=_store_id
    union
    select s.owner_id,
      coalesce(nullif(u.raw_user_meta_data->>'full_name',''),nullif(u.raw_user_meta_data->>'name',''),u.email,'Store owner')::text,
      'owner'::text
    from public.stores s
    join auth.users u on u.id=s.owner_id
    where s.id=_store_id and not exists(
      select 1 from public.store_members sm where sm.store_id=_store_id and sm.user_id=s.owner_id
    );
end;
$function$;
revoke all on function public.list_store_staff(uuid) from public,anon;
grant execute on function public.list_store_staff(uuid) to authenticated;

create table if not exists public.beauty_appointment_services (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  appointment_id uuid not null references public.beauty_appointments(id) on delete cascade,
  service_id uuid not null references public.beauty_services(id) on delete restrict,
  service_name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.beauty_consumable_usage (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  appointment_id uuid not null references public.beauty_appointments(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(12,4) not null check (quantity > 0),
  unit text not null default 'unit',
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

-- General services: job cards, line items, milestones and payments.
create table if not exists public.service_catalog (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  description text not null default '',
  default_price numeric(12,2) not null default 0 check (default_price >= 0),
  estimated_duration_minutes integer check (estimated_duration_minutes > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, name)
);

create table if not exists public.service_jobs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  reference text not null,
  title text not null,
  description text not null default '',
  assigned_staff_id uuid references auth.users(id) on delete set null,
  status text not null default 'requested'
    check (status in ('requested','quoted','approved','in_progress','on_hold','completed','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  quoted_amount numeric(12,2) not null default 0 check (quoted_amount >= 0),
  final_amount numeric(12,2) not null default 0 check (final_amount >= 0),
  amount_paid numeric(12,2) not null default 0 check (amount_paid >= 0),
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, reference),
  check (amount_paid <= greatest(quoted_amount, final_amount))
);
create index if not exists service_jobs_queue_idx
  on public.service_jobs(store_id, branch_id, status, priority, created_at desc);

create table if not exists public.service_job_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  job_id uuid not null references public.service_jobs(id) on delete cascade,
  service_id uuid references public.service_catalog(id) on delete set null,
  description text not null,
  quantity numeric(12,4) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at timestamptz not null default now()
);

create table if not exists public.service_job_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  job_id uuid not null references public.service_jobs(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','card','transfer')),
  reference text not null,
  received_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(store_id, reference)
);

-- A service payment atomically updates the job's paid balance.
create or replace function public.apply_service_job_payment()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_job public.service_jobs%rowtype;
begin
  select * into v_job
    from public.service_jobs
   where id = new.job_id and store_id = new.store_id
   for update;
  if not found then raise exception 'Service job not found'; end if;
  if v_job.amount_paid + new.amount > greatest(v_job.quoted_amount, v_job.final_amount) then
    raise exception 'Payment exceeds the remaining job balance';
  end if;
  perform pg_catalog.set_config('app.allow_vertical_balance_update','on',true);
  update public.service_jobs
     set amount_paid = amount_paid + new.amount, updated_at = now()
   where id = new.job_id and store_id = new.store_id;
  perform pg_catalog.set_config('app.allow_vertical_balance_update','off',true);
  return new;
end;
$function$;
revoke all on function public.apply_service_job_payment() from public, anon, authenticated;
drop trigger if exists apply_service_job_payment on public.service_job_payments;
create trigger apply_service_job_payment
before insert on public.service_job_payments
for each row execute function public.apply_service_job_payment();

-- Prevent double-booking a named staff member, including concurrent requests.
create or replace function public.guard_beauty_appointment_schedule()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.assigned_staff_id is not null and not (
    exists(select 1 from public.store_members sm where sm.store_id=new.store_id and sm.user_id=new.assigned_staff_id)
    or exists(select 1 from public.stores s where s.id=new.store_id and s.owner_id=new.assigned_staff_id)
  ) then
    raise exception 'Assigned staff member does not belong to this store';
  end if;
  if new.status not in ('cancelled','no_show') then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(new.store_id::text || ':branch:' || new.branch_id::text, 0)
    );
    if new.assigned_staff_id is not null then
      perform pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(new.store_id::text || ':staff:' || new.assigned_staff_id::text, 0)
      );
    end if;
    if exists (
      select 1
        from public.beauty_appointments a
       where a.store_id = new.store_id
         and a.id is distinct from new.id
         and a.status not in ('cancelled','no_show')
         and a.starts_at < new.ends_at
         and a.ends_at > new.starts_at
         and (
           (new.assigned_staff_id is not null and a.assigned_staff_id = new.assigned_staff_id)
           or (a.branch_id = new.branch_id and (a.assigned_staff_id is null or new.assigned_staff_id is null))
         )
    ) then
      raise exception 'This staff member or unassigned branch slot already has an appointment during that time';
    end if;
  end if;
  return new;
end;
$function$;
revoke all on function public.guard_beauty_appointment_schedule() from public, anon, authenticated;
drop trigger if exists guard_beauty_appointment_schedule on public.beauty_appointments;
create trigger guard_beauty_appointment_schedule
before insert or update of starts_at, ends_at, assigned_staff_id, status
on public.beauty_appointments
for each row execute function public.guard_beauty_appointment_schedule();

-- Services: appointment booking, staff scheduling and deposits alongside job cards.
alter table public.service_catalog
  add column if not exists duration_minutes integer not null default 30
  check (duration_minutes between 5 and 1440);

create table if not exists public.service_appointments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  service_id uuid not null references public.service_catalog(id) on delete restrict,
  service_name text not null,
  customer_name text not null,
  customer_phone text not null,
  assigned_staff_id uuid references auth.users(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'booked' check (status in ('booked','confirmed','checked_in','in_progress','completed','cancelled','no_show')),
  price numeric(12,2) not null default 0 check (price >= 0),
  deposit_amount numeric(12,2) not null default 0 check (deposit_amount >= 0),
  paid_amount numeric(12,2) not null default 0 check (paid_amount >= 0),
  notes text not null default '',
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index if not exists service_appointments_calendar_idx
  on public.service_appointments(store_id,branch_id,starts_at);
create index if not exists service_appointments_staff_idx
  on public.service_appointments(store_id,assigned_staff_id,starts_at);

create table if not exists public.service_appointment_payments (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  appointment_id uuid not null references public.service_appointments(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','card','transfer')),
  reference text not null,
  received_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique(store_id,reference)
);

create or replace function public.guard_service_appointment_schedule()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.assigned_staff_id is not null and not (
    exists(select 1 from public.store_members sm where sm.store_id=new.store_id and sm.user_id=new.assigned_staff_id)
    or exists(select 1 from public.stores s where s.id=new.store_id and s.owner_id=new.assigned_staff_id)
  ) then raise exception 'Assigned staff member does not belong to this store'; end if;
  if new.status not in ('cancelled','no_show') then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.store_id::text||':branch:'||new.branch_id::text,0));
    if new.assigned_staff_id is not null then
      perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.store_id::text||':staff:'||new.assigned_staff_id::text,0));
    end if;
    if exists(
      select 1 from public.service_appointments a
       where a.store_id=new.store_id and a.id is distinct from new.id
         and a.status not in ('cancelled','no_show')
         and a.starts_at<new.ends_at and a.ends_at>new.starts_at
         and (
           (new.assigned_staff_id is not null and a.assigned_staff_id=new.assigned_staff_id)
           or (a.branch_id=new.branch_id and (a.assigned_staff_id is null or new.assigned_staff_id is null))
         )
    ) then raise exception 'This staff member or unassigned branch slot already has an appointment during that time'; end if;
  end if;
  return new;
end;
$function$;
revoke all on function public.guard_service_appointment_schedule() from public,anon,authenticated;
drop trigger if exists guard_service_appointment_schedule on public.service_appointments;
create trigger guard_service_appointment_schedule
before insert or update of starts_at,ends_at,assigned_staff_id,status on public.service_appointments
for each row execute function public.guard_service_appointment_schedule();

create or replace function public.record_service_appointment_payment(
  _store_id uuid,_appointment_id uuid,_amount numeric,_payment_method text,_reference text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid:=auth.uid();
  v_appointment public.service_appointments%rowtype;
  v_total numeric(12,2);
  v_payment_id uuid;
begin
  if v_user_id is null or not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
  if _amount is null or _amount<=0 then raise exception 'Payment must be greater than zero'; end if;
  if _payment_method not in ('cash','card','transfer') then raise exception 'Invalid payment method'; end if;
  if length(btrim(coalesce(_reference,'')))<3 then raise exception 'Enter a payment reference'; end if;
  select * into v_appointment from public.service_appointments where id=_appointment_id and store_id=_store_id for update;
  if not found then raise exception 'Appointment not found'; end if;
  if v_appointment.status in ('cancelled','no_show') then raise exception 'Cannot take payment for a cancelled or missed appointment'; end if;
  v_total:=greatest(v_appointment.price,v_appointment.deposit_amount);
  if v_appointment.paid_amount+_amount>v_total then raise exception 'Payment exceeds the appointment balance'; end if;
  insert into public.service_appointment_payments(store_id,appointment_id,amount,payment_method,reference,received_by)
    values(_store_id,_appointment_id,_amount,_payment_method,btrim(_reference),v_user_id)
    returning id into v_payment_id;
  perform pg_catalog.set_config('app.allow_vertical_balance_update','on',true);
  update public.service_appointments set paid_amount=paid_amount+_amount,updated_at=now()
    where id=_appointment_id and store_id=_store_id;
  perform pg_catalog.set_config('app.allow_vertical_balance_update','off',true);
  return v_payment_id;
end;
$function$;
revoke all on function public.record_service_appointment_payment(uuid,uuid,numeric,text,text) from public,anon;
grant execute on function public.record_service_appointment_payment(uuid,uuid,numeric,text,text) to authenticated;

-- Balance fields are ledger-managed: clients cannot edit paid totals directly.
create or replace function public.guard_vertical_payment_balance()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_new_balance text;
  v_old_balance text;
begin
  v_new_balance := coalesce(to_jsonb(new)->>'paid_amount',to_jsonb(new)->>'amount_paid');
  v_old_balance := coalesce(to_jsonb(old)->>'paid_amount',to_jsonb(old)->>'amount_paid');
  if v_new_balance is distinct from v_old_balance
     and pg_catalog.current_setting('app.allow_vertical_balance_update',true) is distinct from 'on' then
    raise exception 'Payment balances can only be changed by the payment ledger';
  end if;
  return new;
end;
$function$;
revoke all on function public.guard_vertical_payment_balance() from public,anon,authenticated;
drop trigger if exists guard_electronics_repair_paid_amount on public.electronics_repairs;
create trigger guard_electronics_repair_paid_amount
before update of paid_amount on public.electronics_repairs
for each row execute function public.guard_vertical_payment_balance();
drop trigger if exists guard_beauty_appointment_paid_amount on public.beauty_appointments;
create trigger guard_beauty_appointment_paid_amount
before update of paid_amount on public.beauty_appointments
for each row execute function public.guard_vertical_payment_balance();
drop trigger if exists guard_service_job_paid_amount on public.service_jobs;
create trigger guard_service_job_paid_amount
before update of amount_paid on public.service_jobs
for each row execute function public.guard_vertical_payment_balance();
drop trigger if exists guard_service_appointment_paid_amount on public.service_appointments;
create trigger guard_service_appointment_paid_amount
before update of paid_amount on public.service_appointments
for each row execute function public.guard_vertical_payment_balance();

-- Apply tenant isolation to every new vertical table. Payment ledgers are append-only.
do $policy$
declare
  t text;
begin
  foreach t in array array[
    'electronics_repair_payments','food_ingredient_stock','sale_return_refunds',
    'pharmacy_product_profiles','pharmacy_batches','pharmacy_dispensing_records','pharmacy_recalls',
    'beauty_services','beauty_appointments','beauty_appointment_services','beauty_appointment_payments','beauty_consumable_usage','service_appointments','service_appointment_payments',
    'service_catalog','service_jobs','service_job_items','service_job_payments'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);
    execute format('drop policy if exists %I on public.%I', t || '_store_member_select', t);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_store_member(store_id, (select auth.uid())))',
      t || '_store_member_select', t
    );
  end loop;
end;
$policy$;

create policy food_ingredient_stock_manager_insert on public.food_ingredient_stock
  for insert to authenticated
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
    and exists(select 1 from public.products p where p.id=product_id and p.store_id=food_ingredient_stock.store_id)
    and exists(select 1 from public.branches b where b.id=branch_id and b.store_id=food_ingredient_stock.store_id)
  );

-- Manager-only configuration and stock receiving.
create policy pharmacy_profiles_manager_write on public.pharmacy_product_profiles
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
    and exists(select 1 from public.products p where p.id=product_id and p.store_id=pharmacy_product_profiles.store_id)
  );
create policy pharmacy_batches_manager_insert on public.pharmacy_batches
  for insert to authenticated
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
    and exists(select 1 from public.products p where p.id=product_id and p.store_id=pharmacy_batches.store_id)
    and exists(select 1 from public.branches b where b.id=branch_id and b.store_id=pharmacy_batches.store_id)
  );
create policy pharmacy_batches_manager_update on public.pharmacy_batches
  for update to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
    and exists(select 1 from public.products p where p.id=product_id and p.store_id=pharmacy_batches.store_id)
    and exists(select 1 from public.branches b where b.id=branch_id and b.store_id=pharmacy_batches.store_id)
  );

create policy pharmacy_recalls_manager_insert on public.pharmacy_recalls
  for insert to authenticated
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
    and reported_by=(select auth.uid())
    and exists(select 1 from public.pharmacy_batches b where b.id=batch_id and b.store_id=pharmacy_recalls.store_id)
  );
create policy pharmacy_recalls_manager_update on public.pharmacy_recalls
  for update to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
    and exists(select 1 from public.pharmacy_batches b where b.id=batch_id and b.store_id=pharmacy_recalls.store_id)
  );

-- Pharmacy dispensing is a staff operation, but the referenced batch and sale line
-- must belong to the same tenant and branch.
create policy pharmacy_dispensing_records_cashier_insert on public.pharmacy_dispensing_records
  for insert to authenticated
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
    and dispensed_by=(select auth.uid())
    and exists(select 1 from public.pharmacy_batches b where b.id=batch_id and b.store_id=pharmacy_dispensing_records.store_id and b.branch_id=pharmacy_dispensing_records.branch_id)
    and exists(select 1 from public.sale_items si where si.id=sale_item_id and si.store_id=pharmacy_dispensing_records.store_id)
  );

-- Beauty and service configuration is manager-controlled; staff can manage daily bookings/jobs.
create policy service_appointments_staff_write on public.service_appointments
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
    and exists(select 1 from public.branches b where b.id=branch_id and b.store_id=service_appointments.store_id)
    and exists(select 1 from public.service_catalog s where s.id=service_id and s.store_id=service_appointments.store_id)
    and (assigned_staff_id is null or exists(select 1 from public.store_members sm where sm.store_id=service_appointments.store_id and sm.user_id=service_appointments.assigned_staff_id) or exists(select 1 from public.stores s where s.id=service_appointments.store_id and s.owner_id=service_appointments.assigned_staff_id))
  );

create policy beauty_services_manager_write on public.beauty_services
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
  with check (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]));

create policy beauty_appointments_staff_write on public.beauty_appointments
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
    and exists(select 1 from public.branches b where b.id=branch_id and b.store_id=beauty_appointments.store_id)
    and (customer_id is null or exists(select 1 from public.customers c where c.id=customer_id and c.store_id=beauty_appointments.store_id))
  );

create policy beauty_appointment_services_staff_write on public.beauty_appointment_services
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
    and exists(select 1 from public.beauty_appointments a where a.id=appointment_id and a.store_id=beauty_appointment_services.store_id)
    and exists(select 1 from public.beauty_services s where s.id=service_id and s.store_id=beauty_appointment_services.store_id)
  );

create policy beauty_consumable_usage_staff_insert on public.beauty_consumable_usage
  for insert to authenticated
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
    and recorded_by=(select auth.uid())
    and exists(select 1 from public.beauty_appointments a where a.id=appointment_id and a.store_id=beauty_consumable_usage.store_id and a.branch_id=beauty_consumable_usage.branch_id)
    and exists(select 1 from public.products p where p.id=product_id and p.store_id=beauty_consumable_usage.store_id)
  );

create policy service_catalog_manager_write on public.service_catalog
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
  with check (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]));

create policy service_jobs_staff_write on public.service_jobs
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
    and exists(select 1 from public.branches b where b.id=branch_id and b.store_id=service_jobs.store_id)
    and (customer_id is null or exists(select 1 from public.customers c where c.id=customer_id and c.store_id=service_jobs.store_id))
    and (assigned_staff_id is null or exists(select 1 from public.store_members sm where sm.store_id=service_jobs.store_id and sm.user_id=service_jobs.assigned_staff_id) or exists(select 1 from public.stores s where s.id=service_jobs.store_id and s.owner_id=service_jobs.assigned_staff_id))
  );

create policy service_job_items_staff_write on public.service_job_items
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
    and exists(select 1 from public.service_jobs j where j.id=job_id and j.store_id=service_job_items.store_id)
    and (service_id is null or exists(select 1 from public.service_catalog s where s.id=service_id and s.store_id=service_job_items.store_id))
  );

-- Payment ledgers are insert-only for staff and managers; no client-side editing/deletion.
create policy electronics_repair_payments_cashier_insert on public.electronics_repair_payments
  for insert to authenticated
  with check (
    public.has_store_role(electronics_repair_payments.store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
    and received_by=(select auth.uid())
    and exists(select 1 from public.electronics_repairs r where r.id=repair_id and r.store_id=electronics_repair_payments.store_id)
  );

create policy service_job_payments_staff_insert on public.service_job_payments
  for insert to authenticated
  with check (
    public.has_store_role(service_job_payments.store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
    and received_by=(select auth.uid())
    and exists(select 1 from public.service_jobs j where j.id=job_id and j.store_id=service_job_payments.store_id)
  );


-- Recalled lots are immediately quarantined from future dispensing.
create or replace function public.quarantine_recalled_pharmacy_batch()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  update public.pharmacy_batches
     set recall_status = 'recalled', updated_at = now()
   where id = new.batch_id and store_id = new.store_id;
  if not found then raise exception 'Pharmacy batch not found in this store'; end if;
  return new;
end;
$function$;
revoke all on function public.quarantine_recalled_pharmacy_batch() from public, anon, authenticated;
drop trigger if exists quarantine_recalled_pharmacy_batch on public.pharmacy_recalls;
create trigger quarantine_recalled_pharmacy_batch
after insert on public.pharmacy_recalls
for each row execute function public.quarantine_recalled_pharmacy_batch();

-- Record service consumables and decrement branch stock in one transaction.
create or replace function public.record_beauty_consumable_usage(
  _store_id uuid,
  _branch_id uuid,
  _appointment_id uuid,
  _product_id uuid,
  _quantity numeric,
  _unit text default 'unit'
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_available integer;
  v_usage_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then
    raise exception 'Not authorized for this store';
  end if;
  if _quantity is null or _quantity <= 0 or _quantity <> trunc(_quantity) then
    raise exception 'Consumable quantity must be a positive whole number';
  end if;
  if length(btrim(coalesce(_unit,''))) = 0 or length(btrim(_unit)) > 32 then
    raise exception 'Enter a valid stock unit';
  end if;
  if not exists (
    select 1 from public.beauty_appointments a
     where a.id = _appointment_id and a.store_id = _store_id and a.branch_id = _branch_id
       and a.status in ('checked_in','in_progress','completed')
  ) then raise exception 'Consumables can only be recorded against an active or completed appointment'; end if;
  select quantity into v_available from public.branch_stock
   where store_id = _store_id and branch_id = _branch_id and product_id = _product_id
   for update;
  if not found or v_available < _quantity then raise exception 'Not enough stock for this consumable'; end if;
  update public.branch_stock
     set quantity = quantity - _quantity::integer, updated_at = now()
   where store_id = _store_id and branch_id = _branch_id and product_id = _product_id;
  insert into public.beauty_consumable_usage
    (store_id,branch_id,appointment_id,product_id,quantity,unit,recorded_by)
  values
    (_store_id,_branch_id,_appointment_id,_product_id,_quantity,btrim(_unit),v_user_id)
  returning id into v_usage_id;
  return v_usage_id;
end;
$function$;
revoke all on function public.record_beauty_consumable_usage(uuid,uuid,uuid,uuid,numeric,text) from public, anon;
grant execute on function public.record_beauty_consumable_usage(uuid,uuid,uuid,uuid,numeric,text) to authenticated;


-- Pharmacy checkout: capture prescription context and dispense only valid FEFO lots.
alter table public.pharmacy_product_profiles
  add column if not exists requires_batch_tracking boolean not null default true;
alter table public.sale_items
  add column if not exists pharmacy_prescription_reference text,
  add column if not exists pharmacy_patient_name text,
  add column if not exists pharmacy_patient_age integer
    check (pharmacy_patient_age is null or pharmacy_patient_age between 0 and 120);

CREATE OR REPLACE FUNCTION public.create_sale(_store_id uuid, _branch_id uuid, _payment_method text, _items jsonb, _note text DEFAULT ''::text, _customer_id uuid DEFAULT NULL::uuid, _offline_id text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_sale_id uuid;
  v_reference text;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  v_tax_rate numeric;
  v_item jsonb;
  v_product record;
  v_variant record;
  v_variant_id uuid;
  v_device record;
  v_device_id uuid;
  v_sale_item_id uuid;
  v_business_mode text;
  v_modifiers jsonb;
  v_modifier_item jsonb;
  v_modifier_row record;
  v_modifier_total numeric := 0;
  v_order_notes text;
  v_ingredient record;
  v_available numeric;
  v_stock_unit text;
  v_ticket_id uuid;
  v_batch record;
  v_batch_total integer;
  v_remaining integer;
  v_allocated integer;
  v_quantity integer;
  v_stock_units integer;
  v_unit_type text;
  v_units_per_sale integer;
  v_unit_price numeric;
  v_line_total numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not private.has_store_role(_store_id, v_user_id, array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
  if not exists(select 1 from public.branches b where b.id = _branch_id and b.store_id = _store_id) then raise exception 'Invalid branch'; end if;
  select coalesce(s.storefront_settings->>'businessMode',s.business_type,'general-retail') into v_business_mode from public.stores s where s.id=_store_id;
  update public.inventory_batches set status='expired',updated_at=now() where store_id=_store_id and branch_id=_branch_id and status in ('active','hold') and expiry_date is not null and expiry_date<current_date;
  if _payment_method not in ('cash','card','transfer','credit') then raise exception 'Invalid payment method'; end if;
  if _customer_id is not null and not exists(select 1 from public.customers c where c.id = _customer_id and c.store_id = _store_id) then raise exception 'Invalid customer'; end if;
  if _offline_id is not null then
    select id into v_sale_id from public.sales where offline_id = _offline_id and store_id = _store_id limit 1;
    if v_sale_id is not null then return v_sale_id; end if;
  end if;
  if coalesce(jsonb_typeof(_items), '') <> 'array' then raise exception 'Sale must contain at least one item'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Sale must contain at least one item'; end if;
  select tax_rate into v_tax_rate from public.stores where id = _store_id;

  -- Validate all items and lock the relevant stock rows before creating a sale.
  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_type := coalesce(v_item->>'unit_type', 'piece');
    v_variant_id := nullif(v_item->>'fashion_variant_stock_id', '')::uuid;
    v_device_id := nullif(v_item->>'electronics_device_id', '')::uuid;
    v_modifiers := coalesce(v_item->'modifiers','[]'::jsonb);
    v_order_notes := coalesce(v_item->>'order_notes','');
    v_modifier_total := 0;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Invalid quantity'; end if;
    if v_unit_type not in ('piece','pack') then raise exception 'Invalid sale unit'; end if;
    select p.id,p.name,p.price,p.piece_price,p.pack_price,p.units_per_pack,bs.quantity
      into v_product
      from public.products p
      join public.branch_stock bs on bs.product_id = p.id and bs.branch_id = _branch_id
      where p.id = (v_item->>'product_id')::uuid and p.store_id = _store_id and p.is_active = true
      for update of bs;
    if not found then raise exception 'Product is not available at this branch'; end if;

    if jsonb_typeof(v_modifiers)<>'array' then raise exception 'Invalid menu modifiers'; end if;
    if v_business_mode in ('food-service','restaurant','food','bakery') then
      for v_modifier_item in select value from jsonb_array_elements(v_modifiers) loop
        select * into v_modifier_row from public.food_menu_modifiers
          where id=(v_modifier_item->>'modifier_id')::uuid and store_id=_store_id and product_id=v_product.id and is_active
          for share;
        if not found then raise exception 'A menu modifier is no longer available for %',v_product.name; end if;
        if coalesce((v_modifier_item->>'price_delta')::numeric,0)<0 then raise exception 'Modifier price additions cannot be negative'; end if;
        if not exists(
          select 1 from jsonb_array_elements(v_modifier_row.options) as option_row(value)
          where option_row.value->>'label'=v_modifier_item->>'option_label'
            and coalesce((option_row.value->>'price_delta')::numeric,0)=coalesce((v_modifier_item->>'price_delta')::numeric,0)
        ) then raise exception 'Invalid option for menu modifier %',v_modifier_row.name; end if;
        v_modifier_total := v_modifier_total + coalesce((v_modifier_item->>'price_delta')::numeric,0);
      end loop;
      for v_modifier_row in select id,name from public.food_menu_modifiers where store_id=_store_id and product_id=v_product.id and is_active and is_required loop
        if not exists(select 1 from jsonb_array_elements(v_modifiers) as chosen(value) where chosen.value->>'modifier_id'=v_modifier_row.id::text) then
          raise exception 'Choose an option for %',v_modifier_row.name;
        end if;
      end loop;
    elsif jsonb_array_length(v_modifiers)>0 then
      raise exception 'Menu modifiers are only available in food-service mode';
    end if;

    v_units_per_sale := case when v_unit_type = 'pack' then greatest(v_product.units_per_pack,1) else 1 end;
    if v_unit_type = 'pack' and v_product.units_per_pack <= 1 then raise exception 'This product is not configured for pack sales'; end if;
    v_stock_units := v_quantity * v_units_per_sale;
    if v_variant_id is not null and v_device_id is not null then raise exception 'A sale line cannot select both a fashion variant and an electronics device'; end if;

    if v_device_id is not null then
      if v_quantity <> 1 or v_unit_type <> 'piece' then raise exception 'A serialised device must be sold as one individual item'; end if;
      select * into v_device from public.electronics_devices where id=v_device_id and store_id=_store_id and branch_id=_branch_id and product_id=v_product.id and status='in_stock' for update;
      if not found then raise exception 'Selected serial number or IMEI is no longer available'; end if;
    elsif v_variant_id is not null then
      if v_unit_type <> 'piece' then raise exception 'Fashion variants can only be sold as individual items'; end if;
      select * into v_variant from public.fashion_variant_stock
        where id = v_variant_id and store_id = _store_id and branch_id = _branch_id and product_id = v_product.id
        for update;
      if not found then raise exception 'Selected size and colour are not available at this branch'; end if;
      if v_variant.quantity < v_stock_units then raise exception 'Insufficient stock for % (% / %)', v_product.name, v_variant.size, v_variant.color; end if;
    elsif exists(select 1 from public.electronics_devices ed where ed.store_id=_store_id and ed.branch_id=_branch_id and ed.product_id=v_product.id) then
      raise exception 'Select an available serial number or IMEI for %',v_product.name;
    elsif exists(select 1 from public.inventory_batches ib where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=v_product.id) then
      null; -- Validated in aggregate below; the checkout will allocate FEFO batches.
    elsif v_product.quantity < v_stock_units then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_unit_price := case when v_business_mode in ('food-service','restaurant','food','bakery') then v_product.price + v_modifier_total else case when v_unit_type = 'pack' then coalesce(nullif(v_product.pack_price,0), v_product.price * greatest(v_product.units_per_pack,1)) else coalesce(nullif(v_product.piece_price,0),v_product.price) end + v_modifier_total end;
    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  for v_ingredient in
    select p.id as product_id,
      sum((cart_row.value->>'quantity')::integer * case when coalesce(cart_row.value->>'unit_type','piece')='pack' then greatest(p.units_per_pack,1) else 1 end)::integer as required_quantity
    from jsonb_array_elements(_items) as cart_row(value)
    join public.products p on p.id=(cart_row.value->>'product_id')::uuid and p.store_id=_store_id
    where exists(select 1 from public.inventory_batches ib where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=p.id)
      and nullif(cart_row.value->>'fashion_variant_stock_id','') is null
      and nullif(cart_row.value->>'electronics_device_id','') is null
    group by p.id
  loop
    select coalesce(sum(ib.quantity),0)::integer into v_batch_total from public.inventory_batches ib
      where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=v_ingredient.product_id
        and ib.status='active' and (ib.expiry_date is null or ib.expiry_date>=current_date);
    if v_batch_total<v_ingredient.required_quantity then
      raise exception 'Insufficient unexpired batch stock for product %',v_ingredient.product_id;
    end if;
  end loop;

  if v_business_mode in ('food-service','restaurant','food','bakery') then
    for v_ingredient in
      select r.ingredient_product_id, sum(r.quantity_per_serving * (cart_row.value->>'quantity')::integer)::numeric as required_quantity,
        min(r.unit) as unit, count(distinct r.unit)::integer as unit_count
      from jsonb_array_elements(_items) as cart_row(value)
      join public.food_recipe_ingredients r on r.menu_product_id=(cart_row.value->>'product_id')::uuid and r.store_id=_store_id and r.branch_id=_branch_id
      group by r.ingredient_product_id
    loop
      select fs.quantity, fs.unit into v_available, v_stock_unit from public.food_ingredient_stock fs where fs.store_id=_store_id and fs.branch_id=_branch_id and fs.product_id=v_ingredient.ingredient_product_id for update;
      if not found or v_available < v_ingredient.required_quantity then
        raise exception 'Insufficient ingredient stock for product %',v_ingredient.ingredient_product_id;
      end if;
      if v_ingredient.unit_count <> 1 or v_stock_unit <> v_ingredient.unit then
        raise exception 'Ingredient stock unit must match recipe unit (%) for product %',v_ingredient.unit,v_ingredient.ingredient_product_id;
      end if;
    end loop;
  end if;

  v_tax := round((v_subtotal * v_tax_rate / 100)::numeric, 2);
  v_total := v_subtotal + v_tax;
  v_reference := 'KUD-' || to_char(clock_timestamp(),'YYYYMMDD-HH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.sales(store_id,branch_id,cashier_id,reference,subtotal,tax,total,payment_method,note,customer_id,offline_id)
    values (_store_id,_branch_id,v_user_id,v_reference,v_subtotal,v_tax,v_total,_payment_method::public.payment_method,coalesce(_note,''),_customer_id,_offline_id)
    returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_type := coalesce(v_item->>'unit_type','piece');
    v_variant_id := nullif(v_item->>'fashion_variant_stock_id','')::uuid;
    v_device_id := nullif(v_item->>'electronics_device_id','')::uuid;
    v_modifiers := coalesce(v_item->'modifiers','[]'::jsonb);
    v_order_notes := coalesce(v_item->>'order_notes','');
    select p.id,p.name,p.price,p.piece_price,p.pack_price,p.units_per_pack
      into v_product from public.products p
      where p.id = (v_item->>'product_id')::uuid and p.store_id = _store_id
      for update;
    v_units_per_sale := case when v_unit_type = 'pack' then greatest(v_product.units_per_pack,1) else 1 end;
    v_unit_price := case when v_business_mode in ('food-service','restaurant','food','bakery') then v_product.price + coalesce((select sum(coalesce((m.value->>'price_delta')::numeric,0)) from jsonb_array_elements(v_modifiers) as m(value)),0) else case when v_unit_type = 'pack' then coalesce(nullif(v_product.pack_price,0), v_product.price * greatest(v_product.units_per_pack,1)) else coalesce(nullif(v_product.piece_price,0),v_product.price) end + coalesce((select sum(coalesce((m.value->>'price_delta')::numeric,0)) from jsonb_array_elements(v_modifiers) as m(value)),0) end;
    v_stock_units := v_quantity * v_units_per_sale;
    v_line_total := v_unit_price * v_quantity;

    if v_device_id is not null then
      select * into v_device from public.electronics_devices where id=v_device_id and store_id=_store_id and branch_id=_branch_id and product_id=v_product.id and status='in_stock' for update;
      if not found then raise exception 'Selected serial number or IMEI is no longer available'; end if;
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,electronics_device_id,device_serial_number,device_imei,food_modifiers,order_notes,pharmacy_prescription_reference,pharmacy_patient_name,pharmacy_patient_age)
        values(v_sale_id,_store_id,v_product.id,v_product.name,1,v_unit_price,v_unit_price,'piece',1,v_device.id,v_device.serial_number,v_device.imei,v_modifiers,v_order_notes,nullif(btrim(v_item->>'prescription_reference'),''),nullif(btrim(v_item->>'patient_name'),''),nullif(v_item->>'patient_age','')::integer) returning id into v_sale_item_id;
      update public.electronics_devices set status='sold',sale_item_id=v_sale_item_id,customer_id=_customer_id,warranty_started_at=now(),warranty_expires_at=case when warranty_months>0 then now()+make_interval(months=>warranty_months) else null end,updated_at=now() where id=v_device_id;
    elsif v_variant_id is not null then
      select * into v_variant from public.fashion_variant_stock
        where id = v_variant_id and store_id = _store_id and branch_id = _branch_id and product_id = v_product.id
        for update;
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,fashion_variant_stock_id,variant_size,variant_color,food_modifiers,order_notes,pharmacy_prescription_reference,pharmacy_patient_name,pharmacy_patient_age)
        values (v_sale_id,_store_id,v_product.id,v_product.name,v_quantity,v_unit_price,v_line_total,'piece',1,v_variant.id,v_variant.size,v_variant.color,v_modifiers,v_order_notes,nullif(btrim(v_item->>'prescription_reference'),''),nullif(btrim(v_item->>'patient_name'),''),nullif(v_item->>'patient_age','')::integer);
      update public.fashion_variant_stock set quantity = quantity - v_stock_units, updated_at = now() where id = v_variant_id;
      -- The variant-stock trigger maintains branch_stock as the sum of all active combinations.
    elsif exists(select 1 from public.inventory_batches ib where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=v_product.id) then
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,food_modifiers,order_notes,pharmacy_prescription_reference,pharmacy_patient_name,pharmacy_patient_age)
        values(v_sale_id,_store_id,v_product.id,v_product.name,v_quantity,v_unit_price,v_line_total,v_unit_type,v_units_per_sale,v_modifiers,v_order_notes,nullif(btrim(v_item->>'prescription_reference'),''),nullif(btrim(v_item->>'patient_name'),''),nullif(v_item->>'patient_age','')::integer)
        returning id into v_sale_item_id;
      v_remaining:=v_stock_units;
      for v_batch in select ib.id,ib.batch_number,ib.expiry_date,ib.quantity
        from public.inventory_batches ib
        where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=v_product.id
          and ib.status='active' and ib.quantity>0 and (ib.expiry_date is null or ib.expiry_date>=current_date)
        order by ib.expiry_date asc nulls last,ib.received_at asc,ib.id
        for update
      loop
        exit when v_remaining<=0;
        v_allocated:=least(v_remaining,v_batch.quantity);
        update public.inventory_batches set quantity=quantity-v_allocated,status=case when quantity-v_allocated=0 then 'closed' else status end,updated_at=now() where id=v_batch.id;
        insert into public.inventory_batch_allocations(store_id,branch_id,sale_id,sale_item_id,product_id,batch_id,batch_number,expiry_date,quantity)
          values(_store_id,_branch_id,v_sale_id,v_sale_item_id,v_product.id,v_batch.id,v_batch.batch_number,v_batch.expiry_date,v_allocated);
        v_remaining:=v_remaining-v_allocated;
      end loop;
      if v_remaining>0 then raise exception 'Insufficient unexpired batch stock for %',v_product.name; end if;
    else
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,food_modifiers,order_notes,pharmacy_prescription_reference,pharmacy_patient_name,pharmacy_patient_age)
        values (v_sale_id,_store_id,v_product.id,v_product.name,v_quantity,v_unit_price,v_line_total,v_unit_type,v_units_per_sale,v_modifiers,v_order_notes,nullif(btrim(v_item->>'prescription_reference'),''),nullif(btrim(v_item->>'patient_name'),''),nullif(v_item->>'patient_age','')::integer);
      update public.branch_stock set quantity = quantity - v_stock_units, updated_at = now() where branch_id = _branch_id and product_id = v_product.id;
    end if;
  end loop;

  if v_business_mode in ('food-service','restaurant','food','bakery') then
    insert into public.food_kitchen_tickets(store_id,branch_id,sale_id,ticket_number,status,notes)
      values(_store_id,_branch_id,v_sale_id,'KIT-'||to_char(clock_timestamp(),'YYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)),'new',coalesce(_note,''))
      returning id into v_ticket_id;
    insert into public.food_kitchen_ticket_items(ticket_id,store_id,sale_item_id,product_name,quantity,modifiers,order_notes)
      select v_ticket_id,_store_id,si.id,si.product_name,si.quantity,si.food_modifiers,si.order_notes
      from public.sale_items si where si.sale_id=v_sale_id;
    for v_item in select value from jsonb_array_elements(_items) loop
      update public.food_ingredient_stock fs
        set quantity=fs.quantity-(r.quantity_per_serving*(v_item->>'quantity')::integer),updated_at=now()
        from public.food_recipe_ingredients r
        where r.store_id=_store_id and r.branch_id=_branch_id
          and r.menu_product_id=(v_item->>'product_id')::uuid
          and fs.store_id=_store_id and fs.branch_id=_branch_id and fs.product_id=r.ingredient_product_id and fs.unit=r.unit;
    end loop;
  end if;

  if _customer_id is not null then
    update public.customers set total_spent = total_spent + v_total, visit_count = visit_count + 1, last_visit_at = now(), updated_at = now() where id = _customer_id;
  end if;
  return v_sale_id;
end;
$function$
;

create or replace function public.apply_pharmacy_batch_dispensing()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_mode text;
  v_profile public.pharmacy_product_profiles%rowtype;
  v_branch_id uuid;
  v_user_id uuid := auth.uid();
  v_remaining integer := new.quantity;
  v_take integer;
  v_batch record;
begin
  select coalesce(s.storefront_settings->>'businessMode', s.business_type, 'general-retail')
    into v_mode
    from public.stores s
   where s.id = new.store_id;
  if v_mode not in ('pharmacy','pharmacy-health-products') then return new; end if;

  select * into v_profile
    from public.pharmacy_product_profiles p
   where p.store_id = new.store_id
     and p.product_id = new.product_id
     and p.is_active
   for share;
  if not found then return new; end if;
  if v_profile.requires_prescription and (
    length(btrim(coalesce(new.pharmacy_prescription_reference,''))) < 3
    or length(btrim(coalesce(new.pharmacy_patient_name,''))) < 2
  ) then
    raise exception 'A valid prescription reference and patient name are required for %', new.product_name;
  end if;
  if v_profile.minimum_patient_age is not null and (
    new.pharmacy_patient_age is null or new.pharmacy_patient_age < v_profile.minimum_patient_age
  ) then
    raise exception 'This product requires a patient aged at least %', v_profile.minimum_patient_age;
  end if;
  if v_profile.controlled_class is not null and not public.has_store_role(
    new.store_id, v_user_id, array['owner','manager']::public.store_role[]
  ) then
    raise exception 'Controlled medicines require manager-authorised dispensing';
  end if;
  if not v_profile.requires_batch_tracking then return new; end if;

  select s.branch_id into v_branch_id
    from public.sales s
   where s.id = new.sale_id and s.store_id = new.store_id;
  if not found then raise exception 'Sale branch could not be verified'; end if;
  if v_user_id is null then raise exception 'Authenticated dispensing is required'; end if;

  for v_batch in
    select b.id, b.available_quantity
      from public.pharmacy_batches b
     where b.store_id = new.store_id
       and b.branch_id = v_branch_id
       and b.product_id = new.product_id
       and b.available_quantity > 0
       and b.expiry_date >= current_date
       and b.recall_status = 'clear'
     order by b.expiry_date asc, b.received_at asc, b.id
     for update
  loop
    exit when v_remaining <= 0;
    v_take := least(v_remaining, v_batch.available_quantity);
    update public.pharmacy_batches
       set available_quantity = available_quantity - v_take, updated_at = now()
     where id = v_batch.id and store_id = new.store_id;
    insert into public.pharmacy_dispensing_records
      (store_id,branch_id,batch_id,sale_item_id,quantity,prescription_reference,patient_name,dispensed_by)
    values
      (new.store_id,v_branch_id,v_batch.id,new.id,v_take,
       coalesce(new.pharmacy_prescription_reference,''),coalesce(new.pharmacy_patient_name,''),v_user_id);
    v_remaining := v_remaining - v_take;
  end loop;
  if v_remaining > 0 then
    raise exception 'Insufficient unexpired, non-recalled pharmacy batch stock for %', new.product_name;
  end if;
  return new;
end;
$function$;
revoke all on function public.apply_pharmacy_batch_dispensing() from public, anon, authenticated;
drop trigger if exists apply_pharmacy_batch_dispensing on public.sale_items;
create trigger apply_pharmacy_batch_dispensing
after insert on public.sale_items
for each row execute function public.apply_pharmacy_batch_dispensing();


-- Receiving a pharmacy lot updates the batch ledger and sellable branch stock atomically.
create or replace function public.receive_pharmacy_batch(
  _store_id uuid,
  _branch_id uuid,
  _product_id uuid,
  _batch_number text,
  _manufacturer text,
  _supplier_name text,
  _quantity integer,
  _expiry_date date,
  _unit_cost numeric default 0
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_batch_id uuid;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not public.has_store_role(_store_id,v_user_id,array['owner','manager']::public.store_role[]) then
    raise exception 'Only a store owner or manager can receive pharmacy batches';
  end if;
  if _quantity is null or _quantity <= 0 then raise exception 'Received quantity must be greater than zero'; end if;
  if _expiry_date is null or _expiry_date < current_date then raise exception 'A future expiry date is required'; end if;
  if length(btrim(coalesce(_batch_number,''))) < 2 then raise exception 'Enter a batch number'; end if;
  if _unit_cost is null or _unit_cost < 0 then raise exception 'Unit cost cannot be negative'; end if;
  if not exists(select 1 from public.branches b where b.id=_branch_id and b.store_id=_store_id) then raise exception 'Invalid branch'; end if;
  if not exists(select 1 from public.products p where p.id=_product_id and p.store_id=_store_id) then raise exception 'Invalid product'; end if;

  insert into public.pharmacy_batches
    (store_id,branch_id,product_id,batch_number,manufacturer,supplier_name,received_quantity,available_quantity,expiry_date,unit_cost,created_by)
  values
    (_store_id,_branch_id,_product_id,btrim(_batch_number),btrim(coalesce(_manufacturer,'')),btrim(coalesce(_supplier_name,'')),_quantity,_quantity,_expiry_date,_unit_cost,v_user_id)
  returning id into v_batch_id;

  insert into public.branch_stock(store_id,branch_id,product_id,quantity,updated_at)
    values(_store_id,_branch_id,_product_id,_quantity,now())
    on conflict(branch_id,product_id) do update
      set quantity=public.branch_stock.quantity+excluded.quantity,updated_at=now();
  return v_batch_id;
end;
$function$;
revoke all on function public.receive_pharmacy_batch(uuid,uuid,uuid,text,text,text,integer,date,numeric) from public, anon;
grant execute on function public.receive_pharmacy_batch(uuid,uuid,uuid,text,text,text,integer,date,numeric) to authenticated;


-- Do not let the public storefront bypass specialist checkout controls that are
-- only implemented in the authenticated in-person workflows today.
create or replace function public.guard_online_order_vertical_checkout()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_mode text;
begin
  select coalesce(s.storefront_settings->>'businessMode',s.business_type,'general-retail')
    into v_mode
    from public.stores s
   where s.id = new.store_id;

  if v_mode in ('pharmacy','pharmacy-health-products') and exists (
    select 1 from public.pharmacy_product_profiles p
     where p.store_id=new.store_id and p.product_id=new.product_id and p.is_active
       and p.requires_batch_tracking
  ) then
    raise exception 'This pharmacy product must be dispensed through the pharmacy checkout with batch and prescription checks';
  end if;

  if v_mode in ('electronics','electronics-phones') and exists (
    select 1 from public.electronics_devices d
     where d.store_id=new.store_id and d.product_id=new.product_id
  ) then
    raise exception 'Serialised electronics must be sold through device-aware checkout';
  end if;

  if v_mode in ('food-service','restaurant','food','bakery') and (
    exists(select 1 from public.food_menu_modifiers m where m.store_id=new.store_id and m.product_id=new.product_id and m.is_active)
    or exists(select 1 from public.food_recipe_ingredients r where r.store_id=new.store_id and r.menu_product_id=new.product_id)
  ) then
    raise exception 'This menu item requires the restaurant checkout and kitchen workflow';
  end if;
  return new;
end;
$function$;
revoke all on function public.guard_online_order_vertical_checkout() from public, anon, authenticated;
drop trigger if exists guard_online_order_vertical_checkout on public.online_order_items;
create trigger guard_online_order_vertical_checkout
before insert on public.online_order_items
for each row execute function public.guard_online_order_vertical_checkout();
