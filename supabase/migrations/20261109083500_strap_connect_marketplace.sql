-- STRAP Connect: supplier profiles, wholesale catalogue and saved connections.
create table if not exists public.connect_vendors (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null check (char_length(btrim(business_name)) between 2 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 1200),
  category text not null default 'General' check (char_length(category) <= 80),
  country text not null default 'Nigeria' check (char_length(country) <= 80),
  state text not null default '' check (char_length(state) <= 80),
  city text not null default '' check (char_length(city) <= 80),
  whatsapp_number text not null default '' check (char_length(whatsapp_number) <= 32),
  logo_url text not null default '' check (char_length(logo_url) <= 2048),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint connect_vendors_owner_unique unique (owner_id)
);

create table if not exists public.connect_products (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.connect_vendors(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 2 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  category text not null default 'General' check (char_length(category) <= 80),
  image_url text not null default '' check (char_length(image_url) <= 2048),
  wholesale_price numeric(14,2) not null check (wholesale_price >= 0),
  suggested_retail_price numeric(14,2) not null default 0 check (suggested_retail_price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  min_order_quantity integer not null default 1 check (min_order_quantity >= 1),
  unit text not null default 'piece' check (char_length(unit) <= 32),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connect_saved_products (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.connect_products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.connect_saved_vendors (
  user_id uuid not null references auth.users(id) on delete cascade,
  vendor_id uuid not null references public.connect_vendors(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, vendor_id)
);

create index if not exists connect_vendors_discovery_idx
  on public.connect_vendors (is_published, country, state, category, created_at desc);
create index if not exists connect_products_discovery_idx
  on public.connect_products (is_active, category, wholesale_price, created_at desc);
create index if not exists connect_products_vendor_idx
  on public.connect_products (vendor_id, is_active, created_at desc);
create index if not exists connect_saved_products_user_idx
  on public.connect_saved_products (user_id, created_at desc);
create index if not exists connect_saved_vendors_user_idx
  on public.connect_saved_vendors (user_id, created_at desc);

create or replace function public.set_connect_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_connect_updated_at() from public, anon, authenticated;

drop trigger if exists connect_vendors_updated_at on public.connect_vendors;
create trigger connect_vendors_updated_at
before update on public.connect_vendors
for each row execute function public.set_connect_updated_at();

drop trigger if exists connect_products_updated_at on public.connect_products;
create trigger connect_products_updated_at
before update on public.connect_products
for each row execute function public.set_connect_updated_at();

alter table public.connect_vendors enable row level security;
alter table public.connect_products enable row level security;
alter table public.connect_saved_products enable row level security;
alter table public.connect_saved_vendors enable row level security;

drop policy if exists "Connect vendors are discoverable when published" on public.connect_vendors;
create policy "Connect vendors are discoverable when published"
on public.connect_vendors for select to anon, authenticated
using (is_published or owner_id = (select auth.uid()));

drop policy if exists "Users create their own Connect vendor profile" on public.connect_vendors;
create policy "Users create their own Connect vendor profile"
on public.connect_vendors for insert to authenticated
with check (owner_id = (select auth.uid()));

drop policy if exists "Users update their own Connect vendor profile" on public.connect_vendors;
create policy "Users update their own Connect vendor profile"
on public.connect_vendors for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

drop policy if exists "Users delete their own Connect vendor profile" on public.connect_vendors;
create policy "Users delete their own Connect vendor profile"
on public.connect_vendors for delete to authenticated
using (owner_id = (select auth.uid()));

drop policy if exists "Published Connect products are discoverable" on public.connect_products;
create policy "Published Connect products are discoverable"
on public.connect_products for select to anon, authenticated
using (
  (is_active and exists (
    select 1 from public.connect_vendors v
    where v.id = vendor_id and v.is_published
  ))
  or exists (
    select 1 from public.connect_vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  )
);

drop policy if exists "Vendors manage their own Connect products" on public.connect_products;
create policy "Vendors manage their own Connect products"
on public.connect_products for all to authenticated
using (
  exists (
    select 1 from public.connect_vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1 from public.connect_vendors v
    where v.id = vendor_id and v.owner_id = (select auth.uid())
  )
);

drop policy if exists "Users manage their own saved Connect products" on public.connect_saved_products;
create policy "Users manage their own saved Connect products"
on public.connect_saved_products for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.connect_products p
    join public.connect_vendors v on v.id = p.vendor_id
    where p.id = product_id and p.is_active and v.is_published
  )
);

drop policy if exists "Users manage their own saved Connect vendors" on public.connect_saved_vendors;
create policy "Users manage their own saved Connect vendors"
on public.connect_saved_vendors for all to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.connect_vendors v
    where v.id = vendor_id and v.is_published
  )
);

-- Public discovery only needs read access; writes remain subject to owner-scoped RLS.
grant select on public.connect_vendors, public.connect_products to anon, authenticated;
grant insert, update, delete on public.connect_vendors, public.connect_products to authenticated;
grant select, insert, update, delete on public.connect_saved_products, public.connect_saved_vendors to authenticated;
