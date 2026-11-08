CREATE OR REPLACE FUNCTION public.public_store_has_premium(p_store_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_subscriptions s
    WHERE s.store_id = p_store_id
      AND s.status IN ('trialing','active')
      AND COALESCE(s.expires_at, s.current_period_end) > now()
      AND s.plan_code IN ('business','pro')
  );
$$;
REVOKE ALL ON FUNCTION public.public_store_has_premium(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_store_has_premium(uuid) TO anon, authenticated;
