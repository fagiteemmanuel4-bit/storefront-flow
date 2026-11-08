create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  total_spent numeric not null default 0,
  visit_count integer not null default 0,
  last_visit_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_store_id_idx on public.customers(store_id);
create index if not exists customers_store_phone_idx on public.customers(store_id, phone);

alter table public.sales add column if not exists customer_id uuid references public.customers(id) on delete set null;
alter table public.sales add column if not exists offline_id text;
create unique index if not exists sales_offline_id_unique on public.sales(offline_id) where offline_id is not null;
create index if not exists sales_customer_id_idx on public.sales(customer_id);

alter table public.customers enable row level security;

create policy customers_select_member on public.customers for select using (private.is_store_member(store_id, auth.uid()));
create policy customers_insert_member on public.customers for insert with check (private.has_store_role(store_id, auth.uid(), array['owner','manager','cashier']::public.store_role[]));
create policy customers_update_member on public.customers for update using (private.has_store_role(store_id, auth.uid(), array['owner','manager','cashier']::public.store_role[])) with check (private.has_store_role(store_id, auth.uid(), array['owner','manager','cashier']::public.store_role[]));
create policy customers_delete_manager on public.customers for delete using (private.has_store_role(store_id, auth.uid(), array['owner','manager']::public.store_role[]));

create or replace function public.create_sale(_store_id uuid, _branch_id uuid, _payment_method text, _items jsonb, _note text default '', _customer_id uuid default null, _offline_id text default null)
returns uuid
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_user_id uuid:=auth.uid();
  v_sale_id uuid;
  v_reference text;
  v_subtotal numeric:=0;
  v_tax numeric:=0;
  v_total numeric:=0;
  v_tax_rate numeric;
  v_item jsonb;
  v_product record;
  v_quantity integer;
  v_line_total numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not private.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
  if not exists(select 1 from public.branches b where b.id=_branch_id and b.store_id=_store_id) then raise exception 'Invalid branch'; end if;
  if _payment_method not in ('cash','card','transfer','credit') then raise exception 'Invalid payment method'; end if;
  if _customer_id is not null and not exists(select 1 from public.customers c where c.id=_customer_id and c.store_id=_store_id) then raise exception 'Invalid customer'; end if;
  if _offline_id is not null then
    select id into v_sale_id from public.sales where offline_id=_offline_id and store_id=_store_id limit 1;
    if v_sale_id is not null then return v_sale_id; end if;
  end if;
  if jsonb_typeof(_items)<>'array' or jsonb_array_length(_items)=0 then raise exception 'Sale must contain at least one item'; end if;
  select tax_rate into v_tax_rate from public.stores where id=_store_id;
  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity:=(v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity<=0 then raise exception 'Invalid quantity'; end if;
    select p.id,p.name,p.price,bs.quantity into v_product from public.products p join public.branch_stock bs on bs.product_id=p.id and bs.branch_id=_branch_id where p.id=(v_item->>'product_id')::uuid and p.store_id=_store_id and p.is_active=true for update of bs;
    if not found then raise exception 'Product is not available at this branch'; end if;
    if v_product.quantity<v_quantity then raise exception 'Insufficient stock for %',v_product.name; end if;
    v_line_total:=v_product.price*v_quantity;
    v_subtotal:=v_subtotal+v_line_total;
  end loop;
  v_tax:=round((v_subtotal*v_tax_rate/100)::numeric,2);
  v_total:=v_subtotal+v_tax;
  v_reference:='KUD-'||to_char(clock_timestamp(),'YYYYMMDD-HH24MISSMS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.sales(store_id,branch_id,cashier_id,reference,subtotal,tax,total,payment_method,note,customer_id,offline_id) values(_store_id,_branch_id,v_user_id,v_reference,v_subtotal,v_tax,v_total,_payment_method::public.payment_method,coalesce(_note,''),_customer_id,_offline_id) returning id into v_sale_id;
  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity:=(v_item->>'quantity')::integer;
    select p.id,p.name,p.price,bs.quantity into v_product from public.products p join public.branch_stock bs on bs.product_id=p.id and bs.branch_id=_branch_id where p.id=(v_item->>'product_id')::uuid and p.store_id=_store_id for update of bs;
    v_line_total:=v_product.price*v_quantity;
    insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total) values(v_sale_id,_store_id,v_product.id,v_product.name,v_quantity,v_product.price,v_line_total);
    update public.branch_stock set quantity=quantity-v_quantity,updated_at=now() where branch_id=_branch_id and product_id=v_product.id;
  end loop;
  if _customer_id is not null then
    update public.customers set total_spent=total_spent+v_total, visit_count=visit_count+1, last_visit_at=now(), updated_at=now() where id=_customer_id;
  end if;
  return v_sale_id;
end;
$function$;
