revoke execute on function public.create_sale(uuid, uuid, text, jsonb, text) from anon;
revoke execute on function public.create_sale(uuid, uuid, text, jsonb, text) from authenticated;
revoke execute on function public.create_sale(uuid, uuid, text, jsonb, text, uuid, text) from anon;
revoke execute on function public.create_store(text, text, text, numeric) from anon;
revoke execute on function public.ensure_unique_online_store_slug() from anon, authenticated;
revoke execute on function public.has_store_role(uuid, uuid, public.store_role[]) from anon, authenticated;
revoke execute on function public.is_store_member(uuid, uuid) from anon, authenticated;
revoke execute on function public.is_store_owner(uuid, uuid) from anon, authenticated;
