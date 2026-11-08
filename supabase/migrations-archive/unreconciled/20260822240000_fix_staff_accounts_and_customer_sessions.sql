-- Fix staff account creation validation and keep the public temporary-customer RPC surface explicit.
-- The previous staff PIN regex used \d, which PostgreSQL's POSIX regex engine does not
-- treat like JavaScript's digit class. Explicit [0-9] validation is portable.

CREATE OR REPLACE FUNCTION public.create_staff_account(
  _store_id uuid,
  _name text,
  _pin text,
  _role text DEFAULT 'cashier'
)
RETURNS TABLE(id uuid, name text, role text, is_active boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_name text := btrim(coalesce(_name, ''));
  v_role text := lower(btrim(coalesce(_role, '')));
  v_staff_id uuid;
  v_pin_hash text;
  v_existing record;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT private.has_store_role(_store_id, v_uid, ARRAY['owner'::public.store_role, 'manager'::public.store_role]) THEN
    RAISE EXCEPTION 'Not authorized to manage staff';
  END IF;
  IF v_name = '' OR length(v_name) > 80 THEN
    RAISE EXCEPTION 'Staff name is required and must be 80 characters or fewer';
  END IF;
  IF _pin IS NULL OR _pin !~ '^[0-9]{4,6}$' THEN
    RAISE EXCEPTION 'PIN must contain 4 to 6 digits';
  END IF;
  IF _pin IN ('0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','4321','0123','12345','123456') THEN
    RAISE EXCEPTION 'Choose a less predictable PIN';
  END IF;
  IF v_role NOT IN ('manager','cashier','inventory','sales','viewer') THEN
    RAISE EXCEPTION 'Unsupported staff role';
  END IF;

  SELECT id INTO v_existing
  FROM public.staff_accounts
  WHERE store_id = _store_id AND lower(trim(name)) = lower(v_name)
  LIMIT 1;
  IF FOUND THEN RAISE EXCEPTION 'A staff account with this name already exists'; END IF;

  FOR v_existing IN
    SELECT pin_hash FROM public.staff_accounts
    WHERE store_id = _store_id AND is_active = true
  LOOP
    IF crypt(_pin, v_existing.pin_hash) = v_existing.pin_hash THEN
      RAISE EXCEPTION 'That PIN is already in use by another active staff account';
    END IF;
  END LOOP;

  v_pin_hash := crypt(_pin, gen_salt('bf', 10));
  INSERT INTO public.staff_accounts(store_id, name, pin_hash, role, is_active, failed_attempts, created_by)
  VALUES (_store_id, v_name, v_pin_hash, v_role, true, 0, v_uid)
  RETURNING staff_accounts.id INTO v_staff_id;

  INSERT INTO public.staff_audit_log(store_id, staff_id, actor_user_id, action, metadata)
  VALUES (_store_id, v_staff_id, v_uid, 'staff_created', jsonb_build_object('role', v_role));

  RETURN QUERY
  SELECT s.id, s.name, s.role, s.is_active
  FROM public.staff_accounts s
  WHERE s.id = v_staff_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_staff_account(uuid,text,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_staff_account(uuid,text,text,text) TO authenticated;

REVOKE ALL ON FUNCTION public.customer_account_register(text,text,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.customer_account_login(text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.customer_account_get(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.customer_account_orders(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.customer_account_link_order(text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.customer_account_logout(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_account_register(text,text,text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_account_login(text,text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_account_get(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_account_orders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_account_link_order(text,text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.customer_account_logout(text) TO anon, authenticated;
