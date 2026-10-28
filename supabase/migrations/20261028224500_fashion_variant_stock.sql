-- Per-branch inventory for exact fashion size/colour combinations.
-- Additive only: products without fashion variant rows keep the existing stock workflow.
create table if not exists public.fashion_variant_stock (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null default '',
  color text not null default '',
  quantity integer not null default 0 check (quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fashion_variant_stock_branch_product_size_color_key unique (branch_id, product_id, size, color)
);

create index if not exists fashion_variant_stock_store_product_idx
  on public.fashion_variant_stock(store_id, product_id);
create index if not exists fashion_variant_stock_branch_idx
  on public.fashion_variant_stock(branch_id, product_id);

alter table public.fashion_variant_stock enable row level security;

drop policy if exists "Store members can view fashion variant stock" on public.fashion_variant_stock;
create policy "Store members can view fashion variant stock"
  on public.fashion_variant_stock for select to authenticated
  using (
    public.is_store_member(store_id, (select auth.uid()))
    and exists (
      select 1 from public.products p
      where p.id = fashion_variant_stock.product_id and p.store_id = fashion_variant_stock.store_id
    )
    and exists (
      select 1 from public.branches b
      where b.id = fashion_variant_stock.branch_id and b.store_id = fashion_variant_stock.store_id
    )
  );

drop policy if exists "Store managers can create fashion variant stock" on public.fashion_variant_stock;
create policy "Store managers can create fashion variant stock"
  on public.fashion_variant_stock for insert to authenticated
  with check (
    public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])
    and exists (
      select 1 from public.products p
      where p.id = fashion_variant_stock.product_id and p.store_id = fashion_variant_stock.store_id
    )
    and exists (
      select 1 from public.branches b
      where b.id = fashion_variant_stock.branch_id and b.store_id = fashion_variant_stock.store_id
    )
  );

drop policy if exists "Store managers can update fashion variant stock" on public.fashion_variant_stock;
create policy "Store managers can update fashion variant stock"
  on public.fashion_variant_stock for update to authenticated
  using (
    public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])
  )
  with check (
    public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])
    and exists (
      select 1 from public.products p
      where p.id = fashion_variant_stock.product_id and p.store_id = fashion_variant_stock.store_id
    )
    and exists (
      select 1 from public.branches b
      where b.id = fashion_variant_stock.branch_id and b.store_id = fashion_variant_stock.store_id
    )
  );

drop policy if exists "Store managers can delete fashion variant stock" on public.fashion_variant_stock;
create policy "Store managers can delete fashion variant stock"
  on public.fashion_variant_stock for delete to authenticated
  using (
    public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])
  );

-- Preserve the chosen size/colour on sale records even if a variant is later renamed or removed.
alter table public.sale_items
  add column if not exists fashion_variant_stock_id uuid references public.fashion_variant_stock(id) on delete set null,
  add column if not exists variant_size text,
  add column if not exists variant_color text;

create or replace function public.sync_fashion_variant_total_stock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_store_id uuid;
  v_branch_id uuid;
  v_product_id uuid;
  v_total integer;
begin
  v_store_id := coalesce(new.store_id, old.store_id);
  v_branch_id := coalesce(new.branch_id, old.branch_id);
  v_product_id := coalesce(new.product_id, old.product_id);

  select coalesce(sum(quantity), 0)::integer into v_total
  from public.fashion_variant_stock
  where store_id = v_store_id and branch_id = v_branch_id and product_id = v_product_id;

  insert into public.branch_stock(store_id, branch_id, product_id, quantity, updated_at)
  values (v_store_id, v_branch_id, v_product_id, v_total, now())
  on conflict (branch_id, product_id)
  do update set quantity = excluded.quantity, updated_at = now();

  return coalesce(new, old);
end;
$$;

drop trigger if exists sync_fashion_variant_total_stock on public.fashion_variant_stock;
create trigger sync_fashion_variant_total_stock
  after insert or update of quantity, store_id, branch_id, product_id or delete
  on public.fashion_variant_stock
  for each row execute function public.sync_fashion_variant_total_stock();
