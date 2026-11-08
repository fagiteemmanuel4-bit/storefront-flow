drop policy if exists branch_stock_write_manager on public.branch_stock;
create policy branch_stock_insert_manager on public.branch_stock for insert to authenticated with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
create policy branch_stock_update_manager on public.branch_stock for update to authenticated using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))) with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
create policy branch_stock_delete_manager on public.branch_stock for delete to authenticated using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));

alter policy product_images_public_read on public.product_images to anon;
alter policy product_images_members_read on public.product_images to authenticated;
drop policy if exists product_images_manager_write on public.product_images;
create policy product_images_manager_insert on public.product_images for insert to authenticated with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
create policy product_images_manager_update on public.product_images for update to authenticated using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))) with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
create policy product_images_manager_delete on public.product_images for delete to authenticated using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));

alter policy store_hero_banners_public_read on public.store_hero_banners to anon;
alter policy store_hero_banners_members_read on public.store_hero_banners to authenticated;
drop policy if exists store_hero_banners_owner_manager_write on public.store_hero_banners;
create policy store_hero_banners_owner_manager_insert on public.store_hero_banners for insert to authenticated with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
create policy store_hero_banners_owner_manager_update on public.store_hero_banners for update to authenticated using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role]))) with check ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));
create policy store_hero_banners_owner_manager_delete on public.store_hero_banners for delete to authenticated using ((select private.has_store_role(store_id, (select auth.uid()), array['owner'::store_role, 'manager'::store_role])));

alter policy stores_public_online_read on public.stores to anon;
