import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, Building2, Check, CreditCard, Globe2, Laptop, LockKeyhole, PackageSearch, Printer, ScanLine, ShieldCheck, Users, Wallet, Zap } from "lucide-react";

const cards = [
  { icon: PackageSearch, title: "Find stock before it becomes a problem", body: "See low-stock products, stock value and product activity in one place so restocking decisions are based on what is actually happening." },
  { icon: BarChart3, title: "Turn activity into useful signals", body: "Sales, expenses and inventory information work together so you can understand performance instead of checking disconnected records." },
  { icon: Users, title: "Give every teammate the right workspace", body: "Keep owners, managers and cashiers focused on the work they need while sensitive management actions stay protected." },
];

const plans = [
  { name: "Free", price: "₦0", description: "Run your counter and manage the essentials.", cta: "Start free", featured: false, features: ["POS & offline sales", "Products & inventory", "Customers & expenses", "Basic orders & reports"] },
  { name: "Business", price: "₦3,000", description: "Open your shop online and unlock the tools that help it grow.", cta: "Choose Business", featured: true, features: ["Everything in Free", "Online Store", "Storefront categories", "List, compact & large layouts", "Featured products", "Store data export"] },
  { name: "Pro", price: "₦5,000", description: "Advanced control for growing retail operations.", cta: "Choose Pro", featured: false, features: ["Everything in Business", "Advanced inventory tools", "Stock calculation tools", "Advanced reports", "Priority Pro features"] },
];

