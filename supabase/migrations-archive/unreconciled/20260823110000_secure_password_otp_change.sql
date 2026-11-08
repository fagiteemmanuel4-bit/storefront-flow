-- Strap password-change OTP hardening.
-- The privileged verification path is server-only. No browser role can execute it.

GRANT SELECT ON TABLE auth.users TO service_role;

ALTER TABLE public.password_otp_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.password_otp_attempts FROM anon, authenticated;

DROP FUNCTION IF EXISTS public.verify_password_change_otp(text);
DROP FUNCTION IF EXISTS public.verify_password_change_otp(uuid, text);

CREATE FUNCTION public.verify_password_change_otp(p_user_id uuid, p_otp text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_email text;
  v_token_hash text;
  v_sent_at timestamptz;
  v_expected_hash text;
  v_attempts integer;
BEGIN
  IF p_user_id IS NULL OR p_otp IS NULL OR p_otp !~ '^[0-9]{8}$' THEN
    RETURN false;
  END IF;

  INSERT INTO public.password_otp_attempts(user_id, window_started_at, attempts)
  VALUES (p_user_id, now(), 1)
  ON CONFLICT (user_id) DO UPDATE
  SET window_started_at = CASE
        WHEN public.password_otp_attempts.window_started_at < now() - interval '10 minutes' THEN now()
        ELSE public.password_otp_attempts.window_started_at
      END,
      attempts = CASE
        WHEN public.password_otp_attempts.window_started_at < now() - interval '10 minutes' THEN 1
        ELSE public.password_otp_attempts.attempts + 1
      END
  RETURNING attempts INTO v_attempts;

  IF v_attempts > 5 THEN
    RETURN false;
  END IF;

  SELECT email, reauthentication_token, reauthentication_sent_at
  INTO v_email, v_token_hash, v_sent_at
  FROM auth.users
  WHERE id = p_user_id;

  IF v_email IS NULL OR v_token_hash IS NULL OR v_sent_at IS NULL THEN
    RETURN false;
  END IF;

  v_expected_hash := encode(extensions.digest(lower(v_email) || p_otp, 'sha224'), 'hex');

  IF v_sent_at < now() - interval '10 minutes' OR v_expected_hash <> v_token_hash THEN
    RETURN false;
  END IF;

  UPDATE auth.users
  SET reauthentication_token = NULL,
      reauthentication_sent_at = NULL
  WHERE id = p_user_id;

  DELETE FROM public.password_otp_attempts WHERE user_id = p_user_id;
  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_password_change_otp(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_password_change_otp(uuid, text) TO service_role;
