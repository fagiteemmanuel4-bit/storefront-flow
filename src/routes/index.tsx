import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Globe2,
  PackageCheck,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Store,
  Truck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import heroShop from "@/assets/hero-shop.jpg";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kudi — Run your shop with clarity" },
      {
        name: "description",
        content:
          "Kudi brings sales, inventory, customers, payments and an online storefront into one simple point-of-sale system for growing shops.",
      },
      { property: "og:title", content: "Kudi — Run your shop with clarity" },
      {
        property: "og:description",
        content: "Sell faster. Know your stock. Understand your business.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: ScanLine, title: "Sell in seconds", body: "Build a cart, scan products, choose a payment method and keep the queue moving." },
  { icon: PackageCheck, title: "Know your stock", body: "See what's available, what is running low and what each branch has in real time." },
  { icon: Wallet, title: "Track every naira", body: "Keep sales, expenses, credit and payments together so the numbers tell one story." },
  { icon: Globe2, title: "Sell beyond the counter", body: "Create a shareable online storefront and let customers browse and order from anywhere." },
];

const WORKFLOW = [
  { number: "01", title: "Set up your shop", body: "Add your shop details, currency, branches and starting inventory without a complicated setup process." },
  { number: "02", title: "Start selling", body: "Use a clean register designed for speed. Add products, take payments and finish a sale in a few taps." },
  { number: "03", title: "Run with insight", body: "Come back to a clear picture of revenue, stock, expenses, best sellers and outstanding credit." },
];

