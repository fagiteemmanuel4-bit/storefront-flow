create or replace function public.process_korapay_billing_success(
  p_reference text, p_amount numeric, p_currency text, p_webhook jsonb
) returns text
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  v_tx public.billing_transactions%rowtype;
  v_now timestamptz := now();
  v_expires timestamptz := now() + interval '30 days';
  v_subscription_id uuid;
begin
  select * into v_tx from public.billing_transactions
  where provider = 'korapay' and provider_reference = p_reference for update;
  if not found then return 'not_found'; end if;
  if v_tx.status = 'paid' then return 'duplicate'; end if;
  if v_tx.status <> 'pending' then return 'not_pending'; end if;
  if upper(coalesce(p_currency, '')) <> upper(v_tx.currency)
     or p_amount is distinct from v_tx.amount then return 'amount_or_currency_mismatch'; end if;
  insert into public.store_subscriptions (
    store_id, provider, plan_code, status, currency, amount, interval,
    current_period_start, current_period_end, expires_at, grace_period_ends_at, last_payment_at, updated_at
  ) values (
    v_tx.store_id, 'korapay', v_tx.plan_code, 'active', v_tx.currency, v_tx.amount, 'month',
    v_now, v_expires, v_expires, v_expires + interval '3 days', v_now, v_now
  ) on conflict (store_id) do update set
    provider = excluded.provider, plan_code = excluded.plan_code, status = 'active',
    currency = excluded.currency, amount = excluded.amount, interval = excluded.interval,
    current_period_start = excluded.current_period_start, current_period_end = excluded.current_period_end,
    expires_at = excluded.expires_at, grace_period_ends_at = excluded.grace_period_ends_at,
    last_payment_at = excluded.last_payment_at, updated_at = excluded.updated_at
  returning id into v_subscription_id;
  update public.billing_transactions set status = 'paid', subscription_id = v_subscription_id,
    paid_at = v_now, updated_at = v_now,
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object('webhook', coalesce(p_webhook, '{}'::jsonb))
  where id = v_tx.id;
  return 'processed';
end;
$$;
revoke all on function public.process_korapay_billing_success(text, numeric, text, jsonb) from public, anon, authenticated;
grant execute on function public.process_korapay_billing_success(text, numeric, text, jsonb) to service_role;
