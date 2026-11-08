create table if not exists public.product_variants (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 sku text, barcode text, name text not null, attributes jsonb not null default '{}'::jsonb,
 cost numeric(14,2), price numeric(14,2), is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(product_id, name), unique(store_id, sku)
);
create index if not exists product_variants_product_idx on public.product_variants(product_id);
create index if not exists product_variants_store_idx on public.product_variants(store_id);

create table if not exists public.product_bundles (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 component_product_id uuid not null references public.products(id) on delete restrict,
 quantity integer not null check (quantity > 0), created_at timestamptz not null default now(),
 unique(product_id, component_product_id), check(product_id <> component_product_id)
);
create index if not exists product_bundles_product_idx on public.product_bundles(product_id);

create table if not exists public.inventory_alerts (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 branch_id uuid not null references public.branches(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 alert_type text not null check (alert_type in ('low_stock','out_of_stock','reorder_suggested','dead_stock')),
 current_quantity integer not null default 0, threshold integer, suggested_quantity integer,
 status text not null default 'open' check (status in ('open','acknowledged','resolved')),
 created_at timestamptz not null default now(), resolved_at timestamptz
);
create index if not exists inventory_alerts_store_status_idx on public.inventory_alerts(store_id, status, created_at desc);
create index if not exists inventory_alerts_branch_product_idx on public.inventory_alerts(branch_id, product_id, status);

create table if not exists public.customer_segments (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 name text not null, description text, rules jsonb not null default '{}'::jsonb, is_system boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(store_id, name)
);
create table if not exists public.customer_segment_members (
 segment_id uuid not null references public.customer_segments(id) on delete cascade,
 customer_id uuid not null references public.customers(id) on delete cascade,
 store_id uuid not null references public.stores(id) on delete cascade,
 calculated_at timestamptz not null default now(),
 primary key(segment_id, customer_id)
);
create index if not exists customer_segment_members_customer_idx on public.customer_segment_members(customer_id);

alter table public.product_variants enable row level security;
alter table public.product_bundles enable row level security;
alter table public.inventory_alerts enable row level security;
alter table public.customer_segments enable row level security;
alter table public.customer_segment_members enable row level security;

create policy product_variants_member_select on public.product_variants for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy product_variants_manager_write on public.product_variants for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy product_bundles_member_select on public.product_bundles for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy product_bundles_manager_write on public.product_bundles for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy inventory_alerts_member_select on public.inventory_alerts for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy inventory_alerts_manager_write on public.inventory_alerts for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy customer_segments_member_select on public.customer_segments for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy customer_segments_manager_write on public.customer_segments for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy customer_segment_members_member_select on public.customer_segment_members for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy customer_segment_members_manager_write on public.customer_segment_members for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));

create index if not exists customers_store_spend_idx on public.customers(store_id, total_spent desc);
create index if not exists customers_store_last_visit_idx on public.customers(store_id, last_visit_at desc);
create index if not exists products_store_category_idx on public.products(store_id, category);
