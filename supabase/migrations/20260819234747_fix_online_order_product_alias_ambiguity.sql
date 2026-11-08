create or replace function public.create_online_order(_slug text, _customer_name text, _customer_email text, _customer_phone text, _shipping_address text, _customer_note text, _payment_method text, _items jsonb)
returns text
language plpgsql
security definer
set search_path to ''
as $function$
declare
  s public.stores%rowtype;
  os public.online_stores%rowtype;
  product_row public.products%rowtype;
  item jsonb;
  qty integer;
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

  if _items is null or jsonb_array_length(_items)=0 then
    raise exception 'Your cart is empty';
  end if;

  select * into os
  from public.online_stores
  where slug=lower(btrim(_slug))
    and is_published
    and setup_completed;

  if not found then
    raise exception 'Storefront not found';
  end if;

  select * into s from public.stores where id=os.store_id;

  for item in select value from jsonb_array_elements(_items) loop
    select prod.* into product_row
    from public.products as prod
    join public.online_products as online_prod
      on online_prod.product_id=prod.id
    where prod.id=(item->>'product_id')::uuid
      and prod.store_id=s.id
      and prod.is_active
      and online_prod.enabled;

    if not found then
      raise exception 'A product in your cart is no longer available';
    end if;

    qty:=greatest(1,coalesce((item->>'quantity')::integer,1));
    subtotal:=subtotal+(product_row.price*qty);
  end loop;

  order_no:='KU-'||to_char(now(),'YYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));

  insert into public.online_orders(
    store_id,online_store_id,order_number,customer_name,customer_email,
    customer_phone,shipping_address,customer_note,payment_method,subtotal,total
  ) values(
    s.id,os.id,order_no,btrim(_customer_name),lower(btrim(coalesce(_customer_email,''))),
    btrim(_customer_phone),btrim(_shipping_address),btrim(coalesce(_customer_note,'')),
    _payment_method,subtotal,subtotal
  ) returning id into order_id;

  for item in select value from jsonb_array_elements(_items) loop
    select prod.* into product_row
    from public.products as prod
    join public.online_products as online_prod
      on online_prod.product_id=prod.id
    where prod.id=(item->>'product_id')::uuid
      and prod.store_id=s.id
      and prod.is_active
      and online_prod.enabled;

    qty:=greatest(1,coalesce((item->>'quantity')::integer,1));

    insert into public.online_order_items(
      order_id,store_id,product_id,product_name,unit_price,quantity,line_total
    ) values(
      order_id,s.id,product_row.id,product_row.name,product_row.price,
      qty,product_row.price*qty
    );
  end loop;

  return order_no;
end;
$function$;
