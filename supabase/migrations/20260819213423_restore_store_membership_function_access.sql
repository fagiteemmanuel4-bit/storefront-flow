grant execute on function public.is_store_member(uuid, uuid) to authenticated;
grant execute on function public.is_store_member(uuid, uuid) to anon;

-- Keep the helper safe: it only answers whether the current authenticated user
-- belongs to the requested store. The explicit grants restore the API execution
-- privilege required by the app's RLS policies.
