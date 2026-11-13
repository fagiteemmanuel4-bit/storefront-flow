# Strap Online Store — Delivery Plan

> Planning only. No application code, schema migrations, production data, or deployment has been changed.

## Product boundaries

- **Physical Store workspace:** POS, physical product operations and stocktaking stay focused on in-person work.
- **Online Store workspace:** Store Studio, JSON templates, sections/blocks, storefront preview, publishing, customer ordering and online fulfilment live in a distinct workspace.
- **Shared domain services:** one store-scoped inventory source, shared customer identity where permitted, and shared orders/notifications through explicit service contracts. Neither workspace becomes a visual subpage of the other.
- **Normal Business first:** mode-specific behavior is supplied by the mode profile. Other business modes are added by profile/catalog data, not by branching UI code.
- **No production deploy without explicit approval.**

## Blocking inputs before implementation

1. Add/confirm `modes/normal-business.mode.json` (and profile schema) in the repository. The current main branch has no mode profile file, while the feature catalog requires it. Do not start mode-dependent feature implementation until it is supplied and reviewed.
2. Confirm the JSON templates already prepared by the user; treat them as samples to improve, not production-ready designs or schemas.
3. Confirm template preview content can use generated/demo fixture data only and must not expose real seller/customer data.

## Milestone sequencing

Milestones are small and gated. Work on one milestone at a time. After each milestone, update each feature status in the JSON (`todo` → `in-progress` → `done`), report what works and what was tested, and wait for the user’s explicit “go” before starting the next milestone. No milestone is marked done on appearance alone.

### Foundation order (P0 first)

| Sequence | Milestone | Features | Exit condition |
|---:|---|---|---|
| F0 | Platform safety and feature control | `pl.states`, `pl.security`, `pl.feature-flags` | Feature registry/flags, tenant boundaries and lifecycle state patterns tested; no unfinished flag enabled. |
| F1 | Seller onboarding | `ob.email-verify`, `ob.save-resume`, `ob.slug-check`, `ob.mode-select` | Verified seller can resume setup, choose a validated mode profile and reserve a unique store link. |
| F2 | Product foundation | `pr.crud`, `pr.images`, `pr.variants`, `pr.mode-fields`, `pr.draft-publish` | Normal Business product CRUD/media/variants/fields and online visibility pass; variants/fields require the profile. |
| F3 | Physical ↔ Online sync | `sy.publish-button`, `sy.import-from-store`, `sy.unpublish`, `sy.field-overrides`, `sy.stock-single-source`, `sy.sync-log` | Publishing, import, override reset and inventory concurrency are idempotent and cannot oversell. |
| F4 | Orders and fulfilment | `or.list-filter`, `or.status-flow`, `or.detail-timeline`, `or.notifications` | Order lifecycle comes from the mode profile; order detail and customer notifications pass. |
| F5 | Online storefront foundation | `sf.template-gallery`, `sf.theme-editor`, `sf.section-editor`, `sf.draft-publish-versions`, `sf.subdomain-domain`, `sf.search-filter-sort`, `sf.product-page`, `sf.preview-responsive`, `sf.template-library` | Mode-filtered templates render in safe preview; section/theme editing is draft-only until validated; public store pages resolve correctly. |
| F6 | Checkout and shopper experience | `cu.shopper-account`, `cu.order-tracking`, `ck.cart-drawer`, `ck.guest-and-account`, `ck.shipping-tax`, `ck.payments` | Guest/account ordering, stock reservation, shipping/tax and verified payment lifecycle pass end-to-end. |
| F7 | Remaining P0 readiness | `pl.e2e-tests` | Critical seller/shopper E2E, failure recovery and tenant isolation pass. |
| F8 | P1 onboarding/product/order/customer expansion | `ob.logo-upload`, `ob.setup-checklist`, `pr.categories`, `pr.bulk-actions`, `pr.csv-import-export`, `or.invoice-packing`, `or.cancel-refund`, `or.delivery-pickup`, `cu.list-profile`, `cu.merge-channels`, `cu.saved-addresses` | Seller setup, catalog management, fulfilment and customer management enhancements pass. |
| F9 | P1 storefront/marketing/analytics/admin | `sf.reviews`, `sf.seo-og`, `mk.announcement-bar`, `mk.share-qr`, `an.sales-chart`, `an.channel-compare`, `st.policies`, `st.roles`, `pl.audit-log`, `pl.monitoring`, `pl.accessibility-performance` | Store discovery, reporting, policy/team controls and platform quality pass. |
| F10 | P2 enhancements | `pr.seo-fields`, `or.internal-notes`, `cu.wishlist`, `sf.custom-css-js`, `ck.abandoned-cart`, `mk.newsletter`, `mk.banners`, `an.top-products`, `st.notifications`, `st.data-export` | Optional capabilities pass security, usability and performance gates before enablement. |

## Dependency and implementation rules

- Respect the dependency list in `FEATURES.md`; do not start a feature before its dependencies are verified.
- Priorities are strict: all P0 milestones precede P1; all P1 precede P2. Within that, preserve foundation → products → sync → orders → storefront → checkout.
- Where a dependency crosses priority tiers, the dependent feature stays blocked until the dependency is complete, even if that means reordering within a tier.
- Keep all features behind their exact ID flags. Do not add broad flags that bypass individual feature completion.
- JSON is declarative configuration only. Validate against a versioned schema; render only registered section/block types. Never execute arbitrary JSON, scripts or untrusted component names.
- Keep templates, sections, blocks, settings, assets and published versions store-scoped and versioned. Preview uses isolated draft data and never mutates the live storefront.
- Physical Store and Online Store remain separate workspaces. Sync through shared services/events with idempotency, audit logs and explicit conflict rules.
- Use container queries, CSS Grid and fluid sizing where supported; provide `@supports` fallbacks. Prefer native CSS transitions/view transitions and browser-native controls when compatible. Avoid dependencies without a verified capability gap.
- Build and test responsive behavior at 390px and desktop for every milestone. Do not claim `done` before all lifecycle states and tests pass.

## Proposed catalog additions

- `sf.preview-responsive` — dedicated Store Studio previewer with desktop/tablet/mobile viewport switching, zoom/fit, page/route preview, and isolated draft preview.
- `sf.template-library` — expanded, mode-profile-filtered template library with curated template families, style/use-case tags, version/compatibility metadata and richer previews.

## Release gates

1. Feature-level acceptance criteria pass.
2. Loading/empty/error/success states pass.
3. 390px and desktop visual/interaction checks pass.
4. Automated tests, security review and tenant-isolation tests pass.
5. Feature flag remains OFF until verified and explicitly reviewed.
6. User approves production release; otherwise no Vercel production deployment.
