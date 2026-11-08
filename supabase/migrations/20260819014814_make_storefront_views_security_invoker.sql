create or replace view public.online_catalog with (security_invoker = true) as
select os.store_id, os.slug, os.display_name, os.logo_url, os.display_email, os.display_phone,
  os.description as store_description, s.currency, p.id as product_id, p.name, p.sku, p.category,
  p.price, p.image_url, op.featured, op.description,
  coalesce((select json_agg(pi.image_url order by pi.sort_order, pi.created_at) from public.product_images pi where pi.product_id = p.id), '[]'::json) as image_urls
from public.online_stores os
join public.stores s on s.id = os.store_id
join public.online_products op on op.store_id = os.store_id
join public.products p on p.id = op.product_id
where os.is_published and os.setup_completed and op.enabled and p.is_active;

create or replace view public.online_store_heroes with (security_invoker = true) as
select os.store_id, os.slug, hb.id, hb.image_url, hb.title, hb.subtitle, hb.sort_order
from public.online_stores os
join public.store_hero_banners hb on hb.store_id = os.store_id
where os.is_published and os.setup_completed and hb.is_active
order by hb.sort_order, hb.created_at;
