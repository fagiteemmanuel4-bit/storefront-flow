revoke execute on function public.hash_staff_pin(text) from anon, public;
revoke execute on function public.verify_staff_pin(uuid,uuid,text) from anon, public;
revoke execute on function public.list_staff_accounts(uuid) from anon, public;
grant execute on function public.hash_staff_pin(text) to authenticated;
grant execute on function public.verify_staff_pin(uuid,uuid,text) to authenticated;
grant execute on function public.list_staff_accounts(uuid) to authenticated;
