CREATE OR REPLACE FUNCTION public.customer_account_login(_slug text, _email text, _password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $function$
declare
  os public.online_stores%rowtype;
  account public.store_customer_accounts%rowtype;
  raw_token text;
  v_password_matches boolean := false;
  v_headers jsonb;
  v_ip text;
  v_ip_key text;
  v_email_ip_key text;
begin
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
  v_ip_key := encode(extensions.digest('customer-login-ip:' || v_ip, 'sha256'), 'hex');

  if not private.consume_order_tracking_lookup_limit(v_ip_key, 60) then
    raise exception 'Email or password is incorrect';
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
      'customer-login-email-ip:' || v_ip || ':' || os.store_id::text || ':' || lower(btrim(coalesce(_email, ''))),
      'sha256'
    ),
    'hex'
  );
  if not private.consume_order_tracking_lookup_limit(v_email_ip_key, 5) then
    raise exception 'Email or password is incorrect';
  end if;

  perform public.customer_account_cleanup_expired();

  select * into account
  from public.store_customer_accounts
  where store_id = os.store_id
    and email = lower(btrim(_email));

  if not found or account.expires_at <= now() then
    perform extensions.crypt(coalesce(_password, ''), extensions.gen_salt('bf', 12));
    raise exception 'Email or password is incorrect';
  end if;

  if account.locked_until is not null and account.locked_until > now() then
    perform extensions.crypt(coalesce(_password, ''), extensions.gen_salt('bf', 12));
    raise exception 'Email or password is incorrect';
  end if;

  if _password is not null
    and octet_length(_password) <= 72
    and account.password_hash is not null
  then
    v_password_matches := coalesce(extensions.crypt(_password, account.password_hash) = account.password_hash, false);
  else
    perform extensions.crypt(coalesce(_password, ''), extensions.gen_salt('bf', 12));
  end if;

  if not v_password_matches then
    update public.store_customer_accounts
    set failed_attempts = failed_attempts + 1,
        locked_until = case
          when failed_attempts >= 4 then now() + interval '15 minutes'
          else locked_until
        end
    where id = account.id;

    raise exception 'Email or password is incorrect';
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
    'token', raw_token,
    'expires_at', account.expires_at,
    'name', account.name,
    'email', account.email
  );
end;
$function$;
