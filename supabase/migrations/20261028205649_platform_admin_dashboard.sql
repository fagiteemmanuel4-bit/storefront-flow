-- Strap platform administration foundation. All system-wide reads are gated by an explicit admin allowlist.
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

create or replace function public.is_platform_admin()
returns boolean
language sql stable security definer
set search_path = public, auth
as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

alter table public.store_feedback add column if not exists admin_status text not null default 'new'
  check (admin_status in ('new','reviewing','resolved','dismissed'));
create index if not exists store_feedback_admin_status_created_idx on public.store_feedback(admin_status, created_at desc);

create table if not exists public.platform_support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  contact_email text not null default '',
  category text not null default 'support' check (category in ('complaint','support','feature_request','billing','other')),
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists platform_support_tickets_status_created_idx on public.platform_support_tickets(status, created_at desc);
alter table public.platform_support_tickets enable row level security;
revoke all on public.platform_support_tickets from anon, authenticated;
grant insert on public.platform_support_tickets to authenticated;
drop policy if exists platform_support_ticket_submitter_insert on public.platform_support_tickets;
create policy platform_support_ticket_submitter_insert on public.platform_support_tickets
  for insert to authenticated with check (user_id = auth.uid() and length(subject) between 3 and 160 and length(message) between 5 and 5000 and length(contact_email) <= 320);

create table if not exists public.platform_plan_prices (
  id uuid primary key default gen_random_uuid(),
  country_code char(2) not null,
  country_name text not null,
  currency char(3) not null,
  plan_code text not null check (plan_code in ('business','pro')),
  billing_interval text not null check (billing_interval in ('month','year')),
  amount numeric(14,2) not null check (amount >= 0),
  is_active boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(country_code, plan_code, billing_interval)
);
alter table public.platform_plan_prices enable row level security;
revoke all on public.platform_plan_prices from anon, authenticated;
insert into public.platform_plan_prices(country_code,country_name,currency,plan_code,billing_interval,amount)
values
 ('NG','Nigeria','NGN','business','month',3000),
 ('NG','Nigeria','NGN','business','year',28800),
 ('NG','Nigeria','NGN','pro','month',5000),
 ('NG','Nigeria','NGN','pro','year',48000)
on conflict(country_code,plan_code,billing_interval) do update set country_name=excluded.country_name,currency=excluded.currency,amount=excluded.amount;

create or replace function public.platform_admin_dashboard()
returns jsonb
language plpgsql stable security definer
set search_path = public, auth
as $$
declare result jsonb;
begin
  if not public.is_platform_admin() then raise exception 'Platform admin access required'; end if;
  select jsonb_build_object(
    'stats', jsonb_build_object(
      'registered_users', (select count(*) from auth.users),
      'active_users_30d', (select count(*) from auth.users where last_sign_in_at >= now() - interval '30 days'),
      'stores', (select count(*) from public.stores),
      'paid_subscriptions', (select count(*) from public.store_subscriptions where status in ('active','trialing') and plan_code in ('business','pro')),
      'open_support', (select count(*) from public.platform_support_tickets where status in ('new','in_progress')),
      'new_feedback', (select count(*) from public.store_feedback where admin_status = 'new')
    ),
    'revenue_by_currency', coalesce((select jsonb_agg(jsonb_build_object('currency', currency, 'amount', total_amount, 'payments', payment_count)) from (
      select currency, sum(amount) as total_amount, count(*) as payment_count
      from public.payment_transactions where status = 'paid'
      group by currency order by currency
    ) revenue), '[]'::jsonb),
    'users', coalesce((select jsonb_agg(to_jsonb(u)) from (
      select id, email, created_at, last_sign_in_at,
        coalesce(raw_user_meta_data->>'country','') as country,
        (select count(*) from public.store_members sm where sm.user_id = au.id) as store_count
      from auth.users au order by created_at desc limit 100
    ) u), '[]'::jsonb),
    'subscriptions', coalesce((select jsonb_agg(to_jsonb(s)) from (
      select ss.id, ss.store_id, st.name as store_name, ss.plan_code, ss.status, ss.currency, ss.amount, ss.interval,
        ss.current_period_end, ss.provider, ss.updated_at
      from public.store_subscriptions ss join public.stores st on st.id = ss.store_id
      order by ss.updated_at desc limit 100
    ) s), '[]'::jsonb),
    'feedback', coalesce((select jsonb_agg(to_jsonb(f)) from (
      select sf.id, sf.feedback_type, sf.rating, sf.reason, sf.message, sf.contact_email, sf.admin_status, sf.created_at,
        st.name as store_name
      from public.store_feedback sf join public.stores st on st.id = sf.store_id
      order by sf.created_at desc limit 100
    ) f), '[]'::jsonb),
    'tickets', coalesce((select jsonb_agg(to_jsonb(t)) from (
      select id, user_id, contact_email, category, subject, message, status, created_at, updated_at
      from public.platform_support_tickets order by created_at desc limit 100
    ) t), '[]'::jsonb),
    'pricing', coalesce((select jsonb_agg(to_jsonb(p)) from (
      select id, country_code, country_name, currency, plan_code, billing_interval, amount, is_active, updated_at
      from public.platform_plan_prices order by country_name, plan_code, billing_interval
    ) p), '[]'::jsonb)
  ) into result;
  return result;
