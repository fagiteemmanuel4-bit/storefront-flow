create or replace function public.verify_password_change_otp(p_otp text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_token_hash text;
  v_sent_at timestamptz;
  v_expected_hash text;
begin
  if v_user_id is null or p_otp is null or p_otp !~ '^[0-9]{8}$' then
    return false;
  end if;

  select email, reauthentication_token, reauthentication_sent_at
    into v_email, v_token_hash, v_sent_at
  from auth.users
  where id = v_user_id;

  if v_email is null or v_token_hash is null or v_sent_at is null then
    return false;
  end if;

  -- Supabase Auth hashes reauthentication OTPs as SHA-224(email + otp).
  v_expected_hash := encode(extensions.digest(v_email || p_otp, 'sha224'), 'hex');

  if v_sent_at < now() - interval '10 minutes' or v_expected_hash <> v_token_hash then
    return false;
  end if;

  -- Consume the reauthentication proof so the code cannot be replayed.
  update auth.users
     set reauthentication_token = null,
         reauthentication_sent_at = null
   where id = v_user_id;

  return true;
end;
$$;

revoke all on function public.verify_password_change_otp(text) from public;
revoke all on function public.verify_password_change_otp(text) from anon;
grant execute on function public.verify_password_change_otp(text) to authenticated;
