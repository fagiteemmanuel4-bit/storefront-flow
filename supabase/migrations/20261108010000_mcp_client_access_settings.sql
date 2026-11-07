-- Per-OAuth-client STRAP permissions. Each authorized AI app receives its own branch and action scope.
create table if not exists public.mcp_client_access_settings (
  store_id uuid not null references public.stores(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_id uuid not null,
  client_name text not null default 'Connected AI application',
  allowed_branch_ids uuid[] null,
  allow_store_read boolean not null default true,
  allow_products_read boolean not null default true,
  allow_inventory_read boolean not null default true,
  allow_sales_read boolean not null default true,
  allow_expenses_read boolean not null default false,
  allow_customers_read boolean not null default false,
  allow_product_writes boolean not null default false,
  allow_stock_writes boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (store_id, user_id, client_id)
);

alter table public.mcp_client_access_settings enable row level security;
grant select, insert, update, delete on public.mcp_client_access_settings to authenticated;

create policy mcp_client_access_select_member
on public.mcp_client_access_settings for select to authenticated
using (
  private.is_store_member(store_id, (select auth.uid()))
  or exists (select 1 from public.stores s where s.id = store_id and s.owner_id = (select auth.uid()))
);

create policy mcp_client_access_insert_manager
on public.mcp_client_access_settings for insert to authenticated
with check (
  user_id = (select auth.uid())
  and private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])
);

create policy mcp_client_access_update_manager
on public.mcp_client_access_settings for update to authenticated
using (private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))
with check (
  user_id = (select auth.uid())
  and private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])
);

create policy mcp_client_access_delete_manager
on public.mcp_client_access_settings for delete to authenticated
using (private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]));
