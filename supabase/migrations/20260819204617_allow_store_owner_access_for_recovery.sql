create policy stores_select_owner on public.stores for select to authenticated using (owner_id = auth.uid());
