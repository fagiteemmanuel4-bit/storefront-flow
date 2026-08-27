import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, Boxes, CheckCircle2, ChevronRight, Globe2, KeyRound, Package, Receipt, Rocket, Search, ShieldCheck, ShoppingBag, Store, Users, Zap } from "lucide-react";
import { useMemo, useState } from "react";

const SITE_URL = "https://storefront-flow.vercel.app";

export const Route = createFileRoute("/docs")({
  head: () => ({
    meta: [
      { title: "Strap Documentation — Retail POS, Inventory, Online Store & Commerce" },
      { name: "description", content: "Learn how to use Strap for retail POS, inventory, products, customers, staff, branches, online stores, orders, reports, security, and everyday shop operations." },
      { name: "keywords", content: "Strap documentation, retail POS guide, inventory management guide, online store guide, shop management, ecommerce operations, Shopify alternative, Wix alternative" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "Strap Documentation — Learn the commerce platform" },
      { property: "og:description", content: "Practical guides for products, inventory, POS, customers, staff, online storefronts, orders, reports and security in Strap." },
      { property: "og:url", content: `${SITE_URL}/docs` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/docs` }],
  }),
  component: DocsPage,
});

type Item = { id: string; label: string; group: string };
const sections: Array<{ group: string; items: Array<{ id: string; label: string }> }> = [
  { group: "Start here", items: [{ id: "overview", label: "Overview" }, { id: "quickstart", label: "Quickstart" }, { id: "workspace", label: "Your workspace" }] },
  { group: "Run your shop", items: [{ id: "products", label: "Products & inventory" }, { id: "pos", label: "Point of sale" }, { id: "customers", label: "Customers" }, { id: "staff", label: "Staff & roles" }, { id: "branches", label: "Branches" }, { id: "expenses", label: "Expenses & reports" }] },
  { group: "Sell online", items: [{ id: "storefront", label: "Online storefront" }, { id: "catalogue", label: "Catalogue" }, { id: "orders", label: "Orders & fulfillment" }, { id: "builder", label: "Store builder" }] },
  { group: "Account & security", items: [{ id: "account", label: "Account & sign in" }, { id: "security", label: "Security" }, { id: "privacy", label: "Privacy & data" }] },
  { group: "Developers", items: [{ id: "source", label: "Source code access" }, { id: "architecture", label: "Technical architecture" }] },
  { group: "Help", items: [{ id: "troubleshooting", label: "Troubleshooting" }, { id: "faq", label: "FAQ" }] },
];
const searchItems: Item[] = sections.flatMap((section) => section.items.map((item) => ({ ...item, group: section.group })));

function CodeBlock({ children }: { children: string }) {
  return <pre className="my-5 overflow-x-auto rounded-xl border border-border bg-foreground p-5 text-[13px] leading-6 text-background"><code>{children}</code></pre>;
}

function DocsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? searchItems.filter((item) => `${item.label} ${item.group}`.toLowerCase().includes(q)) : [];
  }, [query]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-5 sm:px-8">
          <Link to="/" className="font-display text-xl font-bold tracking-tight">Strap</Link>
          <span className="hidden h-5 w-px bg-border sm:block" />
          <span className="hidden text-sm text-muted-foreground sm:block">Documentation</span>
          <div className="relative ml-auto hidden w-full max-w-md md:block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the Strap guide" aria-label="Search the Strap guide" className="h-10 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none focus:border-accent-ink/50" />
            {query && <div className="absolute mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl">{filtered.length ? filtered.map((item) => <a key={item.id} href={`#${item.id}`} onClick={() => setQuery("")} className="block rounded-lg px-3 py-2 hover:bg-muted"><span className="block text-sm font-medium">{item.label}</span><span className="text-xs text-muted-foreground">{item.group}</span></a>) : <p className="p-3 text-sm text-muted-foreground">No matching guide found.</p>}</div>}
          </div>
          <Link to="/auth" className="hidden items-center gap-2 text-sm font-semibold text-accent-ink sm:inline-flex">Open Strap <ArrowRight className="size-4" /></Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto py-10 lg:block">
          <nav className="space-y-6">{sections.map((section) => <div key={section.group}><p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground">{section.group}</p><div className="space-y-0.5">{section.items.map((item) => <a key={item.id} href={`#${item.id}`} className="block rounded-md border-l-2 border-transparent px-3 py-1.5 text-sm text-muted-foreground hover:border-accent-ink/40 hover:bg-muted/50 hover:text-foreground">{item.label}</a>)}</div></div>)}</nav>
        </aside>

        <article className="min-w-0 max-w-4xl px-5 py-12 sm:px-8 lg:px-0 lg:py-16">
          <section id="overview" className="scroll-mt-24 border-b border-border pb-14">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent-ink"><BookOpen className="size-4" /> Strap documentation</div>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">Everything you need to run your store with Strap.</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">Strap brings retail POS, inventory, products, customers, staff, branches, expenses, reports and online selling into one commerce workspace. These docs explain how to use the product, not just how the software is built.</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3"><Info icon={Rocket} title="Start quickly" body="Set up your shop, add products and make your first sale." /><Info icon={Boxes} title="Stay organised" body="Keep stock, customers, expenses and orders connected." /><Info icon={Globe2} title="Sell online" body="Publish a catalogue and manage online orders from Strap." /></div>
          </section>

          <DocSection id="quickstart" icon={Zap} title="Quickstart" eyebrow="Start in minutes">
            <p>Strap is designed around the daily rhythm of a shop. After creating or opening your workspace, start with your store profile, add products, then use the POS for sales. You can enable the online storefront when you are ready.</p>
            <ol className="mt-6 space-y-4">{[["1", "Create your workspace", "Complete onboarding and confirm your store details."], ["2", "Add your catalogue", "Create products with names, prices, SKUs, barcodes and stock."], ["3", "Make a sale", "Open Point of Sale, search or scan an item, then complete checkout."], ["4", "Review the business", "Use inventory, expenses, reports and insights to understand the day."], ["5", "Go online", "Configure the online store, publish products and start receiving orders."]].map(([n, title, body]) => <li key={n} className="flex gap-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent-ink">{n}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div></li>)}</ol>
          </DocSection>

          <DocSection id="workspace" icon={Store} title="Your workspace" eyebrow="One source of truth"><p>The Strap workspace connects the operational parts of a retail business. Your store is the tenancy boundary: products, stock, sales, customers, staff activity and other records belong to the appropriate store context.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><Feature title="Dashboard" body="A high-level view of activity and business signals." /><Feature title="Products" body="Catalogue, pricing, SKU, barcode and inventory management." /><Feature title="Point of Sale" body="Fast cart building, scanning, checkout and receipts." /><Feature title="Online Store" body="Public catalogue, storefront configuration and orders." /></div></DocSection>

          <DocSection id="products" icon={Package} title="Products & inventory" eyebrow="Know what you have"><p>Create and maintain the products you sell. Keep identifiers such as SKU and barcode consistent so search and scanning remain fast. Inventory is tracked with branch-aware stock records where applicable.</p><ul className="mt-5 list-disc space-y-2 pl-5 text-muted-foreground"><li>Add products manually or import a catalogue.</li><li>Set pricing, identifiers, categories and stock information.</li><li>Review low-stock and out-of-stock items before they affect sales.</li><li>Use branches and transfers when stock moves between locations.</li></ul></DocSection>

          <DocSection id="pos" icon={Receipt} title="Point of sale" eyebrow="Sell faster"><p>Point of Sale is the counter workflow: find or scan products, build a cart, review totals and complete the transaction. Compatible camera, USB and Bluetooth scanner workflows depend on the device and browser.</p><CodeBlock>{`Find a product → Add to cart → Review quantity → Complete payment → Issue receipt`}</CodeBlock></DocSection>

          <DocSection id="customers" icon={Users} title="Customers" eyebrow="Build relationships"><p>Customers are scoped to your store. Use customer records to keep useful purchase relationships organised and make repeat service easier.</p></DocSection>
          <DocSection id="staff" icon={ShieldCheck} title="Staff & roles" eyebrow="Work as a team"><p>Store roles help owners, managers and cashiers work with appropriate access. Give team members only the access they need for their responsibilities and review account activity when something looks unusual.</p></DocSection>
          <DocSection id="branches" icon={Boxes} title="Branches" eyebrow="Operate across locations"><p>Branches represent business locations. Branch-aware inventory and transfers let a business keep stock organised as products move between locations.</p></DocSection>
          <DocSection id="expenses" icon={BarChart3} title="Expenses & reports" eyebrow="Understand the numbers"><p>Record expenses alongside sales and use reports and insights to understand performance, stock value and operational signals. Reports are decision-support tools: use them to identify what needs attention rather than simply collecting numbers.</p></DocSection>

          <DocSection id="storefront" icon={Globe2} title="Online storefront" eyebrow="Sell beyond the counter"><p>Strap can publish a shareable storefront so customers can browse products and place online orders. Public storefront pages are designed to be discoverable, while private management pages remain behind authentication.</p></DocSection>
          <DocSection id="catalogue" icon={ShoppingBag} title="Catalogue" eyebrow="Present your products"><p>Choose the products that should appear online, organise categories and keep product information accurate. Public product pages should contain useful names, descriptions and imagery because this is the content customers and search engines can understand.</p></DocSection>
          <DocSection id="orders" icon={Package} title="Orders & fulfillment" eyebrow="From checkout to delivery"><p>Online orders connect the customer-facing storefront with the operational workspace. Review order details, status and fulfilment information from the online-store workflow.</p></DocSection>
          <DocSection id="builder" icon={Store} title="Store builder" eyebrow="Shape your storefront"><p>Use the store builder and advanced editor to configure the presentation of your online shop. The builder is for creating the customer-facing experience; this documentation explains how to use it, not how to modify Strap's internal source code.</p></DocSection>

          <DocSection id="account" icon={KeyRound} title="Account & sign in" eyebrow="Access your workspace"><p>Sign in to access private business tools. Strap uses authenticated sessions for protected areas. If your session expires, sign in again rather than trying to bypass the application access controls.</p></DocSection>
          <DocSection id="security" icon={ShieldCheck} title="Security" eyebrow="Protect the business"><p>Strap uses Supabase Auth and PostgreSQL Row Level Security for protected data access. Keep publishable browser keys limited to their intended use and never expose service-role or other secret keys in client-side code. RLS is the database-level boundary that protects tenant records.</p></DocSection>
          <DocSection id="privacy" icon={ShieldCheck} title="Privacy & data" eyebrow="Your business data"><p>Use the public privacy and terms pages for legal information. Within the product, follow the account and security controls provided by Strap. Do not place secrets, passwords or private credentials into product descriptions, support requests or other public fields.</p></DocSection>

          <DocSection id="source" icon={Code2} title="Source code access" eyebrow="For authorised developers"><p>The public documentation is primarily for learning how to use Strap. The application source repository is maintained separately. If you are an authorised contributor or have repository access, use the repository's normal Git workflow.</p><CodeBlock>{`git clone <repository-url>
cd storefront-flow
npm install
npm run dev`}</CodeBlock><p className="text-sm text-muted-foreground">Do not publish credentials or private environment values from a local setup. Browser configuration should use the publishable Supabase key; secret keys belong on trusted server-side infrastructure.</p></DocSection>
          <DocSection id="architecture" icon={Boxes} title="Technical architecture" eyebrow="How Strap fits together"><p>Strap is built with React, TanStack Start, TypeScript, Vite and Supabase, and is deployed through Vercel. The browser uses Supabase client integration for authenticated application workflows while database access is constrained by RLS. Public store routes expose customer-facing catalogue content.</p><div className="mt-6 grid gap-3 sm:grid-cols-2"><Feature title="Frontend" body="React 19, TanStack Router/Start, TypeScript and Tailwind CSS." /><Feature title="Backend" body="Supabase Auth, PostgreSQL, RLS and server-side functions where needed." /><Feature title="Deployment" body="Vercel production deployments with Git-based delivery." /><Feature title="Public SEO" body="Canonical metadata, robots.txt, sitemap.xml and crawlable storefront pages." /></div></DocSection>

          <DocSection id="troubleshooting" icon={Zap} title="Troubleshooting" eyebrow="When something does not work"><div className="space-y-4">{[["I cannot access my workspace", "Confirm you are signed in and that the correct store context is selected."], ["A product is missing", "Check the current store, product status, catalogue filters and inventory records."], ["A scan does not work", "Check camera permissions or scanner connection and test keyboard-wedge input if supported."], ["An online order is not visible", "Refresh the online-store orders view and confirm that the order belongs to the current store."], ["I see an authorization error", "Do not bypass access controls. Confirm your membership and role, then sign in again if the session is stale."]].map(([q, a]) => <div key={q} className="rounded-xl border border-border bg-card p-5"><h3 className="font-semibold">{q}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{a}</p></div>)}</div></DocSection>

          <DocSection id="faq" icon={BookOpen} title="FAQ" eyebrow="Common questions"><div className="space-y-3">{[["What is Strap?", "Strap is a commerce operations platform combining retail POS, inventory, products, customers, staff, branches, reports and online selling."], ["Is Strap an online store builder?", "Yes. Strap includes an online storefront and store-building tools alongside the operational retail workspace."], ["Is Strap a POS system?", "Yes. Point of Sale is one of the core workflows, alongside inventory, customers, expenses and reporting."], ["Is Strap like Shopify or Wix?", "Strap overlaps with ecommerce and store-building products, but its positioning is broader around connected retail operations, including physical-store workflows."], ["Where can I learn how to use Strap?", "This documentation is the main public product guide. Start with Quickstart and then choose the workflow you need."]].map(([q, a]) => <details key={q} className="group border-b border-border py-4"><summary className="cursor-pointer list-none font-semibold">{q}<ChevronRight className="float-right size-4 transition group-open:rotate-90" /></summary><p className="pt-3 text-sm leading-6 text-muted-foreground">{a}</p></details>)}</div></DocSection>

          <footer className="mt-16 border-t border-border pt-8 text-sm text-muted-foreground"><p>Strap documentation is maintained for customers, operators and authorised developers.</p><div className="mt-4 flex flex-wrap gap-4"><Link to="/" className="font-semibold text-accent-ink hover:underline">Strap home</Link><Link to="/support" className="font-semibold text-accent-ink hover:underline">Support</Link><Link to="/partners" className="font-semibold text-accent-ink hover:underline">Partners</Link></div></footer>
        </article>
      </div>
    </main>
  );
}

function Info({ icon: Icon, title, body }: { icon: typeof Rocket; title: string; body: string }) { return <div className="rounded-xl border border-border bg-card p-4"><Icon className="size-5 text-accent-ink" /><h2 className="mt-3 font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p></div>; }
function Feature({ title, body }: { title: string; body: string }) { return <div className="rounded-xl border border-border p-4"><div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="size-4 text-accent-ink" />{title}</div><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>; }
function DocSection({ id, icon: Icon, eyebrow, title, children }: { id: string; icon: typeof Rocket; eyebrow: string; title: string; children: React.ReactNode }) { return <section id={id} className="scroll-mt-24 border-b border-border py-12 first:pt-0"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.14em] text-accent-ink"><Icon className="size-4" />{eyebrow}</div><h2 className="mt-3 font-display text-3xl font-bold tracking-tight">{title}</h2><div className="prose prose-neutral mt-5 max-w-none text-[15px] leading-7 text-muted-foreground [&_p]:max-w-3xl [&_h3]:text-foreground">{children}</div></section>; }
