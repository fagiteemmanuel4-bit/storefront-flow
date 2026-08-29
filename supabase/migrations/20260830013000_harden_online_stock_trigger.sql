-- Trigger functions are invoked by PostgreSQL, never by API callers.
revoke all on function public.release_online_order_stock() from public, anon, authenticated;
