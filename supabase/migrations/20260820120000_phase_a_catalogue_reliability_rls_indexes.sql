-- Phase A: make authenticated catalogue reads deterministic and reduce overlapping RLS work.

drop policy if exists online_products_members_read on public.online_products;
drop policy if exists online_products_members_write on public.online_products;

create policy online_products_members_read
on public.online_products
for select
to authenticated
using ((select public.is_store_member(store_id, (select auth.uid()))));

create policy online_products_manager_insert
on public.online_products
for insert
to authenticated
with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));

create policy online_products_manager_update
on public.online_products
for update
to authenticated
using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])))
with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));

create policy online_products_manager_delete
on public.online_products
for delete
to authenticated
using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));

create index if not exists online_products_store_product_idx on public.online_products(store_id, product_id);
create index if not exists branch_stock_store_product_idx on public.branch_stock(store_id, product_id);
create index if not exists product_images_product_sort_idx on public.product_images(product_id, sort_order, created_at);
