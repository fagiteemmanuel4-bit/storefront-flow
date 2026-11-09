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