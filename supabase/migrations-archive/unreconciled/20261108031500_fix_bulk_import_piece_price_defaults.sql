-- Bulk imports must populate the canonical piece price alongside the catalog price.
-- The importer does not expose pack pricing, so imported rows are always individual-piece priced.
do $$
declare
  v_definition text;
  v_old_insert text := 'insert into public.products(store_id,name,sku,barcode,category,price,cost,low_stock_threshold,is_active)' || E'\n      values (_store_id,v_name,v_sku,v_barcode,v_category,v_price,v_cost,v_low_stock,true)';
  v_new_insert text := 'insert into public.products(store_id,name,sku,barcode,category,price,piece_price,cost,low_stock_threshold,is_active)' || E'\n      values (_store_id,v_name,v_sku,v_barcode,v_category,v_price,v_price,v_cost,v_low_stock,true)';
  v_old_update text := 'price=v_price, cost=v_cost, low_stock_threshold=v_low_stock';
  v_new_update text := 'price=v_price, piece_price=v_price, cost=v_cost, low_stock_threshold=v_low_stock';
  v_insert_count integer;
  v_update_count integer;
begin
  v_definition := pg_get_functiondef(
    'public.bulk_import_products(uuid,uuid,jsonb)'::regprocedure
  );
  v_insert_count := (length(v_definition) - length(replace(v_definition, v_old_insert, ''))) / length(v_old_insert);
  v_update_count := (length(v_definition) - length(replace(v_definition, v_old_update, ''))) / length(v_old_update);
  if v_insert_count <> 1 or v_update_count <> 1 then
    raise exception 'Unexpected bulk_import_products source (insert %, update %); refusing to alter importer', v_insert_count, v_update_count;
  end if;
  v_definition := replace(v_definition, v_old_insert, v_new_insert);
  v_definition := replace(v_definition, v_old_update, v_new_update);
  execute v_definition;
end
$$;