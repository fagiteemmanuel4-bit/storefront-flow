-- Restore a valid piece price for legacy products imported before piece pricing existed.
update public.products
set piece_price = price,
    updated_at = now()
where price > 0
  and coalesce(piece_price, 0) = 0;

-- The POS and database must agree: a zero legacy piece_price means "not configured",
-- not "sell this product for free". Preserve the existing RPC body and permissions.
do $$
declare
  v_definition text;
  v_old text := 'coalesce(case when v_unit_type = ''pack'' then v_product.pack_price else v_product.piece_price end,v_product.price)';
  v_new text := 'case when v_unit_type = ''pack'' then coalesce(nullif(v_product.pack_price,0), v_product.price * greatest(v_product.units_per_pack,1)) else coalesce(nullif(v_product.piece_price,0),v_product.price) end';
  v_occurrences integer;
begin
  v_definition := pg_get_functiondef(
    'public.create_sale(uuid,uuid,text,jsonb,text,uuid,text)'::regprocedure
  );
  v_occurrences := (length(v_definition) - length(replace(v_definition, v_old, ''))) / length(v_old);
  if v_occurrences <> 2 then
    raise exception 'Expected two sale price expressions, found %; refusing to alter create_sale', v_occurrences;
  end if;
  execute replace(v_definition, v_old, v_new);
end
$$;
