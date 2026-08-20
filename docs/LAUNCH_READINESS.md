# Kudi Launch Readiness

Target: public launch preparation.

## Product decisions
- Kudi Sense is no longer part of Kudi's product roadmap; import remains the Kudi bulk-import workflow.
- Sell is the default unit-sale workspace. Barcode/QR scanning must be available directly from Sell.
- Pack/piece selling belongs directly in the Sell workflow rather than a separate destination.

## Pre-launch gates
- [ ] Mobile audit of every authenticated page
- [ ] Desktop regression audit
- [ ] Product create/edit/import regression tests
- [ ] Pack/piece inventory and sale tests
- [ ] Barcode/QR camera scan tests
- [ ] External keyboard barcode scanner tests
- [ ] Offline sale queue and reconnect sync tests
- [ ] Refund/void and sales-history tests
- [ ] Online catalogue/store/order regression tests
- [ ] Customer workflow tests
- [ ] Reports and dashboard numerical verification
- [ ] Receipt printing and receipt designer verification
- [ ] Authentication/email verification regression tests
- [ ] Store slug collision regression test
- [ ] Supabase RLS/security review
- [ ] Loading, empty, error and success states on every major flow
- [ ] Terms/privacy/help links verified
- [ ] Production build and deployment verification

## Mobile UX acceptance
- Primary actions reachable with one hand.
- Touch targets are at least 44px.
- No important action depends on hover.
- Sheets/dialogs fit small phones without horizontal overflow.
- Loading state is visible during every meaningful network operation.
- Destructive actions require clear confirmation.
- Sell opens directly into the fastest possible transaction workflow.

## Launch rule
Do not call Kudi launch-ready because the UI looks finished. A flow is launch-ready only after its happy path, failure path, mobile path and reconnect/offline path have been tested.
