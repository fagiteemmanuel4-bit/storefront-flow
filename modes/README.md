# Strap business-mode profiles

This directory contains draft, declarative profiles for all business modes currently registered in `src/lib/business-modes.ts`.

## Profiles

- [General retail](./normal-business/mode.json)
- [Groceries & provision](./grocery-provision/mode.json)
- [Fashion & boutiques](./fashion/mode.json)
- [Electronics & phones](./electronics/mode.json)
- [Food & restaurants](./food-service/mode.json)
- [Pharmacy & health products](./pharmacy/mode.json)
- [Beauty & personal care](./beauty-personal-care/mode.json)
- [Services & appointments](./services/mode.json)

All profiles follow [the shared JSON Schema](../schemas/business-mode-profile.schema.json).

## Lifecycle and safety

Every profile is `status: draft` and `runtimeReady: false`. All feature flags default to OFF. These files do not activate functionality or alter the database. Runtime integration requires schema/domain validation, profile loader and validator implementation, server-side enforcement, lifecycle states, 390px and desktop checks, and automated tests.

The normal-business feature catalog is the only supplied catalog. Its feature IDs are copied as OFF flags for traceability only; no claim is made that all Normal Business features apply to every mode. Each mode needs an applicability mapping before flags can be enabled.

## Workspace boundary

The Physical Store and Online Store remain separate workspaces. Shared products, inventory and notifications must communicate through explicit, audited and idempotent services/events. JSON templates are data only; render only registered components and never execute arbitrary JSON-provided code.

## Mode-specific guardrails

- Grocery: FEFO batch allocation; expired, recalled or quarantined stock cannot be sold.
- Fashion: size/colour SKU stock; exact variant reservation and decrement.
- Electronics: serialized unit reservation/release required before online serial checkout.
- Food service: modifiers, recipes, ingredient deductions, kitchen dispatch and delivery must be server-authoritative.
- Pharmacy: prescription and controlled products blocked from public checkout pending compliant dispensing safeguards.
- Beauty and services: appointment availability, staff conflict prevention, deposits and payment ledger must be server-authoritative.
