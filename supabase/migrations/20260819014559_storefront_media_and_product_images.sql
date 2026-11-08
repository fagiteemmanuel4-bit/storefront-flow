create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  image_url text not null,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);
create index if not exists product_images_product_sort_idx on public.product_images(product_id, sort_order, created_at);
create index if not exists product_images_store_idx on public.product_images(store_id);
alter table public.product_images enable row level security;
create policy product_images_members_read on public.product_images for select using (private.is_store_member(store_id, auth.uid()));
create policy product_images_manager_write on public.product_images for all using (private.has_store_role(store_id, auth.uid(), array['owner'::store_role,'manager'::store_role])) with check (private.has_store_role(store_id, auth.uid(), array['owner'::store_role,'manager'::store_role]));
create policy product_images_public_read on public.product_images for select using (is_product_public_online(product_id));

create table if not exists public.store_hero_banners (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  image_url text not null,
  title text not null default '',
  subtitle text not null default '',
  sort_order integer not null default 0 check (sort_order >= 0 and sort_order < 5),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(store_id, sort_order)
);
create index if not exists store_hero_banners_store_idx on public.store_hero_banners(store_id, sort_order);
alter table public.store_hero_banners enable row level security;
create policy store_hero_banners_members_read on public.store_hero_banners for select using (private.is_store_member(store_id, auth.uid()));
create policy store_hero_banners_owner_manager_write on public.store_hero_banners for all using (private.has_store_role(store_id, auth.uid(), array['owner'::store_role,'manager'::store_role])) with check (private.has_store_role(store_id, auth.uid(), array['owner'::store_role,'manager'::store_role]));
create policy store_hero_banners_public_read on public.store_hero_banners for select using (is_active and exists (select 1 from public.online_stores os where os.store_id = store_hero_banners.store_id and os.is_published and os.setup_completed));

create or replace view public.online_catalog as
select os.store_id, os.slug, os.display_name, os.logo_url, os.display_email, os.display_phone,
  os.description as store_description, s.currency, p.id as product_id, p.name, p.sku, p.category,
  p.price, p.image_url, op.featured, op.description,
  coalesce((select json_agg(pi.image_url order by pi.sort_order, pi.created_at) from public.product_images pi where pi.product_id = p.id), '[]'::json) as image_urls
from public.online_stores os
join public.stores s on s.id = os.store_id
join public.online_products op on op.store_id = os.store_id
join public.products p on p.id = op.product_id
where os.is_published and os.setup_completed and op.enabled and p.is_active;

create or replace view public.online_store_heroes as
select os.store_id, os.slug, hb.id, hb.image_url, hb.title, hb.subtitle, hb.sort_order
from public.online_stores os
join public.store_hero_banners hb on hb.store_id = os.store_id
where os.is_published and os.setup_completed and hb.is_active
order by hb.sort_order, hb.created_at;
