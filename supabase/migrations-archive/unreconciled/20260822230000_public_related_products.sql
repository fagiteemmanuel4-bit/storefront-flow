-- Public related-product lookup for storefront internal linking.
-- Only returns published products from the same public store/category.

CREATE OR REPLACE FUNCTION public.get_public_related_products(
  _store_slug TEXT,
  _product_id UUID,
  _category TEXT DEFAULT NULL,
  _limit INTEGER DEFAULT 4
)
RETURNS TABLE(
  product_id UUID,
  product_slug TEXT,
  product_name TEXT,
  product_price NUMERIC,
  currency TEXT,
  image_url TEXT,
  available BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    op.slug,
    p.name,
    p.price,
    COALESCE(s.currency, 'NGN'),
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
    AND os.is_published
    AND os.setup_completed
    AND op.enabled
    AND p.is_active
    AND p.id <> _product_id
    AND (_category IS NULL OR _category = '' OR p.category = _category)
  ORDER BY op.featured DESC, p.updated_at DESC NULLS LAST, p.name ASC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 4), 12));
$$;

REVOKE ALL ON FUNCTION public.get_public_related_products(TEXT, UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_related_products(TEXT, UUID, TEXT, INTEGER) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_related_products(TEXT, UUID, TEXT, INTEGER)
IS 'Returns a small public set of published related products for internal storefront navigation.';
