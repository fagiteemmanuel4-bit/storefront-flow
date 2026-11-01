-- Restrict SECURITY DEFINER operations that are intended for signed-in store staff.
-- These functions also enforce store-role checks internally; the grants prevent
-- unauthenticated callers from reaching them through the public Data API.
REVOKE EXECUTE ON FUNCTION public.configure_staff(uuid, uuid, text, boolean, boolean, boolean, boolean, boolean, boolean, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.configure_staff(uuid, uuid, text, boolean, boolean, boolean, boolean, boolean, boolean, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.create_electronics_repair(uuid, uuid, uuid, uuid, text, text, text, text, boolean, numeric, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_electronics_repair(uuid, uuid, uuid, uuid, text, text, text, text, boolean, numeric, timestamp with time zone) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.process_fashion_return(uuid, uuid, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.process_fashion_return(uuid, uuid, text, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_food_waste(uuid, uuid, uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_food_waste(uuid, uuid, uuid, integer, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.record_inventory_batch_waste(uuid, uuid, uuid, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_inventory_batch_waste(uuid, uuid, uuid, integer, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.refresh_expired_inventory_batches(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refresh_expired_inventory_batches(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.staff_assign_branch(uuid, uuid, boolean, boolean, boolean, boolean, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_assign_branch(uuid, uuid, boolean, boolean, boolean, boolean, boolean, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.staff_remove_branch(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.staff_remove_branch(uuid, uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.list_staff_branch_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_staff_branch_access(uuid) TO authenticated;
