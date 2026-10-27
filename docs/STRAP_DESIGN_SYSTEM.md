# Strap Design System

Strap uses one visual language across marketing, authentication, onboarding, point of sale, inventory, customers, reports, online store management, settings, notifications, and public storefronts.

## Design direction: Strap Pulse

A confident monochrome workspace with an electric-lime action colour. The interface should feel modern, precise, fast, and calm. Use motion to clarify interaction, not to decorate it.

## Principles

1. **Trust before decoration.** Commerce software should feel dependable and precise.
2. **Hierarchy over containers.** Use typography, spacing, alignment, and rules before adding cards.
3. **One action accent.** Electric lime marks active navigation, focus, and primary moments. Success, warning, and destructive colours remain semantic.
4. **Dense where work happens.** POS, inventory, tables, and settings prioritize scanability and efficient operation.
5. **Motion explains state.** Short transitions can communicate focus, loading, and completion; avoid distracting movement.
6. **Accessible by default.** Visible keyboard focus, comfortable touch targets, and reduced-motion support are required.
7. **Preserve product behavior.** Visual changes must not change data flow, authorization, or business operations.

## Colour tokens

### Light mode

| Token | Value | Use |
|---|---|---|
| Canvas | `#F6F7F3` | Application background |
| Surface | `#FFFFFF` | Cards, dialogs, and controls |
| Ink | `#171A14` | Primary text |
| Muted | `#72786D` | Supporting text |
| Line | `#E3E6DC` | Borders and dividers |
| Strap lime | `#B8F34A` | Active states and action accent |
| Lime soft | `#EFF9DD` | Quiet highlighted surfaces |

### Dark mode

| Token | Value | Use |
|---|---|---|
| Canvas | `#0C0F0A` | Application background |
| Surface | `#141811` | Cards, dialogs, and controls |
| Ink | `#F4F6EF` | Primary text |
| Muted | `#9BA391` | Supporting text |
| Line | `#2A3024` | Borders and dividers |
| Strap lime | `#B8F34A` | Active states and action accent |

Dark mode uses deep charcoal and olive-tinted surfaces rather than a simple colour inversion.

## Typography

- **Body:** Inter 400/500/600/700.
- **Headings:** Manrope 500/600/700/800.
- Use tight tracking for display headings and compact, readable type for operational data.
- Use tabular numerals where amounts and metrics need comparison.

## Spacing and shape

- Standard controls: 12px radius.
- Standard surfaces: 20px radius.
- Keep data-dense screens compact without sacrificing readable labels or touch targets.
- Avoid excessive rounded containers and ornamental card stacks.

## Elevation and surfaces

Use borders first. Keep card shadows quiet; reserve stronger elevation for dialogs, menus, and floating controls. Hover states may slightly lift a surface or strengthen its border.

## Navigation

The workspace navigation uses a dark rail with high-contrast labels. The active destination uses the lime accent with dark text. Tablet and mobile continue to use the existing responsive navigation patterns.

## Motion

- Short, eased transitions for hover, focus, and button press.
- Subtle page-content entrance when navigating.
- No continuous decorative animation.
- Respect `prefers-reduced-motion`.

## Loading

1. Route/data transitions use the existing slim progress indicator.
2. Local actions use an inline indicator in the triggering control.
3. Skeletons are reserved for layouts where known geometry improves perceived performance.

## Verification checklist

- Use semantic Strap tokens rather than one-off colour values.
- Keep the primary action visually clear.
- Preserve keyboard focus visibility and contrast.
- Verify desktop and mobile layouts.
- Support dark mode and reduced motion.
- Keep authentication, data access, and business behavior unchanged during visual-only work.
