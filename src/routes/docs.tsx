import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Code2,
  Globe2,
  KeyRound,
  Package,
  Palette,
  Receipt,
  Rocket,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  WifiOff,
  Zap,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SeoJsonLd } from "@/components/site/SeoJsonLd";
import { breadcrumbSchema, marketingHead, SITE_URL } from "@/lib/marketingSeo";

const docsSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  headline: "Strap Product Documentation",
  description: "Customer guides for using Strap retail point of sale, inventory, teams, branches, online stores, security and supported integrations.",
  author: { "@type": "Organization", name: "Kryonara" },
  publisher: { "@type": "Organization", name: "Kryonara", url: SITE_URL },
  mainEntityOfPage: `${SITE_URL}/docs`,
  inLanguage: "en-NG",
};
const docsBreadcrumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Documentation", path: "/docs" },
]);

export const Route = createFileRoute("/docs")({
  head: () => marketingHead({
    title: "Strap Documentation — Retail POS, Inventory and Online Store Guides",
    description: "Learn how to use Strap for point of sale, inventory, customers, staff, branches, online stores, orders, reports and account security.",
    path: "/docs",
  }),
  component: DocsPage,
});

type Item = { id: string; label: string; group: string; keywords: string };
const sections: Array<{ group: string; items: Array<{ id: string; label: string; keywords: string }> }> = [
  { group: "Overview", items: [{ id: "overview", label: "Overview", keywords: "platform retail operations workspace" }] },
  { group: "Start here", items: [
    { id: "quickstart", label: "Quickstart", keywords: "setup first sale create store profile onboarding" },
    { id: "concepts", label: "Core concepts", keywords: "workspace branch product transaction stock role access" },
    { id: "workspace", label: "Your workspace", keywords: "dashboard navigation store context" },
  ] },
  { group: "Guides", items: [
    { id: "products", label: "Products & inventory", keywords: "catalogue sku barcode quantities low stock stock adjustments" },
    { id: "pos", label: "Point of sale", keywords: "checkout register cart payments receipt scanner" },
    { id: "customers", label: "Customers", keywords: "customer records purchase history" },
    { id: "staff", label: "Staff & roles", keywords: "owner manager cashier permissions invitations" },
    { id: "branches", label: "Branches", keywords: "locations transfers stock" },
    { id: "expenses", label: "Expenses & reports", keywords: "costs revenue sales performance reports" },
    { id: "receipts", label: "Receipts and printing", keywords: "receipt paper printer branding copies" },
    { id: "offline", label: "Offline sales", keywords: "offline synchronization queue reconnect" },
  ] },
  { group: "Online commerce", items: [
    { id: "storefront", label: "Online storefront", keywords: "public store share catalogue ecommerce" },
    { id: "catalogue", label: "Online catalogue", keywords: "categories product pages featured products" },
    { id: "orders", label: "Orders and fulfilment", keywords: "incoming orders status customer orders" },
    { id: "builder", label: "Store builder", keywords: "design layout storefront theme" },
  ] },
  { group: "Account and security", items: [
    { id: "account", label: "Account and sign in", keywords: "email otp authentication profile" },
    { id: "security", label: "Security", keywords: "password sessions access protection" },
    { id: "privacy", label: "Privacy and data", keywords: "export delete retention personal information" },
    { id: "theme", label: "Theme and display", keywords: "dark mode light mode appearance" },
  ] },
  { group: "Integrations and API", items: [
    { id: "ai-agents", label: "AI integrations and MCP", keywords: "remote mcp oauth connected applications branch scope read write access" },
    { id: "api", label: "API reference and access", keywords: "public api endpoint integration mcp supported interface" },
    { id: "connected-apps", label: "Connected applications", keywords: "permissions revoke authorization access audit" },
  ] },
  { group: "Support", items: [
    { id: "troubleshooting", label: "Troubleshooting", keywords: "problems missing products scanner order" },
    { id: "faq", label: "Frequently asked questions", keywords: "common questions help" },
    { id: "support", label: "Contact support", keywords: "help centre support contact feedback" },
  ] },
];
const searchItems: Item[] = sections.flatMap((section) =>
  section.items.map((item) => ({ ...item, group: section.group })),
);

