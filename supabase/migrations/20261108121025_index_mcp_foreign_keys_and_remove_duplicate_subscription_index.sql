-- Cover the MCP audit and grant foreign keys so cleanup and joins remain efficient.
create index if not exists mcp_access_settings_updated_by_idx
  on public.mcp_access_settings (updated_by)
  where updated_by is not null;

create index if not exists mcp_action_audit_store_id_idx
  on public.mcp_action_audit (store_id);

create index if not exists mcp_action_audit_user_id_idx
  on public.mcp_action_audit (user_id);

create index if not exists mcp_client_access_settings_user_id_idx
  on public.mcp_client_access_settings (user_id);

-- This older index is an exact duplicate of store_subscriptions_store_status_idx.
drop index if exists public.store_subscriptions_status_idx;
