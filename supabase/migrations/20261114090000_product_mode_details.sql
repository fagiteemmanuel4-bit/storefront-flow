-- Store tenant-scoped, private metadata for profile-specific product fields.
-- This deliberately stays separate from products so public catalogue reads cannot
-- expose pharmacy, device, batch, or internal operational details.
create table if not exists public.product_mode_details (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  mode_key text not null check (mode_key in (
    'general-retail',
    'grocery-provision',
    'fashion',
    'electronics',
    'food-service',
    'pharmacy',
    'beauty-personal-care',
    'services'
  )),
  details jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_mode_details_store_product_mode_unique unique (store_id, product_id, mode_key)
);

create index if not exists product_mode_details_product_lookup_idx
  on public.product_mode_details (product_id, mode_key);

alter table public.product_mode_details enable row level security;

grant select, insert, update, delete on table public.product_mode_details to authenticated;

create policy product_mode_details_member_select
  on public.product_mode_details
  for select
  to authenticated
  using (
    (select private.is_store_member(store_id, (select auth.uid())))
    and exists (
      select 1 from public.products p
      where p.id = product_mode_details.product_id
        and p.store_id = product_mode_details.store_id
    )
  );

create policy product_mode_details_manager_insert
  on public.product_mode_details
  for insert
  to authenticated
  with check (
    (select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))
    and exists (
      select 1 from public.products p
      where p.id = product_mode_details.product_id
        and p.store_id = product_mode_details.store_id
    )
  );

create policy product_mode_details_manager_update
  on public.product_mode_details
  for update
  to authenticated
  using (
    (select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))
  )
  with check (
    (select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))
    and exists (
      select 1 from public.products p
      where p.id = product_mode_details.product_id
        and p.store_id = product_mode_details.store_id
    )
  );

create policy product_mode_details_manager_delete
  on public.product_mode_details
  for delete
  to authenticated
  using (
    (select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))
  );

comment on table public.product_mode_details is
  'Private, tenant-scoped profile-specific product metadata. Never exposed to anonymous storefront visitors.';
