create table if not exists private.order_tracking_lookup_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  updated_at timestamptz not null default now()
);
create index if not exists order_tracking_lookup_rate_limits_updated_at_idx
  on private.order_tracking_lookup_rate_limits (updated_at);

alter table private.order_tracking_lookup_rate_limits enable row level security;
revoke all on table private.order_tracking_lookup_rate_limits from public, anon, authenticated;

create or replace function private.consume_order_tracking_lookup_limit(p_key_hash text, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, private
as $function$
declare
  v_attempts integer;
begin
  if p_key_hash is null or p_key_hash !~ '^[a-f0-9]{64}$'
     or p_limit is null or p_limit < 1 or p_limit > 100 then
    return false;
  end if;

  insert into private.order_tracking_lookup_rate_limits as rate_limit
    (key_hash, window_started_at, attempt_count, updated_at)
  values (p_key_hash, now(), 1, now())
  on conflict (key_hash) do update
    set window_started_at = case
          when rate_limit.window_started_at <= now() - interval '15 minutes' then now()
          else rate_limit.window_started_at
        end,
        attempt_count = case
          when rate_limit.window_started_at <= now() - interval '15 minutes' then 1
          else rate_limit.attempt_count + 1
        end,
        updated_at = now()
  returning attempt_count into v_attempts;

  return v_attempts <= p_limit;
end;
$function$;

revoke all on function private.consume_order_tracking_lookup_limit(text, integer)
  from public, anon, authenticated;

create or replace function public.get_order_tracking_token(_order_number text, _customer_phone text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $function$
declare
  v_token text;
  v_headers jsonb;
  v_ip text;
  v_ip_key text;
  v_phone_ip_key text;
begin
  if btrim(coalesce(_order_number, '')) = ''
     or btrim(coalesce(_customer_phone, '')) = '' then
    return null;
  end if;

  begin
    v_headers := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  exception when others then
    v_headers := '{}'::jsonb;
  end;

  -- Prefer the Cloudflare edge address; fall back to the first forwarded address.
  -- Never store the raw address: only SHA-256 digests are persisted.
  v_ip := coalesce(
    nullif(btrim(v_headers->>'cf-connecting-ip'), ''),
    nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
    'unknown'
  );
  v_ip_key := encode(extensions.digest('order-tracking-ip:' || v_ip, 'sha256'), 'hex');
  v_phone_ip_key := encode(
    extensions.digest(
      'order-tracking-phone-ip:' || v_ip || ':' || lower(btrim(_customer_phone)),
      'sha256'
    ),
    'hex'
  );

  -- Per-IP and per-phone/IP limits protect older, predictable order numbers.
  if not private.consume_order_tracking_lookup_limit(v_ip_key, 60)
     or not private.consume_order_tracking_lookup_limit(v_phone_ip_key, 10) then
    return null;
  end if;

  select tracking_token into v_token
  from public.online_orders
  where order_number = btrim(_order_number)
    and customer_phone = btrim(_customer_phone)
  limit 1;

  return v_token;
end;
$function$;
