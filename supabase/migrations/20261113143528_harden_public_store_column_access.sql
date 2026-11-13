-- Keep the anonymous storefront API limited to the exact fields consumed by
-- the public storefront route. Public catalogue/product data is served by
-- SECURITY DEFINER RPCs that return explicit, safe projections.
REVOKE SELECT ON TABLE public.products FROM anon;
REVOKE SELECT ON TABLE public.online_products FROM anon;
REVOKE SELECT ON TABLE public.product_images FROM anon;

-- Public storefront bootstrap reads currency from stores and a fixed set of
-- storefront presentation/contact fields from online_stores.
REVOKE SELECT ON TABLE public.stores FROM anon;
GRANT SELECT (id, currency) ON TABLE public.stores TO anon;

REVOKE SELECT ON TABLE public.online_stores FROM anon;
GRANT SELECT (
  id,
  store_id,
  slug,
  display_name,
  logo_url,
  display_email,
  display_phone,
  description,
  shipping_note,
  checkout_note,
  is_published,
  setup_completed
) ON TABLE public.online_stores TO anon;

-- Public banner display fields only; do not expose future/internal columns.
REVOKE SELECT ON TABLE public.store_hero_banners FROM anon;
GRANT SELECT (
  id,
  store_id,
  image_url,
  title,
  subtitle,
  sort_order,
  is_active
) ON TABLE public.store_hero_banners TO anon;
