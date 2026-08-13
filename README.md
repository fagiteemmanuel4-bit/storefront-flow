# Storefront Flow

#  Build a premium point-of-sale SaaS platform from scratch 

Build a point-of-sale and inventory management web app for small retail

businesses — think a shop owner in Lagos running one or two physical

locations who needs to track products, process sales, manage staff, and

see how the business is actually doing, from their phone as much as

their laptop. Free to start, fast, and genuinely reliable — the kind of

tool where "did that sale actually save?" is never a question the owner

has to ask.



This is a real product for real money changing hands, not a demo. Build

it that way from the first commit.



## Tech stack



- React + TanStack Start (file-based routing, SSR, server functions) + TypeScript

- Firebase Auth (real email/password, not a placeholder) + Firestore

- Tailwind + shadcn/ui as a *foundation*, not the finished look (see Design below)

- Deployed on Vercel



## Non-negotiable architecture principles



These aren't style preferences — each one below caused a real, user-facing

bug when skipped in an earlier build of this exact kind of app.



1. **No server-side state in memory, ever.** Any short-lived state a

   server function needs across two separate requests (a verification

   code, a rate-limit counter, a session token) goes in Firestore or

   another real datastore — never a module-level `Map` or plain variable.

   Serverless functions do not guarantee two requests hit the same

   instance; in-memory storage there is invisible roughly at random.



2. **Firestore writes never contain `undefined`.** Firestore rejects it

   outright. Any optional field gets either omitted from the write object

   entirely or given an explicit default — never `field: possiblyUndefinedValue`.



3. **Security rules must account for the exact moment of creation, not

   just steady-state.** A rule requiring "you must already be linked to

   this resource to write it" will reject the very write that creates

   that link in the first place. Split `create` (checks the incoming

   document sets the right owner) from `update`/`delete` (checks the

   existing link) wherever this pattern applies.



4. **Every mutation function fails loudly, never silently.** A function

   that can't complete its job throws a real error — it never just

   `return`s early while the UI shows a success toast. Silent no-ops that

   look like success are worse than errors; they cause quiet data loss

   nobody notices until much later.



5. **Async effects guard against being superseded.** Any effect kicking

   off an async chain (an auth-state listener resolving custom claims,

   then attaching Firestore listeners) needs a cancellation flag checked

   the moment the async work resumes, or a fast sequence of state changes

   (e.g. logout immediately followed by login) can let a stale response

   overwrite fresh, correct state.



6. **Client-only data caches must actually be written to.** If a route's

   redirect logic depends on a localStorage snapshot, that snapshot has

   to be kept in sync by the same code that changes the underlying state

   — a stale/never-written cache silently breaks "remember me"-style

   logic in a way that's easy to miss in testing.



7. **Server-only secrets never leave the server, and their absence fails

   gracefully.** Every third-party API key (email, AI, admin SDKs) lives

   behind a server function, is read from an environment variable never

   hardcoded, and every code path checks for its absence and returns a

   clear "not configured" response rather than throwing or silently

   proceeding as if it worked.



8. **Multi-tenant data isolation is enforced by real security rules, not

   convention.** Every Firestore read/write for store-scoped data

   verifies the requester is either that store's owner or an

   *authenticated* staff session for that specific store — never "not

   logged in" or any other proxy that can't distinguish a legitimate

   session from an anonymous visitor.



## Core features



- **Products & inventory**: add/edit/delete, barcode field with a real

  camera-based scanner (not a decorative animation — actually request

  camera permission and decode), low-stock thresholds, bulk import.

- **Sales / checkout**: cart-based POS flow, scan-to-add, multiple

  payment methods, receipts, a completion sound.

- **Multi-branch support**: a store can have more than one physical

  location, each with its own stock counts, sharing one product catalog.

  Design the data model for this from day one even if branches ship

  later — retrofitting per-location stock onto a single flat quantity

  field is painful.

- **Staff accounts**: separate from the owner's login, store-code + PIN

  based, real authentication (not just a client-side check) with hashed

  PINs and rate-limited login attempts.

- **Customers & credit tracking**: record sales on credit, track who

  owes the business money — extremely common in markets where this kind

  of app gets used, and a genuine competitive differentiator.

- **Reports**: revenue trends, best sellers, per-branch breakdowns.

- **Notifications/alerts**: low stock, sale completed, configurable

  thresholds — backed by a real Firestore collection, not decorative.

- **AI assistant**: genuinely useful — real access to the store's live

  data (read-only by default), able to *propose* actions like adding a

  product but requiring explicit human confirmation before anything

  writes to the database. Never let an LLM autonomously mutate real

  business data on its own judgment.

- **Settings**: business info, security options that actually do

  something when toggled (no decorative switches), data export/import

  with schema validation on restore.



## Legal & trust pages



- Terms of Service and Privacy Policy — real, specific to the actual

  jurisdiction and data practices, not templated boilerplate. Required

  reading (a real checkbox, not just a footer link) at signup.

- A support/help page with genuine documentation, not just a contact form.

- Never claim a capability the product doesn't have (offline support,

  encryption, specific certifications) unless it's actually implemented

  — a false claim on the landing page is a liability, not marketing.



## Design direction

The single most common failure mode for AI-assisted builds is the

"generic AI SaaS template" look: `font-black` headlines, rounded-full

pill badges and buttons on everything, centered single-column hero

sections, Inter at maximum weight everywhere. Explicitly avoid this.

- Pick a genuine typography pairing with character — a distinctive

  display face for headlines, paired with a warm, readable body font.

  Use heavy font weights sparingly and intentionally, not by default.

- Light theme as the primary experience. A single confident accent color

  used deliberately, not applied everywhere at full saturation.

- Vary component shapes — not everything needs to be a rounded-full pill.

- Real motion: subtle parallax, elements with a sense of depth,

  asymmetric layout choices — not just a fade-in on scroll.

- Apply the same typography, spacing, and component language across

  *every* screen — landing, onboarding, dashboard, settings — so it

  reads as one deliberately designed product, not a series of

  separately-built features bolted together.

- Mobile is not an afterthought: real bottom navigation and drawer

  patterns, 44px minimum touch targets, tested at actual small-phone

  widths (320-375px), not just a resized desktop browser window.

## Before considering anything done

- `tsc --noEmit` and a full production build pass with zero errors.

- Every secret checked against the actual built client bundle to confirm

  it never leaked to the browser.

- Every "success" state in the UI is only shown after the underlying

  operation is confirmed to have actually succeeded — never optimistically

  before an awaited call resolves.

- A written account of what was tested and how, not just "should work."

Make use of Material 3 Expressive level design Text area size and use reactbitz.dev for Interactive looks and premium design

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e9bfd2cc-32a6-4021-a336-5acca33257a7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