end;
$$;
revoke all on function public.platform_admin_dashboard() from public, anon;
grant execute on function public.platform_admin_dashboard() to authenticated;

create or replace function public.platform_admin_update_feedback(_id uuid, _status text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then raise exception 'Platform admin access required'; end if;
  if _status not in ('new','reviewing','resolved','dismissed') then raise exception 'Invalid feedback status'; end if;
  update public.store_feedback set admin_status = _status where id = _id;
  if not found then raise exception 'Feedback item not found'; end if;
end;
$$;
revoke all on function public.platform_admin_update_feedback(uuid,text) from public, anon;
grant execute on function public.platform_admin_update_feedback(uuid,text) to authenticated;

create or replace function public.platform_admin_update_ticket(_id uuid, _status text)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then raise exception 'Platform admin access required'; end if;
  if _status not in ('new','in_progress','resolved','closed') then raise exception 'Invalid ticket status'; end if;
  update public.platform_support_tickets set status = _status, updated_at = now() where id = _id;
  if not found then raise exception 'Support ticket not found'; end if;
end;
$$;
revoke all on function public.platform_admin_update_ticket(uuid,text) from public, anon;
grant execute on function public.platform_admin_update_ticket(uuid,text) to authenticated;

create or replace function public.platform_admin_upsert_price(
  _country_code text, _country_name text, _currency text, _plan_code text, _billing_interval text, _amount numeric, _is_active boolean default true
)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_platform_admin() then raise exception 'Platform admin access required'; end if;
  if upper(_country_code) !~ '^[A-Z]{2}$' or upper(_currency) !~ '^[A-Z]{3}$'
    or _plan_code not in ('business','pro') or _billing_interval not in ('month','year')
    or _amount < 0 or length(trim(_country_name)) < 2 then raise exception 'Invalid pricing details'; end if;
  insert into public.platform_plan_prices(country_code,country_name,currency,plan_code,billing_interval,amount,is_active,updated_at)
  values (upper(_country_code),trim(_country_name),upper(_currency),_plan_code,_billing_interval,_amount,_is_active,now())
  on conflict(country_code,plan_code,billing_interval) do update
    set country_name=excluded.country_name,currency=excluded.currency,amount=excluded.amount,is_active=excluded.is_active,updated_at=now();
end;
$$;
revoke all on function public.platform_admin_upsert_price(text,text,text,text,text,numeric,boolean) from public, anon;
grant execute on function public.platform_admin_upsert_price(text,text,text,text,text,numeric,boolean) to authenticated;
