-- Batch/expiry inventory and traceable batch allocations for grocery/provision stores.
create table if not exists public.inventory_batches (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  batch_number text not null,
  expiry_date date,
  quantity integer not null default 0 check(quantity>=0),
  cost_per_unit numeric(12,2) not null default 0 check(cost_per_unit>=0),
  supplier_name text not null default '',
  status text not null default 'active' check(status in ('active','expired','hold','closed')),
  received_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  notes text not null default '',
  updated_at timestamptz not null default now(),
  constraint inventory_batches_branch_product_number_key unique(branch_id,product_id,batch_number)
);
create index if not exists inventory_batches_fefo_idx on public.inventory_batches(store_id,branch_id,product_id,status,expiry_date,received_at);
create index if not exists inventory_batches_expiry_idx on public.inventory_batches(store_id,branch_id,expiry_date,status);

create table if not exists public.inventory_batch_allocations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  sale_item_id uuid not null references public.sale_items(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  batch_id uuid references public.inventory_batches(id) on delete set null,
  batch_number text not null,
  expiry_date date,
  quantity integer not null check(quantity>0),
  created_at timestamptz not null default now()
);
create index if not exists inventory_batch_allocations_sale_idx on public.inventory_batch_allocations(sale_id);
create index if not exists inventory_batch_allocations_item_idx on public.inventory_batch_allocations(sale_item_id);

create table if not exists public.inventory_waste_records (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  batch_id uuid references public.inventory_batches(id) on delete set null,
  product_id uuid not null references public.products(id) on delete restrict,
  batch_number text not null,
  quantity integer not null check(quantity>0),
  reason text not null,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists inventory_waste_records_store_created_idx on public.inventory_waste_records(store_id,created_at desc);

alter table public.inventory_batches enable row level security;
alter table public.inventory_batch_allocations enable row level security;
alter table public.inventory_waste_records enable row level security;

drop policy if exists "Store members can view inventory batches" on public.inventory_batches;
create policy "Store members can view inventory batches" on public.inventory_batches for select to authenticated
using(public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Managers can manage inventory batches" on public.inventory_batches;
create policy "Managers can manage inventory batches" on public.inventory_batches for all to authenticated
using(public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
with check(
 public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
 and exists(select 1 from public.branches b where b.id=inventory_batches.branch_id and b.store_id=inventory_batches.store_id)
 and exists(select 1 from public.products p where p.id=inventory_batches.product_id and p.store_id=inventory_batches.store_id)
);

drop policy if exists "Store members can view batch allocations" on public.inventory_batch_allocations;
create policy "Store members can view batch allocations" on public.inventory_batch_allocations for select to authenticated
using(public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Store members can view inventory waste" on public.inventory_waste_records;
create policy "Store members can view inventory waste" on public.inventory_waste_records for select to authenticated
using(public.is_store_member(store_id,(select auth.uid())));

create or replace function public.sync_inventory_batch_stock()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_store_id uuid; v_branch_id uuid; v_product_id uuid; v_total integer;
begin
 if tg_op='DELETE' then v_store_id:=old.store_id;v_branch_id:=old.branch_id;v_product_id:=old.product_id;
 else v_store_id:=new.store_id;v_branch_id:=new.branch_id;v_product_id:=new.product_id;end if;
 select coalesce(sum(quantity),0)::integer into v_total from public.inventory_batches
  where store_id=v_store_id and branch_id=v_branch_id and product_id=v_product_id and status='active';
 insert into public.branch_stock(store_id,branch_id,product_id,quantity,updated_at)
  values(v_store_id,v_branch_id,v_product_id,v_total,now())
  on conflict(branch_id,product_id) do update set quantity=excluded.quantity,updated_at=now();
 if tg_op='DELETE' then return old; end if;
 return new;
end; $$;
drop trigger if exists sync_inventory_batch_stock on public.inventory_batches;
create trigger sync_inventory_batch_stock after insert or update of store_id,branch_id,product_id,quantity,status or delete
on public.inventory_batches for each row execute function public.sync_inventory_batch_stock();

create or replace function public.refresh_expired_inventory_batches(_store_id uuid,_branch_id uuid)
returns integer language plpgsql security definer set search_path=public as $$
declare v_user_id uuid:=auth.uid(); v_count integer;
begin
 if v_user_id is null then raise exception 'Not authenticated'; end if;
 if not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
 update public.inventory_batches set status='expired',updated_at=now()
 where store_id=_store_id and branch_id=_branch_id and status in ('active','hold') and expiry_date is not null and expiry_date<current_date;
 get diagnostics v_count=row_count;
 return v_count;
end; $$;

create or replace function public.record_inventory_batch_waste(
 _store_id uuid,_branch_id uuid,_batch_id uuid,_quantity integer,_reason text
)
returns uuid language plpgsql security definer set search_path=public,extensions as $$
declare v_user_id uuid:=auth.uid(); v_batch record; v_id uuid;
begin
 if v_user_id is null then raise exception 'Not authenticated'; end if;
 if not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
 if _quantity is null or _quantity<=0 then raise exception 'Waste quantity must be greater than zero'; end if;
 if length(btrim(coalesce(_reason,'')))<3 then raise exception 'Enter a waste reason'; end if;
 select * into v_batch from public.inventory_batches where id=_batch_id and store_id=_store_id and branch_id=_branch_id for update;
 if not found then raise exception 'Batch not found'; end if;
 if v_batch.quantity<_quantity then raise exception 'Waste quantity exceeds the batch quantity'; end if;
 update public.inventory_batches set quantity=quantity-_quantity,status=case when expiry_date is not null and expiry_date<current_date then 'expired' else status end,updated_at=now() where id=_batch_id;
 insert into public.inventory_waste_records(store_id,branch_id,batch_id,product_id,batch_number,quantity,reason,recorded_by)
 values(_store_id,_branch_id,_batch_id,v_batch.product_id,v_batch.batch_number,_quantity,btrim(_reason),v_user_id) returning id into v_id;
 return v_id;
end; $$;
