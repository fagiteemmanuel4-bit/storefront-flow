-- Reserve online stock atomically at checkout and release it exactly once on cancellation.
create table if not exists public.online_order_stock_allocations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.online_orders(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  released_at timestamptz,
  created_at timestamptz not null default now(),
  unique(order_id, branch_id, product_id)
);
create index if not exists online_order_stock_allocations_order_idx
  on public.online_order_stock_allocations(order_id);
create index if not exists online_order_stock_allocations_store_idx
  on public.online_order_stock_allocations(store_id, created_at desc);

alter table public.online_order_stock_allocations enable row level security;
create policy online_order_stock_allocations_member_read
  on public.online_order_stock_allocations for select to authenticated
  using (public.is_store_member(store_id, auth.uid()));

create or replace function public.create_online_order(
  _slug text,
  _customer_name text,
  _customer_email text,
  _customer_phone text,
  _shipping_address text,
  _customer_note text,
  _payment_method text,
  _items jsonb
)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  s public.stores%rowtype;
  os public.online_stores%rowtype;
  product_row public.products%rowtype;
  stock_row record;
  item jsonb;
  qty integer;
  remaining integer;
  allocated integer;
  subtotal numeric(12,2) := 0;
  order_id uuid;
  order_no text;
begin
  if btrim(coalesce(_customer_name,''))='' or btrim(coalesce(_customer_phone,''))='' or btrim(coalesce(_shipping_address,''))='' then
    raise exception 'Name, phone and delivery address are required';
  end if;
  if _payment_method not in ('pay_on_delivery','bank_transfer') then
    raise exception 'Unsupported payment method';
  end if;
  if jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items)=0 then
    raise exception 'Your cart is empty';
  end if;

  select * into os
  from public.online_stores
  where slug=lower(btrim(_slug)) and is_published and setup_completed
  for share;
  if not found then raise exception 'Storefront not found'; end if;
  select * into s from public.stores where id=os.store_id;

  -- Validate every line against the live catalog before mutating stock.
  for item in select value from jsonb_array_elements(_items) loop
    if (item->>'product_id') is null or (item->>'product_id') = '' then
      raise exception 'Invalid product in cart';
    end if;
    qty := (item->>'quantity')::integer;
    if qty is null or qty <= 0 then raise exception 'Invalid quantity'; end if;
    select prod.* into product_row
    from public.products prod
    join public.online_products online_prod on online_prod.product_id=prod.id
    where prod.id=(item->>'product_id')::uuid
      and prod.store_id=s.id and prod.is_active and online_prod.store_id=s.id and online_prod.enabled;
    if not found then raise exception 'A product in your cart is no longer available'; end if;
    subtotal := subtotal + product_row.price * qty;
  end loop;

  order_no := 'KU-'||to_char(clock_timestamp(),'YYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  insert into public.online_orders(
    store_id,online_store_id,order_number,customer_name,customer_email,customer_phone,
    shipping_address,customer_note,payment_method,subtotal,total
  ) values(
    s.id,os.id,order_no,btrim(_customer_name),lower(btrim(coalesce(_customer_email,''))),
    btrim(_customer_phone),btrim(_shipping_address),btrim(coalesce(_customer_note,'')),_payment_method,subtotal,subtotal
  ) returning id into order_id;

  -- Allocate from the live branch stock rows while holding row locks. If the
  -- aggregate stock is insufficient, the exception rolls back the order too.
  for item in select value from jsonb_array_elements(_items) loop
    qty := (item->>'quantity')::integer;
    remaining := qty;
    for stock_row in
      select bs.branch_id, bs.product_id, bs.quantity
      from public.branch_stock bs
      join public.branches b on b.id=bs.branch_id and b.store_id=s.id
      where bs.store_id=s.id and bs.product_id=(item->>'product_id')::uuid and bs.quantity > 0
      order by b.is_default desc, bs.quantity desc, bs.branch_id
      for update of bs
    loop
      exit when remaining <= 0;
      allocated := least(remaining, stock_row.quantity);
      update public.branch_stock
      set quantity = quantity - allocated, updated_at = now()
      where branch_id=stock_row.branch_id and product_id=stock_row.product_id;
      insert into public.online_order_stock_allocations(order_id,store_id,branch_id,product_id,quantity)
      values(order_id,s.id,stock_row.branch_id,stock_row.product_id,allocated)
      on conflict (order_id,branch_id,product_id)
      do update set quantity=public.online_order_stock_allocations.quantity + excluded.quantity;
      remaining := remaining - allocated;
    end loop;
    if remaining > 0 then
      raise exception 'Insufficient stock for an item in your cart';
    end if;

    select prod.* into product_row
    from public.products prod
    where prod.id=(item->>'product_id')::uuid and prod.store_id=s.id;
    insert into public.online_order_items(order_id,store_id,product_id,product_name,unit_price,quantity,line_total)
    values(order_id,s.id,product_row.id,product_row.name,product_row.price,qty,product_row.price*qty);
  end loop;

  return order_no;
end;
$$;

revoke all on function public.create_online_order(text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.create_online_order(text,text,text,text,text,text,text,jsonb) to anon, authenticated;

create or replace function public.release_online_order_stock()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.branch_stock bs
    set quantity = bs.quantity + a.quantity, updated_at = now()
    from public.online_order_stock_allocations a
    where a.order_id = new.id
      and a.released_at is null
      and bs.branch_id = a.branch_id
      and bs.product_id = a.product_id;

    update public.online_order_stock_allocations
    set released_at = now()
    where order_id = new.id and released_at is null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_release_online_order_stock on public.online_orders;
create trigger trg_release_online_order_stock
after update of status on public.online_orders
for each row execute function public.release_online_order_stock();
