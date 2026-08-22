# Kudi 40-item upgrade

## Execution policy

The 40-item roadmap is being implemented as production capabilities, not UI placeholders. Existing working systems are preserved and extended. Work is grouped into architecture, security, merchant workflows, storefront, customer growth, intelligence and platform layers.

### Staged capabilities

- Merchant online payments: **Coming soon**. Live provider integration is intentionally parked until payment-provider account/device access is available.
- AI assistant and AI storefront generation: **Coming soon**.
- Advanced analytics, loyalty, discounts, purchasing, transfers and inventory intelligence: **Limited free** while Kudi is being expanded.

### Foundation implemented

- Suppliers
- Purchase orders and purchase-order items
- Stock transfers and transfer items
- Provider-agnostic payment transaction ledger (no live collection)
- Refund records
- Discount codes
- Loyalty accounts and transactions
- Store-level granular permission definitions
- Store-owned RLS policies for the new commerce tables
- Supporting indexes
- Internal sale RPC anonymous execution restricted
- Product variants
- Product bundles
- Inventory alerts and reorder/dead-stock alert model
- Customer segments and segment membership model
- Customer and product reporting indexes

### Next implementation priorities

1. Wire the new purchasing, transfer, discount, loyalty, variant and alert models into merchant workflows.
2. Strengthen POS/order correctness around refunds, inventory and customer history.
3. Expand storefront builder and discovery/SEO capabilities.
4. Add merchant-facing analytics and customer segmentation.
5. Complete production security review and regression validation before declaring the roadmap complete.

## Completion standard

A roadmap item is only considered complete when its database model, authorization, UI/API integration, error states, regression behavior and production deployment have been reviewed. A status badge or schema alone does not count as completion.
