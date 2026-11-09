-- STRAP Connect supplier operating system.
-- All supplier-owned data is protected by RLS. Retailer imports remain linked to source products.
alter table public.connect_products
  add column if not exists sku text not null default '',
  add column if not exists variants jsonb not null default '[]'::jsonb,
  add column if not exists is_seasonal boolean not null default false,
  add column if not exists season_start date,
  add column if not exists season_end date,
  add column if not exists distribution_enabled boolean not null default true,
  add column if not exists low_stock_threshold integer not null default 5,
  add column if not exists availability_status text not null default 'available'
    check (availability_status in ('available','low_stock','out_of_stock','seasonal_paused','hidden'));

create table if not exists public.connect_supplier_settings (
 vendor_id uuid primary key references public.connect_vendors(id) on delete cascade,
 require_connection_approval boolean not null default false,
 default_sync_stock boolean not null default true,
 default_sync_wholesale_price boolean not null default false,
 default_sync_availability boolean not null default true,
 default_sync_product_details boolean not null default false,
 notify_low_stock boolean not null default true,
 notify_restock boolean not null default true,
 notify_price_changes boolean not null default true,
 business_status text not null default 'open' check (business_status in ('open','paused','closed')),
 dispatch_estimate text not null default '',
 minimum_order_notes text not null default '',
 return_policy text not null default '',
 updated_at timestamptz not null default now()
);
create table if not exists public.connect_supplier_connections (
 id uuid primary key default gen_random_uuid(),
 vendor_id uuid not null references public.connect_vendors(id) on delete cascade,
 retailer_user_id uuid not null references auth.users(id) on delete cascade,
 status text not null default 'active' check (status in ('pending','active','revoked')),
 source text not null default 'direct' check (source in ('direct','code','link')),
 connected_at timestamptz not null default now(),
 reviewed_at timestamptz,
 unique(vendor_id,retailer_user_id)
);
create index if not exists connect_supplier_connections_retailer_idx on public.connect_supplier_connections(retailer_user_id,status);
create index if not exists connect_supplier_connections_vendor_idx on public.connect_supplier_connections(vendor_id,status);
create table if not exists public.connect_distribution_groups (
 id uuid primary key default gen_random_uuid(),
 vendor_id uuid not null references public.connect_vendors(id) on delete cascade,
 name text not null, description text not null default '',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(vendor_id,name)
);
create table if not exists public.connect_distribution_group_products (
 group_id uuid not null references public.connect_distribution_groups(id) on delete cascade,
 product_id uuid not null references public.connect_products(id) on delete cascade,
 primary key(group_id,product_id)
);
create table if not exists public.connect_distribution_codes (
 id uuid primary key default gen_random_uuid(),
 vendor_id uuid not null references public.connect_vendors(id) on delete cascade,
 code_hash text not null unique, label text not null default 'Product access',
 include_all_products boolean not null default false,
 group_id uuid references public.connect_distribution_groups(id) on delete set null,
 require_approval boolean not null default false, expires_at timestamptz,
 max_redemptions integer, redemption_count integer not null default 0,
 is_active boolean not null default true, created_at timestamptz not null default now(),
 check(max_redemptions is null or max_redemptions>0)
);
create index if not exists connect_distribution_codes_vendor_idx on public.connect_distribution_codes(vendor_id,created_at desc);
create table if not exists public.connect_distribution_code_products (
 code_id uuid not null references public.connect_distribution_codes(id) on delete cascade,
 product_id uuid not null references public.connect_products(id) on delete cascade,
 primary key(code_id,product_id)
);
alter table public.connect_supplier_connections
 add column if not exists distribution_code_id uuid references public.connect_distribution_codes(id) on delete set null;

