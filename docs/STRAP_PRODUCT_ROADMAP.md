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
- [x] Fashion implementation merged: per-size/per-colour inventory, POS selection and decrement, online variant ordering, returns/restocking and size/colour reporting are implemented.
- [ ] Fashion live-data release check: verify authenticated product editing, POS stock decrement, online ordering, return limits/restocking and role permissions with real store data. Build is green; do not call this fully end-to-end tested until those checks pass.
- [x] Electronics & phones implementation merged: serial/IMEI inventory, sale-time device selection, warranty start/expiry and repair intake/status tracking.
- [ ] Electronics live-data release check: verify serialised stock totals, duplicate serial rejection, sale-time warranty updates, repair status restoration and role permissions with real store data.
- [x] Food service implementation in progress on `feat/food-service-workspace`: menu modifier groups with priced options, per-line preparation notes, automatic kitchen tickets, recipe costing/ingredient deductions and waste logging are implemented in code and additive Supabase migrations.
- [ ] Food-service release gate: validate modifier prices, required choices, recipe stock limits, kitchen status updates, waste deduction and role permissions against a real store before merging.
- [ ] Next business mode after food service passes: Groceries & provision — pack/piece workflows, expiry/batch tracking and supplier restock suggestions.
- [ ] Food service: menu modifiers, kitchen tickets, recipe costing, ingredient deductions and waste tracking.
- [ ] Pharmacy: batch/expiry/recall traceability and specialist compliance review before enabling pharmacy workflows.
- [ ] Beauty/personal care: service bookings and consumable usage.
- [ ] Services: appointments, job cards, deposits and service packages.

## Current implementation handoff — 2026-10-28
- Fashion PR #23 (`feat/fashion-first-workspace`) is based on `feat/strap-business-modes` (PR #22). Fashion completion/POS PR #24 (`feat/fashion-completion-and-compact-pos`) is stacked on PR #23. Electronics PR #25 (`feat/electronics-workspace`) is stacked on PR #24. Preserve this merge order; do not merge a child branch directly to `main` before its base.
- Already implemented on the fashion branch: photo-first product entry (up to six images and camera capture), descriptive sizes/colours/material/style notes, fashion-specific navigation/dashboard/settings, catalogue imagery, WhatsApp product sharing, and hiding barcode-first UI in fashion mode.
- Additive `fashion_variant_stock` now stores quantities by store, branch, product, size and colour. Its trigger keeps legacy product-level `branch_stock` totals in sync so existing product lists and non-fashion checkout continue to use their current contract.
- Product editing now supports one `Size | Colour | Quantity` row per variant; POS offers exact size/colour selection and sends the chosen variant to `create_sale`, which validates and decrements that variant. Variant details are snapshotted onto sale items.
- The public catalogue now has a v2 RPC that exposes available size/colour options; the storefront lets customers choose an option, and online order creation allocates/decrements the selected variant across branches. The order detail view displays the chosen size and colour.
- Returns are recorded in `sale_returns` / `sale_return_items`; `process_fashion_return` validates remaining returnable quantity and restocks the original size/colour where recorded. The new Returns & Exchanges workspace is linked from fashion quick actions. Exchanges are handled as a return followed by a replacement sale.
- Reports now include best-selling size/colour combinations for fashion mode. The POS toolbar was compacted so search is prominent and scan/hold controls use less space.
- Fashion implementation is merged through PR #24 and its Vercel build is READY. Electronics is merged through PR #25; production deployment `dpl_7U2zJVEGox4Z98tAWseKmcRaNFeA` for commit `e3d81f0d48edcc50bfac1146f0496b0b9557ab8d` reached READY and aliases `storefront-flow.vercel.app`. Build verification passed; authenticated end-to-end stock/permission checks remain to be completed before describing all flows as fully tested.
- Electronics implementation includes `electronics_devices` (serial/IMEI, status, warranty period and sale linkage), automatic serialized branch-stock totals, sale-time serial selection and warranty start, a repair intake/status queue, and mode-specific desktop/mobile navigation. Its production build is READY; real-data workflow checks remain outstanding. Keep existing sales, authentication, permissions and store data intact.
- Current next task is Food service. PR #26 is being prepared on `feat/food-service-workspace`; its latest UI preview at commit `c78ae1752f063cce61b3e341839ff9403715f056` is READY. Food-service schema and checkout RPC migrations are applied and recorded in Supabase. The checkout RPC now validates priced modifier options, checks recipe ingredient availability, deducts recipe stock transactionally, and creates a kitchen ticket. Latest SQL-only guard changes still need a fresh build before merge. Do not change the existing checkout contract for non-food modes.
- User instruction: proceed autonomously through the current mode and then the next mode without asking for routine confirmations; return only when a deployed, verified working version is available. Keep this roadmap and handoff notes current after each meaningful change.

## Release quality checklist
- [ ] Inspect the current repository before each implementation; reuse existing features instead of duplicating them.
- [ ] Preserve business name, existing transactions, authentication, permissions and established business logic.
- [ ] Keep the UI responsive, accessible, consistent with Strap's orange/black visual language, and usable on small screens.
- [ ] Validate loading, empty, error, saving and success states.
- [ ] Run build and relevant checks; review the changed-file list for unrelated edits.
- [ ] Verify a preview deployment before considering a production release.
