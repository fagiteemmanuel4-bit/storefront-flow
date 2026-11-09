-- Storefront discounts for retailer-owned products.
alter table public.online_products
  add column if not exists discount_type text,
  add column if not exists discount_value numeric(12,2),
  add column if not exists discount_starts_at timestamptz,
  add column if not exists discount_ends_at timestamptz,
  add column if not exists discount_label text not null default '';

alter table public.online_products
  drop constraint if exists online_products_discount_type_check,
  add constraint online_products_discount_type_check check (discount_type is null or discount_type in ('percentage','fixed')),
  drop constraint if exists online_products_discount_value_check,
  add constraint online_products_discount_value_check check (discount_value is null or discount_value >= 0),
  drop constraint if exists online_products_discount_percentage_check,
  add constraint online_products_discount_percentage_check check (discount_type <> 'percentage' or discount_value is null or discount_value <= 100);

create index if not exists online_products_active_discount_idx
  on public.online_products (store_id, enabled, discount_starts_at, discount_ends_at)
  where discount_type is not null;

drop function if exists public.get_public_store_catalog_v2(text);
create function public.get_public_store_catalog_v2(_slug text)
returns table(product_id uuid, name text, category text, price numeric, image_url text, image_urls text[], featured boolean, description text, stock_quantity integer, fashion_variants jsonb, original_price numeric, discount_label text)
language sql stable security definer set search_path to 'public'
as $function$
  select p.id, p.name, p.category,
    case when op.discount_type is not null and (op.discount_starts_at is null or op.discount_starts_at <= now()) and (op.discount_ends_at is null or op.discount_ends_at >= now())
      then greatest(0, round((p.price - case when op.discount_type='percentage' then p.price * op.discount_value / 100 else op.discount_value end)::numeric, 2))
      else p.price end,
    p.image_url,
    coalesce((select array_agg(pi.image_url order by pi.sort_order,pi.created_at) from public.product_images pi where pi.product_id=p.id),'{}'::text[]),
    op.featured, op.description,
    coalesce((select sum(bs.quantity)::integer from public.branch_stock bs where bs.store_id=os.store_id and bs.product_id=p.id),0)::integer,
    coalesce((select jsonb_agg(jsonb_build_object('size',v.size,'color',v.color,'quantity',v.quantity) order by v.size,v.color) from (
      select fvs.size,fvs.color,sum(fvs.quantity)::integer as quantity from public.fashion_variant_stock fvs
      join public.branches b on b.id=fvs.branch_id and b.store_id=fvs.store_id
      where fvs.store_id=os.store_id and fvs.product_id=p.id and fvs.quantity>0 group by fvs.size,fvs.color
    ) v),'[]'::jsonb),
    p.price,
    case when op.discount_type is not null and (op.discount_starts_at is null or op.discount_starts_at <= now()) and (op.discount_ends_at is null or op.discount_ends_at >= now())
      then coalesce(nullif(op.discount_label,''),'Sale') else '' end
  from public.online_stores os
  join public.online_products op on op.store_id=os.store_id and op.enabled=true
  join public.products p on p.id=op.product_id and p.is_active=true and p.store_id=os.store_id
  where lower(btrim(os.slug))=lower(btrim(_slug)) and os.is_published=true and os.setup_completed=true
  order by op.featured desc,p.name asc;
$function$;

drop function if exists public.get_public_store_product(text,text);
create function public.get_public_store_product(_store_slug text, _product_slug text)
returns table(store_id uuid, store_slug text, store_name text, store_description text, store_logo_url text, currency text, product_id uuid, product_slug text, product_name text, product_description text, product_price numeric, product_sku text, product_category text, product_image_url text, product_image_urls text[], product_featured boolean, stock_quantity integer, available boolean, product_original_price numeric, discount_label text)
language sql stable security definer set search_path to 'public'
as $function$
  select os.store_id,os.slug,os.display_name,os.description,os.logo_url,coalesce(s.currency,'NGN'),p.id,op.slug,p.name,coalesce(op.description,''),
    case when op.discount_type is not null and (op.discount_starts_at is null or op.discount_starts_at <= now()) and (op.discount_ends_at is null or op.discount_ends_at >= now())
      then greatest(0,round((p.price-case when op.discount_type='percentage' then p.price*op.discount_value/100 else op.discount_value end)::numeric,2)) else p.price end,
    p.sku,p.category,p.image_url,
    coalesce((select array_agg(pi.image_url order by pi.sort_order,pi.created_at) from public.product_images pi where pi.product_id=p.id and pi.store_id=p.store_id),array[]::text[]),
    op.featured,
    coalesce((select sum(bs.quantity)::integer from public.branch_stock bs where bs.product_id=p.id and bs.store_id=p.store_id),0),
    coalesce((select sum(bs.quantity)::integer from public.branch_stock bs where bs.product_id=p.id and bs.store_id=p.store_id),0)>0,
    p.price,
    case when op.discount_type is not null and (op.discount_starts_at is null or op.discount_starts_at <= now()) and (op.discount_ends_at is null or op.discount_ends_at >= now())
      then coalesce(nullif(op.discount_label,''),'Sale') else '' end
  from public.online_stores os join public.stores s on s.id=os.store_id
  join public.online_products op on op.store_id=os.store_id join public.products p on p.id=op.product_id
  where lower(os.slug)=lower(btrim(_store_slug)) and op.slug=btrim(_product_slug) and os.is_published and os.setup_completed and op.enabled and p.is_active;
$function$;

drop function if exists public.get_public_related_products(text,uuid,text,integer);
create function public.get_public_related_products(_store_slug text,_product_id uuid,_category text default null,_limit integer default 4)
returns table(product_id uuid,product_slug text,product_name text,product_price numeric,currency text,image_url text,available boolean,original_price numeric,discount_label text)
language sql stable security definer set search_path to 'public'
as $function$
  select p.id,op.slug,p.name,
    case when op.discount_type is not null and (op.discount_starts_at is null or op.discount_starts_at<=now()) and (op.discount_ends_at is null or op.discount_ends_at>=now())
      then greatest(0,round((p.price-case when op.discount_type='percentage' then p.price*op.discount_value/100 else op.discount_value end)::numeric,2)) else p.price end,
    coalesce(s.currency,'NGN'),p.image_url,
    coalesce((select sum(bs.quantity)::integer from public.branch_stock bs where bs.product_id=p.id and bs.store_id=p.store_id),0)>0,
    p.price,
    case when op.discount_type is not null and (op.discount_starts_at is null or op.discount_starts_at<=now()) and (op.discount_ends_at is null or op.discount_ends_at>=now())
      then coalesce(nullif(op.discount_label,''),'Sale') else '' end
  from public.online_stores os join public.stores s on s.id=os.store_id
  join public.online_products op on op.store_id=os.store_id join public.products p on p.id=op.product_id
  where lower(os.slug)=lower(btrim(_store_slug)) and os.is_published and os.setup_completed and op.enabled and p.is_active and p.id<>_product_id
    and (_category is null or _category='' or p.category=_category)
  order by op.featured desc,p.updated_at desc nulls last,p.name asc limit greatest(1,least(coalesce(_limit,4),12));
$function$;

grant execute on function public.get_public_store_catalog_v2(text) to anon,authenticated;
grant execute on function public.get_public_store_product(text,text) to anon,authenticated;
grant execute on function public.get_public_related_products(text,uuid,text,integer) to anon,authenticated;