create table if not exists public.connect_product_connections (
 id uuid primary key default gen_random_uuid(),
 vendor_id uuid not null references public.connect_vendors(id) on delete cascade,
 supplier_product_id uuid not null references public.connect_products(id) on delete cascade,
 retailer_user_id uuid not null references auth.users(id) on delete cascade,
 connection_id uuid references public.connect_supplier_connections(id) on delete set null,
 custom_title text not null default '', selling_price numeric(14,2),
 sync_stock boolean not null default true, sync_wholesale_price boolean not null default false,
 sync_availability boolean not null default true, sync_product_details boolean not null default false,
 source_stock_quantity integer not null default 0, source_wholesale_price numeric(14,2) not null default 0,
 source_is_active boolean not null default true, source_availability_status text not null default 'available',
 last_synced_at timestamptz not null default now(), imported_at timestamptz not null default now(),
 unique(retailer_user_id,supplier_product_id)
);
create index if not exists connect_product_connections_supplier_idx on public.connect_product_connections(supplier_product_id);
create index if not exists connect_product_connections_retailer_idx on public.connect_product_connections(retailer_user_id);
create table if not exists public.connect_sync_events (
 id uuid primary key default gen_random_uuid(),
 vendor_id uuid not null references public.connect_vendors(id) on delete cascade,
 product_id uuid not null references public.connect_products(id) on delete cascade,
 event_type text not null check(event_type in ('stock_changed','low_stock','out_of_stock','restocked','price_changed','availability_changed','details_changed','season_changed')),
 old_value jsonb not null default '{}'::jsonb, new_value jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists connect_sync_events_vendor_idx on public.connect_sync_events(vendor_id,created_at desc);
create table if not exists public.connect_notifications (
 id uuid primary key default gen_random_uuid(),
 recipient_user_id uuid not null references auth.users(id) on delete cascade,
 vendor_id uuid references public.connect_vendors(id) on delete cascade,
 product_id uuid references public.connect_products(id) on delete cascade,
 event_type text not null, title text not null, message text not null,
 is_read boolean not null default false, created_at timestamptz not null default now()
);
create index if not exists connect_notifications_recipient_idx on public.connect_notifications(recipient_user_id,is_read,created_at desc);
create table if not exists public.connect_distribution_redemptions (
 id uuid primary key default gen_random_uuid(),
 code_id uuid not null references public.connect_distribution_codes(id) on delete cascade,
 retailer_user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), unique(code_id,retailer_user_id)
);

alter table public.connect_supplier_settings enable row level security;
alter table public.connect_supplier_connections enable row level security;
alter table public.connect_distribution_groups enable row level security;
alter table public.connect_distribution_group_products enable row level security;
alter table public.connect_distribution_codes enable row level security;
alter table public.connect_distribution_code_products enable row level security;
alter table public.connect_product_connections enable row level security;
alter table public.connect_sync_events enable row level security;
alter table public.connect_notifications enable row level security;
alter table public.connect_distribution_redemptions enable row level security;

