create index if not exists staff_accounts_created_by_idx on public.staff_accounts (created_by);
create index if not exists staff_audit_log_actor_user_id_idx on public.staff_audit_log (actor_user_id);
create index if not exists staff_audit_log_staff_id_idx on public.staff_audit_log (staff_id);

alter policy expenses_delete on public.expenses using ((select has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
alter policy expenses_insert on public.expenses with check ((select is_store_member(store_id, (select auth.uid()))) and created_by = (select auth.uid()));
alter policy expenses_select on public.expenses using ((select is_store_member(store_id, (select auth.uid()))));
alter policy expenses_update on public.expenses using ((select has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))) with check ((select has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));

alter policy notifications_read_own on public.notifications using (user_id = (select auth.uid()));
alter policy notifications_update_own on public.notifications using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

alter policy online_store_members_read on public.online_stores using ((select is_store_member(store_id, (select auth.uid()))));
alter policy online_store_owner_insert on public.online_stores with check ((select is_store_owner(store_id, (select auth.uid()))));
alter policy online_store_owner_update on public.online_stores using ((select is_store_owner(store_id, (select auth.uid())))) with check ((select is_store_owner(store_id, (select auth.uid()))));

alter policy online_orders_member_read on public.online_orders using ((select is_store_member(store_id, (select auth.uid()))));
alter policy online_orders_manager_update on public.online_orders using ((select has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))) with check ((select has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
alter policy online_order_items_member_read on public.online_order_items using ((select is_store_member(store_id, (select auth.uid()))));

alter policy customers_delete_manager on public.customers using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
alter policy customers_insert_member on public.customers with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role, 'cashier'::store_role])));
alter policy customers_select_member on public.customers using ((select private.is_store_member(store_id, (select auth.uid()))));
alter policy customers_update_member on public.customers using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role, 'cashier'::store_role]))) with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role, 'cashier'::store_role])));

alter policy staff_accounts_delete_manager on public.staff_accounts using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
alter policy staff_accounts_insert_manager on public.staff_accounts with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
alter policy staff_accounts_select_manager on public.staff_accounts using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
alter policy staff_accounts_update_manager on public.staff_accounts using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
alter policy staff_audit_select_manager on public.staff_audit_log using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
