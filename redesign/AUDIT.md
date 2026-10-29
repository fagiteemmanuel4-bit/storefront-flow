# Strap redesign — Phase 0 audit

**Repository:** `fagiteemmanuel4-bit/storefront-flow`  
**Audited ref:** `main` (tree SHA `86bdefc8dc3a5d348465271708d0c3f7c2b610c0`)  
**Audit branch:** `redesign/phase-0-audit`  
**Scope:** inspection only. No application source, styles, routes, data, APIs, permissions, or runtime behavior changed.

## 1. Stack and architecture

- **Framework:** React 19 + TypeScript, powered by TanStack Start and TanStack Router.
- **Build/dev:** Vite 8 with the Lovable TanStack config wrapper; package scripts expose `dev`, `build`, `preview`, and `lint`.
- **Server/runtime:** TanStack Start with Nitro; `src/routes/__root.tsx` is the root route and global document shell.
- **Routing:** TanStack Router file-based routes. Authenticated merchant pages live beneath `src/routes/_authenticated/route.tsx`, whose `beforeLoad` verifies the Supabase user and email verification status. The route guard also applies plan access checks. Public, customer storefront, tracking, auth and legal pages are separate route files.
- **Data/auth:** Supabase Auth + PostgreSQL, accessed through the Supabase clients and React Query. The repository README documents row-level tenant isolation and migrations under `supabase/migrations`.
- **Styling:** Tailwind CSS v4 through `@tailwindcss/vite`, CSS variables and custom utilities in `src/styles.css`, plus several global CSS layers. Existing styles are imported by `src/routes/__root.tsx`: `styles.css`, `landing-modern.css`, `kudi-modern.css`, `mobile-native.css`, `mobile-nav.css`, `strap-design-system.css`, `strap-loading-overrides.css`, and `strap-mobile-density.css` (with `landing-hero.css` also present in the source tree).
- **Component system:** shadcn/ui (New York style) with locally-owned Radix UI primitives under `src/components/ui/`; Tailwind class composition uses `clsx`, `tailwind-merge`, and `class-variance-authority`. Icons use `lucide-react`. Charts use Recharts. Notifications use Sonner. Table support includes TanStack Table and a local virtualized table.
- **State/data fetching:** React hooks + TanStack Query; existing providers include `StoreProvider` and `ThemeProvider`. Preserve this architecture.
- **Deployment:** Vercel project `storefront-flow` was previously confirmed in the connected Vercel account. This audit does not change deployment configuration.

## 2. Current styling and theme findings

The app already has a deliberate light/dark token system in `src/styles.css`, including semantic background/foreground/surface/card/popover/primary/secondary/muted/accent/success/warning/destructive/border/input/ring/sidebar variables. It currently uses Space Grotesk for display headings and Inter for body text. The current accent is a warm amber/yellow OKLCH value, not the redesign kit's electric lime.

There are additional global overrides and app-specific layers:
- `src/kudi-modern.css`
- `src/mobile-native.css`
- `src/mobile-nav.css`
- `src/strap-design-system.css`
- `src/strap-loading-overrides.css`
- `src/strap-mobile-density.css`
- `src/landing-modern.css`
- `src/landing-hero.css`

This means Phase 1 must be a controlled token translation and cascade review, not simply appending the kit's raw CSS. The project already has a `docs/STRAP_DESIGN_SYSTEM.md`; compare it against the attached kit before deciding what remains authoritative. Preserve intentional public-store and dark-mode behavior unless the approved scope explicitly covers it.

## 3. Route and screen inventory

The following route files exist on the audited `main` tree. Dynamic segments are shown literally.

### Auth, onboarding and account
- `/auth` — sign-in and account-entry flow (the auth page contains the existing sign-in/sign-up mode handling).
- `/signup` — account creation route.
- `/verify-email` — eight-digit email OTP verification.
- `/verified` — verified/confirmation destination.
- `/email-confirmed` — email confirmation destination.
- `/onboarding` — merchant/store onboarding.
- `/profile` — user profile.
- `/staff-login/$slug` — staff PIN/login entry.

