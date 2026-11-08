create table if not exists public.store_customer_accounts (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  email text not null,
  name text not null default '',
  phone text not null default '',
  password_hash text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  last_seen_at timestamptz,
  failed_attempts integer not null default 0,
  locked_until timestamptz,
  unique (store_id, email),
  check (email = lower(email)),
  check (length(password_hash) > 0)
);
create table if not exists public.store_customer_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.store_customer_accounts(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz
);
create table if not exists public.store_customer_orders (
  account_id uuid not null references public.store_customer_accounts(id) on delete cascade,
  order_id uuid not null references public.online_orders(id) on delete cascade,
  linked_at timestamptz not null default now(),
  primary key (account_id, order_id)
);
create index if not exists store_customer_accounts_store_email_idx on public.store_customer_accounts(store_id, email);
create index if not exists store_customer_accounts_expiry_idx on public.store_customer_accounts(expires_at);
create index if not exists store_customer_sessions_expiry_idx on public.store_customer_sessions(expires_at);
create index if not exists store_customer_orders_account_idx on public.store_customer_orders(account_id, linked_at desc);
alter table public.store_customer_accounts enable row level security;
alter table public.store_customer_sessions enable row level security;
alter table public.store_customer_orders enable row level security;
revoke all on public.store_customer_accounts from anon, authenticated;
revoke all on public.store_customer_sessions from anon, authenticated;
revoke all on public.store_customer_orders from anon, authenticated;
create or replace function public.customer_account_cleanup_expired()
returns integer language plpgsql security definer set search_path to '' as $$
declare deleted_count integer;
begin
  delete from public.store_customer_sessions where expires_at <= now();
  delete from public.store_customer_accounts where expires_at <= now();
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;
create or replace function public.customer_account_register(_slug text,_name text,_email text,_phone text,_password text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare os public.online_stores%rowtype; account public.store_customer_accounts%rowtype; raw_token text;
begin
  perform public.customer_account_cleanup_expired();
  if length(btrim(coalesce(_name,''))) < 2 then raise exception 'Enter your name'; end if;
  if length(btrim(coalesce(_email,''))) < 5 or position('@' in _email) < 2 then raise exception 'Enter a valid email'; end if;
  if length(_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;
  select * into os from public.online_stores where slug=lower(btrim(_slug)) and is_published and setup_completed;
  if not found then raise exception 'Storefront not found'; end if;
  begin
    insert into public.store_customer_accounts(store_id,email,name,phone,password_hash)
    values(os.store_id,lower(btrim(_email)),btrim(_name),btrim(coalesce(_phone,'')),extensions.crypt(_password, extensions.gen_salt('bf',12))) returning * into account;
  exception when unique_violation then raise exception 'An account already exists for this email at this store'; end;
  raw_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.store_customer_sessions(account_id,token_hash,expires_at) values(account.id,encode(extensions.digest(raw_token,'sha256'),'hex'),account.expires_at);
  return jsonb_build_object('token',raw_token,'expires_at',account.expires_at,'name',account.name,'email',account.email);
end;
$$;
create or replace function public.customer_account_login(_slug text,_email text,_password text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare os public.online_stores%rowtype; account public.store_customer_accounts%rowtype; raw_token text;
begin
  perform public.customer_account_cleanup_expired();
  select * into os from public.online_stores where slug=lower(btrim(_slug)) and is_published and setup_completed;
  if not found then raise exception 'Storefront not found'; end if;
  select * into account from public.store_customer_accounts where store_id=os.store_id and email=lower(btrim(_email));
  if not found or account.expires_at<=now() then raise exception 'Account not found or expired'; end if;
  if account.locked_until is not null and account.locked_until>now() then raise exception 'Too many attempts. Try again later'; end if;
  if extensions.crypt(_password,account.password_hash)<>account.password_hash then
    update public.store_customer_accounts set failed_attempts=failed_attempts+1,locked_until=case when failed_attempts>=4 then now()+interval '15 minutes' else locked_until end where id=account.id;
    raise exception 'Email or password is incorrect';
  end if;
  update public.store_customer_accounts set failed_attempts=0,locked_until=null,last_seen_at=now() where id=account.id;
  raw_token:=encode(extensions.gen_random_bytes(32),'hex');
  insert into public.store_customer_sessions(account_id,token_hash,expires_at,last_seen_at) values(account.id,encode(extensions.digest(raw_token,'sha256'),'hex'),account.expires_at,now());
  return jsonb_build_object('token',raw_token,'expires_at',account.expires_at,'name',account.name,'email',account.email);
end;
$$;
create or replace function public.customer_account_get(_token text)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
declare account public.store_customer_accounts%rowtype;
begin
  perform public.customer_account_cleanup_expired();
  select a.* into account from public.store_customer_sessions s join public.store_customer_accounts a on a.id=s.account_id where s.token_hash=encode(extensions.digest(coalesce(_token,''),'sha256'),'hex') and s.expires_at>now() and a.expires_at>now();
  if not found then raise exception 'Account session expired'; end if;
  update public.store_customer_sessions set last_seen_at=now() where token_hash=encode(extensions.digest(coalesce(_token,''),'sha256'),'hex');
  return jsonb_build_object('id',account.id,'store_id',account.store_id,'name',account.name,'email',account.email,'phone',account.phone,'created_at',account.created_at,'expires_at',account.expires_at);
end;
$$;
create or replace function public.customer_account_link_order(_token text,_tracking_token text)
returns jsonb language plpgsql security definer set search_path to '' as $$
declare account public.store_customer_accounts%rowtype; ord public.online_orders%rowtype;
begin
  select a.* into account from public.store_customer_sessions s join public.store_customer_accounts a on a.id=s.account_id where s.token_hash=encode(extensions.digest(coalesce(_token,''),'sha256'),'hex') and s.expires_at>now() and a.expires_at>now();
  if not found then raise exception 'Account session expired'; end if;
  select * into ord from public.online_orders where tracking_token=btrim(_tracking_token) and store_id=account.store_id;
  if not found then raise exception 'Order tracking code not found'; end if;
  if lower(coalesce(ord.customer_email,''))<>account.email then raise exception 'That order was not placed with this account email'; end if;
  insert into public.store_customer_orders(account_id,order_id) values(account.id,ord.id) on conflict do nothing;
  return jsonb_build_object('order_number',ord.order_number,'status',ord.status,'tracking_token',ord.tracking_token,'created_at',ord.created_at);
end;
$$;
create or replace function public.customer_account_orders(_token text)
returns table(order_id uuid,order_number text,status text,total numeric,created_at timestamptz,tracking_token text)
language sql stable security definer set search_path to '' as $$
select o.id,o.order_number,o.status,o.total,o.created_at,o.tracking_token from public.store_customer_sessions s join public.store_customer_accounts a on a.id=s.account_id join public.store_customer_orders co on co.account_id=a.id join public.online_orders o on o.id=co.order_id where s.token_hash=encode(extensions.digest(coalesce(_token,''),'sha256'),'hex') and s.expires_at>now() and a.expires_at>now() order by o.created_at desc;
$$;
create or replace function public.customer_account_logout(_token text)
returns boolean language sql security definer set search_path to '' as $$
delete from public.store_customer_sessions where token_hash=encode(extensions.digest(coalesce(_token,''),'sha256'),'hex'); select true;
$$;
revoke all on function public.customer_account_register(text,text,text,text,text) from public; grant execute on function public.customer_account_register(text,text,text,text,text) to anon,authenticated;
revoke all on function public.customer_account_login(text,text,text) from public; grant execute on function public.customer_account_login(text,text,text) to anon,authenticated;
revoke all on function public.customer_account_get(text) from public; grant execute on function public.customer_account_get(text) to anon,authenticated;
revoke all on function public.customer_account_link_order(text,text) from public; grant execute on function public.customer_account_link_order(text,text) to anon,authenticated;
revoke all on function public.customer_account_orders(text) from public; grant execute on function public.customer_account_orders(text) to anon,authenticated;
revoke all on function public.customer_account_logout(text) from public; grant execute on function public.customer_account_logout(text) to anon,authenticated;