export function LandingUpgrades() {
  return (
    <>
      <section id="about" className="border-y border-border bg-secondary/35 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
            <div><p className="text-label-caps text-accent-ink">Why Strap</p><h2 className="text-display-md mt-4">Built around the way a real shop actually moves.</h2></div>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">Strap is not just a register with extra screens. It connects the moments around a sale — finding stock, taking payment, updating inventory, checking money and serving customers online — into one operating flow.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">{cards.map(({ icon: Icon, title, body }) => <article key={title} className="rounded-3xl border border-border bg-background p-6 shadow-sm"><span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5" /></span><h3 className="mt-5 font-display text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</div>
        </div>
      </section>

      <section id="pricing" className="border-y border-border bg-background px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-label-caps text-accent-ink">Simple pricing</p>
            <h2 className="text-display-md mt-4">Start free. Pay when your shop is ready to sell online.</h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">Your counter stays useful on Free. The Online Store starts at ₦3,000/month, with no premium feature quietly hidden behind the free plan.</p>
          </div>
          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`relative rounded-[1.75rem] border p-6 sm:p-7 ${plan.featured ? "border-accent bg-accent-soft/35 shadow-lg" : "border-border bg-background"}`}>
                {plan.featured && <span className="absolute right-5 top-5 rounded-full bg-accent px-3 py-1 text-[11px] font-bold text-accent-foreground">Most popular</span>}
                <h3 className="font-display text-2xl font-bold">{plan.name}</h3>
                <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{plan.description}</p>
                <div className="mt-6 flex items-end gap-1"><span className="font-display text-4xl font-bold tracking-tight">{plan.price}</span>{plan.name !== "Free" && <span className="pb-1 text-sm text-muted-foreground">/ month</span>}</div>
                <Link to="/auth" className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition ${plan.featured ? "bg-accent text-accent-foreground hover:-translate-y-0.5" : "border border-border bg-background hover:bg-secondary"}`}>{plan.cta}<ArrowRight className="size-4" /></Link>
                <ul className="mt-7 space-y-3">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-3 text-sm"><Check className="mt-0.5 size-4 shrink-0 text-accent-ink" /><span>{feature}</span></li>)}</ul>
                {plan.name === "Free" && <p className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">Online Store is not included in Free.</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="inventory" className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-2 lg:items-center"><div><p className="text-label-caps text-accent-ink">Inventory intelligence</p><h2 className="text-display-md mt-4">Know what you have before customers ask.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Search by name, SKU or barcode, filter by category or shelf, and spot products that need attention. Bulk stock actions keep routine updates fast.</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Low-stock alerts", "Out-of-stock filters", "Stock-value tracking", "Bulk quantity updates"].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-sm font-semibold"><Check className="size-4 text-accent-ink" />{item}</div>)}</div></div><div className="rounded-[2rem] border border-white/10 bg-neutral-950 p-6 text-white shadow-lift sm:p-8"><div className="flex items-center gap-3"><Boxes className="size-5 text-accent" /><p className="text-sm font-semibold text-white">Stock control</p></div><div className="mt-7 space-y-3">{[["Available", "124 products"], ["Low stock", "12 products"], ["Out of stock", "3 products"], ["Inventory value", "₦1,842,500"]].map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[.06] p-4"><span className="text-sm text-white/70">{label}</span><span className="font-semibold text-white">{value}</span></div>)}</div></div></div></div>
      </section>

      <section id="checkout" className="border-y border-white/10 bg-neutral-950 px-4 py-20 text-white sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-[1fr_.9fr] lg:items-center"><div><p className="text-label-caps text-accent">Fast checkout</p><h2 className="text-display-md mt-4 text-white">From product search to completed sale without the clutter.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-white/75">Build a cart, scan a product, adjust quantities, choose a payment method and finish the transaction. Strap keeps stock and sales records connected as you work.</p><Link to="/auth" className="mt-7 inline-flex items-center gap-2 font-semibold text-accent hover:underline">Open the register <ArrowRight className="size-4" /></Link></div><div className="rounded-[2rem] border border-white/10 bg-white/[.07] p-6 shadow-2xl shadow-black/20 sm:p-8"><div className="flex items-center gap-3"><CreditCard className="size-5 text-accent" /><p className="font-semibold text-white">A clean counter flow</p></div><div className="mt-6 space-y-2">{["Search or scan a product", "Build the current cart", "Choose cash, card, transfer or credit", "Confirm payment and change", "Preview, print or share the receipt"].map((item, i) => <div key={item} className="flex items-center gap-3 rounded-xl bg-white/[.06] p-3"><span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{i + 1}</span><span className="text-sm text-white/80">{item}</span></div>)}</div></div></div></div>
      </section>

      <section id="online-store" className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div><p className="text-label-caps text-accent-ink">Online storefront</p><h2 className="text-display-md mt-4">Give your shop a front door on the internet.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Publish selected products, feature the ones you want customers to notice and manage online orders from the same business workspace.</p><div className="mt-7 flex flex-wrap gap-2">["Shareable catalog", "Featured products", "Bulk publish", "Online orders"].map((item) => <span key={item} className="rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold">{item}</span>)}</div></div><div className="rounded-[2rem] border border-border bg-secondary p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.16em] text-muted-foreground">Your online store</p><h3 className="mt-2 font-display text-2xl font-bold">Open 24/7</h3></div><Globe2 className="size-7 text-accent-ink" /></div><div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[["42", "Published"], ["8", "Featured"], ["6", "Orders"], ["1", "Storefront"]].map(([value, label]) => <div key={label} className="rounded-xl border border-border bg-background p-4"><p className="text-xl font-bold">{value}</p><p className="mt-1 text-[11px] text-muted-foreground">{label}</p></div>)}</div></div></div></div>
      </section>

      <section id="insights" className="border-y border-border bg-secondary/35 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl"><div className="max-w-2xl"><p className="text-label-caps text-accent-ink">Insights</p><h2 className="text-display-md mt-4">Stop guessing where the money went.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Use sales, expenses, payment records and stock information together to understand the health of the shop.</p></div><div className="mt-10 grid gap-4 md:grid-cols-3">{[[Wallet, "Money movement", "Keep sales, expenses and payment methods attached to the same business records."], [BarChart3, "Performance", "See useful totals and trends without rebuilding reports manually."], [Zap, "Better decisions", "Use what happened today to make tomorrow's stocking and selling decisions clearer."]].map(([Icon, title, body]) => <article key={title as string} className="rounded-2xl border border-border bg-background p-6"><Icon className="size-5 text-accent-ink" /><h3 className="mt-4 font-display text-lg font-bold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p></article>)}</div></div>
      </section>

      <section id="teams" className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-2 lg:items-center"><div><p className="text-label-caps text-accent-ink">Team access</p><h2 className="text-display-md mt-4">Let people work without giving everyone the keys.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Strap supports owner, manager and cashier roles so day-to-day selling can stay fast while management controls remain protected.</p></div><div className="space-y-3">{[[ShieldCheck, "Owner", "Full store management and account control"], [Users, "Manager", "Operational management and catalog workflows"], [Zap, "Cashier", "Fast selling and counter workflows"]].map(([Icon, title, body]) => <div key={title as string} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-5"><span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5" /></span><div><p className="font-display font-bold">{title as string}</p><p className="mt-1 text-sm text-muted-foreground">{body as string}</p></div></div>)}</div></div></div>
      </section>

      <section id="branches" className="border-y border-border bg-background px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-center"><div><p className="text-label-caps text-accent-ink">Multiple locations</p><h2 className="text-display-md mt-4">Ready for the shop that grows beyond one counter.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Organise branches under one store and keep branch-level stock, sales and expenses connected to the same business.</p><div className="mt-7 flex items-center gap-3 text-sm font-semibold"><Building2 className="size-5 text-accent-ink" />Centralised store management</div></div><div className="grid gap-3 sm:grid-cols-2">{["Main branch", "Second location", "Stock by branch", "Branch sales"].map((item, i) => <div key={item} className="rounded-2xl border border-border bg-secondary p-5"><Building2 className="size-5 text-accent-ink" /><p className="mt-4 font-semibold">{item}</p><p className="mt-1 text-xs text-muted-foreground">{i < 2 ? "Configured location" : "Connected to the same store"}</p></div>)}</div></div></div>
      </section>

      <section id="hardware" className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl"><div className="grid gap-10 lg:grid-cols-2"><div className="rounded-[2rem] border border-white/10 bg-neutral-950 p-7 text-white shadow-lift sm:p-10"><div className="flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground"><ScanLine className="size-6" /></div><p className="mt-7 text-label-caps text-accent">Hardware ready</p><h2 className="text-display-md mt-4 text-white">Use the tools already on your counter.</h2><p className="mt-5 text-lg leading-8 text-white/75">Camera scanning works on supported devices, while compatible USB, Bluetooth and serial workflows help desktop counters move faster.</p><Link to="/hardware" className="mt-7 inline-flex items-center gap-2 font-semibold text-accent hover:underline">Open Hardware Center <ArrowRight className="size-4" /></Link></div><div className="grid gap-3 sm:grid-cols-2">{[[Laptop, "PC scanners", "Keyboard-wedge USB and Bluetooth scanners"], [Printer, "Receipt printers", "Browser and compatible device workflows"], [ScanLine, "Camera scanning", "Scan supported codes from mobile devices"], [LockKeyhole, "Permission-aware", "Hardware actions stay inside the user's session"]].map(([Icon, title, body]) => <article key={title as string} className="rounded-2xl border border-border bg-background p-6"><Icon className="size-5 text-accent-ink" /><h3 className="mt-4 font-display font-bold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p></article>)}</div></div></div>
      </section>
    </>
  );
}
