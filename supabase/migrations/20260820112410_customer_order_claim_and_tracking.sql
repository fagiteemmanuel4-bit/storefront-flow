create or replace function public.get_order_tracking_token(_order_number text, _customer_phone text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_token text;
begin
  if btrim(coalesce(_order_number,''))='' or btrim(coalesce(_customer_phone,''))='' then
    return null;
  end if;
  select tracking_token into v_token
  from public.online_orders
  where order_number=btrim(_order_number)
    and customer_phone=btrim(_customer_phone)
  limit 1;
  return v_token;
end;
$$;
revoke all on function public.get_order_tracking_token(text,text) from public;
grant execute on function public.get_order_tracking_token(text,text) to anon, authenticated;
