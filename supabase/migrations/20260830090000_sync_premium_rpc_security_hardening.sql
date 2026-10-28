-- Reconcile repository migration history with the production premium RPC hardening.
-- All statements are idempotent and non-destructive.
REVOKE EXECUTE ON FUNCTION public.expire_premium_subscriptions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.expire_premium_subscriptions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.expire_premium_subscriptions() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.expire_premium_subscriptions() TO service_role;
REVOKE EXECUTE ON FUNCTION public.get_effective_plan(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_effective_plan(UUID) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.store_has_premium(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.store_has_premium(UUID, TEXT) TO authenticated;
