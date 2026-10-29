# Strap open-source stack audit

Updated: 2026-08-30

This document records the open-source candidates reviewed against Strap's current React + TypeScript + TanStack Start/Router/Query + Supabase architecture.

## Approved and already integrated

| Project | License | Decision | Use in Strap |
| --- | --- | --- | --- |
| [cmdk](https://github.com/dip/cmdk) | MIT | Approved | Global Quick Find / command navigation |
| [Radix Primitives](https://github.com/radix-ui/primitives) | MIT | Approved | Accessible interaction primitives already used throughout the app |
| [Recharts](https://github.com/recharts/recharts) | MIT | Approved | Business analytics visualization where charts add operational value |
| [Zod](https://github.com/colinhacks/zod) | MIT | Approved | Runtime validation at application boundaries |
| [React Hook Form](https://github.com/react-hook-form/react-hook-form) | MIT | Approved | Existing complex form workflows |

## Approved for targeted future use

| Project | License | Decision | Reason |
| --- | --- | --- | --- |
| [TanStack Table](https://github.com/TanStack/table) | MIT | Approved | Product/order/customer grids, server-side sorting/filtering and bulk operations |
| [TanStack Virtual](https://github.com/TanStack/virtual) | MIT | Approved | Large catalogues and operational lists once measured list sizes justify virtualization |
| [TanStack Form](https://github.com/TanStack/form) | MIT | Approved | Future migration of the highest-value complex forms where it materially improves validation/state handling |
| [dnd-kit](https://github.com/clauderic/dnd-kit) | MIT | Approved | Storefront/category ordering and other workflows where drag-and-drop is genuinely better than forms |

## Not added blindly

PostHog was not added to the application bundle during this pass. Its repository is mixed-license: core content is MIT while the `ee/` directory is governed by a separate license. Product analytics should be introduced only after deciding whether Strap will use the hosted service or a self-hosted deployment and documenting the applicable license boundary.

Likewise, no POS application was copied into Strap. Open-source POS projects are useful architectural references for offline queues, barcode workflows and receipt handling, but copying an entire application would conflict with Strap's existing TanStack/Supabase architecture and create unnecessary maintenance risk.

## Selection principles

1. Prefer MIT/permissive licenses for application dependencies.
2. Prefer headless libraries that let Strap retain its own visual language.
3. Prefer libraries that complement TanStack and Supabase rather than replacing them.
4. Avoid dependencies that duplicate existing primitives without a measurable benefit.
5. Do not introduce a package solely for visual novelty.
6. Keep commerce-critical business rules server-side in Supabase.
7. Any new dependency must pass the existing lint, type-check, build and dependency-audit gates before release.

## Current implementation

The global Quick Find experience now uses `cmdk` for accessible keyboard navigation, filtering, selection, dialog behavior and recent destinations while retaining Strap's existing visual design. Recent destinations are stored locally and are non-sensitive route metadata only.
