-- Restaurant menu modifiers, recipe ingredients, kitchen tickets and waste tracking.
create table if not exists public.food_menu_modifiers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options)='array'),
  is_required boolean not null default false,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_menu_modifiers_store_product_name_key unique(store_id,product_id,name)
);
create index if not exists food_menu_modifiers_product_idx on public.food_menu_modifiers(store_id,product_id,is_active);

create table if not exists public.food_recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  menu_product_id uuid not null references public.products(id) on delete cascade,
  ingredient_product_id uuid not null references public.products(id) on delete restrict,
  quantity_per_serving integer not null check (quantity_per_serving>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_recipe_ingredients_unique unique(branch_id,menu_product_id,ingredient_product_id),
  constraint food_recipe_products_differ check(menu_product_id<>ingredient_product_id)
);
create index if not exists food_recipe_menu_idx on public.food_recipe_ingredients(store_id,branch_id,menu_product_id);
create index if not exists food_recipe_ingredient_idx on public.food_recipe_ingredients(store_id,branch_id,ingredient_product_id);

create table if not exists public.food_kitchen_tickets (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  ticket_number text not null unique,
  status text not null default 'new' check(status in ('new','preparing','ready','served','cancelled')),
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint food_kitchen_tickets_sale_unique unique(sale_id)
);
create index if not exists food_kitchen_tickets_queue_idx on public.food_kitchen_tickets(store_id,branch_id,status,created_at);

create table if not exists public.food_kitchen_ticket_items (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.food_kitchen_tickets(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_item_id uuid not null references public.sale_items(id) on delete cascade,
  product_name text not null,
  quantity integer not null check(quantity>0),
  modifiers jsonb not null default '[]'::jsonb,
  order_notes text not null default '',
  created_at timestamptz not null default now(),
  constraint food_kitchen_ticket_items_sale_item_unique unique(sale_item_id)
);
create index if not exists food_kitchen_ticket_items_ticket_idx on public.food_kitchen_ticket_items(ticket_id);

create table if not exists public.food_waste_records (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  ingredient_product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check(quantity>0),
  reason text not null,
  recorded_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists food_waste_records_store_created_idx on public.food_waste_records(store_id,created_at desc);

alter table public.sale_items add column if not exists food_modifiers jsonb not null default '[]'::jsonb;
alter table public.sale_items add column if not exists order_notes text not null default '';

alter table public.food_menu_modifiers enable row level security;
alter table public.food_recipe_ingredients enable row level security;
alter table public.food_kitchen_tickets enable row level security;
alter table public.food_kitchen_ticket_items enable row level security;
alter table public.food_waste_records enable row level security;

drop policy if exists "Store members can view food modifiers" on public.food_menu_modifiers;
create policy "Store members can view food modifiers" on public.food_menu_modifiers for select to authenticated using(public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Managers can manage food modifiers" on public.food_menu_modifiers;
create policy "Managers can manage food modifiers" on public.food_menu_modifiers for all to authenticated
using(public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
with check(
 public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
 and exists(select 1 from public.products p where p.id=food_menu_modifiers.product_id and p.store_id=food_menu_modifiers.store_id)
);

drop policy if exists "Store members can view food recipes" on public.food_recipe_ingredients;
create policy "Store members can view food recipes" on public.food_recipe_ingredients for select to authenticated using(public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Managers can manage food recipes" on public.food_recipe_ingredients;
create policy "Managers can manage food recipes" on public.food_recipe_ingredients for all to authenticated
using(public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[]))
with check(
 public.has_store_role(store_id,(select auth.uid()),array['owner','manager']::public.store_role[])
 and exists(select 1 from public.branches b where b.id=food_recipe_ingredients.branch_id and b.store_id=food_recipe_ingredients.store_id)
 and exists(select 1 from public.products p where p.id=food_recipe_ingredients.menu_product_id and p.store_id=food_recipe_ingredients.store_id)
 and exists(select 1 from public.products p where p.id=food_recipe_ingredients.ingredient_product_id and p.store_id=food_recipe_ingredients.store_id)
);

drop policy if exists "Store members can view kitchen tickets" on public.food_kitchen_tickets;
create policy "Store members can view kitchen tickets" on public.food_kitchen_tickets for select to authenticated using(public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Staff can update kitchen tickets" on public.food_kitchen_tickets;
create policy "Staff can update kitchen tickets" on public.food_kitchen_tickets for update to authenticated
using(public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[]))
with check(public.has_store_role(store_id,(select auth.uid()),array['owner','manager','cashier']::public.store_role[]));

drop policy if exists "Store members can view kitchen ticket items" on public.food_kitchen_ticket_items;
create policy "Store members can view kitchen ticket items" on public.food_kitchen_ticket_items for select to authenticated using(public.is_store_member(store_id,(select auth.uid())));

drop policy if exists "Store members can view food waste" on public.food_waste_records;
create policy "Store members can view food waste" on public.food_waste_records for select to authenticated using(public.is_store_member(store_id,(select auth.uid())));

create or replace function public.record_food_waste(
  _store_id uuid,_branch_id uuid,_ingredient_product_id uuid,_quantity integer,_reason text
)
returns uuid language plpgsql security definer set search_path=public,extensions as $function$
declare v_user_id uuid:=auth.uid(); v_available integer; v_id uuid;
begin
 if v_user_id is null then raise exception 'Not authenticated'; end if;
 if not public.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
 if _quantity is null or _quantity<=0 then raise exception 'Waste quantity must be greater than zero'; end if;
 if length(btrim(coalesce(_reason,'')))<3 then raise exception 'Enter a waste reason'; end if;
 if not exists(select 1 from public.products p where p.id=_ingredient_product_id and p.store_id=_store_id) then raise exception 'Invalid ingredient'; end if;
 select quantity into v_available from public.branch_stock where store_id=_store_id and branch_id=_branch_id and product_id=_ingredient_product_id for update;
 if not found or v_available<_quantity then raise exception 'Not enough stock to record this waste'; end if;
 update public.branch_stock set quantity=quantity-_quantity,updated_at=now() where store_id=_store_id and branch_id=_branch_id and product_id=_ingredient_product_id;
 insert into public.food_waste_records(store_id,branch_id,ingredient_product_id,quantity,reason,recorded_by)
 values(_store_id,_branch_id,_ingredient_product_id,_quantity,btrim(_reason),v_user_id) returning id into v_id;
 return v_id;
end;
$function$;
