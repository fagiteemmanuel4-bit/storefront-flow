import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Boxes,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  KeyRound,
  Menu,
  Package,
  Rocket,
  Search,
  Server,
  ShieldCheck,
  ShoppingBag,
  Store,
  Terminal,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/docs")({ component: DocsPage });

type NavItem = {
  id: string;
  label: string;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const navigation: NavGroup[] = [
  {
    title: "Getting started",
    items: [
      { id: "overview", label: "Overview" },
      { id: "quickstart", label: "Quickstart" },
      { id: "project-structure", label: "Project structure" },
    ],
  },
  {
    title: "Core concepts",
    items: [
      { id: "architecture", label: "Architecture" },
      { id: "tenancy", label: "Multi-tenancy" },
      { id: "auth", label: "Authentication" },
      { id: "permissions", label: "Roles & permissions" },
      { id: "data-model", label: "Commerce data model" },
    ],
  },
  {
    title: "Guides",
    items: [
      { id: "products", label: "Products & inventory" },
      { id: "pos", label: "Point of sale" },
      { id: "branches", label: "Branches & transfers" },
      { id: "online-store", label: "Online storefront" },
      { id: "orders", label: "Orders & fulfillment" },
      { id: "staff", label: "Staff & operations" },
    ],
  },
  {
    title: "Reference",
    items: [
      { id: "api", label: "API reference" },
      { id: "supabase", label: "Client SDK integration" },
      { id: "database", label: "Database & RLS" },
      { id: "deployment", label: "Deployment" },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "errors", label: "Troubleshooting & errors" },
      { id: "security", label: "Security checklist" },
    ],
  },
];

const searchItems = navigation.flatMap((group) =>
  group.items.map((item) => ({ ...item, group: group.title })),
);

const endpointRows = [
  ["Authentication", "supabase.auth", "Create sessions, read the current user, refresh sessions, and sign out."],
  ["Stores", "stores", "Store identity, merchant configuration, and the primary tenancy boundary."],
  ["Membership", "store_members", "Connect users to stores and determine their store-level role."],
  ["Branches", "branches", "Business locations used for branch-aware inventory and operations."],
  ["Products", "products", "Catalogue records including SKU, barcode, pricing, categories, and product metadata."],
  ["Inventory", "branch_stock", "Branch-level quantity and stock thresholds for products."],
  ["Sales", "sales / sale_items", "Point-of-sale transactions and their line items."],
  ["Customers", "customers", "Store-specific customer records and purchase relationship data."],
  ["Online store", "online_stores / online_products", "Published storefront configuration and products exposed online."],
  ["Orders", "online_orders / online_order_items", "Online checkout orders, customer information, totals, and order lines."],
  ["Payments", "payment_transactions", "Payment provider references, amounts, currencies, and payment status."],
  ["Refunds", "refunds", "Refund records and their processing lifecycle."],
  ["Purchasing", "suppliers / purchase_orders", "Supplier records and procurement workflows."],
  ["Transfers", "stock_transfers", "Movement of inventory between business branches."],
  ["Notifications", "notifications", "Persistent operational notifications for merchant users."],
  ["Audit", "store_activity_log", "Operational history containing actor, action, entity, and metadata."],
] as const;

const errorRows = [
  ["AUTH_REQUIRED", "No authenticated Supabase session is available.", "Sign in again and verify that the session is being persisted in the browser."],
  ["FORBIDDEN", "The current user is authenticated but is not authorized for the requested store operation.", "Verify store membership, role, and the relevant RLS policy."],
  ["STORE_CONTEXT_REQUIRED", "An operation requires a store context but no valid store has been selected or resolved.", "Complete store onboarding or reload the authenticated workspace."],
  ["RLS_DENIED", "PostgreSQL Row Level Security rejected the requested record access.", "Check the user's membership, store_id relationship, and policy conditions. Do not bypass RLS in the browser."],
  ["INVALID_INPUT", "A mutation received data that does not satisfy the expected validation rules.", "Validate the form payload before sending it and inspect the field-level error."],
  ["DUPLICATE_RECORD", "A unique database constraint was violated.", "Check fields such as SKU, barcode, store slug, or other unique identifiers before retrying."],
  ["NOT_FOUND", "The requested store, product, order, customer, or related record does not exist or is not visible to the current user.", "Refresh the relevant data and confirm that the record belongs to the current store."],
  ["NETWORK_ERROR", "The browser could not complete the request.", "Check connectivity, the Supabase project status, browser extensions, and deployment environment."],
  ["INVALID_BROWSER_KEY", "The browser received a Supabase key that is not a publishable/anon key.", "Use VITE_SUPABASE_PUBLISHABLE_KEY for the browser and keep secret keys server-side."],
] as const;

