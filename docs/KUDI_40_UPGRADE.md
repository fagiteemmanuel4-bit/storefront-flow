# Kudi 40-item upgrade

## Current implementation policy

The 40-item roadmap is being implemented as production capabilities, not UI placeholders. Existing working systems are preserved and extended.

### Staged capabilities

- Merchant online payments: **Coming soon**. The integration is intentionally not enabled until the payment-provider work is performed with the owner's computer/account access.
- AI assistant: **Coming soon**.
- Advanced analytics, loyalty, discounts, purchasing and stock transfers: **Limited free** while the platform is being expanded.

### Foundation already added

- Suppliers
- Purchase orders and purchase-order items
- Stock transfers and transfer items
- Payment transaction ledger (provider-agnostic foundation; no live payment collection)
- Refund records
- Discount codes
- Loyalty accounts and transactions
- Store-level granular permission definitions
- Store-owned RLS policies for the new commerce tables
- Supporting indexes
- Internal sale RPC anonymous execution restricted

## Completion standard

A roadmap item is only considered complete when its database model, authorization, UI/API integration, error states, regression behavior and production deployment have been reviewed. A status badge or schema alone does not count as completion.