const STATS = [
  { value: "01", label: "workspace for your shop" },
  { value: "24/7", label: "access to your records" },
  { value: "∞", label: "products you can organize" },
  { value: "1", label: "clear source of truth" },
];

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-foreground">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden px-4 pb-20 pt-14 sm:px-6 sm:pb-28 sm:pt-20 lg:pt-24">
          <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-10rem] -z-10 h-[42rem] w-[70rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--color-accent-soft),transparent_64%)] opacity-80" />
          <div aria-hidden="true" className="pointer-events-none absolute left-[8%] top-40 -z-10 size-24 rounded-full border border-accent/20 animate-float" />
          <div aria-hidden="true" className="pointer-events-none absolute right-[8%] top-64 -z-10 size-14 rotate-45 rounded-2xl border border-accent/30 animate-float [animation-delay:800ms]" />

          <div className="mx-auto max-w-7xl">
            <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_.98fr] lg:gap-10">
              <div className="max-w-2xl lg:pr-6">
                <div className="animate-rise inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-semibold shadow-sm backdrop-blur">
                  <span className="flex size-5 items-center justify-center rounded-full bg-accent"><Sparkles className="size-3" /></span>
                  A calmer way to run a busy shop
                </div>
                <h1 className="animate-rise text-display-lg mt-6 [animation-delay:80ms] sm:text-[4.6rem] sm:leading-[.98]">
                  Your shop moves fast. <span className="text-accent-ink">Kudi keeps up.</span>
                </h1>
                <p className="animate-rise mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl [animation-delay:150ms]">
                  Sales, stock, expenses, customers and your online store — brought into one simple workspace built around how real shops operate.
                </p>
                <div className="animate-rise mt-9 flex flex-col gap-3 sm:flex-row [animation-delay:220ms]">
                  <Link to="/auth" className="touch-target inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-7 py-3.5 font-semibold text-accent-foreground shadow-lift transition-all hover:-translate-y-0.5 hover:shadow-float">
                    Start selling free <ArrowRight className="size-4" />
                  </Link>
                  <a href="#how-it-works" className="touch-target inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-7 py-3.5 font-semibold transition-colors hover:bg-secondary">
                    Explore Kudi <ChevronRight className="size-4" />
                  </a>
                </div>
                <div className="animate-rise mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-muted-foreground [animation-delay:280ms]">
                  <span className="inline-flex items-center gap-2"><Check className="size-4 text-accent-ink" /> Quick setup</span>
                  <span className="inline-flex items-center gap-2"><Check className="size-4 text-accent-ink" /> Built for everyday retail</span>
                  <span className="inline-flex items-center gap-2"><Check className="size-4 text-accent-ink" /> Your data, your shop</span>
                </div>
              </div>

              <div className="animate-rise relative [animation-delay:180ms] lg:pl-5">
                <div aria-hidden="true" className="absolute -inset-5 rounded-[2rem] bg-accent-soft/50 blur-2xl" />
                <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-background p-2 shadow-float sm:p-3">
                  <div className="relative aspect-[4/4.2] overflow-hidden rounded-[1.25rem] bg-secondary sm:aspect-[4/3.8]">
                    <img src={heroShop} alt="Shopkeeper serving a customer at a busy counter" className="h-full w-full object-cover" width={1000} height={950} />
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-foreground/5" />
                    <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-background/20 bg-foreground/80 px-3 py-2 text-xs font-medium text-background backdrop-blur-md">
                      <span className="size-2 rounded-full bg-accent" /> Register is ready
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-2xl border border-background/20 bg-foreground/85 p-4 text-background backdrop-blur-md">
                        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-background/60">Today's sales</p>
                        <p className="numeric mt-1 text-2xl font-semibold">₦248,500</p>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-background/15"><div className="h-full w-[76%] rounded-full bg-accent animate-pulse" /></div>
                      </div>
                      <div className="hidden rounded-2xl border border-background/30 bg-background/90 p-4 text-foreground backdrop-blur-md sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-accent-ink">Stock health</p>
                        <p className="mt-1 text-lg font-semibold">Looking good.</p>
                        <p className="mt-1 text-xs text-muted-foreground">12 products need attention</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-5 -left-2 hidden rounded-2xl border border-border bg-background p-3 shadow-lift sm:flex sm:items-center sm:gap-3 lg:-left-7">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft"><Zap className="size-5 text-accent-ink" /></span>
                  <div><p className="text-xs font-bold">Less admin.</p><p className="text-[11px] text-muted-foreground">More time selling.</p></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-foreground px-4 py-7 text-background sm:px-6">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-background/10 md:grid-cols-4">
            {STATS.map((stat) => <div key={stat.label} className="px-4 py-2 text-center sm:px-6"><p className="font-display text-2xl font-bold sm:text-3xl">{stat.value}</p><p className="mt-1 text-[10px] uppercase tracking-[.16em] text-background/50">{stat.label}</p></div>)}
          </div>
        </section>

        {/* Features */}
        <section className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-label-caps text-accent-ink">One system. Less guesswork.</p>
              <h2 className="text-display-md mt-4">Everything you need to keep the counter moving.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">Kudi brings the daily jobs together without burying you in settings, spreadsheets or complicated screens.</p>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature, index) => { const Icon = feature.icon; return <article key={feature.title} className="group rounded-2xl border border-border bg-background p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"><div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink transition-transform duration-300 group-hover:scale-105"><Icon className="size-5" /></span><span className="text-xs font-bold text-muted-foreground">0{index + 1}</span></div><h3 className="mt-7 font-display text-xl font-bold">{feature.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{feature.body}</p><div className="mt-7 h-px w-full bg-border" /><span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-accent-ink">Built in <Check className="size-3" /></span></article>; })}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-y border-border bg-background px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr]">
              <div className="lg:sticky lg:top-28 lg:self-start">
                <p className="text-label-caps text-accent-ink">How it works</p>
                <h2 className="text-display-md mt-4">Simple enough for today. Powerful enough for tomorrow.</h2>
                <p className="mt-5 leading-7 text-muted-foreground">Start with the essentials and grow into the tools your shop actually needs. Kudi stays out of the way while giving you a clearer view of the business.</p>
                <Link to="/auth" className="mt-7 inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline">Open your register <ArrowRight className="size-4" /></Link>
              </div>
              <div className="space-y-4">
                {WORKFLOW.map((step) => <article key={step.number} className="group rounded-3xl border border-border bg-surface p-6 transition-all duration-300 hover:border-accent/40 hover:shadow-lift sm:p-8"><div className="flex gap-5"><span className="font-display text-sm font-bold text-accent-ink">{step.number}</span><div><h3 className="font-display text-2xl font-bold">{step.title}</h3><p className="mt-3 max-w-xl leading-7 text-muted-foreground">{step.body}</p></div></div></article>)}
              </div>
            </div>
          </div>
        </section>

        {/* Register visual */}
        <section className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-border bg-secondary shadow-sm">
            <div className="grid items-center gap-10 p-7 sm:p-10 lg:grid-cols-2 lg:p-14">
              <div>
                <span className="inline-flex size-12 items-center justify-center rounded-2xl bg-accent"><ShoppingBag className="size-5" /></span>
                <h2 className="text-display-sm mt-6">A register that feels like it belongs in your shop.</h2>
                <p className="mt-5 leading-7 text-muted-foreground">Large actions. Clear totals. No clutter. The selling screen is designed around the moments that matter when customers are waiting.</p>
                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {["Fast product search", "Multiple payment methods", "Automatic stock updates", "Clear sale history"].map((item) => <div key={item} className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-3 text-sm font-medium"><Check className="size-4 text-accent-ink" />{item}</div>)}
                </div>
              </div>
              <div className="relative rounded-3xl border border-border bg-background p-4 shadow-lift sm:p-6">
                <div className="flex items-center justify-between border-b border-border pb-4"><div><p className="text-xs font-semibold text-muted-foreground">Current sale</p><p className="font-display text-xl font-bold">3 items</p></div><span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-bold">Ready</span></div>
                <div className="space-y-3 py-5">{[["Premium Rice", "₦18,500"], ["Cooking Oil", "₦12,000"], ["Milk", "₦4,500"]].map(([name, price]) => <div key={name} className="flex items-center justify-between rounded-xl bg-secondary px-4 py-3"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-background"><PackageCheck className="size-4" /></span><span className="text-sm font-semibold">{name}</span></div><span className="numeric text-sm font-bold">{price}</span></div>)}</div>
                <div className="flex items-end justify-between border-t border-border pt-4"><span className="text-sm text-muted-foreground">Total</span><span className="numeric text-2xl font-bold">₦35,000</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Online store */}
        <section className="border-y border-border bg-foreground px-4 py-20 text-background sm:px-6 sm:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-label-caps text-accent">Your counter can have a front door.</p>
              <h2 className="text-display-md mt-4">Turn your shop into a shareable online store.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-background/60">Give customers somewhere to browse your products, discover your business and place orders — while you keep managing everything from the same Kudi workspace.</p>
              <div className="mt-8 flex flex-wrap gap-3">{["Shareable store link", "Product catalog", "Online orders", "Mobile friendly"].map((item) => <span key={item} className="rounded-full border border-background/15 bg-background/5 px-4 py-2 text-sm text-background/80">{item}</span>)}</div>
              <Link to="/auth" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-semibold text-accent-foreground hover:opacity-90">Create your store <ArrowRight className="size-4" /></Link>
            </div>
            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -inset-4 rounded-[2rem] bg-accent/10 blur-2xl" />
              <div className="relative rounded-[2rem] border border-background/10 bg-background/5 p-3 backdrop-blur-sm">
                <div className="overflow-hidden rounded-[1.5rem] bg-background text-foreground">
                  <div className="h-32 bg-[linear-gradient(135deg,var(--color-accent-soft),transparent)] p-5"><div className="flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-full bg-accent"><Store className="size-4" /></span><span className="rounded-full bg-background px-3 py-1 text-[10px] font-bold">OPEN STORE</span></div></div>
                  <div className="p-5"><p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Kudi marketplace</p><h3 className="mt-1 font-display text-2xl font-bold">Your shop, online.</h3><div className="mt-5 grid grid-cols-3 gap-2">{["Rice", "Oil", "Milk"].map((item) => <div key={item} className="rounded-xl border border-border p-3"><div className="aspect-square rounded-lg bg-secondary" /><p className="mt-2 truncate text-xs font-semibold">{item}</p></div>)}</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><ShieldCheck className="size-7" /></div>
            <h2 className="text-display-sm mt-6">Your business deserves a system you can trust.</h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">Keep your shop records organized, control who can access your workspace and build your operation on a system designed to grow with you.</p>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
              {[{ icon: ShieldCheck, title: "Account security", body: "Authentication and protected shop access are built into the experience." }, { icon: Smartphone, title: "Made for the counter", body: "Responsive screens keep the important actions close on phones and desktops." }, { icon: Clock3, title: "Built for busy days", body: "Fast flows and clear information help you spend less time on admin." }].map((item) => { const Icon = item.icon; return <div key={item.title} className="rounded-2xl border border-border bg-background p-6"><Icon className="size-5 text-accent-ink" /><h3 className="mt-4 font-display font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p></div>; })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-accent p-8 text-accent-foreground shadow-float sm:p-12 lg:p-16">
            <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
              <div className="max-w-2xl"><p className="text-label-caps opacity-70">Ready when you are</p><h2 className="text-display-md mt-4">Less counting. More knowing.</h2><p className="mt-4 max-w-xl text-base leading-7 opacity-75">Open your Kudi register and give your shop one clear place to sell, track and grow.</p></div>
              <Link to="/auth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-7 py-4 font-semibold text-background transition-transform hover:-translate-y-0.5">Start for free <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
