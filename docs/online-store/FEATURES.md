# Strap Online Store — Feature Acceptance Catalogue

> Source: supplied `strap-features.normal.json` (schemaVersion 1; 73 original features). Two requested additions are appended as proposed features. No completion status has been changed.

## Rules

- Feature flags use the exact feature `id` as the flag key. A feature remains disabled until its full acceptance bar is verified.
- `all-modes` behavior is shared. `mode-specific` behavior must be read from `modes/<mode>/mode.json`; do not infer or hard-code mode behavior.
- Physical Store and Online Store are separate workspaces. They share store-scoped domain data only through explicit, auditable synchronization contracts. Online Store owns JSON templates, theme drafts and publishing; Physical Store remains focused on in-person operations.
- A feature is `done` only when every criterion passes, loading/empty/error/success states exist, responsive checks pass at 390px and desktop, and automated tests cover the behavior.

## Mode-profile prerequisite

The current repository `main` tree has no `modes/<mode>/mode.json` or `normal-business.mode.json` profile. The supplied feature catalog explicitly requires this profile for mode-specific fields, variants, statuses, dashboard cards, checkout fields, storefront sections, filters and templates. This blocks implementation of those features. No substitute profile or guessed defaults will be created.

## Feature acceptance criteria

### `pl.e2e-tests` — End-to-end tests for critical flows

- **Priority:** P0  
- **Group:** Platform quality  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Shared app shell; all feature screens; platform services.  
- **Data required:** Feature-flag registry; RLS policies; validation schemas; rate-limit state; audit/error telemetry; test fixtures.  
- **Dependencies:** `pl.states`, `pl.security`, `pl.feature-flags`
- **Acceptance criteria:**
  1. Critical seller and shopper journeys are covered from onboarding through product publish, stock sync, order creation and fulfilment.
  2. Tests run against isolated fixtures and verify tenant isolation, duplicate webhook/idempotency behavior and failure recovery.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pl.e2e-tests` (default OFF until verified).

### `pl.feature-flags` — Feature flags per feature id

- **Priority:** P0  
- **Group:** Platform quality  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Unfinished work stays hidden  
- **Screens:** Shared app shell; all feature screens; platform services.  
- **Data required:** Feature-flag registry; RLS policies; validation schemas; rate-limit state; audit/error telemetry; test fixtures.  
- **Dependencies:** Shared platform foundation / none listed.
- **Acceptance criteria:**
  1. Every catalog feature is gated by a stable flag whose key exactly matches its feature id.
  2. A flag is enabled only after its acceptance criteria, lifecycle states, 390px/desktop checks and automated tests pass.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pl.feature-flags` (default OFF until verified).

### `pl.security` — Row-level security, validation, rate limits

- **Priority:** P0  
- **Group:** Platform quality  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Shared app shell; all feature screens; platform services.  
- **Data required:** Feature-flag registry; RLS policies; validation schemas; rate-limit state; audit/error telemetry; test fixtures.  
- **Dependencies:** Shared platform foundation / none listed.
- **Acceptance criteria:**
  1. Every store-owned read/write is tenant-scoped and protected by verified RLS or trusted server authorization.
  2. Inputs, uploads, RPCs and public endpoints have schema validation, authorization, rate limits and abuse-resistant error responses.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pl.security` (default OFF until verified).

### `pl.states` — Loading, empty, error and success states on every screen

- **Priority:** P0  
- **Group:** Platform quality  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Shared app shell; all feature screens; platform services.  
- **Data required:** Feature-flag registry; RLS policies; validation schemas; rate-limit state; audit/error telemetry; test fixtures.  
- **Dependencies:** Shared platform foundation / none listed.
- **Acceptance criteria:**
  1. Every touched screen implements explicit loading, empty, recoverable error and success states with accessible announcements.
  2. State behavior is consistent for slow networks, no permissions, no data and retryable server failures.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pl.states` (default OFF until verified).

### `ob.email-verify` — Email verification

- **Priority:** P0  
- **Group:** Seller onboarding  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** 6-digit code with resend countdown and paste support  
- **Screens:** Onboarding flow; account verification; store setup.  
- **Data required:** User identity and verification state; onboarding draft/progress; selected mode profile; store slug and store identity.  
- **Dependencies:** Shared platform foundation / none listed.
- **Acceptance criteria:**
  1. A new seller receives a 6-digit code and can paste a complete code; invalid, expired and reused codes are rejected.
  2. Resend is rate-limited with a visible countdown and verification state persists safely across refresh.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `ob.email-verify` (default OFF until verified).

### `ob.mode-select` — Business mode selection

- **Priority:** P0  
- **Group:** Seller onboarding  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Seller picks or confirms business mode; it configures the rest of the app  
- **Screens:** Onboarding flow; account verification; store setup.  
- **Data required:** User identity and verification state; onboarding draft/progress; selected mode profile; store slug and store identity.  
- **Dependencies:** `ob.email-verify`
- **Acceptance criteria:**
  1. The seller’s selected mode resolves to a validated mode profile and is persisted as the store’s configuration source.
  2. Mode-dependent fields, workflows, sections, filters and statuses are derived from that profile; no mode-specific behavior is hard-coded in shared UI.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `ob.mode-select` (default OFF until verified).

### `ob.save-resume` — Save and resume

