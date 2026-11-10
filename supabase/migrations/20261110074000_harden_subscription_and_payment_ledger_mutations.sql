-- Keep subscription entitlements and payment records under trusted server control.
-- Store members may read their own billing history, but cannot mint or alter paid access.

DROP POLICY IF EXISTS store_subscriptions_owner_write ON public.store_subscriptions;
DROP POLICY IF EXISTS store_subscriptions_owner_write_insert ON public.store_subscriptions;
DROP POLICY IF EXISTS store_subscriptions_owner_write_update ON public.store_subscriptions;
DROP POLICY IF EXISTS store_subscriptions_owner_write_delete ON public.store_subscriptions;

REVOKE ALL PRIVILEGES ON TABLE public.store_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.store_subscriptions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.store_subscriptions TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.payment_transactions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.payment_transactions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.payment_transactions TO service_role;

REVOKE ALL PRIVILEGES ON TABLE public.billing_transactions FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.billing_transactions TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.billing_transactions TO service_role;

COMMENT ON TABLE public.store_subscriptions IS
  'Subscription entitlement state. Client roles are read-only; only trusted server-side billing operations may mutate it.';
COMMENT ON TABLE public.payment_transactions IS
  'Payment ledger. Client roles are read-only; only trusted server-side payment operations may mutate it.';
COMMENT ON TABLE public.billing_transactions IS
  'Legacy billing ledger. Client roles are read-only; only trusted server-side billing operations may mutate it.';