function CodeBlock({ children }: { children: string }) {
  async function copyCode() {
    try {
      await navigator.clipboard.writeText(children);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy is not available in this browser");
    }
  }
  return (
    <div className="my-5 overflow-hidden rounded-xl border border-border bg-foreground text-background">
      <div className="flex items-center justify-between gap-4 border-b border-background/15 px-4 py-2.5">
        <span className="text-[10px] font-bold uppercase tracking-[.14em] text-background/55">Integration endpoint</span>
        <button type="button" onClick={() => void copyCode()} className="rounded-md border border-background/20 px-3 py-1.5 text-xs font-semibold text-background hover:bg-background/10" aria-label="Copy integration endpoint">Copy</button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-6"><code>{children}</code></pre>
    </div>
  );
}

function DocsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? searchItems.filter((item) => `${item.label} ${item.group} ${item.keywords}`.toLowerCase().includes(q))
      : [];
  }, [query]);

  return (
    <div className="marketing-site min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="marketing-breadcrumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link><ChevronRight size={14} aria-hidden="true" /><span aria-current="page">Documentation</span>
          </div>
          <div className="relative py-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <label htmlFor="docs-search" className="sr-only">Search documentation</label>
            <input
              id="docs-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search guides, workflows, inventory, checkout and more"
              aria-label="Search all Strap documentation"
              aria-controls="docs-search-results"
              className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition focus:border-accent-ink/60 focus:ring-2 focus:ring-accent/20"
            />
            {query && (
              <div id="docs-search-results" className="absolute left-0 right-0 top-[calc(100%-8px)] z-30 max-h-80 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl">
                {filtered.length ? filtered.map((item) => (
                  <a key={item.id} href={`#${item.id}`} onClick={() => setQuery("")} className="block rounded-lg px-3 py-3 hover:bg-muted">
                    <span className="block text-sm font-semibold">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.group} · {item.keywords}</span>
                  </a>
                )) : <p className="p-3 text-sm text-muted-foreground">No matching guide found. Try a broader search term.</p>}
              </div>
            )}
          </div>
        </div>
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[220px_minmax(0,1fr)_190px] xl:gap-12">
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] overflow-y-auto py-10 lg:block">
          <nav className="space-y-6">
            {sections.map((section) => (
              <div key={section.group}>
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">
                  {section.group}
                </p>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className="block rounded-md border-l-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground hover:border-accent-ink/40 hover:bg-muted/50 hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 max-w-4xl px-5 py-10 sm:px-8 lg:px-0 lg:py-12">
          <section id="overview" className="scroll-mt-24 border-b border-border pb-14">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent-ink">
              <BookOpen className="size-4" /> Strap documentation
            </div>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Everything you need to run your store with Strap.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Strap brings retail POS, inventory, products, customers, staff, branches, expenses,
              reports and online selling into one commerce workspace. These docs explain how to use
              the product, not just how the software is built.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Info
                icon={Rocket}
                title="Start quickly"
                body="Set up your shop, add products and make your first sale."
              />
              <Info
                icon={Boxes}
                title="Stay organised"
                body="Keep stock, customers, expenses and orders connected."
              />
              <Info
                icon={Globe2}
                title="Sell online"
                body="Publish a catalogue and manage online orders from Strap."
              />
            </div>
          </section>

          <DocSection id="quickstart" icon={Zap} title="Quickstart" eyebrow="Start in minutes">
            <p>
              Strap is designed around the daily rhythm of a shop. After creating or opening your
              workspace, start with your store profile, add products, then use the POS for sales.
              You can enable the online storefront when you are ready.
            </p>
            <ol className="mt-6 space-y-4">
              {[
                [
                  "1",
                  "Create your workspace",
                  "Complete onboarding and confirm your store details.",
                ],
                [
                  "2",
                  "Add your catalogue",
                  "Create products with names, prices, SKUs, barcodes and stock.",
                ],
                [
                  "3",
                  "Make a sale",
                  "Open Point of Sale, search or scan an item, then complete checkout.",
                ],
                [
                  "4",
                  "Review the business",
                  "Use inventory, expenses, reports and insights to understand the day.",
                ],
                [
                  "5",
                  "Go online",
                  "Configure the online store, publish products and start receiving orders.",
                ],
              ].map(([n, title, body]) => (
                <li key={n} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-ink">
                    {n}
                  </span>
                  <div>
                    <h3 className="font-semibold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </DocSection>

          <DocSection
            id="workspace"
            icon={Store}
            title="Your workspace"
            eyebrow="One source of truth"
          >
            <p>
              The Strap workspace connects the operational parts of a retail business. Your store is
              the tenancy boundary: products, stock, sales, customers, staff activity and other
              records belong to the appropriate store context.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Feature
                title="Dashboard"
                body="A high-level view of activity and business signals."
              />
              <Feature
                title="Products"
                body="Catalogue, pricing, SKU, barcode and inventory management."
              />
              <Feature
                title="Point of Sale"
                body="Fast cart building, scanning, checkout and receipts."
              />
              <Feature
                title="Online Store"
                body="Public catalogue, storefront configuration and orders."
              />
            </div>
          </DocSection>
          <DocSection
            id="products"
            icon={Package}
            title="Products & inventory"
            eyebrow="Know what you have"
          >
            <p>
              Create and maintain the products you sell. Keep identifiers such as SKU and barcode
              consistent so search and scanning remain fast. Inventory is tracked with branch-aware
              stock records where applicable.
            </p>
            <ul className="mt-5 list-disc space-y-2 pl-5 text-muted-foreground">
              <li>Add products manually or import a catalogue.</li>
              <li>Set pricing, identifiers, categories and stock information.</li>
              <li>Review low-stock and out-of-stock items before they affect sales.</li>
              <li>Use branches and transfers when stock moves between locations.</li>
            </ul>
          </DocSection>
          <DocSection id="pos" icon={Receipt} title="Point of sale" eyebrow="Sell faster">
            <p>
              Point of Sale is the counter workflow: find or scan products, build a cart, review
              totals and complete the transaction. Compatible camera, USB and Bluetooth scanner
              workflows depend on the device and browser.
            </p>
            <CodeBlock>{`Find a product → Add to cart → Review quantity → Complete payment → Issue receipt`}</CodeBlock>
          </DocSection>
          <DocSection id="customers" icon={Users} title="Customers" eyebrow="Build relationships">
            <p>
              Customers are scoped to your store. Use customer records to keep useful purchase
              relationships organised and make repeat service easier.
            </p>
          </DocSection>
          <DocSection id="staff" icon={ShieldCheck} title="Staff & roles" eyebrow="Work as a team">
            <p>
              Store roles help owners, managers and cashiers work with appropriate access. Give team
              members only the access they need for their responsibilities and review account
              activity when something looks unusual.
            </p>
          </DocSection>
          <DocSection
            id="branches"
            icon={Boxes}
            title="Branches"
            eyebrow="Operate across locations"
          >
            <p>
              Branches represent business locations. Branch-aware inventory and transfers let a
              business keep stock organised as products move between locations.
            </p>
          </DocSection>
          <DocSection
            id="expenses"
            icon={BarChart3}
            title="Expenses & reports"
            eyebrow="Understand the numbers"
          >
            <p>
              Record expenses alongside sales and use reports and insights to understand
              performance, stock value and operational signals. Reports are decision-support tools:
              use them to identify what needs attention rather than simply collecting numbers.
            </p>
          </DocSection>

          <DocSection
            id="storefront"
            icon={Globe2}
            title="Online storefront"
            eyebrow="Sell beyond the counter"
          >
            <p>
              Strap can publish a shareable storefront so customers can browse products and place
              online orders. Public storefront pages are designed to be discoverable, while private
              management pages remain behind authentication.
            </p>
          </DocSection>
          <DocSection
            id="catalogue"
            icon={ShoppingBag}
            title="Catalogue"
            eyebrow="Present your products"
          >
            <p>
              Choose the products that should appear online, organise categories and keep product
              information accurate. Public product pages should contain useful names, descriptions
              and imagery because this is the content customers and search engines can understand.
            </p>
          </DocSection>
          <DocSection
            id="orders"
            icon={Package}
            title="Orders & fulfillment"
            eyebrow="From checkout to delivery"
          >
            <p>
              Online orders connect the customer-facing storefront with the operational workspace.
              Review order details, status and fulfilment information from the online-store
              workflow.
            </p>
          </DocSection>
          <DocSection
            id="builder"
            icon={Store}
            title="Store builder"
            eyebrow="Shape your storefront"
          >
            <p>
              Use the store builder and advanced editor to configure the presentation of your online
              shop. The builder is for creating the customer-facing experience; this documentation
              explains how to use it, not how to modify Strap's internal source code.
            </p>
          </DocSection>

          <DocSection
            id="account"
            icon={KeyRound}
            title="Account & sign in"
            eyebrow="Access your workspace"
          >
            <p>
              Sign in to access private business tools. Strap uses authenticated sessions for
              protected areas. If your session expires, sign in again rather than trying to bypass
              the application access controls.
            </p>
          </DocSection>
          <DocSection
            id="security"
            icon={ShieldCheck}
            title="Security"
            eyebrow="Protect the business"
          >
            <p>
              Strap uses Supabase Auth and PostgreSQL Row Level Security for protected data access.
              Keep publishable browser keys limited to their intended use and never expose
              service-role or other secret keys in client-side code. RLS is the database-level
              boundary that protects tenant records.
            </p>
          </DocSection>
          <DocSection
            id="privacy"
            icon={ShieldCheck}
            title="Privacy & data"
            eyebrow="Your business data"
          >
            <p>
              Use the public privacy and terms pages for legal information. Within the product,
              follow the account and security controls provided by Strap. Do not place secrets,
              passwords or private credentials into product descriptions, support requests or other
              public fields.
            </p>
          </DocSection>
          <DocSection
            id="theme"
            icon={Palette}
            title="Theme & display"
            eyebrow="Make Strap comfortable to use"
          >
            <p>
              Strap uses light mode by default. Open Settings → Theme & display to choose Light,
              Dark or System. Your preference is saved to your account and restored when you sign
              in. Authentication and connection-approval screens stay in light mode for a
              consistent, readable security experience.
            </p>
          </DocSection>

          <DocSection
            id="ai-agents"
            icon={Bot}
            title="AI agents & MCP"
            eyebrow="Connect an assistant with explicit permission"
          >
            <p>
              STRAP MCP lets compatible AI assistants, including Claude, connect to your workspace
              through OAuth 2.1. The connection is tied to the signed-in STRAP user and the OAuth
              application, rather than a shared database password or service-role key.
            </p>
            <CodeBlock>{`https://lhizunrljottkhemdfei.supabase.co/functions/v1/mcp`}</CodeBlock>
            <h3 className="mt-6 font-semibold">Approve access on first connection</h3>
            <p className="mt-2">
              The STRAP approval screen lets an owner or manager choose a store, select all branches
              or specific locations, and decide which information the assistant may read. Expense
              and customer access start disabled. Product creation, product updates and stock
              changes are also disabled until explicitly enabled.
            </p>
            <h3 className="mt-6 font-semibold">Manage or revoke a connection</h3>
            <p className="mt-2">
              Open Settings → Connected applications to review authorised AI apps, edit each app's
              branch and action permissions, or revoke its OAuth grant. Revoking a grant invalidates
              that app's active OAuth tokens. Changes to a connection's access apply to its future
              MCP requests.
            </p>
            <h3 className="mt-6 font-semibold">Available capabilities</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground">
              <li>Identify the connected STRAP user and list authorised stores.</li>
              <li>
                Search products, review stock, branches, sales, expenses and customer records when
                permitted.
              </li>
              <li>
                Create products, update catalogue details and set exact stock quantities when write
                access is enabled.
              </li>
            </ul>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Branch selection applies to branch-level inventory, sales, expenses and stock updates.
              Product catalogue edits are store-wide. STRAP does not currently expose AI write tools
              for payments, refunds, staff permissions or store deletion.
            </p>
          </DocSection>

          <DocSection
            id="api"
            icon={Code2}
            title="API reference and supported access"
            eyebrow="Integration availability"
          >
            <p>
              Strap does not currently publish a general-purpose customer API reference. The supported
              external AI integration is Strap MCP, which uses a remote endpoint and an explicit
              authorization flow. Access is limited by the permissions approved for each connection.
            </p>
            <p>
              Do not share account passwords, staff PINs or private credentials with an external
              application. Review requested permissions before approving a connection and revoke
              access when it is no longer needed.
            </p>
            <CodeBlock>https://lhizunrljottkhemdfei.supabase.co/functions/v1/mcp</CodeBlock>
            <p className="text-sm text-muted-foreground">
              The endpoint is intended for compatible remote MCP clients. Setup steps vary by client.
              See the integration guide for the connection and consent workflow.
            </p>
            <Link to="/mcp" className="mt-3 inline-flex items-center gap-2 font-semibold text-accent-ink">
              Read the Strap MCP integration guide <ArrowRight className="size-4" />
            </Link>
          </DocSection>
          <DocSection
            id="troubleshooting"
            icon={Zap}
            title="Troubleshooting"
            eyebrow="When something does not work"
          >
            <div className="space-y-4">
              {[
                [
                  "I cannot access my workspace",
                  "Confirm you are signed in and that the correct store context is selected.",
                ],
                [
                  "A product is missing",
                  "Check the current store, product status, catalogue filters and inventory records.",
                ],
                [
                  "A scan does not work",
                  "Check camera permissions or scanner connection and test keyboard-wedge input if supported.",
                ],
                [
                  "An online order is not visible",
                  "Refresh the online-store orders view and confirm that the order belongs to the current store.",
                ],
                [
                  "I see an authorization error",
                  "Do not bypass access controls. Confirm your membership and role, then sign in again if the session is stale.",
                ],
              ].map(([q, a]) => (
                <div key={q} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="font-semibold">{q}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{a}</p>
                </div>
              ))}
            </div>
          </DocSection>

          <DocSection id="faq" icon={BookOpen} title="FAQ" eyebrow="Common questions">
            <div className="space-y-3">
              {[
                [
                  "What is Strap?",
                  "Strap is a commerce operations platform combining retail POS, inventory, products, customers, staff, branches, reports and online selling.",
                ],
                [
                  "Is Strap an online store builder?",
                  "Yes. Strap includes an online storefront and store-building tools alongside the operational retail workspace.",
                ],
                [
                  "Is Strap a POS system?",
                  "Yes. Point of Sale is one of the core workflows, alongside inventory, customers, expenses and reporting.",
                ],
                [
                  "Is Strap like Shopify or Wix?",
                  "Strap overlaps with ecommerce and store-building products, but its positioning is broader around connected retail operations, including physical-store workflows.",
                ],
                [
                  "Where can I learn how to use Strap?",
                  "This documentation is the main public product guide. Start with Quickstart and then choose the workflow you need.",
                ],
              ].map(([q, a]) => (
                <details key={q} className="group border-b border-border py-4">
                  <summary className="cursor-pointer list-none font-semibold">
                    {q}
                    <ChevronRight className="float-right size-4 transition group-open:rotate-90" />
                  </summary>
                  <p className="pt-3 text-sm leading-6 text-muted-foreground">{a}</p>
                </details>
              ))}
            </div>
          </DocSection>

          <DocSection
            id="receipts"
            icon={Receipt}
            title="Receipt preferences and printing"
            eyebrow="Customer-ready records"
          >
            <p>
              Store owners and managers can configure receipt branding and content in Settings →
              Receipts. Preferences include business identity, logo URL, address, phone, email, tax
              ID, header and footer wording, receipt prefix, paper width, copy count, text size and
              header alignment.
            </p>
            <p>
              Receipt content can be tailored to show or hide the reference, timestamp, customer,
              branch, item details, subtotal, tax, payment method and closing message. The live
              preview helps check the layout before saving. POS printing uses the saved store
              preferences when available; browser pop-up and printer permissions still apply.
            </p>
            <p>
              Receipt settings are store-scoped. Only owners and managers can save them. Cashiers
              can use the receipt workflow according to their existing role permissions.
            </p>
          </DocSection>
          <DocSection
            id="offline"
            icon={WifiOff}
            title="Offline sales and synchronization"
            eyebrow="Keep selling during interruptions"
          >
            <p>
              When supported connectivity is unavailable, Strap can queue eligible sales locally
              with a stable transaction identifier. The application retries synchronization when the
              device reconnects and checks for an existing transaction before replaying a queued
              sale to reduce duplicate-sale risk.
            </p>
            <p>
              Keep the device secure and reconnect regularly. Confirm queued sales have synchronized
              before clearing browser storage, signing out of a shared device or moving to another
              device. Offline mode does not guarantee conflict-free stock reconciliation across
              multiple devices.
            </p>
          </DocSection>
          <DocSection
            id="connected-apps"
            icon={ShieldCheck}
            title="Connected apps and access"
            eyebrow="Authorised integrations"
          >
            <p>
              Connected applications and MCP clients use explicit per-client authorization grants.
              Store owners can review available access, approve the permissions requested for an
              integration and revoke grants that are no longer needed. Audit events support security
              review and accountability.
            </p>
            <p>
              Never share staff PINs, account passwords or private API credentials with an
              integration. Give external clients only the access needed for their task.
            </p>
          </DocSection>

          <DocSection id="support" icon={BookOpen} title="Support" eyebrow="Get help with Strap">
            <p>
              If you need help with setup or a product workflow, start with the Help Centre. For an
              account-specific issue, sign in and use the in-app feedback option so the team can see
              which part of the workspace you were using.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link to="/support" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-4 py-2.5 text-sm font-semibold text-background">Visit Help Centre <ArrowRight size={15}/></Link>
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold">Contact options</Link>
            </div>
          </DocSection>
          <nav className="mt-12 grid gap-3 border-t border-border pt-8 sm:grid-cols-2" aria-label="Documentation navigation">
            <Link to="/getting-started" className="rounded-xl border border-border p-4 hover:bg-muted/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Previous guide</span>
              <span className="mt-1 block font-semibold">Getting started</span>
            </Link>
            <Link to="/support" className="rounded-xl border border-border p-4 text-right hover:bg-muted/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Next guide</span>
              <span className="mt-1 block font-semibold">Help Centre</span>
            </Link>
          </nav>
        </article>
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] overflow-y-auto py-10 xl:block" aria-label="On this page">
          <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[.15em] text-muted-foreground">On this page</p>
          <nav className="space-y-1">
            {sections.flatMap((section) => section.items).map((item) => (
              <a key={item.id} href={`#${item.id}`} className="block rounded-md px-2 py-1.5 text-xs leading-5 text-muted-foreground hover:bg-muted hover:text-foreground">
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
      </div>
      </main>
      <SiteFooter />
      <SeoJsonLd data={docsSchema} />
      <SeoJsonLd data={docsBreadcrumbs} />
    </div>
  );
}

function Info({ icon: Icon, title, body }: { icon: typeof Rocket; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-5 text-accent-ink" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="flex items-center gap-2 font-semibold">
        <CheckCircle2 className="size-4 text-accent-ink" />
        {title}
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}
function DocSection({
  id,
  icon: Icon,
  eyebrow,
  title,
  children,
}: {
  id: string;
  icon: typeof Rocket;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-border py-12 first:pt-0">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-accent-ink">
        <Icon className="size-4" />
        {eyebrow}
      </div>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">{title}</h2>
      <div className="prose prose-neutral mt-5 max-w-none text-[15px] leading-7 text-muted-foreground [&_p]:max-w-3xl [&_h3]:text-foreground">
        {children}
      </div>
    </section>
  );
}
