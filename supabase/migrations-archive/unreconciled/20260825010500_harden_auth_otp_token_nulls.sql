-- Supabase Auth expects token string fields to contain empty strings rather than NULL.
-- Backfill legacy NULLs so OTP/recovery queries cannot fail with scan errors.
update auth.users
set
  confirmation_token = coalesce(confirmation_token, ''),
  recovery_token = coalesce(recovery_token, ''),
  email_change_token_current = coalesce(email_change_token_current, ''),
  email_change_token_new = coalesce(email_change_token_new, ''),
  phone_change_token = coalesce(phone_change_token, ''),
  reauthentication_token = coalesce(reauthentication_token, '')
where confirmation_token is null
   or recovery_token is null
   or email_change_token_current is null
   or email_change_token_new is null
   or phone_change_token is null
   or reauthentication_token is null;
