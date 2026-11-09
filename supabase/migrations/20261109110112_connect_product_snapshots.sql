-- Snapshot source catalogue fields so retailers retain a useful imported listing even if a supplier hides a product.
alter table public.connect_product_connections
 add column if not exists source_title text not null default '',
 add column if not exists source_description text not null default '',
 add column if not exists source_category text not null default 'General',
 add column if not exists source_image_url text not null default '',
 add column if not exists source_unit text not null default 'piece',
 add column if not exists source_supplier_name text not null default '',
 add column if not exists source_suggested_retail_price numeric(14,2) not null default 0;

create or replace function private.snapshot_connect_import()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 select p.title,p.description,p.category,p.image_url,p.unit,p.suggested_retail_price,v.business_name
 into new.source_title,new.source_description,new.source_category,new.source_image_url,new.source_unit,new.source_suggested_retail_price,new.source_supplier_name
 from public.connect_products p join public.connect_vendors v on v.id=p.vendor_id
 where p.id=new.supplier_product_id and p.vendor_id=new.vendor_id;
 if not found then raise exception 'Supplier product is no longer available.'; end if;
 return new;
end; $$;
revoke all on function private.snapshot_connect_import() from public,anon,authenticated;
drop trigger if exists connect_product_import_snapshot on public.connect_product_connections;
create trigger connect_product_import_snapshot before insert on public.connect_product_connections
for each row execute function private.snapshot_connect_import();

create or replace function private.sync_connect_supplier_product()
returns trigger language plpgsql security definer set search_path=public
as $$
declare v_status text; v_event text; v_old jsonb; v_new jsonb;
begin
 v_status:=case when not new.is_active or not new.distribution_enabled then 'hidden'
 when new.is_seasonal and ((new.season_start is not null and current_date<new.season_start) or (new.season_end is not null and current_date>new.season_end)) then 'seasonal_paused'
 when new.stock_quantity<=0 then 'out_of_stock' when new.stock_quantity<=new.low_stock_threshold then 'low_stock' else 'available' end;
 new.availability_status:=v_status;
 if tg_op='INSERT' then return new; end if;
 v_old:=jsonb_build_object('stock_quantity',old.stock_quantity,'wholesale_price',old.wholesale_price,'is_active',old.is_active,'title',old.title,'availability_status',old.availability_status);
 v_new:=jsonb_build_object('stock_quantity',new.stock_quantity,'wholesale_price',new.wholesale_price,'is_active',new.is_active,'title',new.title,'availability_status',v_status);
 if old.stock_quantity is distinct from new.stock_quantity then v_event:=case when old.stock_quantity<=0 and new.stock_quantity>0 then 'restocked' when new.stock_quantity<=0 then 'out_of_stock' when new.stock_quantity<=new.low_stock_threshold then 'low_stock' else 'stock_changed' end;
 elsif old.wholesale_price is distinct from new.wholesale_price then v_event:='price_changed';
 elsif old.is_active is distinct from new.is_active or old.distribution_enabled is distinct from new.distribution_enabled or old.is_seasonal is distinct from new.is_seasonal or old.season_start is distinct from new.season_start or old.season_end is distinct from new.season_end then v_event:='availability_changed';
 elsif old.title is distinct from new.title or old.description is distinct from new.description or old.image_url is distinct from new.image_url then v_event:='details_changed';
 else v_event:=null; end if;
 if v_event is not null then
  insert into public.connect_sync_events(vendor_id,product_id,event_type,old_value,new_value) values(new.vendor_id,new.id,v_event,v_old,v_new);
  update public.connect_product_connections c set
   source_stock_quantity=case when c.sync_stock then new.stock_quantity else c.source_stock_quantity end,
   source_wholesale_price=case when c.sync_wholesale_price then new.wholesale_price else c.source_wholesale_price end,
   source_is_active=case when c.sync_availability then new.is_active and new.distribution_enabled else c.source_is_active end,
   source_availability_status=case when c.sync_availability then v_status else c.source_availability_status end,
   source_title=case when c.sync_product_details then new.title else c.source_title end,
   source_description=case when c.sync_product_details then new.description else c.source_description end,
   source_category=case when c.sync_product_details then new.category else c.source_category end,
   source_image_url=case when c.sync_product_details then new.image_url else c.source_image_url end,
   source_unit=case when c.sync_product_details then new.unit else c.source_unit end,
   source_suggested_retail_price=case when c.sync_product_details then new.suggested_retail_price else c.source_suggested_retail_price end,
   last_synced_at=now() where c.supplier_product_id=new.id;
  insert into public.connect_notifications(recipient_user_id,vendor_id,product_id,event_type,title,message)
  select c.retailer_user_id,new.vendor_id,new.id,v_event,
   case v_event when 'out_of_stock' then 'Supplier product is out of stock' when 'restocked' then 'Supplier product is back in stock' when 'low_stock' then 'Supplier stock is running low' when 'price_changed' then 'Supplier wholesale price changed' when 'availability_changed' then 'Supplier availability changed' else 'Supplier product updated' end,
   new.title||case v_event when 'out_of_stock' then ' is now out of stock.' when 'restocked' then ' is back in stock.' when 'low_stock' then ' is running low.' when 'price_changed' then ' has a new wholesale price.' when 'availability_changed' then ' availability has changed.' else ' details have changed.' end
  from public.connect_product_connections c where c.supplier_product_id=new.id
   and (v_event<>'price_changed' or exists(select 1 from public.connect_supplier_settings s where s.vendor_id=new.vendor_id and s.notify_price_changes))
   and (v_event<>'low_stock' or exists(select 1 from public.connect_supplier_settings s where s.vendor_id=new.vendor_id and s.notify_low_stock))
   and (v_event<>'restocked' or exists(select 1 from public.connect_supplier_settings s where s.vendor_id=new.vendor_id and s.notify_restock));
 end if;
 return new;
end; $$;

drop trigger if exists connect_supplier_product_sync on public.connect_products;
create trigger connect_supplier_product_sync before insert or update on public.connect_products
for each row execute function private.sync_connect_supplier_product();
