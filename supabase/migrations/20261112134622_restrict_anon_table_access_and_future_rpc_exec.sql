-- Anonymous clients may only read explicitly public storefront/marketplace data
-- and submit the public feedback form. All other public-schema access is via
-- narrowly scoped SECURITY DEFINER RPCs with pinned search_path.
REVOKE SELECT, INSERT, UPDATE, DELETE
  ON ALL TABLES IN SCHEMA public FROM anon;

GRANT SELECT ON TABLE
  public.connect_products,
  public.connect_vendors,
  public.online_products,
  public.online_stores,
  public.product_images,
  public.products,
  public.store_hero_banners,
  public.storefront_configs,
  public.stores
TO anon;

GRANT INSERT ON TABLE public.store_feedback TO anon;

-- New tables/functions must be explicitly granted to public API roles.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM anon, authenticated;
