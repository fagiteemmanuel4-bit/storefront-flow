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
