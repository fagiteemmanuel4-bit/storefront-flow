REVOKE EXECUTE ON FUNCTION public.list_staff_accounts(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_staff_accounts(UUID) TO authenticated;
