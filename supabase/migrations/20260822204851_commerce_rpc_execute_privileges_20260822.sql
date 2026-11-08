-- Least privilege for mutation RPCs. PUBLIC is revoked first because PostgreSQL PUBLIC grants include anon/authenticated.
revoke execute on function public.create_sale(uuid, uuid, text, jsonb, text, uuid, text) from public;
grant execute on function public.create_sale(uuid, uuid, text, jsonb, text, uuid, text) to authenticated;
revoke execute on function public.create_online_order(text, text, text, text, text, text, text, jsonb) from authenticated;
grant execute on function public.create_online_order(text, text, text, text, text, text, text, jsonb) to anon;
