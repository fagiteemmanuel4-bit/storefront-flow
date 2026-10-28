-- Variant-aware checkout is opt-in per cart line. Existing callers keep the product-level path.
create or replace function public.create_sale(
  _store_id uuid,
  _branch_id uuid,
  _payment_method text,
  _items jsonb,
  _note text default '',
  _customer_id uuid default null,
  _offline_id text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_sale_id uuid;
  v_reference text;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  v_tax_rate numeric;
  v_item jsonb;
  v_product record;
  v_variant record;
  v_variant_id uuid;
  v_device record;
  v_device_id uuid;
  v_sale_item_id uuid;
  v_quantity integer;
  v_stock_units integer;
  v_unit_type text;
  v_units_per_sale integer;
  v_unit_price numeric;
  v_line_total numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not private.has_store_role(_store_id, v_user_id, array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
  if not exists(select 1 from public.branches b where b.id = _branch_id and b.store_id = _store_id) then raise exception 'Invalid branch'; end if;
  if _payment_method not in ('cash','card','transfer','credit') then raise exception 'Invalid payment method'; end if;
  if _customer_id is not null and not exists(select 1 from public.customers c where c.id = _customer_id and c.store_id = _store_id) then raise exception 'Invalid customer'; end if;
  if _offline_id is not null then
    select id into v_sale_id from public.sales where offline_id = _offline_id and store_id = _store_id limit 1;
    if v_sale_id is not null then return v_sale_id; end if;
  end if;
  if jsonb_typeof(_items) <> 'array' or jsonb_array_length(_items) = 0 then raise exception 'Sale must contain at least one item'; end if;
  select tax_rate into v_tax_rate from public.stores where id = _store_id;

  -- Validate all items and lock the relevant stock rows before creating a sale.
  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_type := coalesce(v_item->>'unit_type', 'piece');
    v_variant_id := nullif(v_item->>'fashion_variant_stock_id', '')::uuid;
    v_device_id := nullif(v_item->>'electronics_device_id', '')::uuid;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Invalid quantity'; end if;
    if v_unit_type not in ('piece','pack') then raise exception 'Invalid sale unit'; end if;
    select p.id,p.name,p.price,p.piece_price,p.pack_price,p.units_per_pack,bs.quantity
      into v_product
      from public.products p
      join public.branch_stock bs on bs.product_id = p.id and bs.branch_id = _branch_id
      where p.id = (v_item->>'product_id')::uuid and p.store_id = _store_id and p.is_active = true
      for update of bs;
    if not found then raise exception 'Product is not available at this branch'; end if;

    v_units_per_sale := case when v_unit_type = 'pack' then greatest(v_product.units_per_pack,1) else 1 end;
    if v_unit_type = 'pack' and v_product.units_per_pack <= 1 then raise exception 'This product is not configured for pack sales'; end if;
    v_stock_units := v_quantity * v_units_per_sale;
    if v_variant_id is not null and v_device_id is not null then raise exception 'A sale line cannot select both a fashion variant and an electronics device'; end if;

    if v_device_id is not null then
      if v_quantity <> 1 or v_unit_type <> 'piece' then raise exception 'A serialised device must be sold as one individual item'; end if;
      select * into v_device from public.electronics_devices where id=v_device_id and store_id=_store_id and branch_id=_branch_id and product_id=v_product.id and status='in_stock' for update;
      if not found then raise exception 'Selected serial number or IMEI is no longer available'; end if;
    elsif v_variant_id is not null then
      if v_unit_type <> 'piece' then raise exception 'Fashion variants can only be sold as individual items'; end if;
      select * into v_variant from public.fashion_variant_stock
        where id = v_variant_id and store_id = _store_id and branch_id = _branch_id and product_id = v_product.id
        for update;
      if not found then raise exception 'Selected size and colour are not available at this branch'; end if;
      if v_variant.quantity < v_stock_units then raise exception 'Insufficient stock for % (% / %)', v_product.name, v_variant.size, v_variant.color; end if;
    elsif exists(select 1 from public.electronics_devices ed where ed.store_id=_store_id and ed.branch_id=_branch_id and ed.product_id=v_product.id) then
      raise exception 'Select an available serial number or IMEI for %',v_product.name;
    elsif v_product.quantity < v_stock_units then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_unit_price := case when v_unit_type = 'pack' then v_product.pack_price else v_product.piece_price end;
    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  v_tax := round((v_subtotal * v_tax_rate / 100)::numeric, 2);
  v_total := v_subtotal + v_tax;
  v_reference := 'KUD-' || to_char(clock_timestamp(),'YYYYMMDD-HH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.sales(store_id,branch_id,cashier_id,reference,subtotal,tax,total,payment_method,note,customer_id,offline_id)
    values (_store_id,_branch_id,v_user_id,v_reference,v_subtotal,v_tax,v_total,_payment_method::public.payment_method,coalesce(_note,''),_customer_id,_offline_id)
    returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_type := coalesce(v_item->>'unit_type','piece');
    v_variant_id := nullif(v_item->>'fashion_variant_stock_id','')::uuid;
    v_device_id := nullif(v_item->>'electronics_device_id','')::uuid;
    select p.id,p.name,p.price,p.piece_price,p.pack_price,p.units_per_pack
      into v_product from public.products p
      where p.id = (v_item->>'product_id')::uuid and p.store_id = _store_id
      for update;
    v_units_per_sale := case when v_unit_type = 'pack' then greatest(v_product.units_per_pack,1) else 1 end;
    v_unit_price := case when v_unit_type = 'pack' then v_product.pack_price else v_product.piece_price end;
    v_stock_units := v_quantity * v_units_per_sale;
    v_line_total := v_unit_price * v_quantity;

    if v_device_id is not null then
      select * into v_device from public.electronics_devices where id=v_device_id and store_id=_store_id and branch_id=_branch_id and product_id=v_product.id and status='in_stock' for update;
      if not found then raise exception 'Selected serial number or IMEI is no longer available'; end if;
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,electronics_device_id,device_serial_number,device_imei)
        values(v_sale_id,_store_id,v_product.id,v_product.name,1,v_unit_price,v_unit_price,'piece',1,v_device.id,v_device.serial_number,v_device.imei) returning id into v_sale_item_id;
      update public.electronics_devices set status='sold',sale_item_id=v_sale_item_id,customer_id=_customer_id,warranty_started_at=now(),warranty_expires_at=case when warranty_months>0 then now()+make_interval(months=>warranty_months) else null end,updated_at=now() where id=v_device_id;
    elsif v_variant_id is not null then
      select * into v_variant from public.fashion_variant_stock
        where id = v_variant_id and store_id = _store_id and branch_id = _branch_id and product_id = v_product.id
        for update;
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,fashion_variant_stock_id,variant_size,variant_color)
        values (v_sale_id,_store_id,v_product.id,v_product.name,v_quantity,v_unit_price,v_line_total,'piece',1,v_variant.id,v_variant.size,v_variant.color);
      update public.fashion_variant_stock set quantity = quantity - v_stock_units, updated_at = now() where id = v_variant_id;
      -- The variant-stock trigger maintains branch_stock as the sum of all active combinations.
    else
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale)
        values (v_sale_id,_store_id,v_product.id,v_product.name,v_quantity,v_unit_price,v_line_total,v_unit_type,v_units_per_sale);
      update public.branch_stock set quantity = quantity - v_stock_units, updated_at = now() where branch_id = _branch_id and product_id = v_product.id;
    end if;
  end loop;

  if _customer_id is not null then
    update public.customers set total_spent = total_spent + v_total, visit_count = visit_count + 1, last_visit_at = now(), updated_at = now() where id = _customer_id;
  end if;
  return v_sale_id;
end;
$function$;