### Authenticated workspace
- `/dashboard` — business overview.
- `/pos` — point of sale/register.
- `/unit-sale` — unit/pack sale workflow.
- `/products` — product catalogue.
- `/product-import` — product import.
- `/customers` — customer management.
- `/expenses` — expense management.
- `/reports` — business reports.
- `/insights` — operational insights.
- `/command-center` — command/operations center.
- `/activity` — activity history.
- `/notifications` — notifications.
- `/branches` — branch management.
- `/staff` — team and staff management.
- `/hardware` — hardware and scanner/printer setup.
- `/stock-sense` — stock-sheet/image-assisted inventory entry.
- `/extensions` — software extensions/integrations.
- `/feature-discovery` — feature discovery.
- `/help` — in-app help.
- `/upgrade` — plan upgrade/billing entry.
- `/receipt-designer` — receipt design preview/settings.
- `/store-editor` — store editor.
- `/electronics-workspace` — electronics business-mode workspace.
- `/fashion-returns` — fashion returns workflow.
- `/food-service` — food-service/kitchen workspace.
- `/grocery-inventory` — grocery/batch/expiry inventory workspace.

### Online store workspace
- `/online-store` — online-store overview.
- `/online-store/setup` — storefront setup.
- `/online-store/builder` — storefront builder.
- `/online-store/advanced-editor` — advanced storefront editor.
- `/online-store/catalog` — online catalogue.
- `/online-store/orders` — online order management.

### Settings
- `/settings` — settings shell/home.
- `/settings/store-profile` — store identity/profile.
- `/settings/appearance` — appearance.
- `/settings/checkout` — checkout and sales behavior.
- `/settings/inventory` — inventory preferences.
- `/settings/notifications` — notification preferences.
- `/settings/online-store` — online-store preferences.
- `/settings/password` — password change.
- `/settings/payments` — payment settings.
- `/settings/receipts` — receipt settings.
- `/settings/security` — security.
- `/settings/sessions` — active sessions.
- `/settings/sessions/revoke` — session revocation.
- `/settings/staff` — staff and permissions.

### Public, legal, customer and storefront routes
- `/` — public landing page.
- `/about`, `/partners`, `/docs`, `/support` — public company/product/help pages.
- `/privacy`, `/terms`, `/cookies` — legal pages.
- `/admin` — admin surface.
- `/customer-account` — customer account access.
- `/store/$slug` — public storefront.
- `/store/$slug/category/$category` — storefront category.
- `/store/$slug/products/$productSlug` — public product detail.
- `/track/$token` — customer order tracking.

**Inventory note:** route files are the verified screen-level inventory. Some features are conditional panels or mode-specific sections within a route rather than separate routes. The route list should be checked against the generated TanStack route tree and live role/plan states during the module migrations.

## 4. Shared components already present

### App shell and global workspace
- `src/components/shell/AppShell.tsx` — desktop sidebar, workspace header, store/branch context, online/offline state, queued offline sales, app menu, updates/security overlays and calculator entry points.
- `src/components/shell/MobileNav.tsx` — existing four-slot mobile dock (Sell, Products, Search, Menu).
- `src/components/shell/AppMenuSheet.tsx` — role-aware app menu and secondary destinations.
- `StoreProvider.tsx`, `ThemeProvider.tsx`, `QuickFind.tsx`, `RouteLoadingOverlay.tsx`, `NotFoundScreen.tsx`, `UpdatesSheet.tsx`, `WelcomeTour.tsx`, `FirstVisitTour.tsx`, `PreferencesDialog.tsx`, `StoreSettingsDialog.tsx`, `DeleteStoreDialog.tsx`, `ExportDataDialog.tsx`.

