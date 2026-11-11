-- Keep the platform-wide free upgrade mode, but never grant paid storefront
-- access from a missing or expired billing period once upgrade mode ends.
-- Trial subscriptions must use their dedicated trial_ends_at timestamp.

CREATE OR REPLACE FUNCTION public.is_active_premium_store(_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT public.is_platform_upgrade_mode() OR EXISTS (
    SELECT 1
    FROM public.store_subscriptions ss
    WHERE ss.store_id = _store_id
      AND ss.plan_code IN ('business', 'pro')
      AND ss.status IN ('trialing', 'active')
      AND CASE
        WHEN ss.status = 'trialing' THEN
          ss.trial_ends_at IS NOT NULL AND ss.trial_ends_at > now()
        ELSE
          COALESCE(ss.expires_at, ss.current_period_end) IS NOT NULL
          AND COALESCE(ss.expires_at, ss.current_period_end) > now()
      END
  );
$$;

REVOKE ALL ON FUNCTION public.is_active_premium_store(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_premium_store(uuid) TO service_role;

COMMENT ON FUNCTION public.is_active_premium_store(uuid) IS
  'Internal premium storefront gate. Upgrade mode unlocks supported features; otherwise a paid or trial store must have a verified future expiry.';
