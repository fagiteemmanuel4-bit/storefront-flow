insert into public.store_members (store_id, user_id, role)
select s.id, s.owner_id, 'owner'::public.store_role
from public.stores s
where s.owner_id is not null
  and not exists (
    select 1 from public.store_members sm
    where sm.store_id = s.id and sm.user_id = s.owner_id
  );
