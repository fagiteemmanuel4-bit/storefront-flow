-- KUDI Store Builder foundation: structured, tenant-scoped storefront configuration.
CREATE TABLE IF NOT EXISTS public.storefront_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL UNIQUE REFERENCES public.stores(id) ON DELETE CASCADE,
  template TEXT NOT NULL DEFAULT 'minimal-commerce',
  theme JSONB NOT NULL DEFAULT '{"primaryColor":"#111827","secondaryColor":"#f3f4f6","accentColor":"#f59e0b","textColor":"#111827","backgroundColor":"#ffffff","buttonRadius":"medium","fontFamily":"Inter"}'::jsonb,
  branding JSONB NOT NULL DEFAULT '{"logoUrl":"","faviconUrl":"","tagline":""}'::jsonb,
  navigation JSONB NOT NULL DEFAULT '{"links":[]}'::jsonb,
  sections JSONB NOT NULL DEFAULT '[{"id":"hero","type":"hero","enabled":true,"settings":{}},{"id":"featured-products","type":"featured-products","enabled":true,"settings":{}},{"id":"product-grid","type":"product-grid","enabled":true,"settings":{}},{"id":"footer","type":"footer","enabled":true,"settings":{}}]'::jsonb,
  seo JSONB NOT NULL DEFAULT '{"title":"","description":"","keywords":[],"noIndex":false}'::jsonb,
  custom_css TEXT NOT NULL DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT storefront_configs_template_check CHECK (template IN ('fashion','beauty','electronics','food','retail','jewelry','furniture','fitness','luxury','minimal-commerce')),
  CONSTRAINT storefront_configs_theme_object CHECK (jsonb_typeof(theme) = 'object'),
  CONSTRAINT storefront_configs_branding_object CHECK (jsonb_typeof(branding) = 'object'),
  CONSTRAINT storefront_configs_navigation_object CHECK (jsonb_typeof(navigation) = 'object'),
  CONSTRAINT storefront_configs_sections_array CHECK (jsonb_typeof(sections) = 'array'),
  CONSTRAINT storefront_configs_seo_object CHECK (jsonb_typeof(seo) = 'object')
);

CREATE INDEX IF NOT EXISTS storefront_configs_template_idx ON public.storefront_configs(template);
ALTER TABLE public.storefront_configs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.storefront_configs TO authenticated;
GRANT SELECT ON public.storefront_configs TO anon;

CREATE POLICY "storefront_configs_members_read" ON public.storefront_configs FOR SELECT TO authenticated
  USING (public.is_store_member(store_id, auth.uid()));
CREATE POLICY "storefront_configs_owner_manager_insert" ON public.storefront_configs FOR INSERT TO authenticated
  WITH CHECK (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));
CREATE POLICY "storefront_configs_owner_manager_update" ON public.storefront_configs FOR UPDATE TO authenticated
  USING (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]))
  WITH CHECK (public.has_store_role(store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]));
CREATE POLICY "storefront_configs_public_read" ON public.storefront_configs FOR SELECT TO anon
  USING (is_published AND NOT COALESCE((seo->>'noIndex')::boolean, false));

CREATE OR REPLACE FUNCTION public.upsert_storefront_config(
  _store_id UUID,
  _template TEXT,
  _theme JSONB,
  _branding JSONB,
  _navigation JSONB,
  _sections JSONB,
  _seo JSONB,
  _custom_css TEXT,
  _publish BOOLEAN
) RETURNS public.storefront_configs
LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE result public.storefront_configs;
BEGIN
  IF NOT public.has_store_role(_store_id, auth.uid(), ARRAY['owner','manager']::public.store_role[]) THEN
    RAISE EXCEPTION 'You do not have permission to edit this storefront';
  END IF;
  IF _template NOT IN ('fashion','beauty','electronics','food','retail','jewelry','furniture','fitness','luxury','minimal-commerce') THEN
    RAISE EXCEPTION 'Unsupported storefront template';
  END IF;
  IF jsonb_typeof(COALESCE(_theme,'{}'::jsonb)) <> 'object' OR jsonb_typeof(COALESCE(_branding,'{}'::jsonb)) <> 'object' OR jsonb_typeof(COALESCE(_navigation,'{}'::jsonb)) <> 'object' OR jsonb_typeof(COALESCE(_sections,'[]'::jsonb)) <> 'array' OR jsonb_typeof(COALESCE(_seo,'{}'::jsonb)) <> 'object' THEN
    RAISE EXCEPTION 'Invalid storefront configuration';
  END IF;
  IF length(COALESCE(_custom_css,'')) > 20000 THEN RAISE EXCEPTION 'Custom CSS is too large'; END IF;

  INSERT INTO public.storefront_configs(store_id,template,theme,branding,navigation,sections,seo,custom_css,is_published,version)
  VALUES(_store_id,_template,COALESCE(_theme,'{}'::jsonb),COALESCE(_branding,'{}'::jsonb),COALESCE(_navigation,'{}'::jsonb),COALESCE(_sections,'[]'::jsonb),COALESCE(_seo,'{}'::jsonb),COALESCE(_custom_css,''),COALESCE(_publish,false),1)
  ON CONFLICT(store_id) DO UPDATE SET
    template=EXCLUDED.template, theme=EXCLUDED.theme, branding=EXCLUDED.branding, navigation=EXCLUDED.navigation,
    sections=EXCLUDED.sections, seo=EXCLUDED.seo, custom_css=EXCLUDED.custom_css, is_published=EXCLUDED.is_published,
    version=public.storefront_configs.version+1, updated_at=now()
  RETURNING * INTO result;
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.upsert_storefront_config(UUID,TEXT,JSONB,JSONB,JSONB,JSONB,JSONB,TEXT,BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_storefront_config(UUID,TEXT,JSONB,JSONB,JSONB,JSONB,JSONB,TEXT,BOOLEAN) TO authenticated;

CREATE OR REPLACE VIEW public.public_storefront_configs WITH (security_invoker=true) AS
SELECT store_id, template, theme, branding, navigation, sections, seo, version, updated_at
FROM public.storefront_configs
WHERE is_published AND NOT COALESCE((seo->>'noIndex')::boolean, false);
GRANT SELECT ON public.public_storefront_configs TO anon, authenticated;
