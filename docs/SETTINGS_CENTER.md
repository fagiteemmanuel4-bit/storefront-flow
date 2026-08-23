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
4. The user enters the 8-digit code in Strap.
5. Strap sends the OTP and new password to the authenticated `password-change-otp` Edge Function.
6. The Edge Function verifies the reauthentication proof against the active Supabase Auth reauthentication token using the same SHA-224 email+OTP derivation used by Supabase Auth.
7. The Edge Function consumes the verification proof and uses the server-only Supabase Admin API to update the authenticated user's password.
8. Supabase invalidates sessions as part of the password update, so the user may need to sign in again.

The browser never receives or stores a service-role key. The password update is performed server-side only.

There is no old-password field. The email OTP is the verification factor for this operation.

The OTP is not passed through `verifyOtp`. The flow uses the dedicated reauthentication endpoint and a protected server-side password update because the project's Auth policy currently rejects client-side password updates unless a current password is supplied. This keeps the requested UX—no old password—without weakening authentication or exposing administrative credentials to the browser.

The database migration `secure_password_otp_change` provides the narrowly scoped `verify_password_change_otp(text)` security-definer function. It accepts execution only from authenticated users, validates the current user's reauthentication proof, enforces a ten-minute proof lifetime, consumes the proof after successful validation, and is protected by a five-attempt-per-user verification window.

The `password-change-otp` Edge Function is JWT-protected and uses `supabase.auth.admin.updateUserById()` only after that verification succeeds.

The UI provides password-strength validation, confirmation validation, eight-digit numeric OTP validation, resend throttling, loading/error states and a success state.

## Reauthentication email branding

A branded Strap reauthentication template is stored at:

`supabase/templates/reauthentication.html`

The template is OTP-only and contains no sign-in link. It uses `{{ .Token }}` for the eight-digit code and is designed around Strap/Kryonara branding.

The hosted Supabase project currently sends mail through Supabase's default SMTP service. The Auth logs show the current sender as `noreply@mail.app.supabase.io`. Changing the sender display name from **Supabase Auth** to **Strap** requires configuring custom SMTP and setting the sender name to `Strap`; the SMTP credential itself must never be committed to GitHub.

A free custom SMTP option such as Resend can be used for this. After configuring SMTP in Supabase, the branded template can be applied from Supabase Auth Email Templates. No EmailJS dependency is required.

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
9. Vercel reaches `READY` before production is considered complete.
