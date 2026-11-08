-- Password changes now use Supabase Auth's native reauthentication nonce flow.
-- Remove the old custom OTP store and verification overloads that depended on
-- internal auth.users token fields and a service-role password update path.
drop function if exists public.verify_password_change_otp(uuid, text);
drop function if exists public.verify_password_change_otp(text);
drop table if exists public.password_otp_attempts;
