-- Add a first-class pause switch for each connected OAuth application.
-- Existing rows remain enabled to preserve their current access until owners/managers change it.
alter table public.mcp_client_access_settings
  add column if not exists enabled boolean not null default true;