- **Priority:** P0  
- **Group:** Seller onboarding  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Progress saved at every step; back arrow never loses data  
- **Screens:** Onboarding flow; account verification; store setup.  
- **Data required:** User identity and verification state; onboarding draft/progress; selected mode profile; store slug and store identity.  
- **Dependencies:** `ob.mode-select`
- **Acceptance criteria:**
  1. Every completed onboarding step is persisted against the authenticated seller/store and restored after refresh or sign-in.
  2. Back/forward navigation preserves entered values and does not create duplicate stores or memberships.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `ob.save-resume` (default OFF until verified).

### `ob.slug-check` — Store link availability

- **Priority:** P0  
- **Group:** Seller onboarding  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Live check, suggestions, reserved names blocked  
- **Screens:** Onboarding flow; account verification; store setup.  
- **Data required:** User identity and verification state; onboarding draft/progress; selected mode profile; store slug and store identity.  
- **Dependencies:** `ob.save-resume`
- **Acceptance criteria:**
  1. Availability is checked server-side with debouncing and clear available/taken/reserved/invalid outcomes.
  2. A final uniqueness constraint prevents race-condition collisions at save time.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `ob.slug-check` (default OFF until verified).

### `pr.crud` — Create, edit, duplicate, delete products

- **Priority:** P0  
- **Group:** Products  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** With confirmation and undo for destructive actions  
- **Screens:** Physical Products workspace; product editor; import/export.  
- **Data required:** Store-scoped product records; mode-profile product schema; variants/SKUs; media assets; inventory and publication state.  
- **Dependencies:** `pl.security`, `pl.feature-flags`
- **Acceptance criteria:**
  1. With confirmation and undo for destructive actions works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pr.crud` (default OFF until verified).

### `pr.draft-publish` — Draft / published status

- **Priority:** P0  
- **Group:** Products  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Per product online visibility  
- **Screens:** Physical Products workspace; product editor; import/export.  
- **Data required:** Store-scoped product records; mode-profile product schema; variants/SKUs; media assets; inventory and publication state.  
- **Dependencies:** `pr.crud`
- **Acceptance criteria:**
  1. Per product online visibility works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pr.draft-publish` (default OFF until verified).

### `pr.images` — Multi-image upload

- **Priority:** P0  
- **Group:** Products  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Reorder, crop, compress, lazy-load  
- **Screens:** Physical Products workspace; product editor; import/export.  
- **Data required:** Store-scoped product records; mode-profile product schema; variants/SKUs; media assets; inventory and publication state.  
- **Dependencies:** `pr.crud`
- **Acceptance criteria:**
  1. Reorder, crop, compress, lazy-load works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pr.images` (default OFF until verified).

### `pr.mode-fields` — Mode-specific product fields

- **Priority:** P0  
- **Group:** Products  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Fields come from the mode profile, not hard-coded  
- **Screens:** Physical Products workspace; product editor; import/export.  
- **Data required:** Store-scoped product records; mode-profile product schema; variants/SKUs; media assets; inventory and publication state.  
- **Dependencies:** `pr.crud`, `ob.mode-select`
- **Acceptance criteria:**
  1. Product fields and validation are generated from the active mode profile; unsupported fields are not shown or accepted.
  2. Existing product data remains readable when a profile version changes, with explicit migration handling for schema changes.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `pr.mode-fields` (default OFF until verified).

### `pr.variants` — Variants

- **Priority:** P0  
- **Group:** Products  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Options and per-variant price, stock, SKU  
- **Screens:** Physical Products workspace; product editor; import/export.  
- **Data required:** Store-scoped product records; mode-profile product schema; variants/SKUs; media assets; inventory and publication state.  
- **Dependencies:** `pr.crud`, `ob.mode-select`
- **Acceptance criteria:**
  1. Variant options and per-variant price, stock and SKU are rendered from the active mode profile schema.
  2. Variant combinations are validated for uniqueness and stock updates target the selected variant.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `pr.variants` (default OFF until verified).

### `sy.field-overrides` — Synced vs overridden fields

- **Priority:** P0  
- **Group:** Physical ↔ Online sync  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Online-only overrides with Reset to store value  
- **Screens:** Physical Products ↔ Online Store publishing and sync surfaces.  
- **Data required:** Store-scoped physical product and online listing IDs; field ownership/overrides; inventory ledger; idempotency keys; sync events.  
- **Dependencies:** `sy.publish-button`
- **Acceptance criteria:**
  1. Online-only overrides with Reset to store value works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sy.field-overrides` (default OFF until verified).

### `sy.import-from-store` — Import from Store screen

- **Priority:** P0  
- **Group:** Physical ↔ Online sync  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Multi-select, filters, progress and result summary  
- **Screens:** Physical Products ↔ Online Store publishing and sync surfaces.  
- **Data required:** Store-scoped physical product and online listing IDs; field ownership/overrides; inventory ledger; idempotency keys; sync events.  
- **Dependencies:** `pr.crud`, `sy.publish-button`
- **Acceptance criteria:**
  1. Multi-select, filters, progress and result summary works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sy.import-from-store` (default OFF until verified).

### `sy.publish-button` — Publish button on physical products

- **Priority:** P0  
- **Group:** Physical ↔ Online sync  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Existing button creates or updates the online listing  
- **Screens:** Physical Products ↔ Online Store publishing and sync surfaces.  
- **Data required:** Store-scoped physical product and online listing IDs; field ownership/overrides; inventory ledger; idempotency keys; sync events.  
- **Dependencies:** `pr.crud`, `pr.draft-publish`
- **Acceptance criteria:**
  1. Existing button creates or updates the online listing works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sy.publish-button` (default OFF until verified).