### Domain components
- POS: `ProductFormDialog.tsx`, `ProductImportDialog.tsx`, `BarcodeScannerDialog.tsx`, `BusinessCalculatorFab.tsx`.
- Expenses: `AddExpenseSheet.tsx`.
- Security: `SecurityModal.tsx`.
- Settings: `SettingsShell.tsx`, `SettingsCenter.tsx`, `SettingsPrimitives.tsx`, `StaffManager.tsx`, `PasswordOtp.tsx`, `PaymentsSettingsPage.tsx`, `AppearanceSettingsPage.tsx`, `OnlineStoreSettingsPage.tsx`, `CustomDomainsPanel.tsx`, `RevokeSessionsPage.tsx`, `CheckoutSettingsFrame.tsx`.
- Commerce: `CommerceFeatureNotice.tsx`, `FeatureStatusBadge.tsx`, `PremiumUpsellBanner.tsx`.
- Data: `VirtualDataTable.tsx`.
- Public storefront/site: `SiteChrome.tsx`, `LandingHeader.tsx`, `LandingDetails.tsx`, `LandingMedia.tsx`, `LandingUpgrades.tsx`, `PricingSection.tsx`, `StoreCustomerAccess.tsx`, `StoreFeedbackFloating.tsx`, `StrapReviewPrompt.tsx`.

### Existing UI primitive library
The `src/components/ui/` directory contains local shadcn/Radix wrappers for: accordion, alert-dialog, alert, aspect-ratio, avatar, badge, bottom-sheet, breadcrumb, button, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, form, hover-card, input-otp, input, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toggle-group, toggle and tooltip.

## 5. Modal, sheet, drawer and overlay inventory

### Shared overlays/components confirmed in the source tree
- App menu: `AppMenuSheet` (Sheet).
- App updates: `UpdatesSheet` (Sheet).
- Product create/edit: `ProductFormDialog` (BottomSheet).
- Product import: `ProductImportDialog` (dialog/sheet flow).
- Barcode/QR camera scanner: `BarcodeScannerDialog` (BottomSheet).
- Add/edit expense: `AddExpenseSheet` (sheet).
- Security verification: `SecurityModal`.
- Store deletion: `DeleteStoreDialog`.
- Data export: `ExportDataDialog`.
- Store preferences/settings: `PreferencesDialog`, `StoreSettingsDialog`.
- First-visit and welcome tours: `FirstVisitTour`, `WelcomeTour`.
- Quick find/search: `QuickFind` (command/dialog interaction).
- Settings navigation and mobile menu: settings shell navigation sheet/menu.
- Toast/sonner notification viewport: globally mounted from the root route.

### Route-owned overlays confirmed or indicated by route imports/state
- Branch creation/editing flow in `branches.tsx`.
- Expense create/edit and delete confirmation in `expenses.tsx`.
- Customer create/edit/detail actions in `customers.tsx`.
- Staff invitation, access/PIN and role management in `staff.tsx` and `SettingsCenter.tsx`.
- Receipt designer controls in `receipt-designer.tsx`.
- Hardware connection/permission flows in `hardware.tsx`.
- POS sale/checkout, customer selection, discount/payment, scanner and product creation/editing in `pos.tsx` and its child components.
- Storefront setup, catalogue, builder/editor, order actions and domain management across `online-store/*`, `store-editor.tsx`, and `CustomDomainsPanel.tsx`.
- Security, password OTP and session revocation flows across settings routes.

**Important audit boundary:** this is a static source inventory. A modal/sheet may be conditionally rendered inside a large route component or behind a feature flag. Before Phase 3/4 touches a module, inspect that module's complete JSX and enumerate every open state, confirmation, nested sheet, empty/error/loading state and role-gated action. Do not assume the component list above is the entire set of runtime overlay states.

## 6. Navigation and access constraints

The current app shell is more complex than the new reference:
- Desktop `AppShell` builds primary and secondary navigation and changes the primary destinations by business mode (fashion, electronics, food service, grocery).
- The existing mobile dock has four slots, but Search and Menu are buttons that activate existing header controls. It is not yet the exact reference implementation.
- `AppMenuSheet` already contains role-aware destinations and actions.
- Staff session navigation is filtered by role and includes a default-route redirect. The authenticated route guard and plan access checks must remain unchanged.
- Branch/store switching, offline sale queue and online/offline indicators are part of the shell and must not be lost when the visual shell changes.

