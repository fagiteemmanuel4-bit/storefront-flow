# Strap by Kryonara

Build a premium point-of-sale and commerce platform for modern businesses.

**Strap** is the customer-facing product. **Kryonara** is the parent company.

This repository contains Strap, a real product for real businesses — not a demo. Build it that way from the first commit.

## Product identity

- **Product:** Strap
- **Parent company:** Kryonara
- **Preferred attribution:** Strap by Kryonara

## Core product

Strap brings point-of-sale, inventory, customers, staff, reporting, online selling and commerce operations into one workspace for growing businesses.

### Core capabilities

- Products & inventory: add/edit/delete, barcode scanning, low-stock thresholds and bulk import.
- Sales / checkout: cart-based POS flow, scanning, multiple payment methods and receipts.
- Multi-branch support with per-location stock.
- Staff accounts with store-scoped access, hashed PINs and controlled permissions.
- Customers and credit tracking.
- Reports, insights and operational intelligence.
- Persistent notifications and activity/audit history.
- Online storefront, catalogue and order management.
- Commerce operations including suppliers, purchasing, transfers, discounts, loyalty and fulfillment foundations.
- Advanced settings and merchant preferences.
- Customer order tracking with temporary 14-day accounts.

## Brand migration

The former product identity has been retired from the customer experience. Production branding is **Strap by Kryonara**. Internal database identifiers are intentionally preserved where changing them would risk production data or API compatibility.

## Tech stack

- React + TanStack Start + TypeScript
- Supabase Auth + PostgreSQL
- Tailwind + shadcn/ui
- Deployed on Vercel

## Architecture principles

1. No server-side state in memory for persistent request state.
2. Database writes must never contain undefined values.
3. Creation-time security rules must validate the incoming ownership data.
4. Mutation functions fail loudly and only show success after confirmed completion.
5. Async effects guard against stale responses.
6. Client caches are updated whenever their underlying state changes.
7. Server-only secrets stay on the server and missing integrations fail clearly.
8. Multi-tenant data isolation is enforced by database RLS, not convention.

## Trust and legal

Strap includes Terms of Service, Privacy Policy, support/help surfaces and protected merchant workspaces. Do not claim capabilities that are not actually implemented.

## Development

Prefer working locally with Node.js/npm or Bun:

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

Before considering a change done:

- run the production build;
- run the project's type checker where configured;
- run linting where configured;
- verify secrets are not present in the client bundle;
- verify success UI follows confirmed backend success;
- document what was tested.

## Deployment

Production deployment is managed through Vercel. Supabase migrations in `supabase/migrations` are the source of truth for repository-managed database changes.

**Strap by Kryonara — commerce operations for modern businesses.**
