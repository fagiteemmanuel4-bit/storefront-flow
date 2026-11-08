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
