-- Public sitemap source data. Only published, crawlable commerce URLs are exposed.

CREATE OR REPLACE FUNCTION public.get_public_sitemap_products(_limit INTEGER DEFAULT 5000)
RETURNS TABLE(store_slug TEXT, product_slug TEXT, updated_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT os.slug, op.slug, COALESCE(p.updated_at, op.updated_at, now())
  FROM public.online_stores os
  JOIN public.online_products op ON op.store_id = os.store_id
  JOIN public.products p ON p.id = op.product_id
  WHERE os.is_published AND os.setup_completed AND op.enabled AND p.is_active
    AND os.slug IS NOT NULL AND op.slug IS NOT NULL
  ORDER BY COALESCE(p.updated_at, op.updated_at, now()) DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 5000), 50000));
$$;

CREATE OR REPLACE FUNCTION public.get_public_sitemap_stores(_limit INTEGER DEFAULT 5000)
RETURNS TABLE(store_slug TEXT, updated_at TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT os.slug, COALESCE(os.updated_at, now())
  FROM public.online_stores os
  WHERE os.is_published AND os.setup_completed AND os.slug IS NOT NULL
  ORDER BY COALESCE(os.updated_at, now()) DESC
  LIMIT GREATEST(1, LEAST(COALESCE(_limit, 5000), 50000));
$$;

REVOKE ALL ON FUNCTION public.get_public_sitemap_products(INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_sitemap_stores(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_sitemap_products(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_sitemap_stores(INTEGER) TO anon, authenticated;
