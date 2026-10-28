-- Fashion-specific product attributes. These are descriptive options, not per-variant inventory.
create table if not exists public.product_fashion_details (
  product_id uuid primary key references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  size_options text[] not null default '{}',
  color_options text[] not null default '{}',
  material text not null default '',
  style_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists product_fashion_details_store_id_idx
  on public.product_fashion_details(store_id);

alter table public.product_fashion_details enable row level security;

drop policy if exists "Store members can view fashion product details" on public.product_fashion_details;
create policy "Store members can view fashion product details"
  on public.product_fashion_details
  for select
  to authenticated
  using (public.is_store_member(store_id, (select auth.uid())));

drop policy if exists "Store managers can create fashion product details" on public.product_fashion_details;
create policy "Store managers can create fashion product details"
  on public.product_fashion_details
  for insert
  to authenticated
  with check (
    public.has_store_role(array['owner','manager']::public.store_role[], store_id, (select auth.uid()))
  );

drop policy if exists "Store managers can update fashion product details" on public.product_fashion_details;
create policy "Store managers can update fashion product details"
  on public.product_fashion_details
  for update
  to authenticated
  using (
    public.has_store_role(array['owner','manager']::public.store_role[], store_id, (select auth.uid()))
  )
  with check (
    public.has_store_role(array['owner','manager']::public.store_role[], store_id, (select auth.uid()))
  );

drop policy if exists "Store managers can delete fashion product details" on public.product_fashion_details;
create policy "Store managers can delete fashion product details"
  on public.product_fashion_details
  for delete
  to authenticated
  using (
    public.has_store_role(array['owner','manager']::public.store_role[], store_id, (select auth.uid()))
  );

grant select, insert, update, delete on public.product_fashion_details to authenticated;
