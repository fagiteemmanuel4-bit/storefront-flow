-- Complete the next layer of vertical workflows without changing existing tenant data.
-- Existing sales, stock and specialist routes remain backward compatible.

-- Fashion: cancellation restoration must include exact size/colour allocations.
alter table public.online_order_variant_allocations
  add column if not exists released_at timestamptz;

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
       and bs.branch_id = a.branch_id
       and bs.product_id = a.product_id
       and bs.store_id = a.store_id;

    update public.online_order_stock_allocations
       set released_at = now()
     where order_id = new.id and released_at is null;

    update public.fashion_variant_stock fvs
       set quantity = fvs.quantity + a.quantity, updated_at = now()
      from public.online_order_variant_allocations a
     where a.order_id = new.id
       and a.released_at is null
       and a.fashion_variant_stock_id = fvs.id
       and a.store_id = fvs.store_id
       and a.branch_id = fvs.branch_id
       and a.product_id = fvs.product_id;

    update public.online_order_variant_allocations
       set released_at = now()
     where order_id = new.id and released_at is null;

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
       and a.batch_id = ib.id
       and a.store_id = ib.store_id
       and a.branch_id = ib.branch_id
       and a.product_id = ib.product_id;

    update public.online_order_batch_allocations
       set released_at = now()
     where order_id = new.id and released_at is null;
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

  update public.electronics_repairs
     set paid_amount = paid_amount + _amount, updated_at = now()
   where id = _repair_id and store_id = _store_id;
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
  update public.service_jobs
     set amount_paid = amount_paid + new.amount, updated_at = now()
   where id = new.job_id and store_id = new.store_id;
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
  if new.assigned_staff_id is not null and new.status not in ('cancelled','no_show') then
    perform pg_catalog.pg_advisory_xact_lock(
      pg_catalog.hashtextextended(new.store_id::text || ':' || new.assigned_staff_id::text, 0)
    );
    if exists (
      select 1
        from public.beauty_appointments a
       where a.store_id = new.store_id
         and a.assigned_staff_id = new.assigned_staff_id
         and a.id is distinct from new.id
         and a.status not in ('cancelled','no_show')
         and a.starts_at < new.ends_at
         and a.ends_at > new.starts_at
    ) then
      raise exception 'This staff member already has an appointment during that time';
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

-- Apply tenant isolation to every new vertical table. Payment ledgers are append-only.
do $policy$
declare
  t text;
begin
  foreach t in array array[
    'electronics_repair_payments',
    'pharmacy_product_profiles','pharmacy_batches','pharmacy_dispensing_records','pharmacy_recalls',
    'beauty_services','beauty_appointments','beauty_appointment_services','beauty_consumable_usage',
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

-- Manager-only configuration and stock receiving.
create policy pharmacy_profiles_manager_write on public.pharmacy_product_profiles
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
    and exists(select 1 from public.products p where p.id=product_id and p.store_id=pharmacy_product_profiles.store_id)
  );
create policy pharmacy_batches_manager_write on public.pharmacy_batches
  for all to authenticated
  using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
  with check (
    public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
    and exists(select 1 from public.products p where p.id=product_id and p.store_id=pharmacy_batches.store_id)
    and exists(select 1 from public.branches b where b.id=branch_id and b.store_id=pharmacy_batches.store_id)
  );
create policy pharmacy_recalls_manager_write on public.pharmacy_recalls
  for all to authenticated
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
  v_available integer;
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
      select r.ingredient_product_id, sum(r.quantity_per_serving * (cart_row.value->>'quantity')::integer)::integer as required_quantity
      from jsonb_array_elements(_items) as cart_row(value)
      join public.food_recipe_ingredients r on r.menu_product_id=(cart_row.value->>'product_id')::uuid and r.store_id=_store_id and r.branch_id=_branch_id
      group by r.ingredient_product_id
    loop
      select bs.quantity into v_available from public.branch_stock bs where bs.store_id=_store_id and bs.branch_id=_branch_id and bs.product_id=v_ingredient.ingredient_product_id for update;
      if not found or v_available<v_ingredient.required_quantity then
        raise exception 'Insufficient ingredient stock for product %',v_ingredient.ingredient_product_id;
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
      update public.branch_stock bs
        set quantity=bs.quantity-(r.quantity_per_serving*(v_item->>'quantity')::integer),updated_at=now()
        from public.food_recipe_ingredients r
        where r.store_id=_store_id and r.branch_id=_branch_id
          and r.menu_product_id=(v_item->>'product_id')::uuid
          and bs.store_id=_store_id and bs.branch_id=_branch_id and bs.product_id=r.ingredient_product_id;
    end loop;
  end if;

  if _customer_id is not null then
    update public.customers set total_spent = total_spent + v_total, visit_count = visit_count + 1, last_visit_at = now(), updated_at = now() where id = _customer_id;
  end if;
  return v_sale_id;
end;
$function$


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
