revoke execute on function public.bulk_import_products(uuid, uuid, jsonb) from anon;
revoke execute on function public.create_sale(uuid, uuid, text, jsonb, text, uuid, text) from anon;
revoke execute on function public.create_staff_account(uuid, text, text, text) from anon;
revoke execute on function public.create_store(text, text, text, numeric) from anon;
revoke execute on function public.list_staff_accounts(uuid) from anon;
revoke execute on function public.verify_staff_pin(uuid, uuid, text) from anon;
revoke execute on function public.has_store_role(uuid, uuid, public.store_role[]) from anon;
revoke execute on function public.is_store_member(uuid, uuid) from anon;
revoke execute on function public.is_store_owner(uuid, uuid) from anon;

grant execute on function public.bulk_import_products(uuid, uuid, jsonb) to authenticated;
grant execute on function public.create_sale(uuid, uuid, text, jsonb, text, uuid, text) to authenticated;
grant execute on function public.create_staff_account(uuid, text, text, text) to authenticated;
grant execute on function public.create_store(text, text, text, numeric) to authenticated;
grant execute on function public.list_staff_accounts(uuid) to authenticated;
grant execute on function public.verify_staff_pin(uuid, uuid, text) to authenticated;
grant execute on function public.has_store_role(uuid, uuid, public.store_role[]) to authenticated;
grant execute on function public.is_store_member(uuid, uuid) to authenticated;
grant execute on function public.is_store_owner(uuid, uuid) to authenticated;
