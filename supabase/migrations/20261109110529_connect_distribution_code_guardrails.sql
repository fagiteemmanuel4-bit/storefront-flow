-- Harden supplier distribution code handling.
-- Existing approved supplier relationships remain approved when a retailer redeems another code.
create or replace function private.redeem_connect_distribution_code(p_code text)
returns jsonb language plpgsql security definer set search_path=public,extensions
as $$
declare
 v_user uuid:=auth.uid(); v_code public.connect_distribution_codes%rowtype;
 v_connection_id uuid; v_existing_status text; v_requires_approval boolean; v_added integer:=0;
begin
 if v_user is null then raise exception 'Sign in to use a supplier code.'; end if;
 if length(trim(coalesce(p_code,'')))<8 or length(trim(p_code))>40 then raise exception 'Enter a valid supplier code.'; end if;
 select * into v_code from public.connect_distribution_codes where code_hash=encode(digest(upper(trim(p_code)),'sha256'),'hex') for update;
 if not found or not v_code.is_active then raise exception 'This supplier code is invalid or inactive.'; end if;
 if v_code.expires_at is not null and v_code.expires_at<=now() then raise exception 'This supplier code has expired.'; end if;
 if v_code.max_redemptions is not null and v_code.redemption_count>=v_code.max_redemptions then raise exception 'This supplier code has reached its usage limit.'; end if;
 if exists(select 1 from public.connect_distribution_redemptions r where r.code_id=v_code.id and r.retailer_user_id=v_user) then raise exception 'You have already used this supplier code.'; end if;
 select status into v_existing_status from public.connect_supplier_connections where vendor_id=v_code.vendor_id and retailer_user_id=v_user;
 v_requires_approval:=v_code.require_approval and coalesce(v_existing_status,'')<>'active';
 insert into public.connect_supplier_connections(vendor_id,retailer_user_id,status,source,distribution_code_id)
 values(v_code.vendor_id,v_user,case when v_requires_approval then 'pending' else 'active' end,'code',v_code.id)
 on conflict(vendor_id,retailer_user_id) do update set
  status=case when public.connect_supplier_connections.status='revoked' then excluded.status else public.connect_supplier_connections.status end,
  distribution_code_id=excluded.distribution_code_id
 returning id into v_connection_id;
 insert into public.connect_distribution_redemptions(code_id,retailer_user_id) values(v_code.id,v_user);
 update public.connect_distribution_codes set redemption_count=redemption_count+1 where id=v_code.id;
 if not v_requires_approval then
  if v_code.include_all_products then
   insert into public.connect_product_connections(vendor_id,supplier_product_id,retailer_user_id,connection_id,source_stock_quantity,source_wholesale_price,source_is_active,source_availability_status)
   select p.vendor_id,p.id,v_user,v_connection_id,p.stock_quantity,p.wholesale_price,p.is_active,p.availability_status from public.connect_products p where p.vendor_id=v_code.vendor_id and p.is_active and p.distribution_enabled on conflict(retailer_user_id,supplier_product_id) do nothing;
   get diagnostics v_added=row_count;
  elsif v_code.group_id is not null then
   insert into public.connect_product_connections(vendor_id,supplier_product_id,retailer_user_id,connection_id,source_stock_quantity,source_wholesale_price,source_is_active,source_availability_status)
   select p.vendor_id,p.id,v_user,v_connection_id,p.stock_quantity,p.wholesale_price,p.is_active,p.availability_status from public.connect_distribution_group_products gp join public.connect_products p on p.id=gp.product_id where gp.group_id=v_code.group_id and p.is_active and p.distribution_enabled on conflict(retailer_user_id,supplier_product_id) do nothing;
   get diagnostics v_added=row_count;
  else
   insert into public.connect_product_connections(vendor_id,supplier_product_id,retailer_user_id,connection_id,source_stock_quantity,source_wholesale_price,source_is_active,source_availability_status)
   select p.vendor_id,p.id,v_user,v_connection_id,p.stock_quantity,p.wholesale_price,p.is_active,p.availability_status from public.connect_distribution_code_products cp join public.connect_products p on p.id=cp.product_id where cp.code_id=v_code.id and p.is_active and p.distribution_enabled on conflict(retailer_user_id,supplier_product_id) do nothing;
   get diagnostics v_added=row_count;
  end if;
 end if;
 return jsonb_build_object('connection_id',v_connection_id,'status',case when v_requires_approval then 'pending' else 'active' end,'products_added',v_added);
end; $$;

create or replace function private.validate_connect_distribution_code_group()
returns trigger language plpgsql security invoker set search_path=public
as $$
begin
 if new.group_id is not null and not exists(
  select 1 from public.connect_distribution_groups g
  where g.id=new.group_id and g.vendor_id=new.vendor_id
 ) then raise exception 'A distribution code can only include a collection owned by the same supplier.'; end if;
 return new;
end; $$;
revoke all on function private.validate_connect_distribution_code_group() from public,anon,authenticated;
drop trigger if exists connect_distribution_code_group_guard on public.connect_distribution_codes;
create trigger connect_distribution_code_group_guard before insert or update of group_id,vendor_id
on public.connect_distribution_codes for each row execute function private.validate_connect_distribution_code_group();