### `sy.stock-single-source` — One stock count for both channels

- **Priority:** P0  
- **Group:** Physical ↔ Online sync  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Atomic transactions; overselling impossible; optional online reserve  
- **Screens:** Physical Products ↔ Online Store publishing and sync surfaces.  
- **Data required:** Store-scoped physical product and online listing IDs; field ownership/overrides; inventory ledger; idempotency keys; sync events.  
- **Dependencies:** `pr.crud`, `sy.publish-button`, `pl.security`
- **Acceptance criteria:**
  1. Physical and online channels read and update one store-scoped inventory source with atomic reservation/decrement operations.
  2. Concurrent sales cannot oversell; failed or cancelled orders release reservations according to the configured lifecycle.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sy.stock-single-source` (default OFF until verified).

### `sy.sync-log` — Sync log with retry

- **Priority:** P0  
- **Group:** Physical ↔ Online sync  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Failures visible in Needs attention, idempotent retries  
- **Screens:** Physical Products ↔ Online Store publishing and sync surfaces.  
- **Data required:** Store-scoped physical product and online listing IDs; field ownership/overrides; inventory ledger; idempotency keys; sync events.  
- **Dependencies:** `sy.publish-button`, `sy.stock-single-source`, `pl.audit-log`
- **Acceptance criteria:**
  1. Failures visible in Needs attention, idempotent retries works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sy.sync-log` (default OFF until verified).

### `sy.unpublish` — Unpublish

- **Priority:** P0  
- **Group:** Physical ↔ Online sync  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Removes the listing from the storefront without deleting the product  
- **Screens:** Physical Products ↔ Online Store publishing and sync surfaces.  
- **Data required:** Store-scoped physical product and online listing IDs; field ownership/overrides; inventory ledger; idempotency keys; sync events.  
- **Dependencies:** `sy.publish-button`
- **Acceptance criteria:**
  1. Removes the listing from the storefront without deleting the product works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sy.unpublish` (default OFF until verified).

### `or.detail-timeline` — Order detail with timeline

- **Priority:** P0  
- **Group:** Orders & fulfilment  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Items, customer, address, payment, notes  
- **Screens:** Physical Orders workspace; order detail; fulfilment.  
- **Data required:** Store-scoped orders and line items; mode-profile status definitions; customer and fulfilment details; payment/refund state.  
- **Dependencies:** `or.list-filter`, `or.status-flow`
- **Acceptance criteria:**
  1. Items, customer, address, payment, notes works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `or.detail-timeline` (default OFF until verified).

### `or.list-filter` — Order list with status tabs and search

- **Priority:** P0  
- **Group:** Orders & fulfilment  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Physical Orders workspace; order detail; fulfilment.  
- **Data required:** Store-scoped orders and line items; mode-profile status definitions; customer and fulfilment details; payment/refund state.  
- **Dependencies:** `sy.publish-button`
- **Acceptance criteria:**
  1. Order list with status tabs and search works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `or.list-filter` (default OFF until verified).

### `or.notifications` — Customer email on status change

- **Priority:** P0  
- **Group:** Orders & fulfilment  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Templates per status  
- **Screens:** Physical Orders workspace; order detail; fulfilment.  
- **Data required:** Store-scoped orders and line items; mode-profile status definitions; customer and fulfilment details; payment/refund state.  
- **Dependencies:** `or.detail-timeline`
- **Acceptance criteria:**
  1. Templates per status works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `or.notifications` (default OFF until verified).

### `or.status-flow` — Configurable status flow

- **Priority:** P0  
- **Group:** Orders & fulfilment  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Statuses come from the mode profile  
- **Screens:** Physical Orders workspace; order detail; fulfilment.  
- **Data required:** Store-scoped orders and line items; mode-profile status definitions; customer and fulfilment details; payment/refund state.  
- **Dependencies:** `ob.mode-select`, `or.list-filter`
- **Acceptance criteria:**
  1. Allowed order statuses and transitions are loaded from the active mode profile and enforced server-side.
  2. Invalid, skipped or backward transitions are rejected unless the profile explicitly allows them; customer-facing labels follow the same configuration.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `or.status-flow` (default OFF until verified).

### `cu.order-tracking` — Order tracking timeline

- **Priority:** P0  
- **Group:** Customers & shopper account  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Logged-in and guest (order number + email)  
- **Screens:** Customers workspace; shopper account; order tracking.  
- **Data required:** Store-scoped customer identity; shopper auth; order history; consent; addresses; tags and notes.  
- **Dependencies:** `or.detail-timeline`, `cu.shopper-account`
- **Acceptance criteria:**
  1. Logged-in and guest (order number + email) works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `cu.order-tracking` (default OFF until verified).

### `cu.shopper-account` — Shopper mini account

- **Priority:** P0  
- **Group:** Customers & shopper account  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Sign up, login, scoped to one store  
- **Screens:** Customers workspace; shopper account; order tracking.  
- **Data required:** Store-scoped customer identity; shopper auth; order history; consent; addresses; tags and notes.  
- **Dependencies:** `pl.security`, `ob.email-verify`
- **Acceptance criteria:**
  1. Sign up, login, scoped to one store works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `cu.shopper-account` (default OFF until verified).

### `sf.draft-publish-versions` — Draft, publish and version history

- **Priority:** P0  
- **Group:** Storefront & design  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Rollback  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `sf.template-gallery`, `sf.section-editor`
- **Acceptance criteria:**
  1. Draft changes are isolated from the live storefront until an explicit publish action passes validation.
  2. Every publish creates an immutable version with author/time metadata and supports rollback to a previously published version.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sf.draft-publish-versions` (default OFF until verified).

