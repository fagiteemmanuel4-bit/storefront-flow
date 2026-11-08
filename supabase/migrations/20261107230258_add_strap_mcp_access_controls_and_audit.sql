create table if not exists public.mcp_access_settings (
  store_id uuid primary key references public.stores(id) on delete cascade,
  enabled boolean not null default true,
  allowed_branch_ids uuid[] null,
  allow_products_read boolean not null default true,
  allow_inventory_read boolean not null default true,
  allow_sales_read boolean not null default true,
  allow_expenses_read boolean not null default true,
  allow_customers_read boolean not null default true,
  allow_product_writes boolean not null default false,
  allow_stock_writes boolean not null default false,
  updated_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.mcp_access_settings enable row level security;
grant select, insert, update on public.mcp_access_settings to authenticated;
create policy mcp_access_settings_select_member on public.mcp_access_settings
for select to authenticated using (
  private.is_store_member(store_id, (select auth.uid())) or
  exists (select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid()))
);
create policy mcp_access_settings_insert_manager on public.mcp_access_settings
for insert to authenticated with check (
  private.has_store_role(store_id, (select auth.uid()), array['owner'::public.store_role, 'manager'::public.store_role])
);
create policy mcp_access_settings_update_manager on public.mcp_access_settings
for update to authenticated using (
  private.has_store_role(store_id, (select auth.uid()), array['owner'::public.store_role, 'manager'::public.store_role])
) with check (
  private.has_store_role(store_id, (select auth.uid()), array['owner'::public.store_role, 'manager'::public.store_role])
);
create table if not exists public.mcp_action_audit (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  action text not null,
  resource_type text not null,
  resource_id uuid null,
  summary text not null default '',
  created_at timestamptz not null default now()
);
alter table public.mcp_action_audit enable row level security;
grant select, insert on public.mcp_action_audit to authenticated;
create policy mcp_action_audit_select_manager on public.mcp_action_audit
for select to authenticated using (
  private.has_store_role(store_id, (select auth.uid()), array['owner'::public.store_role, 'manager'::public.store_role])
);
create policy mcp_action_audit_insert_manager on public.mcp_action_audit
for insert to authenticated with check (
  user_id = (select auth.uid()) and
  private.has_store_role(store_id, (select auth.uid()), array['owner'::public.store_role, 'manager'::public.store_role])
);
