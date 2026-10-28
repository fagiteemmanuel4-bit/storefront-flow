# Strap Settings Center

## Current architecture

Strap uses `/settings` as the single Settings entry point. Settings are protected by the existing authenticated route tree and each supported category has its own route and focused page.

### Supported routes

- `/settings`
- `/settings/store-profile`
- `/settings/appearance`
- `/settings/staff`
- `/settings/notifications`
- `/settings/receipts`
- `/settings/online-store`
- `/settings/checkout`
- `/settings/inventory`
- `/settings/security`
- `/settings/payments`
- `/settings/password`
- `/settings/sessions`
- `/settings/sessions/revoke`

The former Advanced Settings destination has been removed. There is no `/settings/advanced` or `/advanced-settings` Settings destination anymore.

## Settings persistence

Settings continue to use the existing Supabase model. No second settings database was introduced.

- Store identity and regional preferences use `stores` and its existing JSON settings.
- Store appearance uses `storefront_configs`.
- Online-store configuration uses `online_stores` and `storefront_configs`.
- Notifications, checkout and inventory preferences use the existing advanced-settings persistence where those preferences are already represented.
- Security preferences use `account_security_settings`.
- Staff management uses the existing `staff_accounts` table and staff RPCs.
- Sessions use the existing `account-security` Edge Function.

## Password authentication: email OTP only

The Settings password-change flow does not ask for the old password. It does not use `signInWithOtp`, magic links, confirmation URLs or email redirects.

Supabase Auth sends the project's configured **8-digit reauthentication code**, so the Strap UI accepts exactly eight numeric digits.

### Production flow

1. The authenticated user enters a new password and confirmation.
2. Strap calls `supabase.auth.reauthenticate()`.
3. Supabase Auth sends an 8-digit reauthentication OTP to the user's verified email address.
4. The user enters the 8-digit code in the protected Strap verification modal.
5. Strap sends the OTP and new password to the JWT-protected `password-change-otp` Edge Function.
6. The Edge Function validates the caller's access token with Supabase Auth.
7. A server-only Supabase RPC verifies the reauthentication proof against the active Auth token hash using the same SHA-224 email+OTP derivation used by Supabase Auth.
8. The proof is consumed only after successful verification, and a five-attempt-per-user verification window is enforced.
9. The Edge Function uses the server-only Supabase Admin API to update the authenticated user's password.
10. Supabase invalidates sessions as part of the password update, so the user may need to sign in again.

The browser never receives or stores a service-role key. The password update is performed server-side only.

There is no old-password field. The email OTP is the verification factor for this operation.

The OTP is not passed through `verifyOtp`. The flow uses the dedicated reauthentication endpoint and a protected server-side password update because the project's Auth policy currently rejects client-side password updates unless a current password is supplied. This keeps the requested UX—no old password—without exposing administrative credentials to the browser.

### OTP security hardening

- `password-change-otp` is deployed with JWT verification enabled.
- Verification is bound to the authenticated user's ID from the access token; the client cannot choose another account.
- OTP input is exactly eight numeric digits.
- Codes expire with the active Supabase reauthentication window.
- A maximum of five verification attempts is enforced per user within a ten-minute window.
- A successful verification consumes the stored reauthentication proof.
- `password_otp_attempts` has RLS enabled and no client-facing policies; it is used only by the protected server-side function.
- The password verification RPC is executable only by the server-side `service_role` and is not exposed to anonymous or authenticated browser clients.
- The service-role key is never sent to the browser or committed to GitHub.
- The Edge Function returns generic verification failures rather than exposing internal database/auth details.

The active Edge Function is `password-change-otp` version 3 and its source is version-controlled under `supabase/functions/password-change-otp/`.

## Security confirmation modal

Security-sensitive confirmation and verification experiences use the shared `SecurityModal` component.

It is used for:

- Email OTP verification before password changes.
- Successful password-change confirmation.
- Logout confirmation.
- Destructive store-deletion confirmation.

The modal uses the existing Radix Alert Dialog primitive, prevents accidental outside dismissal for verification flows, uses a strong visual hierarchy, and provides explicit primary/secondary actions.

While a security modal is open, Strap applies best-effort browser protections against ordinary text selection, copy, cut, paste, context-menu and drag operations. Common keyboard clipboard/print/save shortcuts are blocked while the modal is active.

These protections are **not a cryptographic screen-capture barrier**. A normal web browser cannot reliably prevent an operating system screenshot, external camera capture, browser-level screen recording, or hardware/OS casting. Such protection would require a controlled native application/device policy (for example Android's `FLAG_SECURE`). Strap therefore does not claim that browser JavaScript can make screenshots or casting impossible.

## Reauthentication email branding

A branded Strap reauthentication template is stored at:

`supabase/templates/reauthentication.html`

The template is OTP-only and contains no sign-in link. It uses `{{ .Token }}` for the eight-digit code and is designed around Strap/Kryonara branding.

The hosted Supabase project currently sends mail through Supabase's default SMTP service. Changing the sender display name from **Supabase Auth** to **Strap** requires configuring custom SMTP and setting the sender name to `Strap`; SMTP credentials must never be committed to GitHub.

A custom SMTP provider such as Resend can be used for production mail delivery. No EmailJS dependency is required.

## Removed product surfaces

The following are intentionally no longer offered:

- Advanced Settings page and navigation entry.
- Standalone visual storefront editor / `online-store/customize` route.
- Product tour and its replay entry.
- Duplicate Store Profile entry from the hamburger menu.

Store appearance remains available from Settings, but it is a settings-only experience with a lightweight preview. It is not a visual storefront editor.

## Hamburger menu

The application menu was redesigned for desktop-first use with grouped sections, stronger hierarchy, consistent action sizing and one Settings destination under Account.

The menu no longer exposes Settings sub-pages individually.

Logout now opens a secure confirmation modal rather than immediately terminating the session.

## Staff listing fix

The `list_staff_accounts(uuid)` Supabase RPC now returns `created_at` alongside the fields already used by the staff Settings table. This fixes the mismatch where the UI displayed a Created column that the RPC did not return.

The Staff Settings page continues to use the existing staff account system rather than creating a second authentication system.

## Payments and domains

Payments remain **Coming Soon**. No payment processor is connected from Settings.

Custom domains remain on hold.

## Routing note

TanStack Router file-based routing owns the generated route tree. Route files are the source of truth; the generated `routeTree.gen.ts` is regenerated by the project's router build tooling when routes change.

## Deployment verification

After Settings changes, production verification must confirm:

1. `/settings` loads the Settings home.
2. Each supported Settings category opens its own route.
3. No supported Settings route redirects to an Advanced page.
4. The hamburger menu contains one Settings entry.
5. The visual editor route is absent.
6. The product tour is absent.
7. Staff listing renders the real RPC fields without a missing-column mismatch.
8. Password change sends and validates the configured 8-digit email OTP without requiring the old password or a magic link.
9. OTP verification occurs only through the protected server-side function.
10. Security-sensitive confirmations use the shared modal pattern.
11. Vercel reaches `READY` before production is considered complete.
