-- Phase 3: additive billing, custom-domain and partner marketplace foundation.
create table if not exists public.store_subscriptions (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  provider text not null default 'paystack', provider_customer_code text, provider_subscription_code text, plan_code text,
  status text not null default 'inactive' check (status in ('inactive','trialing','active','past_due','cancelled','expired')),
  currency text not null default 'NGN', amount numeric(14,2) not null default 0 check (amount >= 0),
  interval text not null default 'month' check (interval in ('month','year')),
  current_period_start timestamptz, current_period_end timestamptz, cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(store_id), unique(provider, provider_subscription_code)
);
create table if not exists public.store_custom_domains (
  id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id) on delete cascade,
  hostname text not null, status text not null default 'pending' check (status in ('pending','verified','active','failed','removed')),
  verification_type text not null default 'TXT', verification_name text, verification_value text, last_checked_at timestamptz,
  verified_at timestamptz, provider_domain_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(store_id, hostname)
);
create table if not exists public.partner_profiles (
  id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null, partner_type text not null check (partner_type in ('producer','wholesaler','retailer','dropshipper')),
  description text, phone text, email text, city text, country text default 'Nigeria', website text,
  status text not null default 'pending' check (status in ('pending','approved','paused','rejected')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.partner_requests (
  id uuid primary key default gen_random_uuid(), partner_profile_id uuid not null references public.partner_profiles(id) on delete cascade,
  target_store_id uuid references public.stores(id) on delete cascade, requester_user_id uuid references auth.users(id) on delete set null,
  message text, status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists store_subscriptions_status_idx on public.store_subscriptions(store_id,status);
create index if not exists store_custom_domains_store_idx on public.store_custom_domains(store_id,status);
create index if not exists partner_profiles_type_status_idx on public.partner_profiles(partner_type,status);
create index if not exists partner_requests_target_idx on public.partner_requests(target_store_id,status);
alter table public.store_subscriptions enable row level security;
alter table public.store_custom_domains enable row level security;
alter table public.partner_profiles enable row level security;
alter table public.partner_requests enable row level security;
create policy store_subscriptions_member_select on public.store_subscriptions for select to authenticated using (public.is_store_member(store_id,auth.uid()));
create policy store_subscriptions_owner_write on public.store_subscriptions for all to authenticated using (public.is_store_owner(store_id,auth.uid())) with check (public.is_store_owner(store_id,auth.uid()));
create policy store_custom_domains_member_select on public.store_custom_domains for select to authenticated using (public.is_store_member(store_id,auth.uid()));
create policy store_custom_domains_manager_write on public.store_custom_domains for all to authenticated using (public.has_store_role(store_id,auth.uid(),array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id,auth.uid(),array['owner','manager']::public.store_role[]));
create policy partner_profiles_owner_access on public.partner_profiles for all to authenticated using (owner_user_id=auth.uid()) with check (owner_user_id=auth.uid());
create policy partner_requests_requester_access on public.partner_requests for all to authenticated using (requester_user_id=auth.uid() or exists (select 1 from public.partner_profiles p where p.id=partner_profile_id and p.owner_user_id=auth.uid())) with check (requester_user_id=auth.uid() or exists (select 1 from public.partner_profiles p where p.id=partner_profile_id and p.owner_user_id=auth.uid()));
