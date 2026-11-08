-- Harden the newly introduced commerce tables for scale.
create index if not exists loyalty_accounts_customer_idx on public.loyalty_accounts(customer_id);
create index if not exists loyalty_transactions_store_idx on public.loyalty_transactions(store_id);
create index if not exists loyalty_transactions_created_by_idx on public.loyalty_transactions(created_by);
create index if not exists payment_transactions_order_idx on public.payment_transactions(order_id);
create index if not exists payment_transactions_sale_idx on public.payment_transactions(sale_id);
create index if not exists purchase_orders_branch_idx on public.purchase_orders(branch_id);
create index if not exists purchase_orders_supplier_idx on public.purchase_orders(supplier_id);
create index if not exists purchase_orders_created_by_idx on public.purchase_orders(created_by);
create index if not exists purchase_order_items_product_idx on public.purchase_order_items(product_id);
create index if not exists stock_transfers_from_branch_idx on public.stock_transfers(from_branch_id);
create index if not exists stock_transfers_to_branch_idx on public.stock_transfers(to_branch_id);
create index if not exists stock_transfers_requested_by_idx on public.stock_transfers(requested_by);
create index if not exists stock_transfers_approved_by_idx on public.stock_transfers(approved_by);
create index if not exists stock_transfer_items_product_idx on public.stock_transfer_items(product_id);
create index if not exists stock_transfer_items_store_idx on public.stock_transfer_items(store_id);
create index if not exists refunds_order_idx on public.refunds(order_id);
create index if not exists refunds_sale_idx on public.refunds(sale_id);
create index if not exists refunds_payment_transaction_idx on public.refunds(payment_transaction_id);
create index if not exists refunds_created_by_idx on public.refunds(created_by);
create index if not exists refunds_approved_by_idx on public.refunds(approved_by);

-- Replace per-row auth evaluation with initplan-friendly forms on the new policies.
drop policy if exists suppliers_member_select on public.suppliers;
drop policy if exists suppliers_manager_write on public.suppliers;
create policy suppliers_member_select on public.suppliers for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));
create policy suppliers_manager_write on public.suppliers for all to authenticated using (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[]));

drop policy if exists purchase_orders_member_select on public.purchase_orders;
drop policy if exists purchase_orders_manager_write on public.purchase_orders;
create policy purchase_orders_member_select on public.purchase_orders for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));
create policy purchase_orders_manager_write on public.purchase_orders for all to authenticated using (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[]));

drop policy if exists purchase_order_items_member_select on public.purchase_order_items;
drop policy if exists purchase_order_items_manager_write on public.purchase_order_items;
create policy purchase_order_items_member_select on public.purchase_order_items for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));
create policy purchase_order_items_manager_write on public.purchase_order_items for all to authenticated using (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[]));

drop policy if exists stock_transfers_member_select on public.stock_transfers;
drop policy if exists stock_transfers_manager_write on public.stock_transfers;
create policy stock_transfers_member_select on public.stock_transfers for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));
create policy stock_transfers_manager_write on public.stock_transfers for all to authenticated using (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[]));

drop policy if exists stock_transfer_items_member_select on public.stock_transfer_items;
drop policy if exists stock_transfer_items_manager_write on public.stock_transfer_items;
create policy stock_transfer_items_member_select on public.stock_transfer_items for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));
create policy stock_transfer_items_manager_write on public.stock_transfer_items for all to authenticated using (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[]));

drop policy if exists payment_transactions_member_select on public.payment_transactions;
create policy payment_transactions_member_select on public.payment_transactions for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));

drop policy if exists refunds_member_select on public.refunds;
drop policy if exists refunds_manager_write on public.refunds;
create policy refunds_member_select on public.refunds for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));
create policy refunds_manager_write on public.refunds for all to authenticated using (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[]));

drop policy if exists discount_codes_member_select on public.discount_codes;
drop policy if exists discount_codes_manager_write on public.discount_codes;
create policy discount_codes_member_select on public.discount_codes for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));
create policy discount_codes_manager_write on public.discount_codes for all to authenticated using (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[])) with check (public.has_store_role(store_id, (select auth.uid()), array['owner','manager']::public.store_role[]));

drop policy if exists loyalty_accounts_member_select on public.loyalty_accounts;
create policy loyalty_accounts_member_select on public.loyalty_accounts for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));
drop policy if exists loyalty_transactions_member_select on public.loyalty_transactions;
create policy loyalty_transactions_member_select on public.loyalty_transactions for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));

drop policy if exists store_permissions_member_select on public.store_permissions;
drop policy if exists store_permissions_owner_write on public.store_permissions;
create policy store_permissions_member_select on public.store_permissions for select to authenticated using (public.is_store_member(store_id, (select auth.uid())));
create policy store_permissions_owner_write on public.store_permissions for all to authenticated using (public.is_store_owner(store_id, (select auth.uid()))) with check (public.is_store_owner(store_id, (select auth.uid())));
