# Strap OTP Authentication Security

Strap by Kryonara uses a layered email verification flow for account access.

## How authentication works

### Creating an account

1. The user submits their name, email and password.
2. Supabase Auth creates the account.
3. Strap immediately clears the temporary authentication session.
4. Strap requests a one-time email verification code.
5. The user enters the six-digit code on the verification screen.
6. Supabase verifies the code and confirms the email.
7. The user can continue into Strap after successful verification.

### Signing in

1. The user enters their email and password.
2. Supabase first validates the credentials.
3. Strap does not leave that preliminary session active as the final sign-in.
4. Strap requests a fresh one-time email code.
5. The user enters the six-digit code.
6. Supabase verifies the OTP and establishes the authenticated session.
7. Strap opens the protected workspace.

This means a valid password alone is not the final authentication step for normal sign-in.

## OTP protections

- Codes are single-use through Supabase Auth.
- Codes are delivered to the account email address.
- The verification UI accepts exactly six numeric characters.
- Resending a code is rate-limited in the interface with a 60-second cooldown.
- Users are warned never to share their verification code.
- Verification state is cleared from session storage after completion.
- Strap does not store OTP values in the application database.
- Authentication is handled by Supabase Auth rather than a custom password or OTP implementation.

## Password recovery

Password recovery remains a separate Supabase recovery flow. A password-reset link establishes the recovery context and the user completes the password update inside Strap.

## Important configuration

The production Supabase Auth configuration must continue to have the correct production site URL and redirect URLs for:

- `https://storefront-flow.vercel.app/verify-email`
- `https://storefront-flow.vercel.app/auth`
- the production password-recovery callback used by Strap

Email delivery, OTP expiry, rate limits and anti-abuse controls are ultimately governed by the Supabase Auth configuration and email provider. The application must not claim a specific expiry duration unless that value is configured and verified in Supabase.

## User-facing security statement

Strap can describe its authentication as:

> **Secure OTP verification** — Strap adds a one-time email verification step to account creation and normal sign-in, using Supabase Auth to verify the code before protected access is granted.

Do not describe Strap as "unhackable" or make absolute security guarantees. Security depends on the user's email account, Supabase configuration, application security, infrastructure and operational controls.
