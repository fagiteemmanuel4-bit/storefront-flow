# Strap onboarding and compliance update

## User experience

- Refreshes the signup/onboarding visual system with the Strap lemon hero, black content sheet, Sora typography, responsive fields and pinned navigation.
- Reveals the password field after a valid email address is entered.
- Preserves Supabase authentication, 8-digit email OTP, Turnstile, Google OAuth, password recovery, account checks, loading/error handling and existing redirects.
- Adds date of birth and country of residence to the account onboarding flow.
- Adds business registration status and optional registration number, declared branch count, structured business address, website status/URL, Strap website intent and optional business profile image.
- Existing store owners who have not completed these details are routed to a one-time compliance completion screen. Staff accounts are not forced through that flow.

## Data storage

- `profiles.date_of_birth` and `profiles.country` store personal profile details.
- `store_compliance_profiles` stores registration status/number, declared branch count, normalized business address, website details and business profile image URL.
- The combined address is also written to `stores.address` and the default `branches.address` so existing workspace screens keep working.
- Business profile images use the existing `kudi-store-assets` bucket and are limited to PNG, JPG or WebP files up to 5 MB.
- Declared branch count is recorded as a compliance answer; the flow does not create empty branch records.

## Access controls

- RLS is enabled on `store_compliance_profiles`.
- Store owners can read and write their own store compliance records.
- Platform administrators can read compliance records and personal profile data for review; they cannot write through these policies.
- Ordinary store staff do not receive access to private compliance records.
- Anonymous access and authenticated delete privileges are not granted on `store_compliance_profiles`.

## Database migrations applied

- `20261114200617_collect_onboarding_compliance_details.sql`
- `20261114200701_allow_registration_number_to_be_added_later.sql`
- `20261114201308_allow_platform_admin_compliance_review.sql`
- `20261114201716_restrict_compliance_profile_table_privileges.sql`

## Documentation and validation

- Updates the privacy policy to describe personal and business compliance data, its purposes and authorized review access.
- Regenerates Supabase TypeScript database types.
- GitHub CI: formatting, lint, production build and TypeScript checks passed.
- Static security and build checks passed.
- Vercel Git integration produced a READY preview deployment at https://storefront-flow-fdirmeajk-kristens-projects-e3a8795a.vercel.app (preview access may require Vercel authentication).
- The pull request remains open and has not been merged into production.

## Important compliance note

This implementation collects and protects the requested fields. It does not, by itself, certify Strap's compliance or guarantee acceptance by a regulator. The privacy policy still contains legal-entity and privacy-contact placeholders that must be completed and reviewed by qualified Nigerian privacy/compliance counsel before publication.
