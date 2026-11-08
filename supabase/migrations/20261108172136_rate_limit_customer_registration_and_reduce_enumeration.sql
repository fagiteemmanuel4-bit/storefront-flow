create or replace function public.customer_account_register(
  _slug text,
  _name text,
  _email text,
  _phone text,
  _password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  os public.online_stores%rowtype;
  account public.store_customer_accounts%rowtype;
  raw_token text;
  v_headers jsonb;
  v_ip text;
  v_ip_key text;
  v_email_ip_key text;
begin
  if length(btrim(coalesce(_name, ''))) < 2 then
    raise exception 'Enter your name';
  end if;
  if length(btrim(coalesce(_email, ''))) < 5 or position('@' in _email) < 2 then
    raise exception 'Enter a valid email';
  end if;
  if coalesce(length(_password), 0) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;
  if octet_length(_password) > 72 then
    raise exception 'Password is too long. Use 72 bytes or fewer.';
  end if;

  begin
    v_headers := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  v_ip := coalesce(
    nullif(btrim(v_headers->>'cf-connecting-ip'), ''),
    nullif(btrim(v_headers->>'x-real-ip'), ''),
    nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
    'unknown'
  );
  v_ip_key := encode(
    extensions.digest('customer-register-ip:' || v_ip, 'sha256'),
    'hex'
  );

  if not private.consume_order_tracking_lookup_limit(v_ip_key, 30) then
    raise exception 'Registration is temporarily unavailable. Please try again later.';
  end if;

  select * into os
  from public.online_stores
  where slug = lower(btrim(_slug))
    and is_published
    and setup_completed;
  if not found then
    raise exception 'Storefront not found';
  end if;

  v_email_ip_key := encode(
    extensions.digest(
      'customer-register-email-ip:' || v_ip || ':' || os.store_id::text || ':' || lower(btrim(_email)),
      'sha256'
    ),
    'hex'
  );
  if not private.consume_order_tracking_lookup_limit(v_email_ip_key, 5) then
    raise exception 'Registration is temporarily unavailable. Please try again later.';
  end if;

  perform public.customer_account_cleanup_expired();

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
      perform extensions.crypt(_password, extensions.gen_salt('bf', 12));
      raise exception 'We could not complete registration. Check your details or try signing in.';
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
