create table if not exists public.account_security_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  rate_limit_profile text not null default 'standard' check (rate_limit_profile in ('strict','standard','relaxed')),
  security_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.account_security_settings enable row level security;

revoke all on public.account_security_settings from anon;
revoke all on public.account_security_settings from public;
grant select, insert, update on public.account_security_settings to authenticated;

drop policy if exists account_security_settings_select_own on public.account_security_settings;
drop policy if exists account_security_settings_insert_own on public.account_security_settings;
drop policy if exists account_security_settings_update_own on public.account_security_settings;

create policy account_security_settings_select_own
  on public.account_security_settings for select to authenticated
  using ((select auth.uid()) = user_id);

create policy account_security_settings_insert_own
  on public.account_security_settings for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy account_security_settings_update_own
  on public.account_security_settings for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.account_security_list_sessions(p_user_id uuid)
returns table (
  session_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  refreshed_at timestamp,
  not_after timestamptz,
  user_agent text,
  ip inet,
  aal text,
  tag text
)
language sql
security definer
set search_path = pg_catalog, auth
as $$
  select s.id, s.created_at, s.updated_at, s.refreshed_at, s.not_after,
         s.user_agent, s.ip, s.aal::text, s.tag
  from auth.sessions s
  where s.user_id = p_user_id
  order by s.updated_at desc;
$$;

create or replace function public.account_security_revoke_session(p_user_id uuid, p_session_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, auth
as $$
declare
  deleted_count integer;
begin
  delete from auth.sessions where id = p_session_id and user_id = p_user_id;
  get diagnostics deleted_count = row_count;
  return deleted_count = 1;
end;
$$;

create or replace function public.account_security_list_ip_history(p_user_id uuid, p_limit integer default 25)
returns table (
  occurred_at timestamptz,
  ip_address text,
  action text
)
language sql
security definer
set search_path = pg_catalog, auth
as $$
  select a.created_at,
         a.ip_address,
         coalesce(a.payload->>'action', a.payload->>'event', 'auth')
  from auth.audit_log_entries a
  where a.payload->>'user_id' = p_user_id::text
    and a.ip_address is not null
  order by a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 25), 100));
$$;

revoke all on function public.account_security_list_sessions(uuid) from public, anon, authenticated;
revoke all on function public.account_security_revoke_session(uuid, uuid) from public, anon, authenticated;
revoke all on function public.account_security_list_ip_history(uuid, integer) from public, anon, authenticated;
grant execute on function public.account_security_list_sessions(uuid) to service_role;
grant execute on function public.account_security_revoke_session(uuid, uuid) to service_role;
grant execute on function public.account_security_list_ip_history(uuid, integer) to service_role;

create index if not exists account_security_settings_updated_at_idx on public.account_security_settings(updated_at);
