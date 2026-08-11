REVOKE ALL ON FUNCTION public.is_store_member(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_store_owner(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_store_role(UUID, UUID, public.store_role[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.create_store(TEXT, TEXT, TEXT, NUMERIC) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_sale(UUID, UUID, TEXT, JSONB, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_store_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_store_role(UUID, UUID, public.store_role[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_store(TEXT, TEXT, TEXT, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_sale(UUID, UUID, TEXT, JSONB, TEXT) TO authenticated;