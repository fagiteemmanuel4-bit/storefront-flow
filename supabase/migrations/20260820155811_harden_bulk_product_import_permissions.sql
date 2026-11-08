revoke execute on function public.bulk_import_products(uuid, uuid, jsonb) from public, anon;
grant execute on function public.bulk_import_products(uuid, uuid, jsonb) to authenticated;
