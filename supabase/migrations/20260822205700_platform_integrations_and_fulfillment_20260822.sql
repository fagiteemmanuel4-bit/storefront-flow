create table if not exists public.store_domains (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 domain text not null unique, status text not null default 'pending' check(status in ('pending','verified','active','failed')),
 is_primary boolean not null default false, verification_token text, verified_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists store_domains_store_idx on public.store_domains(store_id);

create table if not exists public.api_keys (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 name text not null, key_prefix text not null, key_hash text not null unique, scopes jsonb not null default '[]'::jsonb,
 last_used_at timestamptz, revoked_at timestamptz, created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists api_keys_store_idx on public.api_keys(store_id);

create table if not exists public.webhook_endpoints (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 url text not null, secret_hash text, events jsonb not null default '[]'::jsonb, is_active boolean not null default true,
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists webhook_endpoints_store_idx on public.webhook_endpoints(store_id);
create table if not exists public.webhook_deliveries (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 endpoint_id uuid not null references public.webhook_endpoints(id) on delete cascade, event_type text not null, payload jsonb not null,
 status text not null default 'pending' check(status in ('pending','delivered','failed')), attempt_count integer not null default 0,
 response_code integer, next_attempt_at timestamptz, delivered_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists webhook_deliveries_retry_idx on public.webhook_deliveries(status, next_attempt_at);

create table if not exists public.shipping_rates (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 name text not null, description text, amount numeric(14,2) not null default 0 check(amount >= 0),
 estimated_days_min integer, estimated_days_max integer, is_active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists shipping_rates_store_idx on public.shipping_rates(store_id, is_active);

create table if not exists public.order_fulfillments (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
 order_id uuid not null references public.online_orders(id) on delete cascade, branch_id uuid references public.branches(id) on delete set null,
 status text not null default 'unfulfilled' check(status in ('unfulfilled','processing','packed','shipped','delivered','cancelled')),
 carrier text, tracking_number text, tracking_url text, fulfilled_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists order_fulfillments_order_idx on public.order_fulfillments(order_id);
create index if not exists order_fulfillments_store_idx on public.order_fulfillments(store_id, status, created_at desc);

alter table public.store_domains enable row level security;
alter table public.api_keys enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.shipping_rates enable row level security;
alter table public.order_fulfillments enable row level security;

create policy store_domains_member_select on public.store_domains for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy store_domains_owner_write on public.store_domains for all to authenticated using (public.is_store_owner(store_id, auth.uid())) with check (public.is_store_owner(store_id, auth.uid()));
create policy api_keys_owner_select on public.api_keys for select to authenticated using (public.is_store_owner(store_id, auth.uid()));
create policy api_keys_owner_write on public.api_keys for all to authenticated using (public.is_store_owner(store_id, auth.uid())) with check (public.is_store_owner(store_id, auth.uid()));
create policy webhook_endpoints_manager_select on public.webhook_endpoints for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy webhook_endpoints_owner_write on public.webhook_endpoints for all to authenticated using (public.is_store_owner(store_id, auth.uid())) with check (public.is_store_owner(store_id, auth.uid()));
create policy webhook_deliveries_manager_select on public.webhook_deliveries for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy shipping_rates_member_select on public.shipping_rates for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy shipping_rates_manager_write on public.shipping_rates for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy order_fulfillments_member_select on public.order_fulfillments for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy order_fulfillments_manager_write on public.order_fulfillments for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
