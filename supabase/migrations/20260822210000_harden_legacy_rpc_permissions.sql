-- Security hardening for legacy RPCs.
-- These functions are no longer part of the supported client flow and must not
-- be callable through PostgREST by browser roles.

REVOKE EXECUTE ON FUNCTION public.hash_staff_pin(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_storeless_accounts() FROM anon, authenticated;

-- Keep staff creation available to signed-in users because the function itself
-- performs store/role authorization and the client depends on it.
-- Keep public commerce RPCs unchanged until their anonymous customer flows are
-- migrated to dedicated, narrowly-scoped endpoints.
