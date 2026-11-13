# Business-mode profile runtime foundation

## Runtime contract

- Profiles are discovered from `modes/*/mode.json` and validated before they are exposed to application code.
- `getBusinessModeProfile(modeKey)` returns a success/error result. It never falls back to General Retail or another profile.
- Unknown, malformed, duplicate, or deprecated profiles fail closed.
- `isBusinessModeFeatureEnabled(profile, featureId)` returns true only when the profile is active, runtime-ready, the feature is explicitly mapped to that mode, and its flag is true.
- Draft profiles cannot enable features. All eight authored profiles remain draft, `runtimeReady: false`, and all flags OFF.
- An active, runtime-ready profile must map every product field to a database column or named server-owned source, and each field must independently declare `runtimeReady: true`; field readiness defaults to false.

## Applicability policy

The supplied feature catalog defines 61 features as `all-modes` and 14 as `mode-specific`. The generated `modes/feature-applicability.json` maps only the 61 explicitly shared features to all eight modes. The 14 mode-specific features remain unmapped until each mode is reviewed against its actual workflow and server-side contracts. This is deliberate; no mode applicability is inferred from a feature's description.

## Validation

Run:

```sh
npm run check:business-mode-profiles
```

The check verifies profile count, draft/default-off release state, unique product fields, valid order transitions, registered template sections, and feature applicability boundaries. The runtime Zod schema performs additional structural and cross-reference validation when profiles are loaded.

## Not included in this milestone

- No profile is activated or marked runtime-ready.
- No product/order/storefront UI has been migrated to consume profiles yet.
- No database schema, RLS policy, RPC, inventory allocation, or payment behavior is changed.
- No production deployment is performed.

The next integration step must migrate one bounded surface at a time, beginning with read-only mode configuration, then product fields and storefront templates. Server-authoritative inventory and order workflows require separate tests and release gates.
