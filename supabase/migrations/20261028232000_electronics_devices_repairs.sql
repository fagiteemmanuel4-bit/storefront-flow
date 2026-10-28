-- Serial/IMEI-level inventory and repair intake for electronics businesses.
create table if not exists public.electronics_devices (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  serial_number text,
  imei text,
  status text not null default 'in_stock' check (status in ('in_stock','sold','repair','retired')),
  warranty_months integer not null default 12 check (warranty_months between 0 and 120),
  warranty_started_at timestamptz,
  warranty_expires_at timestamptz,
  sale_item_id uuid references public.sale_items(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  notes text not null default '',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint electronics_devices_serial_or_imei_required check (nullif(btrim(serial_number),'') is not null or nullif(btrim(imei),'') is not null)
);
create unique index if not exists electronics_devices_store_serial_unique on public.electronics_devices(store_id,serial_number) where serial_number is not null and btrim(serial_number)<>'';
create unique index if not exists electronics_devices_store_imei_unique on public.electronics_devices(store_id,imei) where imei is not null and btrim(imei)<>'';
create index if not exists electronics_devices_branch_status_idx on public.electronics_devices(store_id,branch_id,status);
create index if not exists electronics_devices_product_idx on public.electronics_devices(product_id,status);

create table if not exists public.electronics_repairs (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  device_id uuid references public.electronics_devices(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  device_label text not null,
  issue_description text not null,
  diagnosis text not null default '',
  status text not null default 'received' check (status in ('received','diagnosing','waiting_parts','ready','collected','cancelled')),
  warranty_claim boolean not null default false,
  estimated_cost numeric(12,2) not null default 0 check (estimated_cost>=0),
  final_cost numeric(12,2) not null default 0 check (final_cost>=0),
  received_at timestamptz not null default now(),
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists electronics_repairs_store_status_idx on public.electronics_repairs(store_id,status,received_at desc);
create index if not exists electronics_repairs_device_idx on public.electronics_repairs(device_id);

alter table public.electronics_devices enable row level security;
alter table public.electronics_repairs enable row level security;

drop policy if exists "Store members can view electronics devices" on public.electronics_devices;
create policy "Store members can view electronics devices" on public.electronics_devices for select to authenticated
using (public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Store managers can create electronics devices" on public.electronics_devices;
create policy "Store managers can create electronics devices" on public.electronics_devices for insert to authenticated
with check (
  public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
  and exists(select 1 from public.products p where p.id=electronics_devices.product_id and p.store_id=electronics_devices.store_id)
  and exists(select 1 from public.branches b where b.id=electronics_devices.branch_id and b.store_id=electronics_devices.store_id)
);
drop policy if exists "Store managers can update electronics devices" on public.electronics_devices;
create policy "Store managers can update electronics devices" on public.electronics_devices for update to authenticated
using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
with check (
  public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
  and exists(select 1 from public.products p where p.id=electronics_devices.product_id and p.store_id=electronics_devices.store_id)
  and exists(select 1 from public.branches b where b.id=electronics_devices.branch_id and b.store_id=electronics_devices.store_id)
);
drop policy if exists "Store managers can delete electronics devices" on public.electronics_devices;
create policy "Store managers can delete electronics devices" on public.electronics_devices for delete to authenticated
using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]));

drop policy if exists "Store members can view electronics repairs" on public.electronics_repairs;
create policy "Store members can view electronics repairs" on public.electronics_repairs for select to authenticated
using (public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Staff can create electronics repairs" on public.electronics_repairs;
create policy "Staff can create electronics repairs" on public.electronics_repairs for insert to authenticated
with check (
  public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[])
  and exists(select 1 from public.branches b where b.id=electronics_repairs.branch_id and b.store_id=electronics_repairs.store_id)
);
drop policy if exists "Managers can update electronics repairs" on public.electronics_repairs;
create policy "Managers can update electronics repairs" on public.electronics_repairs for update to authenticated
using (public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
with check (
  public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
  and exists(select 1 from public.branches b where b.id=electronics_repairs.branch_id and b.store_id=electronics_repairs.store_id)
);

alter table public.sale_items
  add column if not exists electronics_device_id uuid references public.electronics_devices(id) on delete set null,
  add column if not exists device_serial_number text,
  add column if not exists device_imei text;

create or replace function public.sync_electronics_device_stock()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_store_id uuid; v_branch_id uuid; v_product_id uuid; v_total integer;
begin
  if tg_op='DELETE' then v_store_id:=old.store_id; v_branch_id:=old.branch_id; v_product_id:=old.product_id;
  else v_store_id:=new.store_id; v_branch_id:=new.branch_id; v_product_id:=new.product_id; end if;
  select count(*)::integer into v_total from public.electronics_devices
    where store_id=v_store_id and branch_id=v_branch_id and product_id=v_product_id and status='in_stock';
  insert into public.branch_stock(store_id,branch_id,product_id,quantity,updated_at)
    values(v_store_id,v_branch_id,v_product_id,v_total,now())
    on conflict(branch_id,product_id) do update set quantity=excluded.quantity,updated_at=now();
  if tg_op='DELETE' then return old; end if;
  return new;
end; $$;
drop trigger if exists sync_electronics_device_stock on public.electronics_devices;
create trigger sync_electronics_device_stock after insert or update of status,store_id,branch_id,product_id or delete
on public.electronics_devices for each row execute function public.sync_electronics_device_stock();