### `sf.preview-responsive` — Responsive storefront previewer

- **Priority:** P0  
- **Group:** Storefront & design  
- **Availability:** `all-modes`  
- **Status:** `proposed`  
- **Catalog description:** Dedicated isolated preview with desktop, tablet and mobile viewport presets, zoom/fit, page/route selection and draft-only rendering  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** Shared platform foundation / none listed.
- **Acceptance criteria:**
  1. Preview renders the selected page/template using isolated draft configuration and fixture data; it never mutates or exposes the published storefront or live customer data.
  2. User can switch desktop/tablet/mobile presets, zoom/fit and select a page/route; viewport controls reflect the actual rendered preview dimensions.
  3. Preview updates from editor changes with clear loading, empty, error and success states; keyboard controls and 390px/desktop editor layouts are tested.
  4. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sf.preview-responsive` (default OFF until verified).

### `sf.product-page` — Product page

- **Priority:** P0  
- **Group:** Storefront & design  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Gallery, variants, stock badge, related products  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `pr.crud`, `pr.variants`, `sf.draft-publish-versions`
- **Acceptance criteria:**
  1. Gallery, variants, stock badge, related products works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `sf.product-page` (default OFF until verified).

### `sf.search-filter-sort` — Search, filters and sorting

- **Priority:** P0  
- **Group:** Storefront & design  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Filters adapt to product fields  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `pr.mode-fields`, `pr.variants`, `sf.draft-publish-versions`
- **Acceptance criteria:**
  1. Filters adapt to product fields works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `sf.search-filter-sort` (default OFF until verified).

### `sf.section-editor` — Section editor

- **Priority:** P0  
- **Group:** Storefront & design  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Reorder, show/hide, edit text and images  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `sf.template-gallery`, `sf.theme-editor`
- **Acceptance criteria:**
  1. The section catalogue is derived from the active mode profile and only registered, compatible section types can be inserted.
  2. Merchants can reorder, hide/show, edit supported settings and restore defaults; invalid JSON is rejected with actionable validation errors.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `sf.section-editor` (default OFF until verified).

### `sf.subdomain-domain` — Store link and custom domain

- **Priority:** P0  
- **Group:** Storefront & design  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Wildcard subdomain, SSL, domain verification  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `sf.draft-publish-versions`, `st.store-profile`
- **Acceptance criteria:**
  1. Wildcard subdomain, SSL, domain verification works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sf.subdomain-domain` (default OFF until verified).

### `sf.template-gallery` — Template gallery with live preview

- **Priority:** P0  
- **Group:** Storefront & design  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Filtered by business mode  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `ob.mode-select`, `pl.feature-flags`
- **Acceptance criteria:**
  1. Only templates compatible with the active mode profile are listed, with clear purpose, page coverage, style tags and preview imagery.
  2. Each template can be previewed with realistic sample data before applying; applying creates a draft and never overwrites the published storefront.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `sf.template-gallery` (default OFF until verified).

### `sf.template-library` — Expanded template library and profiles

- **Priority:** P0  
- **Group:** Storefront & design  
- **Availability:** `mode-specific`  
- **Status:** `proposed`  
- **Catalog description:** Curated template families with style/use-case tags, search, mode compatibility, profile/version metadata and rich previews  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** Shared platform foundation / none listed.
- **Acceptance criteria:**
  1. Gallery supports curated template families, search and style/use-case filters, with compatibility derived from the active mode profile.
  2. Each template exposes version, supported pages/sections, profile compatibility and a rich preview; incompatible or deprecated templates cannot be applied.
  3. Applying a template creates a reversible draft with explicit confirmation and never overwrites the live store; loading, empty, error and success states are tested.
  4. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `sf.template-library` (default OFF until verified).

### `sf.theme-editor` — Theme editor

