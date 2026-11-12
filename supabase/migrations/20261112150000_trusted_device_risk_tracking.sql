create table if not exists public.trusted_auth_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null,
  user_agent_family text not null default 'unknown',
  first_ip inet,
  last_ip inet,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  revoked_at timestamptz,
  constraint trusted_auth_devices_user_token_unique unique (user_id, token_hash),
  constraint trusted_auth_devices_token_hash_length check (length(token_hash) = 64)
);
create index if not exists trusted_auth_devices_user_active_idx
  on public.trusted_auth_devices (user_id, expires_at)
  where revoked_at is null;

create table if not exists public.auth_security_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  risk_level text not null check (risk_level in ('low', 'medium', 'high')),
  ip_address inet,
  user_agent_family text,
  created_at timestamptz not null default now()
);
create index if not exists auth_security_events_user_created_idx
  on public.auth_security_events (user_id, created_at desc);

alter table public.trusted_auth_devices enable row level security;
alter table public.auth_security_events enable row level security;
revoke all on public.trusted_auth_devices from public, anon, authenticated;
revoke all on public.auth_security_events from public, anon, authenticated;
grant all on public.trusted_auth_devices to service_role;
grant all on public.auth_security_events to service_role;
grant usage, select on sequence public.auth_security_events_id_seq to service_role;

comment on table public.trusted_auth_devices is 'Server-validated remembered browser credentials; only service role may access.';
comment on table public.auth_security_events is 'Security event log for trusted-device and anomalous sign-in signals; service role only.';
