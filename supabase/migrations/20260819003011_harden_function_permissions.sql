REVOKE ALL ON FUNCTION public.create_store(text,text,text,numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_store(text,text,text,numeric) TO authenticated;

REVOKE ALL ON FUNCTION public.create_sale(uuid,uuid,text,jsonb,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_sale(uuid,uuid,text,jsonb,text) TO authenticated;

REVOKE ALL ON FUNCTION public.is_store_member(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid,uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.is_store_owner(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_store_owner(uuid,uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.has_store_role(uuid,uuid,public.store_role[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_store_role(uuid,uuid,public.store_role[]) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
