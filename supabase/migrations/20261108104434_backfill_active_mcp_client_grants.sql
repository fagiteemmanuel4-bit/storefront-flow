-- The original per-client table migration predates the enabled flag used by the MCP server.
-- Add it before copying legacy grants so clean installs and existing projects match.
alter table public.mcp_client_access_settings
  add column if not exists enabled boolean not null default true;

-- Preserve existing, explicitly active MCP grants while moving from store-wide
-- settings to per-OAuth-client permissions. New clients do not inherit this row.
-- Only users who still have owner/manager access receive a backfilled grant.
insert into public.mcp_client_access_settings (
  store_id,
  user_id,
  client_id,
  client_name,
  enabled,
  allowed_branch_ids,
  allow_store_read,
  allow_products_read,
  allow_inventory_read,
  allow_sales_read,
  allow_expenses_read,
  allow_customers_read,
  allow_product_writes,
  allow_stock_writes,
  updated_at
)
select
  legacy.store_id,
  consent.user_id,
  consent.client_id,
  coalesce(nullif(btrim(client.client_name), ''), 'Connected AI application'),
  legacy.enabled,
  legacy.allowed_branch_ids,
  legacy.allow_store_read,
  legacy.allow_products_read,
  legacy.allow_inventory_read,
  legacy.allow_sales_read,
  legacy.allow_expenses_read,
  legacy.allow_customers_read,
  legacy.allow_product_writes,
  legacy.allow_stock_writes,
  now()
from public.mcp_access_settings as legacy
join auth.oauth_consents as consent
  on consent.revoked_at is null
join auth.oauth_clients as client
  on client.id = consent.client_id
 and client.deleted_at is null
where private.has_store_role(
  legacy.store_id,
  consent.user_id,
  array['owner'::public.store_role, 'manager'::public.store_role]
)
on conflict (store_id, user_id, client_id) do nothing;
