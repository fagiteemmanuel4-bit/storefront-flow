-- Temporary 24-day customer/order-tracking access foundation.
create table if not exists public.temporary_tracking_accounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  token_hash text not null unique,
  label text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at <= created_at + interval '24 days')
);
create index if not exists temporary_tracking_accounts_store_idx on public.temporary_tracking_accounts(store_id, expires_at);
create index if not exists temporary_tracking_accounts_active_idx on public.temporary_tracking_accounts(token_hash) where revoked_at is null;
alter table public.temporary_tracking_accounts enable row level security;
create policy temporary_tracking_accounts_owner_manager on public.temporary_tracking_accounts for all to authenticated using (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));

-- Storefront customization must be controlled by store membership/role at the database layer.
-- Add a canonical settings container when the existing stores table has no JSON settings column.
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='stores' and column_name='storefront_settings') then
    alter table public.stores add column storefront_settings jsonb not null default '{}'::jsonb;
  end if;
end $$;

-- Ensure stale temporary tracking credentials can never be used beyond their fixed lifetime.
create or replace function public.validate_temporary_tracking_token(p_token_hash text)
returns table (tracking_account_id uuid, store_id uuid, expires_at timestamptz)
language sql
security definer
set search_path = public, extensions
stable
as $$
  select id, store_id, expires_at
  from public.temporary_tracking_accounts
  where token_hash = p_token_hash
    and revoked_at is null
    and expires_at > now()
    and expires_at <= created_at + interval '24 days'
  limit 1;
$$;
revoke all on function public.validate_temporary_tracking_token(text) from public;
revoke all on function public.validate_temporary_tracking_token(text) from anon;
revoke all on function public.validate_temporary_tracking_token(text) from authenticated;

-- Explicit role checks for storefront settings and staff remain enforced through existing store membership/RLS.