## 7. Phase 1 expected files (proposal only; no changes made)

1. `src/styles.css` — add the Strap redesign semantic tokens into the existing Tailwind v4 `@theme inline`/CSS-variable model, without deleting the current theme contract or breaking dark mode.
2. `src/routes/__root.tsx` — adjust font stylesheet/preconnect declarations only if needed; it already centralizes global stylesheet and font loading.
3. `public/brand/logo-mark.svg`, `public/brand/logo-mark-inverse.svg`, `public/brand/logo-wordmark.svg` — add the three supplied SVG assets under a predictable public path.
4. Possibly `src/strap-design-system.css` — only if the existing design-system layer is the cleanest place for the new token aliases; first inspect its current selectors and cascade. Prefer a single canonical token source rather than duplicating values.
5. `redesign/` documentation files — audit and feature map only.

No route component, data hook, API client, database migration, auth logic, permission helper, printer output or scanner implementation should be part of Phase 1.

## 8. Phases 1–5 plan for this codebase

### Phase 1 — Tokens and base
- Translate the kit tokens into the existing Tailwind v4/CSS-variable system.
- Map semantic aliases used by shadcn/Radix primitives (background, foreground, card, popover, primary, secondary, muted, accent, destructive, success, warning, border, input, ring, sidebar) to the new palette.
- Load Bricolage Grotesque for display and retain Inter for body/UI; verify font loading does not introduce layout/functional changes.
- Add the supplied logo assets under `public/brand/`; do not replace current assets until usages are identified.
- Preserve existing dark mode, storefront theming, print styles, reduced motion, focus states and all global override behavior.
- Limit visual change to the agreed fonts and page background/base token layer. Capture before/after screenshots at 360/390/768/1280.

### Phase 2 — Shared components
- Update local shadcn/Radix wrappers in place where possible: button, input/password affordance, badge/chip, card, table, bottom-sheet, toast and empty-state patterns.
- Reuse existing `button.tsx`, `input.tsx`, `badge.tsx`, `card.tsx`, `table.tsx`, `bottom-sheet.tsx`, `sheet.tsx`, `sonner.tsx` and existing empty-state patterns before creating new primitives.
- Add a non-production component preview route/story in a documented location; keep it outside normal customer navigation and ensure no production feature behavior changes.

### Phase 3 — Priority screens
1. Auth: `auth.tsx`, `signup.tsx`, `verify-email.tsx` (plus confirmation routes if required). Preserve current Supabase auth, password validation, email OTP, resend cooldown, success/error states and redirect behavior.
2. App shell: `AppShell.tsx`, `MobileNav.tsx`, `AppMenuSheet.tsx` and shell CSS. Preserve mode-dependent nav, role filtering, store/branch switching, offline queue, quick search, notifications, security, updates and all destinations. Map every old destination to a visible tab, Menu entry or desktop sidebar item.
3. Dashboard: `dashboard.tsx`.
4. Sell: `pos.tsx`, existing scanner/product form/calculator/checkout components. Preserve scanning, keyboard wedge, camera, stock checks, discounts, customers, wholesale/pack pricing, payment, offline sale and receipt behavior.
5. Products: `products.tsx`, product form/import components; preserve product images, categories, SKUs/barcodes, shelves, variants, stock thresholds and import.
6. Search: existing `QuickFind` and its shell trigger; there is no standalone Search route in the current route inventory.

