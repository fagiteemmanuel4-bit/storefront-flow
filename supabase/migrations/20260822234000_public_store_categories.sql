-- Public category discovery metadata for storefront navigation.
-- Read-only, public-safe RPC: no customer, staff, or private tenant data.

CREATE OR REPLACE FUNCTION public.get_public_store_categories(
  _store_slug TEXT
)
RETURNS TABLE(
  category TEXT,
  product_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NULLIF(btrim(p.category), '') AS category,
    COUNT(*)::BIGINT AS product_count
  FROM public.online_stores os
  JOIN public.online_products op ON op.store_id = os.store_id
  JOIN public.products p ON p.id = op.product_id
  WHERE lower(os.slug) = lower(btrim(_store_slug))
    AND os.is_published
    AND os.setup_completed
    AND op.enabled
    AND p.is_active
    AND NULLIF(btrim(p.category), '') IS NOT NULL
  GROUP BY NULLIF(btrim(p.category), '')
  ORDER BY category ASC;
$$;

REVOKE ALL ON FUNCTION public.get_public_store_categories(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_store_categories(TEXT) TO anon, authenticated;

COMMENT ON FUNCTION public.get_public_store_categories(TEXT)
IS 'Returns only published public storefront categories and their real published product counts.';
