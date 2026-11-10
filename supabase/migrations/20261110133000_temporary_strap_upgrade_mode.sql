-- Temporary STRAP platform-wide upgrade mode.
-- Preserves historical orders/store data while hiding storefront pages and unlocking supported features.
create table if not exists public.platform_runtime_settings (
  setting_key text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.platform_runtime_settings enable row level security;
revoke all on public.platform_runtime_settings from anon, authenticated;
insert into public.platform_runtime_settings(setting_key, enabled)
values ('upgrade_mode', true)
on conflict (setting_key) do update set enabled = excluded.enabled, updated_at = now();

create or replace function public.is_platform_upgrade_mode()
returns boolean language sql stable security definer set search_path = public
as $$
  select coalesce((select enabled from public.platform_runtime_settings where setting_key = 'upgrade_mode'), false);
$$;
revoke all on function public.is_platform_upgrade_mode() from public;

alter table public.store_subscriptions drop constraint if exists store_subscriptions_status_check;
alter table public.store_subscriptions add constraint store_subscriptions_status_check
  check (status = any (array['inactive','trialing','active','past_due','cancelled','expired','suspended']));

update public.store_subscriptions
set metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'platform_upgrade_suspension',
      jsonb_build_object('suspended_at', now(), 'previous_plan_code', plan_code, 'previous_status', status)
    ),
    plan_code = 'free',
    status = 'suspended',
    cancel_at_period_end = true,
    updated_at = now()
where plan_code in ('business','pro') and status in ('trialing','active','past_due');

alter table public.online_stores add column if not exists upgrade_restore_is_published boolean;
update public.online_stores
set upgrade_restore_is_published = is_published, is_published = false, updated_at = now()
where is_published = true and upgrade_restore_is_published is null;

create or replace function public.is_active_premium_store(_store_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_platform_upgrade_mode() or exists (
    select 1 from public.store_subscriptions ss
    where ss.store_id = _store_id and ss.plan_code in ('business','pro')
      and ss.status in ('trialing','active')
      and (ss.current_period_end is null or ss.current_period_end > now())
  );
$$;

create or replace function public.store_has_premium(p_store_id uuid, p_required_plan text default 'business')
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_platform_upgrade_mode() or case
    when p_required_plan = 'business' then exists (
      select 1 from public.store_subscriptions s
      where s.store_id = p_store_id and s.status in ('trialing','active')
        and coalesce(s.expires_at, s.current_period_end) > now()
        and s.plan_code in ('business','pro')
    )
    when p_required_plan = 'pro' then exists (
      select 1 from public.store_subscriptions s
      where s.store_id = p_store_id and s.status in ('trialing','active')
        and coalesce(s.expires_at, s.current_period_end) > now()
        and s.plan_code = 'pro'
    )
    else false
  end;
$$;

create or replace function public.get_effective_plan(p_store_id uuid)
returns text language sql stable security definer set search_path = public
as $$
  select case
    when public.is_platform_upgrade_mode() then 'pro'
    when exists (
      select 1 from public.store_subscriptions s
      where s.store_id=p_store_id and s.plan_code='pro' and s.status in ('trialing','active')
        and coalesce(s.expires_at,s.current_period_end)>now()
    ) then 'pro'
    when exists (
      select 1 from public.store_subscriptions s
      where s.store_id=p_store_id and s.plan_code='business' and s.status in ('trialing','active')
        and coalesce(s.expires_at,s.current_period_end)>now()
    ) then 'business'
    else 'free'
  end;
$$;

create or replace function public.is_published_online_store(_store_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select not public.is_platform_upgrade_mode() and exists (
    select 1 from public.online_stores os
    where os.store_id = _store_id and os.is_published and os.setup_completed
      and public.is_active_premium_store(_store_id)
  );
$$;

-- To end upgrade mode later: set platform_runtime_settings.enabled=false.
-- Restore storefronts only after review using upgrade_restore_is_published, then clear that marker.
-- Suspended subscriptions remain suspended until explicitly reactivated by an administrator.
