create or replace function private.initialize_store_subscription(
  _store_id uuid,
  _plan_code text,
  _currency text,
  _interval text,
  _metadata jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_amount numeric := 0;
  v_status text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if _store_id is null or not private.is_store_owner(_store_id, auth.uid()) then
    raise exception 'Only the store owner can initialize its subscription';
  end if;
  if _plan_code is null or _plan_code not in ('free', 'business', 'pro') then
    raise exception 'Invalid subscription plan';
  end if;
  if _currency is null or _currency !~ '^[A-Z]{3}$' then
    raise exception 'Invalid currency';
  end if;
  if _interval is null or _interval not in ('month', 'year') then
    raise exception 'Invalid billing interval';
  end if;

  if _plan_code = 'free' then
    v_amount := 0;
    v_status := 'active';
  else
    select p.amount into v_amount
    from public.platform_plan_prices p
    where p.currency = _currency
      and p.plan_code = _plan_code
      and p.billing_interval = _interval
      and p.is_active = true
    order by p.updated_at desc
    limit 1;
    if v_amount is null then
      raise exception 'This plan is not currently priced for the selected currency. Please choose another currency or contact support.';
    end if;
    v_status := 'pending';
  end if;

  insert into public.store_subscriptions (
    store_id, provider, plan_code, status, currency, amount, interval, metadata, updated_at
  ) values (
    _store_id, 'korapay', _plan_code, v_status, _currency, v_amount, _interval,
    coalesce(_metadata, '{}'::jsonb), now()
  )
  on conflict (store_id) do update set
    provider = excluded.provider,
    plan_code = excluded.plan_code,
    status = excluded.status,
    currency = excluded.currency,
    amount = excluded.amount,
    interval = excluded.interval,
    metadata = excluded.metadata,
    updated_at = now();
end;
$function$;

revoke all on function private.initialize_store_subscription(uuid, text, text, text, jsonb) from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.initialize_store_subscription(uuid, text, text, text, jsonb) to authenticated;

create or replace function public.initialize_store_subscription(
  _store_id uuid,
  _plan_code text,
  _currency text,
  _interval text,
  _metadata jsonb default '{}'::jsonb
)
returns void
language sql
security invoker
set search_path = ''
as $function$
  select private.initialize_store_subscription(
    _store_id, _plan_code, _currency, _interval, _metadata
  );
$function$;

revoke all on function public.initialize_store_subscription(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.initialize_store_subscription(uuid, text, text, text, jsonb) to authenticated;
