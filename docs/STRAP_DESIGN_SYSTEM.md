# Strap Design System

Strap uses one visual language across marketing, authentication, onboarding, operations, POS, online store management, settings, notifications, and public storefronts.

## Principles

1. **Trust before decoration.** Commerce software should feel dependable, quiet, and precise.
2. **Hierarchy over containers.** Use typography, spacing, alignment, and rules before adding cards.
3. **One accent.** Strap blue is the action and focus color. Success, warning, and destructive colors are semantic only.
4. **Dense where work happens.** Tables, POS, inventory, and settings prioritize scanability and keyboard/mouse efficiency.
5. **Motion explains state.** Transitions should communicate loading, completion, or focus—not add spectacle.
6. **Accessible by default.** Visible focus, comfortable touch targets, reduced-motion support, and semantic controls are part of the design system.

## Color tokens

### Light

| Token | Value | Use |
|---|---|---|
| `--strap-canvas` | `#F8FAFC` | Application background |
| `--strap-panel` | `#FFFFFF` | Surfaces and controls |
| `--strap-ink` | `#101828` | Primary text |
| `--strap-muted` | `#667085` | Secondary text |
| `--strap-line` | `#E4E7EC` | Borders and rules |
| `--strap-blue-500` | `#3767E8` | Primary accent |
| `--strap-blue-600` | `#2856D7` | Primary actions |
| `--strap-blue-700` | `#2047B7` | Active/strong accent text |

Dark mode maps the same semantic roles to a deep navy canvas and blue-tinted surfaces. It is not a simple inversion.

## Typography

- **Body:** Inter 400/500/600/700
- **Display/headings:** Manrope 500/600/700/800
- Display tracking is intentionally tight; operational text stays compact and readable.
- Numeric values use tabular numerals where comparison matters.

## Spacing and shape

- Base spacing follows the existing Tailwind scale.
- Standard control radius: 10px.
- Standard surface radius: 18px.
- Large editorial surfaces: 24px.
- Avoid decorative 28–40px rounding on ordinary application panels.

## Elevation

Use borders first. Shadows are reserved for dialogs, menus, floating controls, and important surfaces.

- Small: `--strap-shadow-sm`
- Floating: `--strap-shadow-md`
- Dialog: `--strap-shadow-lg`

## Icons

Lucide remains the functional icon set. Use 16–18px icons for controls and 20–22px icons for primary navigation. Prominent brand moments may use custom marks/illustrations; do not introduce an icon for every empty state.

## Loading

There are exactly two preferred loading patterns:

1. **Route/data transition:** 2px fixed progress line at the top of the viewport.
2. **Local action:** 16px circular indicator inside the triggering control.

Do not introduce full-screen loading cards or generic `Loading...` copy for ordinary transitions. Skeletons are reserved for layouts where the known geometry materially improves perceived performance.

## Notifications

Toasts use a white/dark surface, one-pixel border, restrained shadow, and concise copy. Banners should communicate a real status or action and never behave like advertising.

## Responsive behavior

Desktop uses a persistent workspace navigation rail. Tablet and mobile collapse navigation into the existing mobile menu. Content remains fluid with a maximum reading/working width instead of stretching indefinitely.

## Verification checklist

For each redesigned surface:

- Uses semantic Strap tokens rather than one-off color values.
- Has a clear primary action.
- Has visible keyboard focus.
- Works at mobile and desktop widths.
- Uses the global loading language when asynchronous work is visible.
- Supports dark mode where the application supports dark mode.
- Does not introduce decorative gradients, excessive cards, or ornamental animation.
