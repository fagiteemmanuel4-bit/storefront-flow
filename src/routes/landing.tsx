import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Package,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Users,
  WifiOff,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
const features = [
  {
    icon: ShoppingBag,
    title: "Point of sale",
    body: "Search or scan products, hold carts, apply discounts, take payment and issue clear receipts. Offline sales can queue and sync when you reconnect.",
  },
  {
    icon: Package,
    title: "Products & catalogue",
    body: "Keep product names, images, categories, SKUs, barcodes, variants and pricing together.",
  },
  {
    icon: Boxes,
    title: "Inventory control",
    body: "Track stock by branch, spot low stock, transfer inventory and manage batches and expiry workflows where supported.",
  },
  {
    icon: Users,
    title: "Customers & staff",
    body: "Link customers to purchases and give owners, managers and cashiers role-appropriate access.",
  },
  {
    icon: BarChart3,
    title: "Reports & expenses",
    body: "Understand sales, payment mix, expenses, product performance and the numbers that need attention.",
  },
  {
    icon: ClipboardList,
    title: "Online orders",
    body: "Publish a shareable storefront, show your catalogue and manage incoming customer orders.",
  },
];
export function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="pointer-events-none absolute -right-32 -top-32 size-[34rem] rounded-full bg-accent/15 blur-3xl" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[1.05fr_.95fr]">
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <span className="size-2 rounded-full bg-accent" /> Retail management by Kryonara
              </span>
              <h1 className="mt-7 max-w-3xl font-display text-5xl font-bold leading-[.98] tracking-[-.06em] text-foreground sm:text-7xl">
                Run your business.{" "}
                <span className="relative inline-block text-foreground">
                  Not around it.
                  <span className="absolute -bottom-1 left-0 -z-0 h-3 w-full bg-accent/70" />
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground">
                Meet Strap. Point of sale, inventory, customers, staff, reports, expenses and online
                sales, together in one workspace.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/auth"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full bg-foreground px-6 font-semibold text-background transition hover:-translate-y-0.5"
                >
                  Get started <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex min-h-12 items-center rounded-full border border-border bg-surface px-6 font-semibold hover:bg-secondary"
                >
                  Explore features
                </a>
              </div>
              <div className="mt-9 flex flex-wrap gap-5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  <ScanLine className="size-4" /> Scan & sell
                </span>
                <span className="inline-flex items-center gap-2">
                  <WifiOff className="size-4" /> Offline queue
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="size-4" /> Staff access
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-[2rem] border border-border bg-surface p-3 shadow-2xl shadow-black/10">
                <div className="flex items-center justify-between border-b border-border px-3 pb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">STRAP WORKSPACE</p>
                    <p className="font-semibold">Store overview</p>
                  </div>
                  <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-foreground">
                    Live workspace
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 p-3">
                  <div className="rounded-2xl bg-secondary p-4">
                    <p className="text-xs text-muted-foreground">Today's sales</p>
                    <p className="mt-2 text-2xl font-bold">₦248,500</p>
                    <p className="mt-1 text-xs text-muted-foreground">Illustrative preview</p>
                  </div>
                  <div className="rounded-2xl bg-secondary p-4">
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="mt-2 text-2xl font-bold">36</p>
                    <p className="mt-1 text-xs text-muted-foreground">Illustrative preview</p>
                  </div>
                </div>
                <div className="mx-3 mb-3 rounded-2xl border border-border p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Recent activity</p>
                    <span className="text-xs text-muted-foreground">Workspace preview</span>
                  </div>
                  {[
                    "Counter sale · Receipt issued",
                    "Stock updated · Branch transfer",
                    "New online order · Awaiting review",
                  ].map((s, i) => (
                    <div
                      key={s}
                      className="flex items-center gap-3 border-t border-border py-3 first:mt-3"
                    >
                      <span className="grid size-8 place-items-center rounded-xl bg-accent/20 text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-sm">{s}</span>
                      <span className="ml-auto size-2 rounded-full bg-accent" />
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Illustrative interface preview — not live store data.
              </p>
            </div>
          </div>
        </section>
        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-muted-foreground">
              One connected workspace
            </p>
            <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Every important part of your shop, moving together.
            </h2>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Less switching between tools. A clearer view of the work happening behind the counter
              and online.
            </p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, body }) => (
              <article
                key={title}
                className="rounded-3xl border border-border bg-surface p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <span className="grid size-12 place-items-center rounded-2xl bg-accent text-accent-foreground">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="bg-foreground text-background">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.2em] text-background/60">
                Built for everyday retail
              </p>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
                From one counter to multiple branches.
              </h2>
              <p className="mt-5 max-w-xl leading-8 text-background/70">
                Set up the way your business works. Keep stock and sales connected across your team,
                branches and online storefront.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                "Food service",
                "Shops & supermarkets",
                "Fashion & electronics",
                "Growing brands",
              ].map((x) => (
                <div
                  key={x}
                  className="rounded-2xl border border-background/15 bg-background/5 p-5 font-semibold"
                >
                  {x}
                </div>
              ))}
            </div>
          </div>
        </section>
        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-muted-foreground">
            Get started
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Simple from the first step.
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                n: "01",
                t: "Create your account",
                d: "Set up your workspace and business profile.",
              },
              {
                n: "02",
                t: "Add products and people",
                d: "Load your catalogue, branches and staff access.",
              },
              {
                n: "03",
                t: "Start selling",
                d: "Record sales, manage stock and follow performance.",
              },
            ].map((x) => (
              <div key={x.n} className="border-t border-border pt-5">
                <p className="text-sm font-bold text-muted-foreground">{x.n}</p>
                <h3 className="mt-4 text-xl font-bold">{x.t}</h3>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="mx-auto max-w-7xl rounded-[2rem] bg-accent p-8 text-accent-foreground sm:p-14">
            <p className="text-xs font-bold uppercase tracking-[.2em]">
              A clearer way to run retail
            </p>
            <h2 className="mt-4 max-w-2xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
              Bring your shop into one workspace.
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#10130c] px-6 font-semibold text-white"
              >
                Create an account <ArrowRight className="size-4" />
              </Link>
              <Link
                to="/docs"
                className="inline-flex min-h-12 items-center rounded-full border border-accent-foreground/30 px-6 font-semibold"
              >
                Read the docs
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

export const Route = createFileRoute("/landing")({ component: Landing });
