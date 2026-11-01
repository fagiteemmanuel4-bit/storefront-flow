-- Slug generation is an internal helper called by the staff-account trigger.
-- It is not a public endpoint and should not be callable through PostgREST.
REVOKE EXECUTE ON FUNCTION public.generate_staff_login_slug(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_staff_login_slug(text) TO service_role;