- **Priority:** P0  
- **Group:** Storefront & design  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Colors, fonts, radius, light/dark, instant preview  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `sf.template-gallery`
- **Acceptance criteria:**
  1. Global theme tokens (palette, typography, spacing, radii and color scheme) update the preview immediately without mutating the published version.
  2. Settings are schema-validated and persist as a versioned draft that can be previewed, compared and published.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sf.theme-editor` (default OFF until verified).

### `ck.cart-drawer` — Cart drawer

- **Priority:** P0  
- **Group:** Cart, checkout & payments  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Quantity, remove, stock limits  
- **Screens:** Public storefront cart; checkout; order confirmation.  
- **Data required:** Cart/session; customer/contact and address; mode-profile checkout fields; inventory reservation; shipping/tax quotes; payment intents/webhook events.  
- **Dependencies:** `sf.product-page`, `sy.stock-single-source`
- **Acceptance criteria:**
  1. Quantity, remove, stock limits works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `ck.cart-drawer` (default OFF until verified).

### `ck.guest-and-account` — Guest or account checkout

- **Priority:** P0  
- **Group:** Cart, checkout & payments  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Public storefront cart; checkout; order confirmation.  
- **Data required:** Cart/session; customer/contact and address; mode-profile checkout fields; inventory reservation; shipping/tax quotes; payment intents/webhook events.  
- **Dependencies:** `ck.cart-drawer`, `cu.shopper-account`
- **Acceptance criteria:**
  1. Guest or account checkout works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `ck.guest-and-account` (default OFF until verified).

### `ck.payments` — Payment providers

- **Priority:** P0  
- **Group:** Cart, checkout & payments  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Cards, transfer, cash on delivery; webhooks idempotent  
- **Screens:** Public storefront cart; checkout; order confirmation.  
- **Data required:** Cart/session; customer/contact and address; mode-profile checkout fields; inventory reservation; shipping/tax quotes; payment intents/webhook events.  
- **Dependencies:** `ck.guest-and-account`, `ck.shipping-tax`, `ob.mode-select`
- **Acceptance criteria:**
  1. Available payment methods are filtered by seller country, currency and provider capability; unsupported options cannot be selected.
  2. Payment confirmation relies on verified, idempotent server webhooks; client redirects alone never mark an order paid.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `ck.payments` (default OFF until verified).

### `ck.shipping-tax` — Shipping rates and taxes

- **Priority:** P0  
- **Group:** Cart, checkout & payments  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Zones, free-shipping threshold  
- **Screens:** Public storefront cart; checkout; order confirmation.  
- **Data required:** Cart/session; customer/contact and address; mode-profile checkout fields; inventory reservation; shipping/tax quotes; payment intents/webhook events.  
- **Dependencies:** `ck.cart-drawer`, `st.store-profile`
- **Acceptance criteria:**
  1. Zones, free-shipping threshold works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `ck.shipping-tax` (default OFF until verified).

### `an.dashboard-cards` — Dashboard cards

- **Priority:** P0  
- **Group:** Analytics  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Cards come from the mode profile  
- **Screens:** Physical Store dashboard; Online Store analytics; channel comparison.  
- **Data required:** Store-scoped orders, line items, products, inventory and channel attribution; mode-profile dashboard definitions.  
- **Dependencies:** `ob.mode-select`, `or.list-filter`
- **Acceptance criteria:**
  1. Cards come from the mode profile works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `an.dashboard-cards` (default OFF until verified).

### `st.store-profile` — Store profile

- **Priority:** P0  
- **Group:** Settings & admin  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Name, logo, contact, currency, timezone  
- **Screens:** Settings workspace; store profile; team and policy pages.  
- **Data required:** Store identity and locale; policies; membership/roles; notification preferences; export/audit records.  
- **Dependencies:** `ob.save-resume`
- **Acceptance criteria:**
  1. Name, logo, contact, currency, timezone works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `st.store-profile` (default OFF until verified).

### `pl.accessibility-performance` — Accessibility AA and performance budget

- **Priority:** P1  
- **Group:** Platform quality  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** LCP under 2.5s on mobile  
- **Screens:** Shared app shell; all feature screens; platform services.  
- **Data required:** Feature-flag registry; RLS policies; validation schemas; rate-limit state; audit/error telemetry; test fixtures.  
- **Dependencies:** `pl.states`
- **Acceptance criteria:**
  1. LCP under 2.5s on mobile works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pl.accessibility-performance` (default OFF until verified).

### `pl.audit-log` — Audit log

- **Priority:** P1  
- **Group:** Platform quality  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Shared app shell; all feature screens; platform services.  
- **Data required:** Feature-flag registry; RLS policies; validation schemas; rate-limit state; audit/error telemetry; test fixtures.  
- **Dependencies:** `pl.security`
- **Acceptance criteria:**
  1. Audit log works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pl.audit-log` (default OFF until verified).

### `pl.monitoring` — Error monitoring and logs

- **Priority:** P1  
- **Group:** Platform quality  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Shared app shell; all feature screens; platform services.  
- **Data required:** Feature-flag registry; RLS policies; validation schemas; rate-limit state; audit/error telemetry; test fixtures.  
- **Dependencies:** `pl.states`
- **Acceptance criteria:**
  1. Error monitoring and logs works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pl.monitoring` (default OFF until verified).

### `ob.logo-upload` — Logo upload with circle crop

- **Priority:** P1  
- **Group:** Seller onboarding  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Skip or add logo  
- **Screens:** Onboarding flow; account verification; store setup.  
- **Data required:** User identity and verification state; onboarding draft/progress; selected mode profile; store slug and store identity.  
- **Dependencies:** `ob.save-resume`
- **Acceptance criteria:**
  1. Skip or add logo works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `ob.logo-upload` (default OFF until verified).

### `ob.setup-checklist` — Setup checklist

- **Priority:** P1  
- **Group:** Seller onboarding  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Dashboard checklist for skipped steps  
- **Screens:** Onboarding flow; account verification; store setup.  
- **Data required:** User identity and verification state; onboarding draft/progress; selected mode profile; store slug and store identity.  
- **Dependencies:** `ob.mode-select`
- **Acceptance criteria:**
  1. Dashboard checklist for skipped steps works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `ob.setup-checklist` (default OFF until verified).

