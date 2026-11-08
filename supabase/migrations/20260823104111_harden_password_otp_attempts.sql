create table if not exists public.password_otp_attempts (
  user_id uuid primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0 check (attempts >= 0)
);

revoke all on table public.password_otp_attempts from public, anon, authenticated;

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
  v_window_started timestamptz;
  v_attempts integer;
begin
  if v_user_id is null or p_otp is null or p_otp !~ '^[0-9]{8}$' then
    return false;
  end if;

  insert into public.password_otp_attempts(user_id, window_started_at, attempts)
  values (v_user_id, now(), 1)
  on conflict (user_id) do update
    set window_started_at = case
          when public.password_otp_attempts.window_started_at < now() - interval '10 minutes' then now()
          else public.password_otp_attempts.window_started_at
        end,
        attempts = case
          when public.password_otp_attempts.window_started_at < now() - interval '10 minutes' then 1
          else public.password_otp_attempts.attempts + 1
        end
  returning window_started_at, attempts into v_window_started, v_attempts;

  if v_attempts > 5 then
    return false;
  end if;

  select email, reauthentication_token, reauthentication_sent_at
    into v_email, v_token_hash, v_sent_at
  from auth.users
  where id = v_user_id;

  if v_email is null or v_token_hash is null or v_sent_at is null then
    return false;
  end if;

  v_expected_hash := encode(extensions.digest(v_email || p_otp, 'sha224'), 'hex');

  if v_sent_at < now() - interval '10 minutes' or v_expected_hash <> v_token_hash then
    return false;
  end if;

  update auth.users
     set reauthentication_token = null,
         reauthentication_sent_at = null
   where id = v_user_id;

  delete from public.password_otp_attempts where user_id = v_user_id;

  return true;
end;
$$;

revoke all on function public.verify_password_change_otp(text) from public, anon;
grant execute on function public.verify_password_change_otp(text) to authenticated;
