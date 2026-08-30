# Strap 2.0 Design System

Strap 2.0 uses a marketplace-blue visual language: white working surfaces, pale-blue workspace canvas, strong blue actions, navy typography, restrained borders, and trustworthy status language.

## Semantic colors

| Token | Value | Use |
| --- | --- | --- |
| `--surface-base` | `#FFFFFF` | Cards, panels, inputs |
| `--surface-subtle` | `#F5F8FC` | App canvas, navigation, table headers |
| `--surface-sunken` | `#EEF3FA` | Disabled/input-sunken surfaces |
| `--border-default` | `#E1E8F2` | Default separators and borders |
| `--border-strong` | `#C7D4E8` | Form/control borders |
| `--brand-600` | `#1D5FE0` | Primary actions, links, active states |
| `--brand-700` | `#1749B3` | Hover/active brand state |
| `--brand-100` | `#E7EFFD` | Brand tint and active backgrounds |
| `--ink-900` | `#0B1220` | Headings and high-emphasis text |
| `--ink-600` | `#46526B` | Body text |
| `--ink-400` | `#8492A8` | Labels and secondary text |
| `--success-*` | muted green | Confirmed/synced/active status |
| `--warning-*` | muted amber | Low stock/pending status |
| `--danger-*` | muted red | Errors/destructive status |

No component should introduce an inline hex value. Use semantic variables or the Tailwind aliases generated from them.

## Type

Display: Space Grotesk. UI/body: Inter. Data and comparable numeric columns use tabular figures (`font-variant-numeric: tabular-nums`).

Type scale: 12 / 14 / 16 / 20 / 24 / 32 / 40px.

## Spacing

Base spacing uses a 4px unit with named tokens from 4px through 48px. Prefer the shared spacing scale over one-off values.

## Shape

- Small controls: 8px
- Cards: 12px
- Modals/panels: 16px
- Default border: 1px
- Card shadow: `0 1px 2px rgba(11,18,32,.04), 0 8px 24px rgba(11,18,32,.06)`
- Popover shadow: `0 12px 32px rgba(11,18,32,.12)`

## Motion

- Fast interaction: 150ms
- Page transition target: 180ms
- Press state: scale to `.985`
- Data loading: shimmer skeletons, not indefinite spinners
- Reduced motion: all animation and transitions collapse to ~1ms

## Interaction rules

Every interactive control needs a visible keyboard focus state. Disabled states must be visually clear. Touch targets should be at least 44px where the control is primarily used on mobile.

## Product language

Use merchant-facing language: `Low stock alerts`, `Add product`, `Save changes`, `Refund order`, `Published`, `Synced`, `Pending`.

Errors explain what happened and the next action. Empty states include an illustration, one sentence of guidance, and a primary action.

## Visual guardrails

Do not introduce gradients as decoration, glassmorphism, neon colors, oversized shadows, mixed icon families, sparkle/magic-wand icons, or generic AI-feature badges. The product should communicate confidence through hierarchy, alignment, whitespace, and consistent states.
