create table if not exists public.fulfillment_orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid not null references public.online_orders(id) on delete cascade,
  status text not null default 'unfulfilled' check (status in ('unfulfilled','processing','packed','shipped','delivered','cancelled')),
  carrier text,
  tracking_number text,
  shipping_address jsonb not null default '{}'::jsonb,
  notes text,
  fulfilled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, order_id)
);
create index if not exists fulfillment_orders_store_status_idx on public.fulfillment_orders(store_id,status,created_at desc);

create table if not exists public.custom_store_domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  domain text not null,
  status text not null default 'pending' check (status in ('pending','verifying','verified','failed','removed')),
  verification_token text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id,domain)
);
create index if not exists custom_store_domains_store_idx on public.custom_store_domains(store_id);

alter table public.fulfillment_orders enable row level security;
alter table public.custom_store_domains enable row level security;
create policy fulfillment_member_select on public.fulfillment_orders for select to authenticated using (public.is_store_member(store_id,auth.uid()));
create policy fulfillment_manager_write on public.fulfillment_orders for all to authenticated using (public.has_store_role(store_id,auth.uid(),array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id,auth.uid(),array['owner','manager']::public.store_role[]));
create policy domains_member_select on public.custom_store_domains for select to authenticated using (public.is_store_member(store_id,auth.uid()));
create policy domains_manager_write on public.custom_store_domains for all to authenticated using (public.has_store_role(store_id,auth.uid(),array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id,auth.uid(),array['owner','manager']::public.store_role[]));

create index if not exists product_variants_store_product_idx on public.product_variants(store_id,product_id,is_active);
create index if not exists product_bundles_store_product_idx on public.product_bundles(store_id,product_id);
create index if not exists inventory_alerts_store_status_idx on public.inventory_alerts(store_id,status,created_at desc);
create index if not exists customer_segment_members_store_segment_idx on public.customer_segment_members(store_id,segment_id);
