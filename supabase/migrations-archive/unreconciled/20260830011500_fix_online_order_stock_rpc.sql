-- Follow-up fix: avoid PL/pgSQL variable/column ambiguity in the allocation upsert.
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
  v_order_id uuid;
  order_no text;
begin
  if btrim(coalesce(_customer_name,''))='' or btrim(coalesce(_customer_phone,''))='' or btrim(coalesce(_shipping_address,''))='' then raise exception 'Name, phone and delivery address are required'; end if;
  if _payment_method not in ('pay_on_delivery','bank_transfer') then raise exception 'Unsupported payment method'; end if;
  if jsonb_typeof(_items)<>'array' or jsonb_array_length(_items)=0 then raise exception 'Your cart is empty'; end if;
  select * into os from public.online_stores where slug=lower(btrim(_slug)) and is_published and setup_completed for share;
  if not found then raise exception 'Storefront not found'; end if;
  select * into s from public.stores where id=os.store_id;

  for item in select value from jsonb_array_elements(_items) loop
    if (item->>'product_id') is null or (item->>'product_id')='' then raise exception 'Invalid product in cart'; end if;
    qty := (item->>'quantity')::integer;
    if qty is null or qty<=0 then raise exception 'Invalid quantity'; end if;
    select prod.* into product_row
    from public.products prod
    join public.online_products online_prod on online_prod.product_id=prod.id
    where prod.id=(item->>'product_id')::uuid and prod.store_id=s.id and prod.is_active and online_prod.store_id=s.id and online_prod.enabled;
    if not found then raise exception 'A product in your cart is no longer available'; end if;
    subtotal := subtotal + product_row.price * qty;
  end loop;

  order_no := 'KU-'||to_char(clock_timestamp(),'YYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  insert into public.online_orders(store_id,online_store_id,order_number,customer_name,customer_email,customer_phone,shipping_address,customer_note,payment_method,subtotal,total)
  values(s.id,os.id,order_no,btrim(_customer_name),lower(btrim(coalesce(_customer_email,''))),btrim(_customer_phone),btrim(_shipping_address),btrim(coalesce(_customer_note,'')),_payment_method,subtotal,subtotal)
  returning id into v_order_id;

  for item in select value from jsonb_array_elements(_items) loop
    qty := (item->>'quantity')::integer;
    remaining := qty;
    for stock_row in
      select bs.branch_id, bs.product_id, bs.quantity
      from public.branch_stock bs
      join public.branches b on b.id=bs.branch_id and b.store_id=s.id
      where bs.store_id=s.id and bs.product_id=(item->>'product_id')::uuid and bs.quantity>0
      order by b.is_default desc, bs.quantity desc, bs.branch_id
      for update of bs
    loop
      exit when remaining<=0;
      allocated := least(remaining,stock_row.quantity);
      update public.branch_stock set quantity=quantity-allocated,updated_at=now() where branch_id=stock_row.branch_id and product_id=stock_row.product_id;
      insert into public.online_order_stock_allocations(order_id,store_id,branch_id,product_id,quantity)
      values(v_order_id,s.id,stock_row.branch_id,stock_row.product_id,allocated)
      on conflict(order_id,branch_id,product_id) do update
        set quantity=public.online_order_stock_allocations.quantity+excluded.quantity;
      remaining := remaining-allocated;
    end loop;
    if remaining>0 then raise exception 'Insufficient stock for an item in your cart'; end if;
    select prod.* into product_row from public.products prod where prod.id=(item->>'product_id')::uuid and prod.store_id=s.id;
    insert into public.online_order_items(order_id,store_id,product_id,product_name,unit_price,quantity,line_total)
    values(v_order_id,s.id,product_row.id,product_row.name,product_row.price,qty,product_row.price*qty);
  end loop;
  return order_no;
end;
$$;
revoke all on function public.create_online_order(text,text,text,text,text,text,text,jsonb) from public;
grant execute on function public.create_online_order(text,text,text,text,text,text,text,jsonb) to anon,authenticated;
