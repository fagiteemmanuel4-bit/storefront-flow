-- Public product URLs and SEO-safe lookup.
ALTER TABLE public.online_products
  ADD COLUMN IF NOT EXISTS slug TEXT;

CREATE OR REPLACE FUNCTION public.kudi_slugify(_value TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT left(regexp_replace(regexp_replace(lower(trim(coalesce(_value,''))), '[^a-z0-9]+', '-', 'g'), '(^-|-$)', '', 'g'), 90);
$$;

UPDATE public.online_products op
SET slug = public.kudi_slugify(p.name) || '-' || left(replace(p.id::text, '-', ''), 8)
FROM public.products p
WHERE p.id = op.product_id
  AND (op.slug IS NULL OR op.slug = '');

ALTER TABLE public.online_products
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS online_products_store_slug_idx
  ON public.online_products(store_id, slug);

CREATE OR REPLACE FUNCTION public.get_public_store_product(_store_slug TEXT, _product_slug TEXT)
RETURNS TABLE(
  store_id UUID,
  store_slug TEXT,
  store_name TEXT,
  store_description TEXT,
  store_logo_url TEXT,
  currency TEXT,
  product_id UUID,
  product_slug TEXT,
  product_name TEXT,
  product_description TEXT,
  product_price NUMERIC,
  product_sku TEXT,
  product_category TEXT,
  product_image_url TEXT,
  product_image_urls TEXT[],
  product_featured BOOLEAN,
  stock_quantity INTEGER,
  available BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    os.store_id,
    os.slug,
    os.display_name,
    os.description,
    os.logo_url,
    COALESCE(s.currency, 'NGN'),
    p.id,
    op.slug,
    p.name,
    COALESCE(op.description, ''),
    p.price,
    p.sku,
    p.category,
    p.image_url,
    COALESCE((SELECT array_agg(pi.image_url ORDER BY pi.sort_order, pi.created_at)
              FROM public.product_images pi
              WHERE pi.product_id = p.id AND pi.store_id = p.store_id), ARRAY[]::TEXT[]),
    op.featured,
    COALESCE((SELECT SUM(bs.quantity)::INTEGER
              FROM public.branch_stock bs
              WHERE bs.product_id = p.id AND bs.store_id = p.store_id), 0),
    (COALESCE((SELECT SUM(bs.quantity)::INTEGER
               FROM public.branch_stock bs
               WHERE bs.product_id = p.id AND bs.store_id = p.store_id), 0) > 0)
  FROM public.online_stores os
  JOIN public.stores s ON s.id = os.store_id
  JOIN public.online_products op ON op.store_id = os.store_id
  JOIN public.products p ON p.id = op.product_id
  WHERE lower(os.slug) = lower(btrim(_store_slug))
    AND op.slug = btrim(_product_slug)
    AND os.is_published
    AND os.setup_completed
    AND op.enabled
    AND p.is_active;
$$;

REVOKE ALL ON FUNCTION public.get_public_store_product(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_store_product(TEXT, TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_store_product(TEXT, TEXT) IS
  'Returns only published product/store fields required for a public product page and SEO. No private customer, staff, or tenant data.';
