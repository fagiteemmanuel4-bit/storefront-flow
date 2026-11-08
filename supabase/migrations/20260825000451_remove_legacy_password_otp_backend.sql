drop function if exists public.verify_password_change_otp(uuid, text);
drop function if exists public.verify_password_change_otp(text);
drop table if exists public.password_otp_attempts;