### Phase 4 — Remaining modules, one at a time
- Orders: `online-store/orders.tsx`, order tracking/public order pages and order status actions.
- Customers: `customers.tsx`, `customer-account.tsx`.
- Expenses: `expenses.tsx`, `AddExpenseSheet.tsx`.
- Reports/insights: `reports.tsx`, `insights.tsx`, `command-center.tsx`.
- Stock: `stock-sense.tsx`, `grocery-inventory.tsx`, `product-import.tsx`, product inventory sections and inventory settings.
- Online store and modes: `online-store/*`, `store-editor.tsx`, public `store/$slug*`, plus electronics/fashion/food/grocery mode workspaces.
- Wholesale/pack sales: `unit-sale.tsx`, POS pack pricing and related product/checkout sections. Wholesale appears to be a capability inside existing workflows, not a distinct top-level route; confirm exact live entry points before styling.
- Team/roles: `staff.tsx`, `settings/staff.tsx`, role-aware shell/menu states and staff login.
- Branches: `branches.tsx`, branch selector/context in shell and inventory/POS.
- Receipt designer: `receipt-designer.tsx`, `settings/receipts.tsx`. Keep actual print output untouched.
- Hardware/scanners: `hardware.tsx`, `BarcodeScannerDialog.tsx`, hardware helpers. Preserve device APIs and keyboard capture.
- Integrations/extensions: `extensions.tsx`, extension components and integration settings.
- Settings: all `settings/*` routes, `SettingsCenter`, `SettingsShell` and settings child components.
- Billing/help: `upgrade.tsx`, `help.tsx`, `support.tsx`, `docs.tsx`.

### Phase 5 — QA and cleanup
- Run the existing production build, lint and TypeScript check (add a type-check script only if absent and only with approval).
- Exercise 360, 390, 768 and 1280 px for each migrated screen; check safe-area insets, fixed nav/cart spacing, scroll containment and table overflow.
- Check keyboard focus, labels, screen-reader announcements, WCAG AA contrast and 44px minimum touch targets.
- Regression-check auth, role/plan gating, branch switching, offline sales, scanner/camera/keyboard wedge, payment/discount/customer/wholesale checkout, receipts/printing, exports, integrations and public storefront.
- Remove only styles proven unused after a reference scan; do not delete legacy selectors that are still consumed by conditional routes or modes.
- Report tests and manual checks separately; do not claim unrun checks passed.

## 9. Assumptions and open questions

### Assumptions
- The connected repository `fagiteemmanuel4-bit/storefront-flow` is the Strap source of truth; README confirms Strap by Kryonara and the package/deployment context matches the app.
- The attached reference HTML is a visual specification only. Its sample content and implementation are not to be copied into production.
- Existing route names and feature gates are canonical; the new navigation must adapt around them rather than rename or remove routes.
- Phase 0 documentation may be committed separately without touching application code. To avoid changing the Lovable-connected `main` branch, this audit is being recorded on `redesign/phase-0-audit`.

### Questions (maximum 3)
1. Please confirm that `fagiteemmanuel4-bit/storefront-flow` is the exact Strap repository you want redesigned (rather than another Strap-related repo).
2. Should the new palette replace the existing dark theme too, or should the current dark-mode preference remain supported with a mapped dark palette?
3. Should the 26 reference marketing/app HTML pages be treated as in-scope redesign targets, or are they visual guidance only while we restyle the actual production routes listed above?


## 10. Attached reference HTML review

All three primary reference files and all 26 files under `reference/marketing-pages/` were opened and reviewed for page title, heading hierarchy and page intent. The primary approved app references are:
- `reference/login.html` and `reference/verify.html` — split auth panel, login, eight-digit verification and verified state.
- `reference/dashboard.html` — dashboard, Sell, Products, Search, Menu, cart bar, product form and sale sheet.

The 26 marketing/app reference pages reviewed are:
`index.html`, `about.html`, `contact.html`, `features.html`, `pricing.html`, `login.html`, `signup.html`, `forgot-password.html`, `dashboard.html`, `register.html`, `products.html`, `stock.html`, `orders.html`, `customers.html`, `expenses.html`, `reports.html`, `online-store.html`, `team.html`, `branches.html`, `receipts.html`, `hardware.html`, `settings.html`, `billing.html`, `help-centre.html`, `privacy.html`, and `terms.html`.

They are treated as a visual target, not production source. The references contain sample/demo content; real labels, data, plan names, routes and capabilities must continue to come from the existing app.
