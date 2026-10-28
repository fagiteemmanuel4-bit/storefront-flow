-- Return records are separate from original sales and preserve variant snapshots.
create table if not exists public.sale_returns (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete restrict,
  reference text not null unique,
  reason text not null,
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  processed_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists sale_returns_store_created_idx on public.sale_returns(store_id,created_at desc);
create index if not exists sale_returns_sale_idx on public.sale_returns(sale_id);

create table if not exists public.sale_return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.sale_returns(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete restrict,
  store_id uuid not null references public.stores(id) on delete cascade,
  sale_item_id uuid not null references public.sale_items(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  variant_size text,
  variant_color text,
  created_at timestamptz not null default now()
);
create index if not exists sale_return_items_sale_item_idx on public.sale_return_items(sale_item_id);
create index if not exists sale_return_items_sale_idx on public.sale_return_items(sale_id);

alter table public.sale_returns enable row level security;
alter table public.sale_return_items enable row level security;
drop policy if exists "Store members can view sale returns" on public.sale_returns;
create policy "Store members can view sale returns" on public.sale_returns for select to authenticated
using (public.is_store_member(store_id,(select auth.uid())));
drop policy if exists "Store members can view sale return items" on public.sale_return_items;
create policy "Store members can view sale return items" on public.sale_return_items for select to authenticated
using (public.is_store_member(store_id,(select auth.uid())));

create or replace function public.process_fashion_return(
  _store_id uuid,
  _sale_id uuid,
  _reason text,
  _items jsonb
)
returns uuid
language plpgsql
security definer
set search_path to 'public','extensions'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_sale record;
  v_item jsonb;
  v_sale_item record;
  v_return_id uuid;
  v_variant_id uuid;
  v_quantity integer;
  v_already_returned integer;
  v_total numeric(12,2) := 0;
  v_reference text;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not private.has_store_role(_store_id,v_user_id,array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
  if length(btrim(coalesce(_reason,''))) < 3 then raise exception 'Enter a return reason'; end if;
  if jsonb_typeof(_items)<>'array' or jsonb_array_length(_items)=0 then raise exception 'Select at least one item to return'; end if;
  select id,store_id,branch_id,reference into v_sale from public.sales where id=_sale_id and store_id=_store_id for update;
  if not found then raise exception 'Sale not found in this store'; end if;

  -- Reject duplicate line IDs so repeated entries cannot bypass the return limit.
  if exists (
    select 1 from jsonb_array_elements(_items) as input_rows(value)
    group by input_rows.value->>'sale_item_id'
    having count(*) > 1
  ) then raise exception 'Each sale item can appear only once in a return'; end if;

  -- Validate requested quantities before writing any return records.
  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Return quantity must be greater than zero'; end if;
    select si.* into v_sale_item from public.sale_items si
      where si.id=(v_item->>'sale_item_id')::uuid and si.sale_id=_sale_id and si.store_id=_store_id
      for update;
    if not found then raise exception 'An item does not belong to this sale'; end if;
    select coalesce(sum(sri.quantity),0)::integer into v_already_returned from public.sale_return_items sri where sri.sale_item_id=v_sale_item.id;
    if v_already_returned + v_quantity > v_sale_item.quantity then raise exception 'Return quantity exceeds the quantity originally sold for %',v_sale_item.product_name; end if;
    v_total := v_total + v_sale_item.unit_price * v_quantity;
  end loop;

  v_reference := 'RET-'||to_char(clock_timestamp(),'YYYYMMDD-HH24MISSMS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,5));
  insert into public.sale_returns(store_id,branch_id,sale_id,reference,reason,total_amount,processed_by)
    values(_store_id,v_sale.branch_id,_sale_id,v_reference,btrim(_reason),v_total,v_user_id)
    returning id into v_return_id;

  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    select si.* into v_sale_item from public.sale_items si
      where si.id=(v_item->>'sale_item_id')::uuid and si.sale_id=_sale_id and si.store_id=_store_id
      for update;
    insert into public.sale_return_items(return_id,sale_id,store_id,sale_item_id,product_id,product_name,quantity,unit_price,line_total,variant_size,variant_color)
      values(v_return_id,_sale_id,_store_id,v_sale_item.id,v_sale_item.product_id,v_sale_item.product_name,v_quantity,v_sale_item.unit_price,v_sale_item.unit_price*v_quantity,v_sale_item.variant_size,v_sale_item.variant_color);

    if coalesce(v_sale_item.variant_size,'')<>'' and coalesce(v_sale_item.variant_color,'')<>'' then
      insert into public.fashion_variant_stock(store_id,branch_id,product_id,size,color,quantity,updated_at)
        values(_store_id,v_sale.branch_id,v_sale_item.product_id,v_sale_item.variant_size,v_sale_item.variant_color,v_quantity,now())
        on conflict(branch_id,product_id,size,color) do update set quantity=public.fashion_variant_stock.quantity+excluded.quantity,updated_at=now()
        returning id into v_variant_id;
    else
      insert into public.branch_stock(store_id,branch_id,product_id,quantity,updated_at)
        values(_store_id,v_sale.branch_id,v_sale_item.product_id,v_quantity,now())
        on conflict(branch_id,product_id) do update set quantity=public.branch_stock.quantity+excluded.quantity,updated_at=now();
    end if;
  end loop;
  return v_return_id;
end;
$function$;
