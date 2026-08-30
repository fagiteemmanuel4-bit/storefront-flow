-- Premium status is an internal gate used by other SECURITY DEFINER functions.
REVOKE ALL ON FUNCTION public.is_active_premium_store(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_premium_store(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.is_active_premium_store(UUID) FROM authenticated;
