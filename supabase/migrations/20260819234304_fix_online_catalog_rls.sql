drop policy if exists online_products_members_read on public.online_products;
drop policy if exists online_products_members_write on public.online_products;

create policy online_products_members_read
on public.online_products
for select
to authenticated
using (private.is_store_member(store_id, auth.uid()));

create policy online_products_members_write
on public.online_products
for all
to authenticated
using (private.has_store_role(store_id, auth.uid(), array['owner'::public.store_role, 'manager'::public.store_role]))
with check (private.has_store_role(store_id, auth.uid(), array['owner'::public.store_role, 'manager'::public.store_role]));
