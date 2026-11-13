-- The public feedback form only submits these six fields. Prevent anonymous
-- clients from setting internal moderation metadata or timestamps.
REVOKE INSERT ON TABLE public.store_feedback FROM anon, authenticated;
GRANT INSERT (
  store_id,
  feedback_type,
  rating,
  reason,
  message,
  contact_email
) ON TABLE public.store_feedback TO anon, authenticated;

-- Apply database-side abuse limits even when requests bypass the Vercel app.
CREATE OR REPLACE FUNCTION private.enforce_store_feedback_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_headers jsonb;
  v_ip text;
  v_ip_key text;
  v_store_ip_key text;
BEGIN
  BEGIN
    v_headers := coalesce(
      nullif(current_setting('request.headers', true), ''),
      '{}'
    )::jsonb;
  EXCEPTION WHEN others THEN
    v_headers := '{}'::jsonb;
  END;

  v_ip := coalesce(
    nullif(btrim(v_headers->>'cf-connecting-ip'), ''),
    nullif(btrim(v_headers->>'x-real-ip'), ''),
    nullif(btrim(split_part(coalesce(v_headers->>'x-forwarded-for', ''), ',', 1)), ''),
    'unknown'
  );

  v_ip_key := encode(
    extensions.digest('store-feedback-ip:' || v_ip, 'sha256'),
    'hex'
  );
  v_store_ip_key := encode(
    extensions.digest(
      'store-feedback-store-ip:' || v_ip || ':' || coalesce(NEW.store_id::text, ''),
      'sha256'
    ),
    'hex'
  );

  IF NOT private.consume_order_tracking_lookup_limit(v_ip_key, 30)
     OR NOT private.consume_order_tracking_lookup_limit(v_store_ip_key, 5) THEN
    RAISE EXCEPTION 'Too many feedback submissions. Please wait before trying again.';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION private.enforce_store_feedback_rate_limit() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_store_feedback_rate_limit ON public.store_feedback;
CREATE TRIGGER enforce_store_feedback_rate_limit
BEFORE INSERT ON public.store_feedback
FOR EACH ROW
EXECUTE FUNCTION private.enforce_store_feedback_rate_limit();