### `pr.bulk-actions` — Bulk actions

- **Priority:** P1  
- **Group:** Products  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Publish, unpublish, price change, delete, categorize  
- **Screens:** Physical Products workspace; product editor; import/export.  
- **Data required:** Store-scoped product records; mode-profile product schema; variants/SKUs; media assets; inventory and publication state.  
- **Dependencies:** `pr.crud`
- **Acceptance criteria:**
  1. Publish, unpublish, price change, delete, categorize works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pr.bulk-actions` (default OFF until verified).

### `pr.categories` — Categories and collections

- **Priority:** P1  
- **Group:** Products  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Manual and rule-based collections  
- **Screens:** Physical Products workspace; product editor; import/export.  
- **Data required:** Store-scoped product records; mode-profile product schema; variants/SKUs; media assets; inventory and publication state.  
- **Dependencies:** `pr.crud`
- **Acceptance criteria:**
  1. Manual and rule-based collections works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pr.categories` (default OFF until verified).

### `pr.csv-import-export` — CSV import and export

- **Priority:** P1  
- **Group:** Products  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Template download, validation report, partial-failure handling  
- **Screens:** Physical Products workspace; product editor; import/export.  
- **Data required:** Store-scoped product records; mode-profile product schema; variants/SKUs; media assets; inventory and publication state.  
- **Dependencies:** `pr.crud`
- **Acceptance criteria:**
  1. Template download, validation report, partial-failure handling works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pr.csv-import-export` (default OFF until verified).

### `sy.auto-unpublish` — Auto-unpublish on delete or archive

- **Priority:** P1  
- **Group:** Physical ↔ Online sync  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Seller is told why  
- **Screens:** Physical Products ↔ Online Store publishing and sync surfaces.  
- **Data required:** Store-scoped physical product and online listing IDs; field ownership/overrides; inventory ledger; idempotency keys; sync events.  
- **Dependencies:** `sy.unpublish`, `sy.sync-log`
- **Acceptance criteria:**
  1. Seller is told why works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sy.auto-unpublish` (default OFF until verified).

### `or.cancel-refund` — Cancel and refund

- **Priority:** P1  
- **Group:** Orders & fulfilment  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Restocks items, records reason  
- **Screens:** Physical Orders workspace; order detail; fulfilment.  
- **Data required:** Store-scoped orders and line items; mode-profile status definitions; customer and fulfilment details; payment/refund state.  
- **Dependencies:** `or.detail-timeline`, `sy.stock-single-source`
- **Acceptance criteria:**
  1. Restocks items, records reason works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `or.cancel-refund` (default OFF until verified).

### `or.delivery-pickup` — Delivery or pickup choice

- **Priority:** P1  
- **Group:** Orders & fulfilment  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** Zones, pickup times  
- **Screens:** Physical Orders workspace; order detail; fulfilment.  
- **Data required:** Store-scoped orders and line items; mode-profile status definitions; customer and fulfilment details; payment/refund state.  
- **Dependencies:** `or.status-flow`, `ob.mode-select`
- **Acceptance criteria:**
  1. Zones, pickup times works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `or.delivery-pickup` (default OFF until verified).

### `or.invoice-packing` — Invoice and packing slip

- **Priority:** P1  
- **Group:** Orders & fulfilment  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Printable / PDF  
- **Screens:** Physical Orders workspace; order detail; fulfilment.  
- **Data required:** Store-scoped orders and line items; mode-profile status definitions; customer and fulfilment details; payment/refund state.  
- **Dependencies:** `or.detail-timeline`
- **Acceptance criteria:**
  1. Printable / PDF works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `or.invoice-packing` (default OFF until verified).

### `cu.list-profile` — Customer list and profile

- **Priority:** P1  
- **Group:** Customers & shopper account  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Orders, spend, notes, tags  
- **Screens:** Customers workspace; shopper account; order tracking.  
- **Data required:** Store-scoped customer identity; shopper auth; order history; consent; addresses; tags and notes.  
- **Dependencies:** `or.detail-timeline`
- **Acceptance criteria:**
  1. Orders, spend, notes, tags works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `cu.list-profile` (default OFF until verified).

### `cu.merge-channels` — One customer across in-store and online

- **Priority:** P1  
- **Group:** Customers & shopper account  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Match by email or phone  
- **Screens:** Customers workspace; shopper account; order tracking.  
- **Data required:** Store-scoped customer identity; shopper auth; order history; consent; addresses; tags and notes.  
- **Dependencies:** `cu.list-profile`, `sy.publish-button`
- **Acceptance criteria:**
  1. Match by email or phone works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `cu.merge-channels` (default OFF until verified).

### `cu.saved-addresses` — Saved addresses and profile

- **Priority:** P1  
- **Group:** Customers & shopper account  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Customers workspace; shopper account; order tracking.  
- **Data required:** Store-scoped customer identity; shopper auth; order history; consent; addresses; tags and notes.  
- **Dependencies:** `cu.shopper-account`
- **Acceptance criteria:**
  1. Saved addresses and profile works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `cu.saved-addresses` (default OFF until verified).

### `sf.reviews` — Reviews and ratings

