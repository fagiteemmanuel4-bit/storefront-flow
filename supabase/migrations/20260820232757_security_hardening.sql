-- Kudi production security hardening.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.notify_online_order() from public, anon, authenticated;
revoke execute on function public.ensure_unique_online_store_slug() from public, anon, authenticated;
revoke execute on function public.customer_account_cleanup_expired() from public, anon, authenticated;
