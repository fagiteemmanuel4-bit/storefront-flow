-- Public SECURITY DEFINER helpers must only answer questions about the caller.
-- These wrappers are used by RLS policies with auth.uid(); reject arbitrary user IDs
-- so authenticated users cannot enumerate other users' store memberships or roles.
create or replace function public.is_store_member(_store_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $function$
  select coalesce(_user_id = auth.uid(), false)
    and private.is_store_member(_store_id, auth.uid());
$function$;

create or replace function public.has_store_role(_store_id uuid, _user_id uuid, _roles public.store_role[])
returns boolean
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $function$
  select coalesce(_user_id = auth.uid(), false)
    and private.has_store_role(_store_id, auth.uid(), _roles);
$function$;

create or replace function public.is_store_owner(_store_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'extensions'
as $function$
  select coalesce(_user_id = auth.uid(), false)
    and private.is_store_owner(_store_id, auth.uid());
$function$;

-- This is a trigger-only guard. It is not an RPC endpoint.
revoke execute on function public.guard_online_order_status_transition()
  from public, anon, authenticated;

-- The pre-auth staff login page only needs a display name, role and store name.
-- Do not expose internal IDs, branch IDs, login slugs or inactive staff profiles.
create or replace function public.staff_login_profile(_slug text)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (
      select jsonb_build_object(
        'name', s.name,
        'role', s.role,
        'store_name', st.name
      )
      from public.staff_accounts s
      join public.stores st on st.id = s.store_id
      where s.login_slug = lower(btrim(_slug))
        and s.is_active = true
      limit 1
    ),
    '{}'::jsonb
  );
$function$;

-- This helper only constructs a path and does not need elevated privileges.
create or replace function public.staff_login_url(_slug text)
returns text
language sql
immutable
security invoker
set search_path to 'public'
as $function$
  select '/staff-login/' || trim(both '/' from coalesce(_slug, ''));
$function$;


-- NULL passwords must never compare as a successful bcrypt match.
-- Return login failures as data so failed-attempt counters commit instead of
-- being rolled back by a raised exception.
create or replace function public.customer_account_login(_slug text, _email text, _password text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  os public.online_stores%rowtype;
  account public.store_customer_accounts%rowtype;
  raw_token text;
begin
  perform public.customer_account_cleanup_expired();

  select * into os
  from public.online_stores
  where slug = lower(btrim(_slug))
    and is_published
    and setup_completed;
  if not found then
    raise exception 'Storefront not found';
  end if;

  select * into account
  from public.store_customer_accounts
  where store_id = os.store_id
    and email = lower(btrim(_email));

  if not found or account.expires_at <= now() then
    return jsonb_build_object('ok', false, 'message', 'Email or password is incorrect');
  end if;

  if account.locked_until is not null and account.locked_until > now() then
    return jsonb_build_object('ok', false, 'message', 'Too many attempts. Try again later');
  end if;

  if _password is null
    or account.password_hash is null
    or extensions.crypt(_password, account.password_hash) is distinct from account.password_hash
  then
    update public.store_customer_accounts
    set failed_attempts = failed_attempts + 1,
        locked_until = case
          when failed_attempts >= 4 then now() + interval '15 minutes'
          else locked_until
        end
    where id = account.id;

    return jsonb_build_object('ok', false, 'message', 'Email or password is incorrect');
  end if;

  update public.store_customer_accounts
  set failed_attempts = 0,
      locked_until = null,
      last_seen_at = now()
  where id = account.id;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.store_customer_sessions(account_id, token_hash, expires_at, last_seen_at)
  values (
    account.id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    account.expires_at,
    now()
  );

  return jsonb_build_object(
    'ok', true,
    'token', raw_token,
    'expires_at', account.expires_at,
    'name', account.name,
    'email', account.email
  );
end;
$function$;

-- A NULL PIN previously made the comparison NULL; IF NOT NULL is not true in
-- PL/pgSQL, so it could fall through to the successful staff-login branch.
create or replace function public.verify_staff_pin(_store_id uuid, _staff_id uuid, _pin text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_staff public.staff_accounts;
  v_ok boolean;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if not private.is_store_member(_store_id, auth.uid()) then
    raise exception 'Not authorized';
  end if;

  select * into v_staff
  from public.staff_accounts
  where id = _staff_id
    and store_id = _store_id
    and is_active = true;

  if not found then
    raise exception 'Staff account not found';
  end if;
  if v_staff.locked_until is not null and v_staff.locked_until > now() then
    raise exception 'Staff account temporarily locked';
  end if;

  v_ok := coalesce(
    _pin is not null
      and v_staff.pin_hash is not null
      and extensions.crypt(_pin, v_staff.pin_hash) = v_staff.pin_hash,
    false
  );

  if not v_ok then
    update public.staff_accounts
    set failed_attempts = failed_attempts + 1,
        locked_until = case
          when failed_attempts + 1 >= 5 then now() + interval '10 minutes'
          else locked_until
        end,
        updated_at = now()
    where id = v_staff.id;

    insert into public.staff_audit_log(store_id, staff_id, actor_user_id, action, metadata)
    values (
      _store_id,
      v_staff.id,
      auth.uid(),
      'pin_failed',
      jsonb_build_object('failed_attempts', v_staff.failed_attempts + 1)
    );

    return jsonb_build_object('ok', false, 'message', 'Incorrect PIN');
  end if;

  update public.staff_accounts
  set failed_attempts = 0,
      locked_until = null,
      last_login_at = now(),
      updated_at = now()
  where id = v_staff.id;

  insert into public.staff_audit_log(store_id, staff_id, actor_user_id, action)
  values (_store_id, v_staff.id, auth.uid(), 'pin_login');

  return jsonb_build_object(
    'ok', true,
    'staff_id', v_staff.id,
    'name', v_staff.name,
    'role', v_staff.role
  );
end;
$function$;

-- A NULL registration password must be rejected before bcrypt is called.
create or replace function public.customer_account_register(_slug text, _name text, _email text, _phone text, _password text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  os public.online_stores%rowtype;
  account public.store_customer_accounts%rowtype;
  raw_token text;
begin
  perform public.customer_account_cleanup_expired();

  if length(btrim(coalesce(_name, ''))) < 2 then
    raise exception 'Enter your name';
  end if;
  if length(btrim(coalesce(_email, ''))) < 5 or position('@' in _email) < 2 then
    raise exception 'Enter a valid email';
  end if;
  if coalesce(length(_password), 0) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  select * into os
  from public.online_stores
  where slug = lower(btrim(_slug))
    and is_published
    and setup_completed;
  if not found then
    raise exception 'Storefront not found';
  end if;

  begin
    insert into public.store_customer_accounts(store_id, email, name, phone, password_hash)
    values (
      os.store_id,
      lower(btrim(_email)),
      btrim(_name),
      btrim(coalesce(_phone, '')),
      extensions.crypt(_password, extensions.gen_salt('bf', 12))
    )
    returning * into account;
  exception
    when unique_violation then
      raise exception 'An account already exists for this email at this store';
  end;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  insert into public.store_customer_sessions(account_id, token_hash, expires_at)
  values (
    account.id,
    encode(extensions.digest(raw_token, 'sha256'), 'hex'),
    account.expires_at
  );

  return jsonb_build_object(
    'token', raw_token,
    'expires_at', account.expires_at,
    'name', account.name,
    'email', account.email
  );
end;
$function$;


-- Reject NULL, non-array, and empty carts before creating customer orders or sales.
CREATE OR REPLACE FUNCTION public.create_online_order(_slug text, _customer_name text, _customer_email text, _customer_phone text, _shipping_address text, _customer_note text, _payment_method text, _items jsonb)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  s public.stores%rowtype; os public.online_stores%rowtype; product_row public.products%rowtype;
  stock_row record; variant_row record; item jsonb; qty integer; remaining integer;
  allocated integer; subtotal numeric(12,2):=0; v_order_id uuid; order_no text;
  v_size text; v_color text; v_has_variants boolean; v_has_batches boolean;
  v_batch record; v_batch_remaining integer; v_batch_allocated integer; v_batch_total integer;
begin
  if btrim(coalesce(_customer_name,''))='' or btrim(coalesce(_customer_phone,''))='' or btrim(coalesce(_shipping_address,''))='' then raise exception 'Name, phone and delivery address are required'; end if;
  if _payment_method not in ('pay_on_delivery','bank_transfer') then raise exception 'Unsupported payment method'; end if;
  if coalesce(jsonb_typeof(_items), '') <> 'array' then raise exception 'Your cart is empty'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Your cart is empty'; end if;
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
$function$


CREATE OR REPLACE FUNCTION public.create_sale(_store_id uuid, _branch_id uuid, _payment_method text, _items jsonb, _note text DEFAULT ''::text, _customer_id uuid DEFAULT NULL::uuid, _offline_id text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_sale_id uuid;
  v_reference text;
  v_subtotal numeric := 0;
  v_tax numeric := 0;
  v_total numeric := 0;
  v_tax_rate numeric;
  v_item jsonb;
  v_product record;
  v_variant record;
  v_variant_id uuid;
  v_device record;
  v_device_id uuid;
  v_sale_item_id uuid;
  v_business_mode text;
  v_modifiers jsonb;
  v_modifier_item jsonb;
  v_modifier_row record;
  v_modifier_total numeric := 0;
  v_order_notes text;
  v_ingredient record;
  v_available integer;
  v_ticket_id uuid;
  v_batch record;
  v_batch_total integer;
  v_remaining integer;
  v_allocated integer;
  v_quantity integer;
  v_stock_units integer;
  v_unit_type text;
  v_units_per_sale integer;
  v_unit_price numeric;
  v_line_total numeric;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not private.has_store_role(_store_id, v_user_id, array['owner','manager','cashier']::public.store_role[]) then raise exception 'Not authorized for this store'; end if;
  if not exists(select 1 from public.branches b where b.id = _branch_id and b.store_id = _store_id) then raise exception 'Invalid branch'; end if;
  select coalesce(s.storefront_settings->>'businessMode',s.business_type,'general-retail') into v_business_mode from public.stores s where s.id=_store_id;
  update public.inventory_batches set status='expired',updated_at=now() where store_id=_store_id and branch_id=_branch_id and status in ('active','hold') and expiry_date is not null and expiry_date<current_date;
  if _payment_method not in ('cash','card','transfer','credit') then raise exception 'Invalid payment method'; end if;
  if _customer_id is not null and not exists(select 1 from public.customers c where c.id = _customer_id and c.store_id = _store_id) then raise exception 'Invalid customer'; end if;
  if _offline_id is not null then
    select id into v_sale_id from public.sales where offline_id = _offline_id and store_id = _store_id limit 1;
    if v_sale_id is not null then return v_sale_id; end if;
  end if;
  if coalesce(jsonb_typeof(_items), '') <> 'array' then raise exception 'Sale must contain at least one item'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Sale must contain at least one item'; end if;
  select tax_rate into v_tax_rate from public.stores where id = _store_id;

  -- Validate all items and lock the relevant stock rows before creating a sale.
  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_type := coalesce(v_item->>'unit_type', 'piece');
    v_variant_id := nullif(v_item->>'fashion_variant_stock_id', '')::uuid;
    v_device_id := nullif(v_item->>'electronics_device_id', '')::uuid;
    v_modifiers := coalesce(v_item->'modifiers','[]'::jsonb);
    v_order_notes := coalesce(v_item->>'order_notes','');
    v_modifier_total := 0;
    if v_quantity is null or v_quantity <= 0 then raise exception 'Invalid quantity'; end if;
    if v_unit_type not in ('piece','pack') then raise exception 'Invalid sale unit'; end if;
    select p.id,p.name,p.price,p.piece_price,p.pack_price,p.units_per_pack,bs.quantity
      into v_product
      from public.products p
      join public.branch_stock bs on bs.product_id = p.id and bs.branch_id = _branch_id
      where p.id = (v_item->>'product_id')::uuid and p.store_id = _store_id and p.is_active = true
      for update of bs;
    if not found then raise exception 'Product is not available at this branch'; end if;

    if jsonb_typeof(v_modifiers)<>'array' then raise exception 'Invalid menu modifiers'; end if;
    if v_business_mode in ('food-service','restaurant','food','bakery') then
      for v_modifier_item in select value from jsonb_array_elements(v_modifiers) loop
        select * into v_modifier_row from public.food_menu_modifiers
          where id=(v_modifier_item->>'modifier_id')::uuid and store_id=_store_id and product_id=v_product.id and is_active
          for share;
        if not found then raise exception 'A menu modifier is no longer available for %',v_product.name; end if;
        if coalesce((v_modifier_item->>'price_delta')::numeric,0)<0 then raise exception 'Modifier price additions cannot be negative'; end if;
        if not exists(
          select 1 from jsonb_array_elements(v_modifier_row.options) as option_row(value)
          where option_row.value->>'label'=v_modifier_item->>'option_label'
            and coalesce((option_row.value->>'price_delta')::numeric,0)=coalesce((v_modifier_item->>'price_delta')::numeric,0)
        ) then raise exception 'Invalid option for menu modifier %',v_modifier_row.name; end if;
        v_modifier_total := v_modifier_total + coalesce((v_modifier_item->>'price_delta')::numeric,0);
      end loop;
      for v_modifier_row in select id,name from public.food_menu_modifiers where store_id=_store_id and product_id=v_product.id and is_active and is_required loop
        if not exists(select 1 from jsonb_array_elements(v_modifiers) as chosen(value) where chosen.value->>'modifier_id'=v_modifier_row.id::text) then
          raise exception 'Choose an option for %',v_modifier_row.name;
        end if;
      end loop;
    elsif jsonb_array_length(v_modifiers)>0 then
      raise exception 'Menu modifiers are only available in food-service mode';
    end if;

    v_units_per_sale := case when v_unit_type = 'pack' then greatest(v_product.units_per_pack,1) else 1 end;
    if v_unit_type = 'pack' and v_product.units_per_pack <= 1 then raise exception 'This product is not configured for pack sales'; end if;
    v_stock_units := v_quantity * v_units_per_sale;
    if v_variant_id is not null and v_device_id is not null then raise exception 'A sale line cannot select both a fashion variant and an electronics device'; end if;

    if v_device_id is not null then
      if v_quantity <> 1 or v_unit_type <> 'piece' then raise exception 'A serialised device must be sold as one individual item'; end if;
      select * into v_device from public.electronics_devices where id=v_device_id and store_id=_store_id and branch_id=_branch_id and product_id=v_product.id and status='in_stock' for update;
      if not found then raise exception 'Selected serial number or IMEI is no longer available'; end if;
    elsif v_variant_id is not null then
      if v_unit_type <> 'piece' then raise exception 'Fashion variants can only be sold as individual items'; end if;
      select * into v_variant from public.fashion_variant_stock
        where id = v_variant_id and store_id = _store_id and branch_id = _branch_id and product_id = v_product.id
        for update;
      if not found then raise exception 'Selected size and colour are not available at this branch'; end if;
      if v_variant.quantity < v_stock_units then raise exception 'Insufficient stock for % (% / %)', v_product.name, v_variant.size, v_variant.color; end if;
    elsif exists(select 1 from public.electronics_devices ed where ed.store_id=_store_id and ed.branch_id=_branch_id and ed.product_id=v_product.id) then
      raise exception 'Select an available serial number or IMEI for %',v_product.name;
    elsif exists(select 1 from public.inventory_batches ib where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=v_product.id) then
      null; -- Validated in aggregate below; the checkout will allocate FEFO batches.
    elsif v_product.quantity < v_stock_units then
      raise exception 'Insufficient stock for %', v_product.name;
    end if;

    v_unit_price := case when v_business_mode in ('food-service','restaurant','food','bakery') then v_product.price + v_modifier_total else case when v_unit_type = 'pack' then coalesce(nullif(v_product.pack_price,0), v_product.price * greatest(v_product.units_per_pack,1)) else coalesce(nullif(v_product.piece_price,0),v_product.price) end + v_modifier_total end;
    v_line_total := v_unit_price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  for v_ingredient in
    select p.id as product_id,
      sum((cart_row.value->>'quantity')::integer * case when coalesce(cart_row.value->>'unit_type','piece')='pack' then greatest(p.units_per_pack,1) else 1 end)::integer as required_quantity
    from jsonb_array_elements(_items) as cart_row(value)
    join public.products p on p.id=(cart_row.value->>'product_id')::uuid and p.store_id=_store_id
    where exists(select 1 from public.inventory_batches ib where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=p.id)
      and nullif(cart_row.value->>'fashion_variant_stock_id','') is null
      and nullif(cart_row.value->>'electronics_device_id','') is null
    group by p.id
  loop
    select coalesce(sum(ib.quantity),0)::integer into v_batch_total from public.inventory_batches ib
      where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=v_ingredient.product_id
        and ib.status='active' and (ib.expiry_date is null or ib.expiry_date>=current_date);
    if v_batch_total<v_ingredient.required_quantity then
      raise exception 'Insufficient unexpired batch stock for product %',v_ingredient.product_id;
    end if;
  end loop;

  if v_business_mode in ('food-service','restaurant','food','bakery') then
    for v_ingredient in
      select r.ingredient_product_id, sum(r.quantity_per_serving * (cart_row.value->>'quantity')::integer)::integer as required_quantity
      from jsonb_array_elements(_items) as cart_row(value)
      join public.food_recipe_ingredients r on r.menu_product_id=(cart_row.value->>'product_id')::uuid and r.store_id=_store_id and r.branch_id=_branch_id
      group by r.ingredient_product_id
    loop
      select bs.quantity into v_available from public.branch_stock bs where bs.store_id=_store_id and bs.branch_id=_branch_id and bs.product_id=v_ingredient.ingredient_product_id for update;
      if not found or v_available<v_ingredient.required_quantity then
        raise exception 'Insufficient ingredient stock for product %',v_ingredient.ingredient_product_id;
      end if;
    end loop;
  end if;

  v_tax := round((v_subtotal * v_tax_rate / 100)::numeric, 2);
  v_total := v_subtotal + v_tax;
  v_reference := 'KUD-' || to_char(clock_timestamp(),'YYYYMMDD-HH24MISSMS') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));
  insert into public.sales(store_id,branch_id,cashier_id,reference,subtotal,tax,total,payment_method,note,customer_id,offline_id)
    values (_store_id,_branch_id,v_user_id,v_reference,v_subtotal,v_tax,v_total,_payment_method::public.payment_method,coalesce(_note,''),_customer_id,_offline_id)
    returning id into v_sale_id;

  for v_item in select value from jsonb_array_elements(_items) loop
    v_quantity := (v_item->>'quantity')::integer;
    v_unit_type := coalesce(v_item->>'unit_type','piece');
    v_variant_id := nullif(v_item->>'fashion_variant_stock_id','')::uuid;
    v_device_id := nullif(v_item->>'electronics_device_id','')::uuid;
    v_modifiers := coalesce(v_item->'modifiers','[]'::jsonb);
    v_order_notes := coalesce(v_item->>'order_notes','');
    select p.id,p.name,p.price,p.piece_price,p.pack_price,p.units_per_pack
      into v_product from public.products p
      where p.id = (v_item->>'product_id')::uuid and p.store_id = _store_id
      for update;
    v_units_per_sale := case when v_unit_type = 'pack' then greatest(v_product.units_per_pack,1) else 1 end;
    v_unit_price := case when v_business_mode in ('food-service','restaurant','food','bakery') then v_product.price + coalesce((select sum(coalesce((m.value->>'price_delta')::numeric,0)) from jsonb_array_elements(v_modifiers) as m(value)),0) else case when v_unit_type = 'pack' then coalesce(nullif(v_product.pack_price,0), v_product.price * greatest(v_product.units_per_pack,1)) else coalesce(nullif(v_product.piece_price,0),v_product.price) end + coalesce((select sum(coalesce((m.value->>'price_delta')::numeric,0)) from jsonb_array_elements(v_modifiers) as m(value)),0) end;
    v_stock_units := v_quantity * v_units_per_sale;
    v_line_total := v_unit_price * v_quantity;

    if v_device_id is not null then
      select * into v_device from public.electronics_devices where id=v_device_id and store_id=_store_id and branch_id=_branch_id and product_id=v_product.id and status='in_stock' for update;
      if not found then raise exception 'Selected serial number or IMEI is no longer available'; end if;
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,electronics_device_id,device_serial_number,device_imei,food_modifiers,order_notes)
        values(v_sale_id,_store_id,v_product.id,v_product.name,1,v_unit_price,v_unit_price,'piece',1,v_device.id,v_device.serial_number,v_device.imei,v_modifiers,v_order_notes) returning id into v_sale_item_id;
      update public.electronics_devices set status='sold',sale_item_id=v_sale_item_id,customer_id=_customer_id,warranty_started_at=now(),warranty_expires_at=case when warranty_months>0 then now()+make_interval(months=>warranty_months) else null end,updated_at=now() where id=v_device_id;
    elsif v_variant_id is not null then
      select * into v_variant from public.fashion_variant_stock
        where id = v_variant_id and store_id = _store_id and branch_id = _branch_id and product_id = v_product.id
        for update;
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,fashion_variant_stock_id,variant_size,variant_color,food_modifiers,order_notes)
        values (v_sale_id,_store_id,v_product.id,v_product.name,v_quantity,v_unit_price,v_line_total,'piece',1,v_variant.id,v_variant.size,v_variant.color,v_modifiers,v_order_notes);
      update public.fashion_variant_stock set quantity = quantity - v_stock_units, updated_at = now() where id = v_variant_id;
      -- The variant-stock trigger maintains branch_stock as the sum of all active combinations.
    elsif exists(select 1 from public.inventory_batches ib where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=v_product.id) then
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,food_modifiers,order_notes)
        values(v_sale_id,_store_id,v_product.id,v_product.name,v_quantity,v_unit_price,v_line_total,v_unit_type,v_units_per_sale,v_modifiers,v_order_notes)
        returning id into v_sale_item_id;
      v_remaining:=v_stock_units;
      for v_batch in select ib.id,ib.batch_number,ib.expiry_date,ib.quantity
        from public.inventory_batches ib
        where ib.store_id=_store_id and ib.branch_id=_branch_id and ib.product_id=v_product.id
          and ib.status='active' and ib.quantity>0 and (ib.expiry_date is null or ib.expiry_date>=current_date)
        order by ib.expiry_date asc nulls last,ib.received_at asc,ib.id
        for update
      loop
        exit when v_remaining<=0;
        v_allocated:=least(v_remaining,v_batch.quantity);
        update public.inventory_batches set quantity=quantity-v_allocated,status=case when quantity-v_allocated=0 then 'closed' else status end,updated_at=now() where id=v_batch.id;
        insert into public.inventory_batch_allocations(store_id,branch_id,sale_id,sale_item_id,product_id,batch_id,batch_number,expiry_date,quantity)
          values(_store_id,_branch_id,v_sale_id,v_sale_item_id,v_product.id,v_batch.id,v_batch.batch_number,v_batch.expiry_date,v_allocated);
        v_remaining:=v_remaining-v_allocated;
      end loop;
      if v_remaining>0 then raise exception 'Insufficient unexpired batch stock for %',v_product.name; end if;
    else
      insert into public.sale_items(sale_id,store_id,product_id,product_name,quantity,unit_price,line_total,unit_type,units_per_sale,food_modifiers,order_notes)
        values (v_sale_id,_store_id,v_product.id,v_product.name,v_quantity,v_unit_price,v_line_total,v_unit_type,v_units_per_sale,v_modifiers,v_order_notes);
      update public.branch_stock set quantity = quantity - v_stock_units, updated_at = now() where branch_id = _branch_id and product_id = v_product.id;
    end if;
  end loop;

  if v_business_mode in ('food-service','restaurant','food','bakery') then
    insert into public.food_kitchen_tickets(store_id,branch_id,sale_id,ticket_number,status,notes)
      values(_store_id,_branch_id,v_sale_id,'KIT-'||to_char(clock_timestamp(),'YYMMDDHH24MISS')||'-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,4)),'new',coalesce(_note,''))
      returning id into v_ticket_id;
    insert into public.food_kitchen_ticket_items(ticket_id,store_id,sale_item_id,product_name,quantity,modifiers,order_notes)
      select v_ticket_id,_store_id,si.id,si.product_name,si.quantity,si.food_modifiers,si.order_notes
      from public.sale_items si where si.sale_id=v_sale_id;
    for v_item in select value from jsonb_array_elements(_items) loop
      update public.branch_stock bs
        set quantity=bs.quantity-(r.quantity_per_serving*(v_item->>'quantity')::integer),updated_at=now()
        from public.food_recipe_ingredients r
        where r.store_id=_store_id and r.branch_id=_branch_id
          and r.menu_product_id=(v_item->>'product_id')::uuid
          and bs.store_id=_store_id and bs.branch_id=_branch_id and bs.product_id=r.ingredient_product_id;
    end loop;
  end if;

  if _customer_id is not null then
    update public.customers set total_spent = total_spent + v_total, visit_count = visit_count + 1, last_visit_at = now(), updated_at = now() where id = _customer_id;
  end if;
  return v_sale_id;
end;
$function$



-- Reject NULL and non-array bulk import payloads before array operations.
CREATE OR REPLACE FUNCTION public.bulk_import_products(_store_id uuid, _branch_id uuid, _rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_row jsonb;
  v_product_id uuid;
  v_name text;
  v_sku text;
  v_barcode text;
  v_category text;
  v_price numeric;
  v_cost numeric;
  v_quantity integer;
  v_low_stock integer;
  v_created integer := 0;
  v_updated integer := 0;
  v_seen integer := 0;
begin
  if v_user_id is null then raise exception 'Not authenticated'; end if;
  if not private.has_store_role(_store_id, v_user_id, array['owner','manager']::public.store_role[]) then
    raise exception 'Not authorized for bulk product import';
  end if;
  if not exists (select 1 from public.branches b where b.id = _branch_id and b.store_id = _store_id) then
    raise exception 'Invalid branch';
  end if;
  if coalesce(jsonb_typeof(_rows), '') <> 'array' then
    raise exception 'Import must contain at least one product';
  end if;
  if jsonb_array_length(_rows) = 0 then
    raise exception 'Import must contain at least one product';
  end if;
  if jsonb_array_length(_rows) > 5000 then
    raise exception 'Import is limited to 5000 products per batch';
  end if;

  for v_row in select value from jsonb_array_elements(_rows) loop
    v_seen := v_seen + 1;
    v_name := nullif(trim(v_row->>'name'), '');
    v_sku := trim(coalesce(v_row->>'sku', ''));
    v_barcode := trim(coalesce(v_row->>'barcode', ''));
    v_category := trim(coalesce(v_row->>'category', ''));
    v_price := greatest(coalesce((v_row->>'price')::numeric, 0), 0);
    v_cost := greatest(coalesce((v_row->>'cost')::numeric, 0), 0);
    v_quantity := greatest(coalesce((v_row->>'quantity')::integer, 0), 0);
    v_low_stock := greatest(coalesce((v_row->>'lowStockThreshold')::integer, 5), 0);

    if v_name is null then raise exception 'Product % has no name', v_seen; end if;

    v_product_id := null;
    if v_sku <> '' then
      select p.id into v_product_id from public.products p
      where p.store_id = _store_id and p.is_active = true and lower(trim(coalesce(p.sku,''))) = lower(v_sku)
      order by p.updated_at desc nulls last limit 1 for update;
    end if;
    if v_product_id is null and v_barcode <> '' then
      select p.id into v_product_id from public.products p
      where p.store_id = _store_id and p.is_active = true and trim(coalesce(p.barcode,'')) = v_barcode
      order by p.updated_at desc nulls last limit 1 for update;
    end if;
    if v_product_id is null then
      select p.id into v_product_id from public.products p
      where p.store_id = _store_id and p.is_active = true and lower(trim(p.name)) = lower(v_name)
      order by p.updated_at desc nulls last limit 1 for update;
    end if;

    if v_product_id is null then
      insert into public.products(store_id,name,sku,barcode,category,price,piece_price,cost,low_stock_threshold,is_active)
      values (_store_id,v_name,v_sku,v_barcode,v_category,v_price,v_price,v_cost,v_low_stock,true)
      returning id into v_product_id;
      v_created := v_created + 1;
    else
      update public.products set name=v_name, sku=v_sku, barcode=v_barcode, category=v_category,
        price=v_price, piece_price=v_price, cost=v_cost, low_stock_threshold=v_low_stock, updated_at=now()
      where id=v_product_id;
      v_updated := v_updated + 1;
    end if;

    insert into public.branch_stock(store_id,branch_id,product_id,quantity,updated_at)
    values (_store_id,_branch_id,v_product_id,v_quantity,now())
    on conflict (branch_id,product_id) do update
      set quantity=excluded.quantity, store_id=excluded.store_id, updated_at=now();
  end loop;

  return jsonb_build_object('created',v_created,'updated',v_updated,'processed',v_seen);
end;
$function$


-- Reject NULL and non-array return payloads before recording a return.
CREATE OR REPLACE FUNCTION public.process_fashion_return(_store_id uuid, _sale_id uuid, _reason text, _items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
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
  if coalesce(jsonb_typeof(_items), '') <> 'array' then raise exception 'Select at least one item to return'; end if;
  if jsonb_array_length(_items) = 0 then raise exception 'Select at least one item to return'; end if;
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
$function$



-- Staff account metadata (including lock state and last login) is manager-only.
-- The SECURITY DEFINER RPC must enforce the same boundary as the table's RLS policy.
create or replace function public.list_staff_accounts(_store_id uuid)
returns table(
  id uuid,
  name text,
  role text,
  is_active boolean,
  last_login_at timestamp with time zone,
  locked_until timestamp with time zone,
  created_at timestamp with time zone
)
language sql
security definer
set search_path to 'public'
as $function$
  select
    s.id,
    s.name,
    s.role,
    s.is_active,
    s.last_login_at,
    s.locked_until,
    s.created_at
  from public.staff_accounts s
  where s.store_id = _store_id
    and private.has_store_role(
      _store_id,
      auth.uid(),
      array['owner'::public.store_role, 'manager'::public.store_role]
    )
  order by s.is_active desc, lower(s.name);
$function$;
