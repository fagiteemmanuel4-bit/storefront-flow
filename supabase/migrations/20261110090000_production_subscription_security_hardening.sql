-- Production subscription security hardening.
-- Keep merchant subscription and transaction data read-only to client sessions.
-- Trusted server-side Edge Functions use service_role for all payment mutations.

ALTER TABLE public.store_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_plan_prices ENABLE ROW LEVEL SECURITY;

-- Remove any historical client-write policy if one was ever applied.
DROP POLICY IF EXISTS store_subscriptions_owner_write ON public.store_subscriptions;
DROP POLICY IF EXISTS store_subscriptions_owner_access ON public.store_subscriptions;
DROP POLICY IF EXISTS store_subscriptions_member_write ON public.store_subscriptions;

-- Explicitly remove inherited and direct client privileges, then restore only
-- the SELECT privileges required by the existing membership-scoped RLS policies.
REVOKE ALL PRIVILEGES ON TABLE public.store_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.store_subscriptions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.store_subscriptions TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.billing_transactions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.billing_transactions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.billing_transactions TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.payment_transactions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.payment_transactions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.payment_transactions TO service_role;

-- Plan prices are maintained by trusted platform administration only.
REVOKE ALL PRIVILEGES ON TABLE public.platform_plan_prices FROM PUBLIC, anon, authenticated;
GRANT ALL PRIVILEGES ON TABLE public.platform_plan_prices TO service_role;

-- Do not default new subscriptions to a retired/unconfigured payment rail.
-- Existing subscription provider values are intentionally preserved.
ALTER TABLE public.store_subscriptions
  ALTER COLUMN provider SET DEFAULT 'unconfigured';

-- Ensure subscription mutation RPCs remain service-role only.
REVOKE ALL ON FUNCTION public.process_paystack_subscription_success(text, numeric, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_paystack_subscription_success(text, numeric, text, jsonb)
  TO service_role;

REVOKE ALL ON FUNCTION public.process_korapay_billing_success(text, numeric, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_korapay_billing_success(text, numeric, text, jsonb)
  TO service_role;

COMMENT ON TABLE public.store_subscriptions IS
  'Subscription state is read-only to client roles; only trusted server-side billing functions may mutate it.';
COMMENT ON TABLE public.billing_transactions IS
  'Billing transaction mutations are restricted to trusted server-side billing functions.';
COMMENT ON TABLE public.payment_transactions IS
  'Payment transaction mutations are restricted to trusted server-side billing functions.';