drop policy if exists "Supplier owners manage supplier settings" on public.connect_supplier_settings;
create policy "Supplier owners manage supplier settings" on public.connect_supplier_settings for all to authenticated
using(exists(select 1 from public.connect_vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())))
with check(exists(select 1 from public.connect_vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())));
drop policy if exists "Connection parties can view" on public.connect_supplier_connections;
create policy "Connection parties can view" on public.connect_supplier_connections for select to authenticated
using(retailer_user_id=(select auth.uid()) or exists(select 1 from public.connect_vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())));
drop policy if exists "Supplier owners manage distribution groups" on public.connect_distribution_groups;
create policy "Supplier owners manage distribution groups" on public.connect_distribution_groups for all to authenticated
using(exists(select 1 from public.connect_vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())))
with check(exists(select 1 from public.connect_vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())));
drop policy if exists "Supplier owners manage group products" on public.connect_distribution_group_products;
create policy "Supplier owners manage group products" on public.connect_distribution_group_products for all to authenticated
using(exists(select 1 from public.connect_distribution_groups g join public.connect_vendors v on v.id=g.vendor_id where g.id=group_id and v.owner_id=(select auth.uid())))
with check(exists(select 1 from public.connect_distribution_groups g join public.connect_vendors v on v.id=g.vendor_id join public.connect_products p on p.id=product_id and p.vendor_id=v.id where g.id=group_id and v.owner_id=(select auth.uid())));
drop policy if exists "Supplier owners manage distribution codes" on public.connect_distribution_codes;
create policy "Supplier owners manage distribution codes" on public.connect_distribution_codes for all to authenticated
using(exists(select 1 from public.connect_vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())))
with check(exists(select 1 from public.connect_vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())));
drop policy if exists "Supplier owners manage code products" on public.connect_distribution_code_products;
create policy "Supplier owners manage code products" on public.connect_distribution_code_products for all to authenticated
using(exists(select 1 from public.connect_distribution_codes c join public.connect_vendors v on v.id=c.vendor_id where c.id=code_id and v.owner_id=(select auth.uid())))
with check(exists(select 1 from public.connect_distribution_codes c join public.connect_vendors v on v.id=c.vendor_id join public.connect_products p on p.id=product_id and p.vendor_id=v.id where c.id=code_id and v.owner_id=(select auth.uid())));
drop policy if exists "Connection parties view imported products" on public.connect_product_connections;
create policy "Connection parties view imported products" on public.connect_product_connections for select to authenticated
using(retailer_user_id=(select auth.uid()) or exists(select 1 from public.connect_vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())));
drop policy if exists "Retailers manage their own imported product preferences" on public.connect_product_connections;
create policy "Retailers manage their own imported product preferences" on public.connect_product_connections for update to authenticated
using(retailer_user_id=(select auth.uid())) with check(retailer_user_id=(select auth.uid()));
revoke update on public.connect_product_connections from authenticated;
grant update(custom_title,selling_price,sync_stock,sync_wholesale_price,sync_availability,sync_product_details) on public.connect_product_connections to authenticated;
drop policy if exists "Supplier owners view sync events" on public.connect_sync_events;
create policy "Supplier owners view sync events" on public.connect_sync_events for select to authenticated
using(exists(select 1 from public.connect_vendors v where v.id=vendor_id and v.owner_id=(select auth.uid())));
drop policy if exists "Users view own connect notifications" on public.connect_notifications;
create policy "Users view own connect notifications" on public.connect_notifications for select to authenticated
using(recipient_user_id=(select auth.uid()));
drop policy if exists "Users update own connect notifications" on public.connect_notifications;
create policy "Users update own connect notifications" on public.connect_notifications for update to authenticated
using(recipient_user_id=(select auth.uid())) with check(recipient_user_id=(select auth.uid()));
drop policy if exists "Retailers view own code redemptions" on public.connect_distribution_redemptions;
create policy "Retailers view own code redemptions" on public.connect_distribution_redemptions for select to authenticated
using(retailer_user_id=(select auth.uid()));

create schema if not exists private;
revoke all on schema private from public,anon,authenticated;
grant usage on schema private to authenticated;

create or replace function private.redeem_connect_distribution_code(p_code text)
returns jsonb language plpgsql security definer set search_path=public,extensions
as $$
declare v_user uuid:=auth.uid(); v_code public.connect_distribution_codes%rowtype; v_connection_id uuid; v_added integer:=0;
begin
 if v_user is null then raise exception 'Sign in to use a supplier code.'; end if;
 if length(trim(coalesce(p_code,'')))<8 or length(trim(p_code))>40 then raise exception 'Enter a valid supplier code.'; end if;
 select * into v_code from public.connect_distribution_codes where code_hash=encode(digest(upper(trim(p_code)),'sha256'),'hex') for update;
 if not found or not v_code.is_active then raise exception 'This supplier code is invalid or inactive.'; end if;
 if v_code.expires_at is not null and v_code.expires_at<=now() then raise exception 'This supplier code has expired.'; end if;
 if v_code.max_redemptions is not null and v_code.redemption_count>=v_code.max_redemptions then raise exception 'This supplier code has reached its usage limit.'; end if;
 if exists(select 1 from public.connect_distribution_redemptions r where r.code_id=v_code.id and r.retailer_user_id=v_user) then raise exception 'You have already used this supplier code.'; end if;
 insert into public.connect_supplier_connections(vendor_id,retailer_user_id,status,source,distribution_code_id)
 values(v_code.vendor_id,v_user,case when v_code.require_approval then 'pending' else 'active' end,'code',v_code.id)
 on conflict(vendor_id,retailer_user_id) do update set status=case when public.connect_supplier_connections.status='revoked' then excluded.status else public.connect_supplier_connections.status end,distribution_code_id=excluded.distribution_code_id
 returning id into v_connection_id;
 insert into public.connect_distribution_redemptions(code_id,retailer_user_id) values(v_code.id,v_user);
 update public.connect_distribution_codes set redemption_count=redemption_count+1 where id=v_code.id;
 if not v_code.require_approval then
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
 return jsonb_build_object('connection_id',v_connection_id,'status',case when v_code.require_approval then 'pending' else 'active' end,'products_added',v_added);
