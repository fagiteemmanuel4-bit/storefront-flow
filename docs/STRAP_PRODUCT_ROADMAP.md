# Strap product roadmap — checklist

This roadmap starts with **business-specific workspaces** and then progresses through the supporting capabilities discussed for Strap. Keep existing sales, authentication, permissions and database behaviour intact unless a task explicitly requires a reviewed change.

## 4. Dedicated modes for different businesses — current work
- [x] Add business-mode selection to Store Profile with clear descriptions and a mobile-friendly card layout.
- [x] Add business-mode selection and a clear mode summary during new-store onboarding.
- [x] Persist the selected mode in the existing store profile settings without a new database migration.
- [x] Show mode-specific shortcuts and recommended workflows on the dashboard.
- [x] Clearly distinguish working features from planned features; never present planned functionality as already available.
- [x] Preserve a general-retail default for existing stores and let owners change the mode later.
- [ ] Test all mode choices, saving, reload persistence, mobile layout and role permissions.
- [ ] Add the next mode-specific feature only after reviewing its existing implementation and database dependencies.

## 5. Competitive differentiation and daily microfeatures
- [ ] Reliable offline checkout: visible sync status, safe retry, duplicate-sale protection and clear recovery after a browser crash.
- [ ] Stock units: carton/pack/piece conversions and distinct buying and selling prices.
- [ ] Accurate profit view: cost of goods, discounts, refunds, expenses, credit sales and cash movement.
- [ ] Cashier shifts: opening float, handover, expected-versus-counted cash and manager review.
- [ ] Supplier management: suppliers, purchase orders, partial deliveries, supplier balances and purchase-cost history.
- [ ] Customer credit: part-payments, due dates, statements, credit limits and payment history.
- [ ] Daily business briefing: explain sales, margin, slow-moving stock, debts and restock priorities using real records.
- [ ] Checkout polish: keyboard shortcuts, faster search, held carts, split payments and receipt lookup.
- [ ] Inventory polish: bulk edits, safe product duplication, CSV import/export, barcode scan and stock movement history.
- [ ] Pricing controls: wholesale prices, customer-specific pricing and quantity discounts.
- [ ] Customer tools: purchase history, optional digital receipts, loyalty and repeat-purchase tools.
- [ ] Staff controls: least-privilege roles, shift accountability and auditable sensitive actions.
- [ ] Reports: date, branch, category and cashier filters; CSV/Excel/PDF export.
- [ ] Reliability: transparent sync status, backup visibility and safe recovery paths.

## 6. Strap differentiators
- [ ] WhatsApp-ready receipts, invoices, statements and catalogue lists.
- [ ] Convert incoming WhatsApp orders into reviewed draft sales.
- [ ] Supplier-receipt OCR that extracts editable draft rows and never changes stock before confirmation.
- [ ] Ask-Strap business assistant grounded in real transactions, with links back to supporting records.
- [ ] Unusual-activity review for voids, refunds, price overrides and stock adjustments.
- [ ] Owner dashboard on a separate device with clear last-sync timestamps.
- [ ] Cash-flow and restocking planner that respects a shop's spending budget.
- [ ] Build safe audit trails and permission checks before introducing AI actions.

## 7. Business-specific workflow backlog
- [ ] Groceries/provision: expiry and batch tracking, reorder suggestions and supplier price comparisons.
- [x] Fashion: photo-first product entry, size/colour/material notes, WhatsApp product sharing, fashion-first dashboard/navigation and barcode-free product entry.
- [ ] Fashion completion gate: per-size/per-colour quantities, variant selection at checkout, variant-aware stock decrement and sales records, storefront variant display, exchanges/returns with stock adjustments, and collection-level reporting. Do not start the next business mode until this gate is tested end-to-end.
- [ ] Next after fashion completion: Electronics & phones — serial/IMEI records linked to device stock and sales, warranty tracking, and repair intake.
- [ ] Food service: menu modifiers, kitchen tickets, recipe costing, ingredient deductions and waste tracking.
- [ ] Pharmacy: batch/expiry/recall traceability and specialist compliance review before enabling pharmacy workflows.
- [ ] Beauty/personal care: service bookings and consumable usage.
- [ ] Services: appointments, job cards, deposits and service packages.

## Current implementation handoff — 2026-10-28
- Fashion PR #23 (`feat/fashion-first-workspace`) is based on `feat/strap-business-modes` (PR #22). POS refinement PR #24 (`feat/fashion-completion-and-compact-pos`) is stacked on PR #23. Preserve this merge order; do not merge either branch directly to `main` before its base.
- Already implemented on the fashion branch: photo-first product entry (up to six images and camera capture), descriptive sizes/colours/material/style notes, fashion-specific navigation/dashboard/settings, catalogue imagery, WhatsApp product sharing, and hiding barcode-first UI in fashion mode.
- The existing `product_fashion_details` table stores descriptive size/colour options only. It is not variant inventory. The existing `product_variants` table has attributes and prices but no branch-level quantities, and `create_sale` currently decrements product-level `branch_stock`.
- Next implementation step: inspect and design an additive, branch-aware size/colour stock model, then wire product editing, POS variant selection, sale RPC/line items, online storefront display, and regression tests together. Preserve current product-level checkout for every non-fashion mode. Do not claim variant stock is available until all those paths are implemented and verified.
- After the fashion completion gate passes: start the Electronics & phones workspace. Keep existing sales, authentication, permissions and store data intact.
- User instruction: proceed autonomously through the current mode and then the next mode without asking for routine confirmations; return only when a deployed, verified working version is available. Keep this roadmap and handoff notes current after each meaningful change.

## Release quality checklist
- [ ] Inspect the current repository before each implementation; reuse existing features instead of duplicating them.
- [ ] Preserve business name, existing transactions, authentication, permissions and established business logic.
- [ ] Keep the UI responsive, accessible, consistent with Strap's orange/black visual language, and usable on small screens.
- [ ] Validate loading, empty, error, saving and success states.
- [ ] Run build and relevant checks; review the changed-file list for unrelated edits.
- [ ] Verify a preview deployment before considering a production release.
