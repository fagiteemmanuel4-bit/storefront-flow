create index if not exists idx_online_products_store_enabled on public.online_products (store_id, enabled);
create index if not exists idx_online_products_store_featured on public.online_products (store_id, featured) where enabled = true;
create index if not exists idx_product_images_product_sort on public.product_images (product_id, sort_order);
create index if not exists idx_store_hero_banners_store_active_sort on public.store_hero_banners (store_id, is_active, sort_order);
create index if not exists idx_online_stores_slug_published on public.online_stores (slug, is_published, setup_completed);
create index if not exists idx_products_store_active on public.products (store_id, is_active);
