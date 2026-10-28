-- Store builder foundation: structured, tenant-scoped configuration.
create table if not exists public.storefront_configs (
  store_id uuid primary key references public.stores(id) on delete cascade,
  template text not null default 'minimal-commerce',
  theme jsonb not null default '{}'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  navigation jsonb not null default '{}'::jsonb,
  sections jsonb not null default '[]'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  custom_css text not null default '',
  published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storefront_configs_template_check check (template in ('fashion','beauty','electronics','food','general-retail','jewelry','furniture-home','fitness','luxury','minimal-commerce')),
  constraint storefront_configs_sections_array check (jsonb_typeof(sections) = 'array'),
  constraint storefront_configs_custom_css_size check (length(custom_css) <= 50000)
);

alter table public.storefront_configs enable row level security;

create or replace function public.can_manage_store(target_store_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.store_members sm
    where sm.store_id = target_store_id
      and sm.user_id = auth.uid()
      and sm.role in ('owner','manager')
  );
$$;

create policy storefront_configs_select on public.storefront_configs
for select using (public.can_manage_store(store_id));

create policy storefront_configs_insert on public.storefront_configs
for insert with check (public.can_manage_store(store_id));

create policy storefront_configs_update on public.storefront_configs
for update using (public.can_manage_store(store_id))
with check (public.can_manage_store(store_id));

create or replace function public.upsert_storefront_config(
  p_store_id uuid,
  p_template text,
  p_theme jsonb,
  p_branding jsonb,
  p_navigation jsonb,
  p_sections jsonb,
  p_seo jsonb,
  p_custom_css text,
  p_published boolean
)
returns public.storefront_configs
language plpgsql security definer set search_path = public
as $$
declare
  result public.storefront_configs;
begin
  if auth.uid() is null or not public.can_manage_store(p_store_id) then
    raise exception 'Not authorized to manage this store';
  end if;
  if p_template not in ('fashion','beauty','electronics','food','general-retail','jewelry','furniture-home','fitness','luxury','minimal-commerce') then
    raise exception 'Unsupported storefront template';
  end if;
  if jsonb_typeof(coalesce(p_sections, '[]'::jsonb)) <> 'array' then
    raise exception 'Sections must be an array';
  end if;
  if length(coalesce(p_custom_css, '')) > 50000 then
    raise exception 'Custom CSS exceeds the 50000 character limit';
  end if;

  insert into public.storefront_configs(store_id, template, theme, branding, navigation, sections, seo, custom_css, published, version)
  values (p_store_id, p_template, coalesce(p_theme,'{}'), coalesce(p_branding,'{}'), coalesce(p_navigation,'{}'), coalesce(p_sections,'[]'), coalesce(p_seo,'{}'), coalesce(p_custom_css,''), coalesce(p_published,false), 1)
  on conflict (store_id) do update set
    template = excluded.template,
    theme = excluded.theme,
    branding = excluded.branding,
    navigation = excluded.navigation,
    sections = excluded.sections,
    seo = excluded.seo,
    custom_css = excluded.custom_css,
    published = excluded.published,
    version = public.storefront_configs.version + 1,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

grant execute on function public.upsert_storefront_config(uuid,text,jsonb,jsonb,jsonb,jsonb,jsonb,text,boolean) to authenticated;
