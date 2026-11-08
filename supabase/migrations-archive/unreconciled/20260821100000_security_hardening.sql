-- Kudi production security hardening.
-- Trigger-only and internal maintenance functions do not need to be callable
-- through the PostgREST RPC surface by anon/authenticated clients.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.notify_online_order() from public, anon, authenticated;
revoke execute on function public.ensure_unique_online_store_slug() from public, anon, authenticated;
revoke execute on function public.customer_account_cleanup_expired() from public, anon, authenticated;

-- Keep SECURITY DEFINER functions' ownership/search_path model intact. Public
-- storefront RPCs and authenticated merchant RPCs are intentionally retained
-- and are expected to enforce their own authorization inside the function.
