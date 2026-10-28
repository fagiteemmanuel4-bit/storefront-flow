# Strap OTP Authentication Security

Strap by Kryonara uses Supabase Auth for email verification and sensitive-account reauthentication.

## How authentication works

### Creating an account

1. The user submits their name, email and password.
2. Supabase Auth creates the account.
3. Strap clears the temporary authentication session.
4. Strap requests a one-time email verification code.
5. The user enters the six-digit email OTP on the verification screen.
6. Supabase verifies the code and confirms the email.
7. Strap shows a clear verification-success state and the user can continue securely.

### Signing in

1. The user enters their email and password.
2. Supabase validates the credentials.
3. Strap does not leave that preliminary session active as the final sign-in.
4. Strap requests a fresh one-time email code.
5. The user enters the six-digit email OTP.
6. Supabase verifies the OTP and establishes the authenticated session.
7. Strap opens the protected workspace.

### Changing a password

1. An authenticated user chooses a new password.
2. Strap calls Supabase Auth `reauthenticate()`.
3. Supabase sends an eight-digit reauthentication nonce to the user's verified email.
4. Strap accepts all eight digits and automatically submits the completed code.
5. Strap sends the nonce with `updateUser({ password, nonce })`.
6. Supabase validates the nonce before changing the password.
7. Strap shows a dedicated success state only after Supabase confirms the password update.

## OTP protections

- Email signup/sign-in OTPs are six digits and are single-use through Supabase Auth.
- Password reauthentication nonces are eight digits and are validated by Supabase Auth before a sensitive password change.
- Codes are delivered to the account's verified email address.
- The verification UI accepts only numeric characters and the exact expected length for the flow.
- Email OTP resend is rate-limited in the interface with a 60-second cooldown.
- Password reauthentication resend is rate-limited in the interface with a 60-second cooldown.
- Users are warned never to share verification codes.
- Verification state is cleared from session storage after completion.
- Strap does not store OTP values in the application database.
- Authentication and nonce validation are handled by Supabase Auth rather than a custom password or OTP implementation.

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
