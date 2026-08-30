-- Premium status is an internal gate used by other SECURITY DEFINER functions.
-- It must not be directly callable through the public REST API.
REVOKE ALL ON FUNCTION public.is_active_premium_store(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_premium_store(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.is_active_premium_store(UUID) FROM authenticated;
