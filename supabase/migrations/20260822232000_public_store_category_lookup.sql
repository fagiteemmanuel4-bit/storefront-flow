-- Public category lookup for crawlable Store -> Category -> Product navigation.

CREATE OR REPLACE FUNCTION public.get_public_store_category_products(
  _store_slug TEXT,
  _category TEXT,
  _limit INTEGER DEFAULT 48
)
RETURNS TABLE(
  store_id UUID,
  store_slug TEXT,
  store_name TEXT,
  currency TEXT,
  category TEXT,
  product_id UUID,
  product_slug TEXT,
  product_name TEXT,
  product_price NUMERIC,
  image_url TEXT,
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
    COALESCE(s.currency, 'NGN'),
    p.category,
    p.id,
    op.slug,
    p.name,
    p.price,
    p.image_url,
    COALESCE((
      SELECT SUM(bs.quantity)::INTEGER
      FROM public.branch_stock bs
      WHERE bs.product_id = p.id
        AND bs.store_id = p.store_id
    ), 0) > 0
  FROM public.online_stores os
  JOIN public.stores s ON s.id = os.store_id
  JOIN public.online_products op ON op.store_id = os.store_id
  JOIN public.products p ON p.id = op.product_id
  WHERE lower(os.slug) = lower(btrim(_store_slug))
    AND lower(p.category) = lower(btrim(_category))
    AND os.is_published
    AND os.setup_completed
    AND op.enabled
    AND p.is_active
  ORDER BY op.featured DESC, p.updated_at DESC NULLS LAST, p.name ASC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 48), 100));
$$;

REVOKE ALL ON FUNCTION public.get_public_store_category_products(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_store_category_products(TEXT, TEXT, INTEGER) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_store_category_products(TEXT, TEXT, INTEGER)
IS 'Returns only published products for a public storefront category.';
