drop policy if exists stores_select_owner on public.stores;
alter policy stores_select_member on public.stores using (((select private.is_store_member(stores.id, (select auth.uid()))) or stores.owner_id = (select auth.uid())));