- **Priority:** P1  
- **Group:** Storefront & design  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Moderation by seller  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `sf.product-page`, `cu.shopper-account`
- **Acceptance criteria:**
  1. Moderation by seller works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sf.reviews` (default OFF until verified).

### `sf.seo-og` — SEO, Open Graph, sitemap

- **Priority:** P1  
- **Group:** Storefront & design  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `sf.product-page`, `sf.subdomain-domain`
- **Acceptance criteria:**
  1. SEO, Open Graph, sitemap works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sf.seo-og` (default OFF until verified).

### `ck.discount-codes` — Discount codes

- **Priority:** P1  
- **Group:** Cart, checkout & payments  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Percent or fixed, expiry, limits  
- **Screens:** Public storefront cart; checkout; order confirmation.  
- **Data required:** Cart/session; customer/contact and address; mode-profile checkout fields; inventory reservation; shipping/tax quotes; payment intents/webhook events.  
- **Dependencies:** `ck.cart-drawer`
- **Acceptance criteria:**
  1. Percent or fixed, expiry, limits works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `ck.discount-codes` (default OFF until verified).

### `ck.mode-fields` — Mode-specific checkout fields

- **Priority:** P1  
- **Group:** Cart, checkout & payments  
- **Availability:** `mode-specific`  
- **Status:** `todo`  
- **Catalog description:** From the mode profile  
- **Screens:** Public storefront cart; checkout; order confirmation.  
- **Data required:** Cart/session; customer/contact and address; mode-profile checkout fields; inventory reservation; shipping/tax quotes; payment intents/webhook events.  
- **Dependencies:** `ck.guest-and-account`, `ob.mode-select`
- **Acceptance criteria:**
  1. From the mode profile works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. All mode-dependent options are read from the active mode profile; a missing or invalid profile fails closed with a clear setup error rather than silently falling back to Normal Business.
- **Feature flag:** `ck.mode-fields` (default OFF until verified).

### `mk.announcement-bar` — Announcement bar

- **Priority:** P1  
- **Group:** Marketing  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Store Studio marketing sections; campaign/share surfaces.  
- **Data required:** Store-scoped content/settings; theme section configuration; subscriber consent; share metadata and public store URL.  
- **Dependencies:** `sf.theme-editor`
- **Acceptance criteria:**
  1. Announcement bar works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `mk.announcement-bar` (default OFF until verified).

### `mk.share-qr` — Share link, QR code, social share

- **Priority:** P1  
- **Group:** Marketing  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Store Studio marketing sections; campaign/share surfaces.  
- **Data required:** Store-scoped content/settings; theme section configuration; subscriber consent; share metadata and public store URL.  
- **Dependencies:** `sf.subdomain-domain`
- **Acceptance criteria:**
  1. Share link, QR code, social share works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `mk.share-qr` (default OFF until verified).

### `an.channel-compare` — In-store vs online comparison

- **Priority:** P1  
- **Group:** Analytics  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Physical Store dashboard; Online Store analytics; channel comparison.  
- **Data required:** Store-scoped orders, line items, products, inventory and channel attribution; mode-profile dashboard definitions.  
- **Dependencies:** `sy.stock-single-source`, `an.sales-chart`
- **Acceptance criteria:**
  1. In-store vs online comparison works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `an.channel-compare` (default OFF until verified).

### `an.sales-chart` — Sales chart

- **Priority:** P1  
- **Group:** Analytics  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** By day, week, month  
- **Screens:** Physical Store dashboard; Online Store analytics; channel comparison.  
- **Data required:** Store-scoped orders, line items, products, inventory and channel attribution; mode-profile dashboard definitions.  
- **Dependencies:** `an.dashboard-cards`, `or.detail-timeline`
- **Acceptance criteria:**
  1. By day, week, month works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `an.sales-chart` (default OFF until verified).

### `st.policies` — Policy pages

- **Priority:** P1  
- **Group:** Settings & admin  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Shipping, returns, privacy, terms  
- **Screens:** Settings workspace; store profile; team and policy pages.  
- **Data required:** Store identity and locale; policies; membership/roles; notification preferences; export/audit records.  
- **Dependencies:** `st.store-profile`, `sf.subdomain-domain`
- **Acceptance criteria:**
  1. Shipping, returns, privacy, terms works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `st.policies` (default OFF until verified).

### `st.roles` — Roles and team

- **Priority:** P1  
- **Group:** Settings & admin  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Owner, Manager, Cashier, Online fulfilment  
- **Screens:** Settings workspace; store profile; team and policy pages.  
- **Data required:** Store identity and locale; policies; membership/roles; notification preferences; export/audit records.  
- **Dependencies:** `pl.security`, `st.store-profile`
- **Acceptance criteria:**
  1. Owner, Manager, Cashier, Online fulfilment works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `st.roles` (default OFF until verified).

### `pr.seo-fields` — Product SEO fields

- **Priority:** P2  
- **Group:** Products  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Title, description, URL handle, share image  
- **Screens:** Physical Products workspace; product editor; import/export.  
- **Data required:** Store-scoped product records; mode-profile product schema; variants/SKUs; media assets; inventory and publication state.  
- **Dependencies:** `pr.crud`
- **Acceptance criteria:**
  1. Title, description, URL handle, share image works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `pr.seo-fields` (default OFF until verified).

