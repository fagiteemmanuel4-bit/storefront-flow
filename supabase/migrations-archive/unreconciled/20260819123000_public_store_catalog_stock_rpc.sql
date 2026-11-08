create or replace function public.get_public_store_catalog(_slug text)
returns table (
  product_id uuid,
  name text,
  category text,
  price numeric,
  image_url text,
  image_urls text[],
  featured boolean,
  description text,
  stock_quantity integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as product_id,
    p.name,
    p.category,
    p.price,
    p.image_url,
    coalesce((select array_agg(pi.image_url order by pi.sort_order, pi.created_at) from public.product_images pi where pi.product_id = p.id), '{}'::text[]) as image_urls,
    op.featured,
    op.description,
    coalesce((select sum(bs.quantity)::integer from public.branch_stock bs where bs.store_id = os.store_id and bs.product_id = p.id), 0)::integer as stock_quantity
  from public.online_stores os
  join public.online_products op on op.store_id = os.store_id and op.enabled = true
  join public.products p on p.id = op.product_id and p.is_active = true and p.store_id = os.store_id
  where lower(btrim(os.slug)) = lower(btrim(_slug))
    and os.is_published = true
    and os.setup_completed = true
  order by op.featured desc, p.name asc;
$$;

revoke all on function public.get_public_store_catalog(text) from public;
grant execute on function public.get_public_store_catalog(text) to anon, authenticated;
