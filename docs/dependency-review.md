# Dependency review

Internal record of third-party packages used in Strap and the reason each is included. This document is for product maintenance and software-compliance review; it is not a customer setup guide.

| Package | Licence | Product use |
| --- | --- | --- |
| cmdk | MIT | Global quick find and command navigation |
| Radix UI primitives | MIT | Accessible dialogs, menus, popovers and other interactions |
| Recharts | MIT | Business reporting visualisations |
| Zod | MIT | Runtime validation at application boundaries |
| React Hook Form | MIT | Form state and validation workflows |

## Review principles

- Prefer the existing React, TanStack and Supabase architecture.
- Add a dependency only when it provides a clear product or accessibility benefit.
- Review licence obligations before adding or upgrading packages.
- Keep dependencies maintained and remove unused packages after confirming no production route depends on them.
- Do not expose internal implementation notes in customer-facing documentation.