### `or.internal-notes` — Internal order notes and tags

- **Priority:** P2  
- **Group:** Orders & fulfilment  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Physical Orders workspace; order detail; fulfilment.  
- **Data required:** Store-scoped orders and line items; mode-profile status definitions; customer and fulfilment details; payment/refund state.  
- **Dependencies:** `or.detail-timeline`
- **Acceptance criteria:**
  1. Internal order notes and tags works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `or.internal-notes` (default OFF until verified).

### `cu.wishlist` — Wishlist

- **Priority:** P2  
- **Group:** Customers & shopper account  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Customers workspace; shopper account; order tracking.  
- **Data required:** Store-scoped customer identity; shopper auth; order history; consent; addresses; tags and notes.  
- **Dependencies:** `cu.shopper-account`, `pr.draft-publish`
- **Acceptance criteria:**
  1. Wishlist works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `cu.wishlist` (default OFF until verified).

### `sf.custom-css-js` — Custom CSS and sandboxed JS

- **Priority:** P2  
- **Group:** Storefront & design  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** CSS sanitized; JS only inside sandboxed iframe  
- **Screens:** Online Store workspace; Store Studio; template gallery; visual editor; public storefront.  
- **Data required:** Store-scoped versioned JSON templates; mode profile; registered section/block schemas; theme tokens; product/collection data; draft/published versions.  
- **Dependencies:** `sf.theme-editor`, `pl.security`
- **Acceptance criteria:**
  1. CSS sanitized; JS only inside sandboxed iframe works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `sf.custom-css-js` (default OFF until verified).

### `ck.abandoned-cart` — Abandoned cart reminder

- **Priority:** P2  
- **Group:** Cart, checkout & payments  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Public storefront cart; checkout; order confirmation.  
- **Data required:** Cart/session; customer/contact and address; mode-profile checkout fields; inventory reservation; shipping/tax quotes; payment intents/webhook events.  
- **Dependencies:** `ck.guest-and-account`, `ck.payments`
- **Acceptance criteria:**
  1. Abandoned cart reminder works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `ck.abandoned-cart` (default OFF until verified).

### `mk.banners` — Promo banners and sale badges

- **Priority:** P2  
- **Group:** Marketing  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Store Studio marketing sections; campaign/share surfaces.  
- **Data required:** Store-scoped content/settings; theme section configuration; subscriber consent; share metadata and public store URL.  
- **Dependencies:** `sf.theme-editor`
- **Acceptance criteria:**
  1. Promo banners and sale badges works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `mk.banners` (default OFF until verified).

### `mk.newsletter` — Newsletter signup and list

- **Priority:** P2  
- **Group:** Marketing  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Export  
- **Screens:** Store Studio marketing sections; campaign/share surfaces.  
- **Data required:** Store-scoped content/settings; theme section configuration; subscriber consent; share metadata and public store URL.  
- **Dependencies:** `sf.theme-editor`, `pl.security`
- **Acceptance criteria:**
  1. Export works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `mk.newsletter` (default OFF until verified).

### `an.top-products` — Top products and sources

- **Priority:** P2  
- **Group:** Analytics  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Physical Store dashboard; Online Store analytics; channel comparison.  
- **Data required:** Store-scoped orders, line items, products, inventory and channel attribution; mode-profile dashboard definitions.  
- **Dependencies:** `an.sales-chart`, `pr.crud`
- **Acceptance criteria:**
  1. Top products and sources works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `an.top-products` (default OFF until verified).

### `st.data-export` — Data export

- **Priority:** P2  
- **Group:** Settings & admin  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Screens:** Settings workspace; store profile; team and policy pages.  
- **Data required:** Store identity and locale; policies; membership/roles; notification preferences; export/audit records.  
- **Dependencies:** `pl.security`, `st.store-profile`
- **Acceptance criteria:**
  1. Data export works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `st.data-export` (default OFF until verified).

### `st.notifications` — Notification settings

- **Priority:** P2  
- **Group:** Settings & admin  
- **Availability:** `all-modes`  
- **Status:** `todo`  
- **Catalog description:** Email and push  
- **Screens:** Settings workspace; store profile; team and policy pages.  
- **Data required:** Store identity and locale; policies; membership/roles; notification preferences; export/audit records.  
- **Dependencies:** `st.store-profile`, `or.notifications`
- **Acceptance criteria:**
  1. Email and push works end-to-end using persisted, store-scoped data and server-side validation.
  2. The user can complete the primary action, recover from an invalid or interrupted attempt, and see the resulting state reflected consistently in connected workspaces.
  3. Behavior is identical across modes unless the catalog explicitly identifies a mode-specific extension.
- **Feature flag:** `st.notifications` (default OFF until verified).

## Global completion gate

- Loading, empty, error and success states exist and are tested, including permission-denied, offline/slow-network and retry paths where relevant.
- Layout and interaction pass at 390px viewport and desktop; no horizontal overflow, clipped controls or unreachable actions.
- Keyboard operation, focus visibility, accessible names, semantic structure and WCAG AA contrast are verified.
- Unit/integration/E2E tests cover happy paths, validation, failure paths, tenant isolation and idempotency where applicable.
- Feature flag is OFF by default and enabled only after review evidence is recorded.
- No production deployment occurs without explicit user approval.