end; $$;
revoke all on function private.redeem_connect_distribution_code(text) from public,anon;
grant execute on function private.redeem_connect_distribution_code(text) to authenticated;
create or replace function public.redeem_connect_distribution_code(p_code text)
returns jsonb language sql security invoker set search_path=public,private as $$ select private.redeem_connect_distribution_code(p_code); $$;
revoke all on function public.redeem_connect_distribution_code(text) from public,anon;
grant execute on function public.redeem_connect_distribution_code(text) to authenticated;

create or replace function private.review_connect_supplier_request(p_connection_id uuid,p_approve boolean)
returns void language plpgsql security definer set search_path=public
as $$
declare v_code_id uuid; v_retailer uuid; v_vendor uuid; v_code public.connect_distribution_codes%rowtype;
begin
 if auth.uid() is null then raise exception 'Sign in required.'; end if;
 update public.connect_supplier_connections c set status=case when p_approve then 'active' else 'revoked' end,reviewed_at=now()
 from public.connect_vendors v where c.id=p_connection_id and v.id=c.vendor_id and v.owner_id=auth.uid() and c.status='pending'
 returning c.distribution_code_id,c.retailer_user_id,c.vendor_id into v_code_id,v_retailer,v_vendor;
 if not found then raise exception 'Request not found or you do not have permission.'; end if;
 if p_approve then
  select * into v_code from public.connect_distribution_codes where id=v_code_id;
  if v_code.id is null then raise exception 'The original distribution code is no longer available.'; end if;
  if v_code.include_all_products then
   insert into public.connect_product_connections(vendor_id,supplier_product_id,retailer_user_id,connection_id,source_stock_quantity,source_wholesale_price,source_is_active,source_availability_status)
   select p.vendor_id,p.id,v_retailer,p_connection_id,p.stock_quantity,p.wholesale_price,p.is_active,p.availability_status from public.connect_products p where p.vendor_id=v_vendor and p.is_active and p.distribution_enabled on conflict(retailer_user_id,supplier_product_id) do nothing;
  elsif v_code.group_id is not null then
   insert into public.connect_product_connections(vendor_id,supplier_product_id,retailer_user_id,connection_id,source_stock_quantity,source_wholesale_price,source_is_active,source_availability_status)
   select p.vendor_id,p.id,v_retailer,p_connection_id,p.stock_quantity,p.wholesale_price,p.is_active,p.availability_status from public.connect_distribution_group_products gp join public.connect_products p on p.id=gp.product_id where gp.group_id=v_code.group_id and p.is_active and p.distribution_enabled on conflict(retailer_user_id,supplier_product_id) do nothing;
  else
   insert into public.connect_product_connections(vendor_id,supplier_product_id,retailer_user_id,connection_id,source_stock_quantity,source_wholesale_price,source_is_active,source_availability_status)
   select p.vendor_id,p.id,v_retailer,p_connection_id,p.stock_quantity,p.wholesale_price,p.is_active,p.availability_status from public.connect_distribution_code_products cp join public.connect_products p on p.id=cp.product_id where cp.code_id=v_code.id and p.is_active and p.distribution_enabled on conflict(retailer_user_id,supplier_product_id) do nothing;
  end if;
 end if;
end; $$;
revoke all on function private.review_connect_supplier_request(uuid,boolean) from public,anon;
grant execute on function private.review_connect_supplier_request(uuid,boolean) to authenticated;
create or replace function public.review_connect_supplier_request(p_connection_id uuid,p_approve boolean)
returns void language sql security invoker set search_path=public,private as $$ select private.review_connect_supplier_request(p_connection_id,p_approve); $$;
revoke all on function public.review_connect_supplier_request(uuid,boolean) from public,anon;
grant execute on function public.review_connect_supplier_request(uuid,boolean) to authenticated;

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
   custom_title=case when c.sync_product_details and new.title is distinct from old.title then new.title else c.custom_title end,
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
create trigger connect_supplier_product_sync before insert or update on public.connect_products for each row execute function private.sync_connect_supplier_product();
insert into public.connect_supplier_settings(vendor_id) select id from public.connect_vendors on conflict(vendor_id) do nothing;
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  begin alter publication supabase_realtime add table public.connect_notifications; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.connect_product_connections; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.connect_supplier_connections; exception when duplicate_object then null; end;
 end if;
end $$;
