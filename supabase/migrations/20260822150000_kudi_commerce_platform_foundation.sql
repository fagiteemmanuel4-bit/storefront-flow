-- Kudi commerce platform foundation
-- This migration mirrors the commerce foundation applied to production and keeps
-- the repository migration history reproducible for new environments.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null, phone text, email text, address text, notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists suppliers_store_id_idx on public.suppliers(store_id);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  supplier_id uuid references public.suppliers(id) on delete set null,
  reference text not null,
  status text not null default 'draft' check (status in ('draft','ordered','partially_received','received','cancelled')),
  subtotal numeric(14,2) not null default 0,
  notes text, ordered_at timestamptz, received_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(store_id, reference)
);
create index if not exists purchase_orders_store_idx on public.purchase_orders(store_id, created_at desc);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity_ordered integer not null check (quantity_ordered > 0),
  quantity_received integer not null default 0 check (quantity_received >= 0 and quantity_received <= quantity_ordered),
  unit_cost numeric(14,2) not null check (unit_cost >= 0),
  line_total numeric(14,2) generated always as (quantity_ordered * unit_cost) stored,
  created_at timestamptz not null default now(), unique(purchase_order_id, product_id)
);
create index if not exists purchase_order_items_store_idx on public.purchase_order_items(store_id);

create table if not exists public.stock_transfers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  from_branch_id uuid not null references public.branches(id) on delete restrict,
  to_branch_id uuid not null references public.branches(id) on delete restrict,
  reference text not null,
  status text not null default 'requested' check (status in ('requested','approved','dispatched','received','cancelled')),
  requested_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(), dispatched_at timestamptz,
  received_at timestamptz, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (from_branch_id <> to_branch_id), unique(store_id, reference)
);
create table if not exists public.stock_transfer_items (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  transfer_id uuid not null references public.stock_transfers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  received_quantity integer not null default 0 check (received_quantity >= 0 and received_quantity <= quantity),
  created_at timestamptz not null default now(), unique(transfer_id, product_id)
);
create index if not exists stock_transfers_store_idx on public.stock_transfers(store_id, created_at desc);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  order_id uuid references public.online_orders(id) on delete set null,
  sale_id uuid references public.sales(id) on delete set null,
  provider text not null, provider_reference text,
  amount numeric(14,2) not null check (amount >= 0), currency text not null default 'NGN',
  status text not null default 'pending' check (status in ('pending','processing','paid','failed','refunded','partially_refunded','cancelled')),
  metadata jsonb not null default '{}'::jsonb, paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(provider, provider_reference)
);
create index if not exists payment_transactions_store_idx on public.payment_transactions(store_id, created_at desc);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_id uuid references public.sales(id) on delete set null,
  order_id uuid references public.online_orders(id) on delete set null,
  payment_transaction_id uuid references public.payment_transactions(id) on delete set null,
  amount numeric(14,2) not null check (amount > 0), reason text not null,
  status text not null default 'requested' check (status in ('requested','approved','processed','rejected','cancelled')),
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(), processed_at timestamptz
);
create index if not exists refunds_store_idx on public.refunds(store_id, created_at desc);

create table if not exists public.discount_codes (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  code text not null, type text not null check (type in ('percentage','fixed')),
  value numeric(14,2) not null check (value >= 0), minimum_order numeric(14,2) not null default 0,
  usage_limit integer, usage_count integer not null default 0,
  starts_at timestamptz, expires_at timestamptz, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(store_id, code)
);
create index if not exists discount_codes_store_idx on public.discount_codes(store_id);

create table if not exists public.loyalty_accounts (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  lifetime_points integer not null default 0 check (lifetime_points >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(store_id, customer_id)
);
create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  loyalty_account_id uuid not null references public.loyalty_accounts(id) on delete cascade,
  points integer not null, reason text not null, reference text,
  created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists loyalty_transactions_account_idx on public.loyalty_transactions(loyalty_account_id, created_at desc);

create table if not exists public.store_permissions (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  staff_role text not null, permission text not null, allowed boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(store_id, staff_role, permission)
);

alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.stock_transfers enable row level security;
alter table public.stock_transfer_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.refunds enable row level security;
alter table public.discount_codes enable row level security;
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.store_permissions enable row level security;

create policy suppliers_member_select on public.suppliers for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy suppliers_manager_write on public.suppliers for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy purchase_orders_member_select on public.purchase_orders for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy purchase_orders_manager_write on public.purchase_orders for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy purchase_order_items_member_select on public.purchase_order_items for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy purchase_order_items_manager_write on public.purchase_order_items for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy stock_transfers_member_select on public.stock_transfers for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy stock_transfers_manager_write on public.stock_transfers for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy stock_transfer_items_member_select on public.stock_transfer_items for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy stock_transfer_items_manager_write on public.stock_transfer_items for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy payment_transactions_member_select on public.payment_transactions for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy refunds_member_select on public.refunds for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy refunds_manager_write on public.refunds for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy discount_codes_member_select on public.discount_codes for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy discount_codes_manager_write on public.discount_codes for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));
create policy loyalty_accounts_member_select on public.loyalty_accounts for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy loyalty_transactions_member_select on public.loyalty_transactions for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy store_permissions_member_select on public.store_permissions for select to authenticated using (public.is_store_member(store_id, auth.uid()));
create policy store_permissions_owner_write on public.store_permissions for all to authenticated using (public.is_store_owner(store_id, auth.uid())) with check (public.is_store_owner(store_id, auth.uid()));

revoke execute on function public.create_sale(uuid, uuid, text, jsonb, text, uuid, text) from anon;
revoke execute on function public.create_online_order(text, text, text, text, text, text, text, jsonb) from authenticated;

create index if not exists branch_stock_store_branch_product_idx on public.branch_stock(store_id, branch_id, product_id);
create index if not exists sales_store_created_idx on public.sales(store_id, created_at desc);
create index if not exists online_orders_store_created_idx on public.online_orders(store_id, created_at desc);
create index if not exists products_store_active_idx on public.products(store_id, is_active);
