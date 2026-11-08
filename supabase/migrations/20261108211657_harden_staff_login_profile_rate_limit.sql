create or replace function public.staff_login_profile(_slug text)
returns jsonb
language plpgsql
volatile
security definer
set search_path = pg_catalog, public, private, extensions
as $function$
declare
  v_headers jsonb;
  v_ip text;
  v_ip_key text;
  v_slug_ip_key text;
begin
  if coalesce(length(btrim(_slug)), 0) < 3 or length(btrim(_slug)) > 80 then
    return '{}'::jsonb;
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
  v_ip_key := encode(extensions.digest('staff-login-ip:' || v_ip, 'sha256'), 'hex');
  v_slug_ip_key := encode(
    extensions.digest('staff-login-slug-ip:' || v_ip || ':' || lower(btrim(_slug)), 'sha256'),
    'hex'
  );
  if not private.consume_order_tracking_lookup_limit(v_ip_key, 60)
     or not private.consume_order_tracking_lookup_limit(v_slug_ip_key, 10) then
    return '{}'::jsonb;
  end if;
  return coalesce(
    (
      select jsonb_build_object('name', s.name, 'role', s.role, 'store_name', st.name)
      from public.staff_accounts s
      join public.stores st on st.id = s.store_id
      where s.login_slug = lower(btrim(_slug))
        and s.is_active = true
      limit 1
    ),
    '{}'::jsonb
  );
end;
$function$;