const codeBlocks = {
  install: `npm install\nnpm run dev`,
  scripts: `npm run dev\nnpm run build\nnpm run build:dev\nnpm run preview\nnpm run lint\nnpm run format`,
  env: `VITE_SUPABASE_URL=https://your-project.supabase.co\nVITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`,
  supabase: `import { supabase } from "@/integrations/supabase/client";\n\nconst { data, error } = await supabase\n  .from("products")\n  .select("id, name, sku, price")\n  .order("name");\n\nif (error) {\n  throw error;\n}\n\nconsole.log(data);`,
  auth: `import { supabase } from "@/integrations/supabase/client";\n\nconst { data, error } = await supabase.auth.signInWithPassword({\n  email,\n  password,\n});\n\nif (error) {\n  throw error;\n}\n\nconsole.log(data.session);`,
  mutation: `const { data, error } = await supabase\n  .from("products")\n  .insert({\n    store_id: storeId,\n    name: productName,\n    sku,\n    price,\n  })\n  .select()\n  .single();\n\nif (error) {\n  throw error;\n}\n\nreturn data;`,
  build: `npm run lint\nnpm run build\nnpm run preview`,
} as const;

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-border bg-foreground text-background shadow-sm">
      <div className="flex items-center gap-2 border-b border-background/10 px-4 py-2.5 text-xs text-background/60">
        <span className="size-2 rounded-full bg-background/25" />
        <span className="size-2 rounded-full bg-background/25" />
        <span className="size-2 rounded-full bg-background/25" />
        <span className="ml-2 font-mono">terminal</span>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6"><code>{children}</code></pre>
    </div>
  );
}

function SectionIcon({ icon: Icon }: { icon: typeof BookOpen }) {
  return (
    <span className="mb-5 inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-accent-ink">
      <Icon className="size-4" />
    </span>
  );
}

function DocsPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return searchItems.slice(0, 8);
    return searchItems.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(value));
  }, [query]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="shrink-0 font-display text-xl font-bold tracking-tight">Strap</Link>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden text-sm text-muted-foreground sm:block">Documentation</span>
          <div className="ml-auto hidden w-full max-w-sm md:block">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search documentation"
                aria-label="Search documentation"
                className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none transition focus:border-accent-ink/50 focus:ring-2 focus:ring-accent-ink/10"
              />
            </label>
            {query && (
              <div className="absolute mt-2 w-full max-w-sm overflow-hidden rounded-xl border border-border bg-card p-2 shadow-xl">
                {filtered.length ? filtered.map((item) => (
                  <a key={`${item.group}-${item.id}`} href={`#${item.id}`} onClick={() => setQuery("")} className="block rounded-lg px-3 py-2 text-sm hover:bg-muted">
                    <span className="block font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.group}</span>
                  </a>
                )) : <p className="px-3 py-4 text-sm text-muted-foreground">No matching documentation found.</p>}
              </div>
            )}
          </div>
          <Link to="/auth" className="hidden items-center gap-1.5 text-sm font-semibold text-accent-ink sm:inline-flex">
            Open Strap <ArrowRight className="size-3.5" />
          </Link>
          <button type="button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close documentation menu" : "Open documentation menu"} className="ml-auto rounded-lg border border-border p-2 md:hidden">
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-x-0 top-16 z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b border-border bg-background px-5 py-5 shadow-xl md:hidden">
          <div className="relative mb-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documentation" className="h-10 w-full rounded-lg border border-border bg-muted/40 pl-9 text-sm outline-none" />
          </div>
          <nav className="space-y-5">
            {navigation.map((group) => (
              <div key={group.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{group.title}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => <a key={item.id} href={`#${item.id}`} onClick={closeMobile} className="block rounded-md px-3 py-2 text-sm hover:bg-muted">{item.label}</a>)}
                </div>
              </div>
            ))}
          </nav>
        </div>
      )}

      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[230px_minmax(0,780px)_230px] lg:gap-12 xl:grid-cols-[240px_minmax(0,800px)_240px] xl:gap-16">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto py-10 lg:block">
          <nav className="space-y-7 pr-4">
            {navigation.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{group.title}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <a key={item.id} href={`#${item.id}`} className="block rounded-md border-l-2 border-transparent px-3 py-1.5 text-[13px] text-muted-foreground transition hover:border-accent-ink/40 hover:bg-muted/50 hover:text-foreground">
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 px-5 py-12 sm:px-8 lg:px-0 lg:py-16">
          <section id="overview" className="scroll-mt-24 border-b border-border pb-14">
            <div className="flex items-center gap-2 text-sm font-medium text-accent-ink"><BookOpen className="size-4" /> Strap documentation</div>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-5xl">Build, operate, and extend commerce with Strap.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">Strap is a commerce operations platform for businesses that need one workspace for products, inventory, point of sale, customers, staff, branches, online storefronts, orders, purchasing, fulfillment, and operational reporting.</p>
            <p className="mt-4 max-w-3xl leading-7 text-muted-foreground">This documentation is organized like a developer platform: start with the quickstart, learn the system boundaries, follow task-focused guides, then use the API and database references when you need implementation detail.</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                [Rocket, "Production-ready stack", "React, TanStack Start, TypeScript, Vite, Supabase, and Vercel."],
                [ShieldCheck, "Secure by design", "Supabase Auth and PostgreSQL Row Level Security protect tenant data."],
                [Boxes, "Commerce primitives", "Products, stock, sales, customers, orders, branches, and procurement share one data model."],
              ].map(([Icon, title, body]) => {
                const Component = Icon as typeof Rocket;
                return <div key={title as string} className="rounded-xl border border-border bg-card p-4"><Component className="size-4 text-accent-ink" /><p className="mt-3 text-sm font-semibold">{title as string}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{body as string}</p></div>;
              })}
            </div>
          </section>

          <section id="quickstart" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Terminal} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Quickstart</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Get the Strap application running locally, connect it to Supabase, and verify that the production build can be generated before you begin making changes.</p>
            <h3 className="mt-8 text-lg font-semibold">1. Clone and install</h3>
            <CodeBlock>{`git clone https://github.com/fagiteemmanuel4-bit/storefront-flow.git\ncd storefront-flow\n${codeBlocks.install}`}</CodeBlock>
            <h3 className="mt-8 text-lg font-semibold">2. Configure Supabase</h3>
            <p className="mt-3 leading-7 text-muted-foreground">The browser client reads the Supabase URL and publishable key from the Vite environment when available. The project also contains configuration fallbacks for its managed environment. A browser build must only receive a publishable or legacy anonymous key; a Supabase secret key must never be exposed to client code.</p>
            <CodeBlock>{codeBlocks.env}</CodeBlock>
            <h3 className="mt-8 text-lg font-semibold">3. Run the application</h3>
            <CodeBlock>{codeBlocks.install}</CodeBlock>
            <h3 className="mt-8 text-lg font-semibold">4. Validate before committing</h3>
            <CodeBlock>{codeBlocks.build}</CodeBlock>
            <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Development rule:</strong> if a change affects database access, authentication, store ownership, inventory, orders, or payments, validate both the UI behavior and the database authorization boundary.</div>
          </section>

          <section id="project-structure" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Code2} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Project structure</h2>
            <p className="mt-4 leading-7 text-muted-foreground">The application uses TanStack Start with filesystem-oriented routes. Domain behavior is split between route modules, reusable UI, hooks, integrations, and Supabase database types.</p>
            <CodeBlock>{`src/\n├── routes/\n│   ├── __root.tsx\n│   ├── auth.tsx\n│   ├── signup.tsx\n│   ├── email-confirmed.tsx\n│   ├── index.tsx\n│   ├── docs.tsx\n│   ├── privacy.tsx\n│   ├── cookies.tsx\n│   ├── partners.tsx\n│   ├── settings.tsx\n│   ├── advanced-settings.tsx\n│   ├── customer-account.tsx\n│   ├── _authenticated/\n│   └── store/\n├── components/\n├── hooks/\n├── integrations/\n│   └── supabase/\n└── lib/\n\nsupabase/\n└── migrations/`}</CodeBlock>
            <p className="mt-4 leading-7 text-muted-foreground">Keep route-specific behavior close to the route, promote genuinely reusable UI into components, and treat Supabase migrations as the repository-managed source of truth for schema changes.</p>
          </section>

          <section id="architecture" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Server} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Architecture</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Strap is a browser application backed by Supabase. Vercel serves the web application, TanStack Start provides the application and routing model, and Supabase supplies authentication, PostgreSQL data, Row Level Security, and related backend capabilities.</p>
            <div className="my-8 overflow-x-auto rounded-2xl border border-border bg-muted/30 p-5 font-mono text-xs leading-7 text-muted-foreground">
              <pre>{`Browser\n  │\n  ▼\nVercel / application runtime\n  │\n  ▼\nReact + TanStack Start + TanStack Router\n  │\n  ├───────────────┐\n  ▼               ▼\nSupabase Auth   Supabase client\n  │               │\n  └───────┬───────┘\n          ▼\n   PostgreSQL + RLS\n          │\n          ▼\n Store → branches → products → inventory\n        ├→ sales → sale_items\n        ├→ customers\n        ├→ online_store → orders\n        ├→ suppliers → purchase_orders\n        └→ transfers → audit / notifications`}</pre>
            </div>
            <p className="leading-7 text-muted-foreground">The critical security property is that a successful UI check is not considered authorization. Database policies must independently constrain which rows an authenticated user can read or mutate.</p>
          </section>

          <section id="tenancy" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Store} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Multi-tenancy</h2>
            <p className="mt-4 leading-7 text-muted-foreground">A Strap store is the primary tenant boundary. Business data such as products, branches, sales, customers, online-store configuration, orders, suppliers, and operational records is associated with a store.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                ["1", "Identify", "Supabase Auth identifies the current user."],
                ["2", "Resolve membership", "store_members connects the user to a store and role."],
                ["3", "Scope", "Queries and mutations operate against the current store context."],
                ["4", "Enforce", "PostgreSQL RLS independently verifies the data boundary."],
              ].map(([number, title, body]) => <div key={number} className="rounded-xl border border-border p-4"><span className="inline-flex size-6 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">{number}</span><h3 className="mt-3 text-sm font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div>)}
            </div>
            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6"><strong>Never trust a client-supplied store ID as authorization.</strong> A store ID is context, not proof of access. The database policy is the final boundary.</div>
          </section>

          <section id="auth" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={KeyRound} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Authentication</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Authentication is provided by Supabase Auth. Strap persists the browser session, automatically refreshes tokens, and exposes the authenticated identity to the application through the shared Supabase client.</p>
            <CodeBlock>{codeBlocks.auth}</CodeBlock>
            <p className="leading-7 text-muted-foreground">The application contains dedicated authentication, signup, and email-confirmation routes. Authenticated application experiences are grouped beneath the protected route structure.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[[Check, "Sign in", "Create a session using the supported authentication flow."], [Check, "Persist", "Keep the session available between browser navigations."], [Check, "Sign out", "Explicitly terminate the user's session when leaving the workspace."]].map(([Icon, title, body]) => { const Component = Icon as typeof Check; return <div key={title as string} className="rounded-xl border border-border p-4"><Component className="size-4 text-accent-ink" /><p className="mt-3 text-sm font-semibold">{title as string}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{body as string}</p></div>; })}
            </div>
          </section>

          <section id="permissions" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Users} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Roles & permissions</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Store membership supplies the high-level role used to organize access. The current product model includes owner, manager, cashier, inventory, sales, and viewer responsibilities, with additional permission structures available for finer operational control.</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm"><thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-3">Role</th><th className="px-4 py-3">Typical responsibility</th></tr></thead><tbody className="divide-y divide-border">{[["Owner", "Full business administration and store ownership."], ["Manager", "Day-to-day operational management and team oversight."], ["Cashier", "Point-of-sale and customer-facing checkout operations."], ["Inventory", "Products, stock counts, receiving, and inventory operations."], ["Sales", "Sales workflows, customers, and commercial activity."], ["Viewer", "Read-only operational visibility where permitted."]].map(([role, body]) => <tr key={role}><td className="px-4 py-3 font-medium">{role}</td><td className="px-4 py-3 text-muted-foreground">{body}</td></tr>)}</tbody></table>
            </div>
            <p className="mt-5 leading-7 text-muted-foreground">Use roles for coarse access and explicit permissions for granular operations. Never use a hidden button as the only protection for a sensitive mutation.</p>
          </section>

          <section id="data-model" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Database} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Commerce data model</h2>
            <p className="mt-4 leading-7 text-muted-foreground">The data model is designed around the real lifecycle of a merchant operation. Catalogue records become branch inventory, inventory participates in sales and purchasing, customers accumulate commercial history, and the same product catalogue can power the online storefront.</p>
            <div className="mt-6 space-y-2">{endpointRows.slice(1, 13).map(([name, resource, description]) => <details key={name} className="group rounded-xl border border-border bg-card"><summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-sm font-semibold"><ChevronDown className="size-4 transition-transform group-open:rotate-180" /><span>{name}</span><code className="ml-auto hidden rounded bg-muted px-2 py-1 text-xs font-normal text-muted-foreground sm:block">{resource}</code></summary><p className="border-t border-border px-4 py-3.5 text-sm leading-6 text-muted-foreground">{description}</p></details>)}</div>
          </section>

          <section id="products" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Package} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Products & inventory</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Products are the central catalogue primitive. A product can carry a name, SKU, barcode, category, price, cost, images, stock threshold, and other merchandising metadata. Branch stock keeps quantity operationally scoped to a location.</p>
            <h3 className="mt-8 text-lg font-semibold">Recommended lifecycle</h3>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground"><li><strong className="text-foreground">1. Create the product.</strong> Establish the canonical catalogue record before adding branch-specific quantities.</li><li><strong className="text-foreground">2. Assign inventory.</strong> Set branch stock and the appropriate low-stock threshold.</li><li><strong className="text-foreground">3. Sell or receive.</strong> POS sales decrease available stock while purchasing and receiving increase it.</li><li><strong className="text-foreground">4. Monitor.</strong> Use stock levels, notifications, and activity records to identify operational changes.</li></ol>
            <CodeBlock>{codeBlocks.mutation}</CodeBlock>
          </section>

          <section id="pos" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={ShoppingBag} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Point of sale</h2>
            <p className="mt-4 leading-7 text-muted-foreground">The POS flow is designed around a fast checkout loop: choose a branch, add products, review quantities, associate a customer when appropriate, select payment, confirm the sale, and reflect the inventory change.</p>
            <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5 font-mono text-xs leading-7 text-muted-foreground"><pre>{`Branch → Product search / barcode → Cart\n       → quantity / pricing → customer\n       → payment → sale → sale_items\n       → inventory update → receipt / confirmation`}</pre></div>
            <p className="mt-5 leading-7 text-muted-foreground">Payment methods in the current model include cash, card, transfer, and credit. Treat a sale as successful only after the backend mutation has completed successfully; do not display a success state before persistence is confirmed.</p>
          </section>

          <section id="branches" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={GitBranch} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Branches & stock transfers</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Branches represent physical or operational business locations. Inventory is scoped to branches so a merchant can understand what is available at each location instead of treating the entire store as one undifferentiated stock pool.</p>
            <p className="mt-4 leading-7 text-muted-foreground">Stock transfers provide an auditable movement path between locations. A transfer can progress through requested, approved, dispatched, and received states, with cancellation available where supported by the workflow.</p>
            <div className="mt-6 rounded-xl border border-border p-5"><p className="text-sm font-semibold">Inventory invariant</p><p className="mt-2 text-sm leading-6 text-muted-foreground">When moving stock between branches, update the source and destination through the supported transfer workflow rather than silently editing two quantities. The transfer record is part of the operational history.</p></div>
          </section>

          <section id="online-store" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Store} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Online storefront</h2>
            <p className="mt-4 leading-7 text-muted-foreground">The online store extends the merchant catalogue into a customer-facing shopping experience. Storefront configuration includes identity, contact information, shipping guidance, checkout notes, publication state, themes, navigation, sections, SEO, and custom presentation settings.</p>
            <p className="mt-4 leading-7 text-muted-foreground">The visual editor is intended to let merchants customize content and layout without duplicating the core catalogue. Product data remains an operational source of truth while the storefront determines how that data is presented publicly.</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">{[[Zap, "Visual editing", "Compose storefront sections and preview responsive presentation."], [ShoppingBag, "Shared catalogue", "Expose selected products online without creating a second product system."], [Rocket, "Publishing", "Control whether the configured storefront is available to customers."], [Search, "SEO", "Configure storefront metadata and discovery-oriented presentation."]].map(([Icon, title, body]) => { const Component = Icon as typeof Zap; return <div key={title as string} className="rounded-xl border border-border p-4"><Component className="size-4 text-accent-ink" /><p className="mt-3 text-sm font-semibold">{title as string}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{body as string}</p></div>; })}</div>
          </section>

          <section id="orders" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={ShoppingBag} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Orders & fulfillment</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Online orders connect storefront checkout to merchant operations. Orders retain customer information, shipping information, payment method, totals, status, and line items so the merchant can move from purchase to fulfillment without losing context.</p>
            <div className="mt-6 rounded-2xl border border-border bg-muted/30 p-5 font-mono text-xs leading-7 text-muted-foreground"><pre>{`pending → confirmed → processing → shipped → completed\n       └──────────────────────────────→ cancelled`}</pre></div>
            <p className="mt-5 leading-7 text-muted-foreground">Order status history should be treated as an operational timeline. Shipping and tracking information belongs to the fulfillment lifecycle and should not be inferred only from the current status label.</p>
          </section>

          <section id="staff" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Users} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Staff & operations</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Staff management supports day-to-day store operations without conflating every operational worker with the primary merchant identity. Staff accounts can carry roles, active state, login metadata, failed-login tracking, and audit information.</p>
            <p className="mt-4 leading-7 text-muted-foreground">Operational events should remain observable. Notifications communicate actionable changes while the activity log provides a historical record of actor, entity, action, summary, metadata, and timestamp.</p>
          </section>

          <section id="api" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Code2} />
            <h2 className="font-display text-3xl font-bold tracking-tight">API reference</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Strap is primarily a Supabase-backed application rather than a conventional REST server with manually maintained controllers for every commerce operation. The most useful API reference is therefore the combination of Supabase Auth methods, typed database resources, database functions where present, and the application's route-level data operations.</p>
            <div className="mt-7 overflow-hidden rounded-xl border border-border">
              <div className="border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resource reference</div>
              <div className="divide-y divide-border">{endpointRows.map(([name, resource, description]) => <div key={name} className="grid gap-2 px-4 py-4 sm:grid-cols-[140px_210px_1fr] sm:items-start"><div className="text-sm font-semibold">{name}</div><code className="w-fit rounded bg-muted px-2 py-1 text-xs text-muted-foreground">{resource}</code><p className="text-sm leading-6 text-muted-foreground">{description}</p></div>)}</div>
            </div>
            <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Reference rule:</strong> table names describe current data resources, not guaranteed public HTTP endpoints. Use the application's typed Supabase client and route implementation as the source of truth for a specific operation.</div>
          </section>

          <section id="supabase" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Database} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Client SDK integration</h2>
            <p className="mt-4 leading-7 text-muted-foreground">The repository exposes a shared typed Supabase browser client at <code className="rounded bg-muted px-1.5 py-0.5 text-sm">@/integrations/supabase/client</code>. The client is generated around the project's database types and is responsible for session persistence, automatic token refresh, and safe browser-key handling.</p>
            <CodeBlock>{codeBlocks.supabase}</CodeBlock>
            <h3 className="mt-8 text-lg font-semibold">Authentication with the client</h3>
            <CodeBlock>{codeBlocks.auth}</CodeBlock>
            <h3 className="mt-8 text-lg font-semibold">Mutations</h3>
            <p className="mt-3 leading-7 text-muted-foreground">Treat every mutation as a fallible operation. Check the returned error before updating local state, displaying success, navigating, or invalidating dependent queries.</p>
            <CodeBlock>{codeBlocks.mutation}</CodeBlock>
            <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">Key rule:</strong> the browser may use the Supabase publishable or anonymous key. It must never contain a Supabase service-role or secret key.</div>
          </section>

          <section id="database" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={ShieldCheck} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Database & Row Level Security</h2>
            <p className="mt-4 leading-7 text-muted-foreground">PostgreSQL is the persistent system of record. Row Level Security is enabled across the application's exposed public data model so authenticated users cannot rely on client-side filtering to access another store's records.</p>
            <h3 className="mt-8 text-lg font-semibold">Schema change workflow</h3>
            <div className="mt-4 rounded-2xl border border-border bg-muted/30 p-5 font-mono text-xs leading-7 text-muted-foreground"><pre>{`Migration → local validation → code update → review → deploy\n     │\n     └── supabase/migrations/`}</pre></div>
            <p className="mt-5 leading-7 text-muted-foreground">Repository-managed migrations are the durable record of schema evolution. Do not make a production-only database change and leave the repository unaware of it.</p>
            <h3 className="mt-8 text-lg font-semibold">RLS checklist</h3>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-muted-foreground">{["Every exposed table has an intentional access policy.", "Policies identify the authenticated user through the supported Supabase identity context.", "Store-scoped records are tied back to an authorized store membership.", "Sensitive mutations cannot be performed merely by changing a client-side store_id.", "Service-level credentials are never shipped to browser code."].map((item) => <li key={item} className="flex gap-2"><Check className="mt-1 size-4 shrink-0 text-accent-ink" />{item}</li>)}</ul>
          </section>

          <section id="deployment" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={Rocket} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Deployment</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Vercel is the application hosting layer for Strap. GitHub remains the source-control system, while Supabase owns the database and authentication backend. Treat those as separate deployment surfaces with separate validation responsibilities.</p>
            <div className="my-7 grid gap-3 sm:grid-cols-3">{[[GitBranch, "GitHub", "Source, branches, commits, pull requests, and review."], [Rocket, "Vercel", "Build, deploy, preview, and serve the web application."], [Database, "Supabase", "Authentication, PostgreSQL, RLS, and backend data services."]].map(([Icon, title, body]) => { const Component = Icon as typeof GitBranch; return <div key={title as string} className="rounded-xl border border-border p-4"><Component className="size-4 text-accent-ink" /><p className="mt-3 text-sm font-semibold">{title as string}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{body as string}</p></div>; })}</div>
            <h3 className="text-lg font-semibold">Release checklist</h3>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground"><li><strong className="text-foreground">1. Review.</strong> Confirm the change does not weaken tenant isolation or alter unrelated workflows.</li><li><strong className="text-foreground">2. Lint.</strong> Run <code className="rounded bg-muted px-1.5 py-0.5">npm run lint</code>.</li><li><strong className="text-foreground">3. Build.</strong> Run <code className="rounded bg-muted px-1.5 py-0.5">npm run build</code>.</li><li><strong className="text-foreground">4. Database.</strong> Apply and verify migrations when schema changes are involved.</li><li><strong className="text-foreground">5. Deploy.</strong> Allow Vercel to build the application from the reviewed Git state.</li><li><strong className="text-foreground">6. Verify.</strong> Test authentication, store access, critical mutations, and production navigation after deployment.</li></ol>
          </section>

          <section id="errors" className="scroll-mt-24 border-b border-border py-14">
            <SectionIcon icon={CircleHelp} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Troubleshooting & error codes</h2>
            <p className="mt-4 leading-7 text-muted-foreground">When a request fails, start at the boundary where the failure occurs: browser configuration, authentication, store context, authorization, validation, database constraints, or network availability. The table below provides the expected diagnosis path for common application-level failures.</p>
            <div className="mt-7 overflow-hidden rounded-xl border border-border">
              <div className="divide-y divide-border">{errorRows.map(([code, meaning, fix]) => <div key={code} className="p-4"><div className="flex items-center gap-2"><AlertCircle className="size-4 text-accent-ink" /><code className="rounded bg-muted px-2 py-1 text-xs font-semibold">{code}</code></div><p className="mt-3 text-sm font-medium">{meaning}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{fix}</p></div>)}</div>
            </div>
            <h3 className="mt-8 text-lg font-semibold">Build failures</h3>
            <p className="mt-3 leading-7 text-muted-foreground">If Vercel fails while the application works locally, first reproduce the production build locally with the same Node/runtime assumptions and inspect environment configuration. Missing browser variables, type errors, route generation failures, and dependency mismatches should be fixed in the repository rather than worked around in the deployment dashboard.</p>
            <CodeBlock>{codeBlocks.build}</CodeBlock>
          </section>

          <section id="security" className="scroll-mt-24 py-14">
            <SectionIcon icon={ShieldCheck} />
            <h2 className="font-display text-3xl font-bold tracking-tight">Security checklist</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Commerce data contains operational and customer information. Every contributor should preserve the following boundaries when adding features or changing existing flows.</p>
            <div className="mt-7 space-y-3">{[
              "Use Supabase Auth for identity rather than inventing a second browser authentication mechanism.",
              "Keep publishable keys in browser code and keep service-level secrets on trusted server infrastructure only.",
              "Use PostgreSQL RLS as the final tenant and authorization boundary.",
              "Validate ownership before creating or mutating store-scoped records.",
              "Do not display a success message until the backend mutation has completed successfully.",
              "Do not silently swallow mutation errors; surface actionable feedback and preserve the failed state.",
              "Use migrations for repository-managed database changes.",
              "Avoid logging customer data, authentication tokens, secret keys, or sensitive payment information.",
              "When adding a new store-scoped table, design its RLS policies before exposing it through the application.",
            ].map((item, index) => <div key={item} className="flex gap-3 rounded-xl border border-border p-4"><span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span><p className="text-sm leading-6 text-muted-foreground">{item}</p></div>)}</div>
            <div className="mt-8 rounded-2xl border border-border bg-foreground p-6 text-background"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-background/50">Final principle</p><h3 className="mt-3 font-display text-2xl font-bold">The database is the security boundary.</h3><p className="mt-3 max-w-2xl text-sm leading-6 text-background/70">UI permissions improve the experience, but they do not replace authorization. If a user can send a request directly to Supabase, the database must still determine whether that request is allowed.</p></div>
          </section>

          <footer className="border-t border-border py-12">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-display text-lg font-bold">Strap by Kryonara</p><p className="mt-1 text-sm text-muted-foreground">Commerce operations for modern businesses.</p></div>
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground"><a href="https://github.com/fagiteemmanuel4-bit/storefront-flow" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">GitHub <ExternalLink className="size-3" /></a><Link to="/auth" className="inline-flex items-center gap-1.5 hover:text-foreground">Open Strap <ArrowRight className="size-3" /></Link></div>
            </div>
          </footer>
        </article>

        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto py-16 xl:block">
          <div className="border-l border-border pl-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">On this page</p>
            <nav className="mt-4 space-y-2 text-sm text-muted-foreground">
              {["overview", "quickstart", "architecture", "tenancy", "auth", "api", "supabase", "database", "deployment", "errors", "security"].map((id) => {
                const item = searchItems.find((entry) => entry.id === id);
                return item ? <a key={id} href={`#${id}`} className="block py-0.5 hover:text-foreground">{item.label}</a> : null;
              })}
            </nav>
          </div>
        </aside>
      </div>
    </main>
  );
}
