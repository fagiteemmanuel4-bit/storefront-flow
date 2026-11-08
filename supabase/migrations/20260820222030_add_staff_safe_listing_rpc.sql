create or replace function public.list_staff_accounts(_store_id uuid)
returns table(id uuid,name text,role text,is_active boolean,last_login_at timestamptz,locked_until timestamptz)
language sql security definer set search_path=public
as $$
  select s.id,s.name,s.role,s.is_active,s.last_login_at,s.locked_until
  from public.staff_accounts s
  where s.store_id=_store_id
    and private.is_store_member(_store_id,auth.uid())
  order by s.is_active desc, lower(s.name);
$$;
grant execute on function public.list_staff_accounts(uuid) to authenticated;
