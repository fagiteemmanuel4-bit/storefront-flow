-- Staff listing is an authenticated merchant operation; anonymous callers must not reach the RPC.
REVOKE EXECUTE ON FUNCTION public.list_staff_accounts(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.list_staff_accounts(UUID) TO authenticated;
