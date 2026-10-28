-- Reserve online grocery orders against actual unexpired batches, not only aggregate branch stock.
create table if not exists public.online_order_batch_allocations (
 id uuid primary key default gen_random_uuid(),
 order_id uuid not null references public.online_orders(id) on delete cascade,
 store_id uuid not null references public.stores(id) on delete cascade,
 branch_id uuid not null references public.branches(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete restrict,
 batch_id uuid references public.inventory_batches(id) on delete set null,
 batch_number text not null,
 expiry_date date,
 quantity integer not null check(quantity>0),
 created_at timestamptz not null default now()
);
create index if not exists online_order_batch_allocations_order_idx on public.online_order_batch_allocations(order_id);
alter table public.online_order_batch_allocations enable row level security;
drop policy if exists "Store members can view online batch allocations" on public.online_order_batch_allocations;
create policy "Store members can view online batch allocations" on public.online_order_batch_allocations for select to authenticated
using(public.is_store_member(store_id,(select auth.uid())));

create or replace function public.create_online_order(
  _slug text, _customer_name text, _customer_email text, _customer_phone text,
  _shipping_address text, _customer_note text, _payment_method text, _items jsonb
)
returns text language plpgsql security definer set search_path to 'public','extensions' as $function$
declare
  s public.stores%rowtype; os public.online_stores%rowtype; product_row public.products%rowtype;
  stock_row record; variant_row record; item jsonb; qty integer; remaining integer;
  allocated integer; subtotal numeric(12,2):=0; v_order_id uuid; order_no text;
  v_size text; v_color text; v_has_variants boolean; v_has_batches boolean;
  v_batch record; v_batch_remaining integer; v_batch_allocated integer; v_batch_total integer;
begin
  if btrim(coalesce(_customer_name,''))='' or btrim(coalesce(_customer_phone,''))='' or btrim(coalesce(_shipping_address,''))='' then raise exception 'Name, phone and delivery address are required'; end if;
  if _payment_method not in ('pay_on_delivery','bank_transfer') then raise exception 'Unsupported payment method'; end if;
  if jsonb_typeof(_items)<>'array' or jsonb_array_length(_items)=0 then raise exception 'Your cart is empty'; end if;
  select * into os from public.online_stores where slug=lower(btrim(_slug)) and is_published and setup_completed for share;
  if not found then raise exception 'Storefront not found'; end if;
  select * into s from public.stores where id=os.store_id;
  update public.inventory_batches set status='expired',updated_at=now() where store_id=s.id and status='active' and expiry_date is not null and expiry_date<current_date;

  for item in select value from jsonb_array_elements(_items) loop
    if coalesce(item->>'product_id','')='' then raise exception 'Invalid product in cart'; end if;
    qty:=(item->>'quantity')::integer;
    if qty is null or qty<=0 then raise exception 'Invalid quantity'; end if;
    v_size:=nullif(btrim(item->>'variant_size'),''); v_color:=nullif(btrim(item->>'variant_color'),'');
    if (v_size is null) <> (v_color is null) then raise exception 'Choose both a size and a colour'; end if;
    select prod.* into product_row from public.products prod
      join public.online_products online_prod on online_prod.product_id=prod.id
      where prod.id=(item->>'product_id')::uuid and prod.store_id=s.id and prod.is_active and online_prod.store_id=s.id and online_prod.enabled;
    if not found then raise exception 'A product in your cart is no longer available'; end if;
    select exists(select 1 from public.fashion_variant_stock fvs where fvs.store_id=s.id and fvs.product_id=product_row.id) into v_has_variants;
    select exists(select 1 from public.inventory_batches ib where ib.store_id=s.id and ib.product_id=product_row.id) into v_has_batches;
    if v_has_variants and v_size is null then raise exception 'Choose a size and colour for %',product_row.name; end if;
    if v_size is not null then
      select coalesce(sum(quantity),0)::integer into allocated from public.fashion_variant_stock
        where store_id=s.id and product_id=product_row.id and size=v_size and color=v_color;
      if allocated < qty then raise exception 'Insufficient stock for % (% / %)',product_row.name,v_size,v_color; end if;
    elsif v_has_batches then
      select coalesce(sum(ib.quantity),0)::integer into allocated from public.inventory_batches ib
        where ib.store_id=s.id and ib.product_id=product_row.id and ib.status='active' and (ib.expiry_date is null or ib.expiry_date>=current_date);
      if allocated < qty then raise exception 'Insufficient unexpired batch stock for %',product_row.name; end if;
    else
      select coalesce(sum(bs.quantity),0)::integer into allocated from public.branch_stock bs
        where bs.store_id=s.id and bs.product_id=product_row.id;
      if allocated < qty then raise exception 'Insufficient stock for %',product_row.name; end if;
    end if;
    subtotal:=subtotal+product_row.price*qty;
  end loop;

  order_no:='KU-'||to_char(clock_timestamp(),'YYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  insert into public.online_orders(store_id,online_store_id,order_number,customer_name,customer_email,customer_phone,shipping_address,customer_note,payment_method,subtotal,total)
    values(s.id,os.id,order_no,btrim(_customer_name),lower(btrim(coalesce(_customer_email,''))),btrim(_customer_phone),btrim(_shipping_address),btrim(coalesce(_customer_note,'')),_payment_method,subtotal,subtotal)
    returning id into v_order_id;

  for item in select value from jsonb_array_elements(_items) loop
    qty:=(item->>'quantity')::integer; remaining:=qty;
    v_size:=nullif(btrim(item->>'variant_size'),''); v_color:=nullif(btrim(item->>'variant_color'),'');
    select prod.* into product_row from public.products prod where prod.id=(item->>'product_id')::uuid and prod.store_id=s.id;
    if v_size is not null then
      for variant_row in
        select fvs.id,fvs.branch_id,fvs.product_id,fvs.quantity,fvs.size,fvs.color
        from public.fashion_variant_stock fvs
        join public.branches b on b.id=fvs.branch_id and b.store_id=s.id
        where fvs.store_id=s.id and fvs.product_id=product_row.id and fvs.size=v_size and fvs.color=v_color and fvs.quantity>0
        order by b.is_default desc,fvs.quantity desc,fvs.branch_id
        for update of fvs
      loop
        exit when remaining<=0;
        allocated:=least(remaining,variant_row.quantity);
        update public.fashion_variant_stock set quantity=quantity-allocated,updated_at=now() where id=variant_row.id;
        insert into public.online_order_variant_allocations(order_id,store_id,branch_id,product_id,fashion_variant_stock_id,variant_size,variant_color,quantity)
          values(v_order_id,s.id,variant_row.branch_id,product_row.id,variant_row.id,variant_row.size,variant_row.color,allocated);
        remaining:=remaining-allocated;
      end loop;
      if remaining>0 then raise exception 'Insufficient stock for % (% / %)',product_row.name,v_size,v_color; end if;
      insert into public.online_order_items(order_id,store_id,product_id,product_name,unit_price,quantity,line_total,variant_size,variant_color)
        values(v_order_id,s.id,product_row.id,product_row.name,product_row.price,qty,product_row.price*qty,v_size,v_color);
    elsif exists(select 1 from public.inventory_batches ib where ib.store_id=s.id and ib.product_id=product_row.id) then
      v_batch_remaining:=qty;
      for v_batch in
        select ib.id,ib.branch_id,ib.product_id,ib.quantity,ib.batch_number,ib.expiry_date
        from public.inventory_batches ib join public.branches b on b.id=ib.branch_id and b.store_id=s.id
        where ib.store_id=s.id and ib.product_id=product_row.id and ib.status='active' and ib.quantity>0 and (ib.expiry_date is null or ib.expiry_date>=current_date)
        order by ib.expiry_date asc nulls last,b.is_default desc,ib.received_at asc,ib.id
        for update of ib
      loop
        exit when v_batch_remaining<=0;
        v_batch_allocated:=least(v_batch_remaining,v_batch.quantity);
        update public.inventory_batches set quantity=quantity-v_batch_allocated,status=case when quantity-v_batch_allocated=0 then 'closed' else status end,updated_at=now() where id=v_batch.id;
        insert into public.online_order_batch_allocations(order_id,store_id,branch_id,product_id,batch_id,batch_number,expiry_date,quantity)
          values(v_order_id,s.id,v_batch.branch_id,product_row.id,v_batch.id,v_batch.batch_number,v_batch.expiry_date,v_batch_allocated);
        v_batch_remaining:=v_batch_remaining-v_batch_allocated;
      end loop;
      if v_batch_remaining>0 then raise exception 'Insufficient unexpired batch stock for %',product_row.name; end if;
      insert into public.online_order_items(order_id,store_id,product_id,product_name,unit_price,quantity,line_total)
        values(v_order_id,s.id,product_row.id,product_row.name,product_row.price,qty,product_row.price*qty);
    else
      for stock_row in
        select bs.branch_id,bs.product_id,bs.quantity from public.branch_stock bs
        join public.branches b on b.id=bs.branch_id and b.store_id=s.id
        where bs.store_id=s.id and bs.product_id=product_row.id and bs.quantity>0
        order by b.is_default desc,bs.quantity desc,bs.branch_id for update of bs
      loop
        exit when remaining<=0;
        allocated:=least(remaining,stock_row.quantity);
        update public.branch_stock set quantity=quantity-allocated,updated_at=now() where branch_id=stock_row.branch_id and product_id=stock_row.product_id;
        insert into public.online_order_stock_allocations(order_id,store_id,branch_id,product_id,quantity)
          values(v_order_id,s.id,stock_row.branch_id,stock_row.product_id,allocated)
          on conflict(order_id,branch_id,product_id) do update set quantity=public.online_order_stock_allocations.quantity+excluded.quantity;
        remaining:=remaining-allocated;
      end loop;
      if remaining>0 then raise exception 'Insufficient stock for an item in your cart'; end if;
      insert into public.online_order_items(order_id,store_id,product_id,product_name,unit_price,quantity,line_total)
        values(v_order_id,s.id,product_row.id,product_row.name,product_row.price,qty,product_row.price*qty);
    end if;
  end loop;
  return order_no;
end;
$function$;

alter table public.online_order_batch_allocations add column if not exists released_at timestamptz;

create or replace function public.release_online_order_stock()
returns trigger language plpgsql security definer set search_path=public,extensions as $function$
declare v_batch record;
begin
 if new.status='cancelled' and old.status<>'cancelled' then
   update public.branch_stock bs set quantity=bs.quantity+a.quantity,updated_at=now()
   from public.online_order_stock_allocations a
   where a.order_id=new.id and a.released_at is null and bs.branch_id=a.branch_id and bs.product_id=a.product_id;
   update public.online_order_stock_allocations set released_at=now() where order_id=new.id and released_at is null;
   for v_batch in select a.id,a.batch_id,a.quantity from public.online_order_batch_allocations a
     where a.order_id=new.id and a.released_at is null and a.batch_id is not null for update
   loop
     update public.inventory_batches
       set quantity=quantity+v_batch.quantity,
           status=case when expiry_date is not null and expiry_date<current_date then 'expired' else 'active' end,
           updated_at=now()
       where id=v_batch.batch_id;
   end loop;
   update public.online_order_batch_allocations set released_at=now() where order_id=new.id and released_at is null;
 end if;
 return new;
end;
$function$;
