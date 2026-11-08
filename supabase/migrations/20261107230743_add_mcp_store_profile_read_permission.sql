alter table public.mcp_access_settings
  add column if not exists allow_store_read boolean not null default true;
