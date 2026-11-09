create or replace function public.apply_online_product_discount_to_order_item()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_product_price numeric(12,2);
  v_discount_type text;
  v_discount_value numeric(12,2);
  v_starts_at timestamptz;
  v_ends_at timestamptz;
begin
  select p.price,op.discount_type,op.discount_value,op.discount_starts_at,op.discount_ends_at
  into v_product_price,v_discount_type,v_discount_value,v_starts_at,v_ends_at
  from public.products p join public.online_products op on op.product_id=p.id and op.store_id=p.store_id
  where p.id=new.product_id and p.store_id=new.store_id and op.enabled and p.is_active;
  if not found then raise exception 'This product is no longer published'; end if;
  if v_discount_type is not null and (v_starts_at is null or v_starts_at<=now()) and (v_ends_at is null or v_ends_at>=now()) then
    new.unit_price:=greatest(0,round((v_product_price-case when v_discount_type='percentage' then v_product_price*v_discount_value/100 else v_discount_value end)::numeric,2));
  else new.unit_price:=v_product_price; end if;
  new.line_total:=new.unit_price*new.quantity;
  return new;
end; $$;

create or replace function public.refresh_online_order_totals_after_item()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_order_id uuid;
begin
  if tg_op='DELETE' then v_order_id:=old.order_id; else v_order_id:=new.order_id; end if;
  update public.online_orders o
  set subtotal=coalesce((select sum(i.line_total) from public.online_order_items i where i.order_id=v_order_id),0),
      total=coalesce((select sum(i.line_total) from public.online_order_items i where i.order_id=v_order_id),0)+coalesce(o.shipping_fee,0),
      updated_at=now()
  where o.id=v_order_id;
  return null;
end; $$;

drop trigger if exists online_order_items_apply_discount on public.online_order_items;
create trigger online_order_items_apply_discount before insert on public.online_order_items
for each row execute function public.apply_online_product_discount_to_order_item();
drop trigger if exists online_order_items_refresh_totals on public.online_order_items;
create trigger online_order_items_refresh_totals after insert or update or delete on public.online_order_items
for each row execute function public.refresh_online_order_totals_after_item();
