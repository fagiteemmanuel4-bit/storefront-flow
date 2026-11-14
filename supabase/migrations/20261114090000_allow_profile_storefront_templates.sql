create or replace function public.upsert_storefront_config(
  _store_id uuid,
  _template text,
  _theme jsonb,
  _branding jsonb,
  _navigation jsonb,
  _sections jsonb,
  _seo jsonb,
  _custom_css text,
  _publish boolean
)
returns public.storefront_configs
language plpgsql
set search_path to 'public'
as $function$
declare
  result public.storefront_configs;
begin
  if not public.has_store_role(_store_id, auth.uid(), array['owner','manager']::public.store_role[]) then
    raise exception 'You do not have permission to edit this storefront';
  end if;

  if _template not in (
    'fashion','beauty','electronics','food','retail','jewelry','furniture','fitness','luxury','minimal-commerce',
    'everyday-edit','market-day','quiet-form','bold-supply','neighbourhood','signature-store',
    'fresh-market','provision-pro','atelier','wardrobe-edit','street-form',
    'tech-gallery','device-store','modern-electronics',
    'bistro','quick-bites','table-and-takeaway',
    'healthcare-clean','wellness-shelf','pharmacy-trust',
    'skin-studio','glow-market','beauty-editorial',
    'studio-services','appointment-first','craft-and-care'
  ) then
    raise exception 'Unsupported storefront template';
  end if;

  if jsonb_typeof(coalesce(_theme, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(_branding, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(_navigation, '{}'::jsonb)) <> 'object'
    or jsonb_typeof(coalesce(_sections, '[]'::jsonb)) <> 'array'
    or jsonb_typeof(coalesce(_seo, '{}'::jsonb)) <> 'object' then
    raise exception 'Invalid storefront configuration';
  end if;

  if length(coalesce(_custom_css, '')) > 20000 then
    raise exception 'Custom CSS is too large';
  end if;

  insert into public.storefront_configs (
    store_id, template, theme, branding, navigation, sections, seo, custom_css, is_published, version
  )
  values (
    _store_id, _template, coalesce(_theme, '{}'::jsonb), coalesce(_branding, '{}'::jsonb),
    coalesce(_navigation, '{}'::jsonb), coalesce(_sections, '[]'::jsonb), coalesce(_seo, '{}'::jsonb),
    coalesce(_custom_css, ''), coalesce(_publish, false), 1
  )
  on conflict (store_id) do update set
    template = excluded.template,
    theme = excluded.theme,
    branding = excluded.branding,
    navigation = excluded.navigation,
    sections = excluded.sections,
    seo = excluded.seo,
    custom_css = excluded.custom_css,
    is_published = excluded.is_published,
    version = public.storefront_configs.version + 1,
    updated_at = now()
  returning * into result;

  return result;
end;
$function$;
