create or replace function public.bulk_import_products(_store_id uuid, _branch_id uuid, _rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_row jsonb;
  v_product_id uuid;
  v_name text;
  v_sku text;
  v_barcode text;
  v_category text;
  v_price numeric;
  v_cost numeric;
  v_quantity integer;
  v_low_stock integer;
  v_created integer := 0;
  v_updated integer := 0;
  v_seen integer := 0;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not private.has_store_role(_store_id, v_user_id, array['owner','manager']::public.store_role[]) then
    raise exception 'Not authorized for bulk product import';
  end if;
  if not exists (select 1 from public.branches b where b.id = _branch_id and b.store_id = _store_id) then
    raise exception 'Invalid branch';
  end if;
  if jsonb_typeof(_rows) <> 'array' or jsonb_array_length(_rows) = 0 then
    raise exception 'Import must contain at least one product';
  end if;
  if jsonb_array_length(_rows) > 5000 then
    raise exception 'Import is limited to 5000 products per batch';
  end if;

  for v_row in select value from jsonb_array_elements(_rows) loop
    v_seen := v_seen + 1;
    v_name := nullif(trim(v_row->>'name'), '');
    v_sku := trim(coalesce(v_row->>'sku', ''));
    v_barcode := trim(coalesce(v_row->>'barcode', ''));
    v_category := trim(coalesce(v_row->>'category', ''));
    v_price := greatest(coalesce((v_row->>'price')::numeric, 0), 0);
    v_cost := greatest(coalesce((v_row->>'cost')::numeric, 0), 0);
    v_quantity := greatest(coalesce((v_row->>'quantity')::integer, 0), 0);
    v_low_stock := greatest(coalesce((v_row->>'lowStockThreshold')::integer, 5), 0);

    if v_name is null then raise exception 'Product % has no name', v_seen; end if;

    v_product_id := null;
    if v_sku <> '' then
      select p.id into v_product_id from public.products p
      where p.store_id = _store_id and p.is_active = true and lower(trim(coalesce(p.sku,''))) = lower(v_sku)
      order by p.updated_at desc nulls last limit 1 for update;
    end if;
    if v_product_id is null and v_barcode <> '' then
      select p.id into v_product_id from public.products p
      where p.store_id = _store_id and p.is_active = true and trim(coalesce(p.barcode,'')) = v_barcode
      order by p.updated_at desc nulls last limit 1 for update;
    end if;
    if v_product_id is null then
      select p.id into v_product_id from public.products p
      where p.store_id = _store_id and p.is_active = true and lower(trim(p.name)) = lower(v_name)
      order by p.updated_at desc nulls last limit 1 for update;
    end if;

    if v_product_id is null then
      insert into public.products(store_id,name,sku,barcode,category,price,cost,low_stock_threshold,is_active)
      values (_store_id,v_name,v_sku,v_barcode,v_category,v_price,v_cost,v_low_stock,true)
      returning id into v_product_id;
      v_created := v_created + 1;
    else
      update public.products set name=v_name, sku=v_sku, barcode=v_barcode, category=v_category,
        price=v_price, cost=v_cost, low_stock_threshold=v_low_stock, updated_at=now()
      where id=v_product_id;
      v_updated := v_updated + 1;
    end if;

    insert into public.branch_stock(store_id,branch_id,product_id,quantity,updated_at)
    values (_store_id,_branch_id,v_product_id,v_quantity,now())
    on conflict (branch_id,product_id) do update
      set quantity=excluded.quantity, store_id=excluded.store_id, updated_at=now();
  end loop;

  return jsonb_build_object('created',v_created,'updated',v_updated,'processed',v_seen);
end;
$$;

revoke all on function public.bulk_import_products(uuid, uuid, jsonb) from public;
grant execute on function public.bulk_import_products(uuid, uuid, jsonb) to authenticated;
