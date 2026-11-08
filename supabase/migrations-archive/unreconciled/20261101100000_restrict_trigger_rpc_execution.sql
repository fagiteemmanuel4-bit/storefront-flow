-- These SECURITY DEFINER routines are trigger-only implementation details.
-- Revoke direct Data API execution while leaving their table triggers intact.
REVOKE EXECUTE ON FUNCTION public.sync_electronics_device_stock() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_electronics_device_stock() TO service_role;

REVOKE EXECUTE ON FUNCTION public.sync_fashion_variant_total_stock() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_fashion_variant_total_stock() TO service_role;

REVOKE EXECUTE ON FUNCTION public.sync_inventory_batch_stock() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_inventory_batch_stock() TO service_role;

REVOKE EXECUTE ON FUNCTION public.staff_account_workspace_defaults() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.staff_account_workspace_defaults() TO service_role;
