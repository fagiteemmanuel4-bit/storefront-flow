import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, ScanLine, Store, Wallet } from "lucide-react";
import heroShop from "@/assets/hero-shop.jpg";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kudi — Point of sale built for busy shops" },
      {
        name: "description",
        content:
          "Scan, sell and track stock across every branch. Kudi is a fast, offline-friendly point of sale and inventory system for small retail businesses.",
      },
      { property: "og:title", content: "Kudi — Point of sale built for busy shops" },
      {
        property: "og:description",
        content: "Scan, sell and track stock across every branch of your shop.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: ScanLine,
    title: "Scan and sell",
    body: "Point the camera at a barcode and the product drops into the cart. Cash, transfer, card or credit.",
  },
  {
    icon: Store,
    title: "Every branch, one view",
    body: "Stock is counted per location, so the Yaba shop never sells what only Ikeja has.",
  },
  {
    icon: Wallet,
    title: "Credit you can chase",
    body: "Record who owes what, log part payments, and see the outstanding book at a glance.",
  },
  {
    icon: BarChart3,
    title: "Numbers that make sense",
    body: "Today's takings, best sellers, and low stock warnings — in your own currency.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />

      <main>
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:pt-24">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-0 h-[32rem] w-[52rem] -translate-x-1/2 bg-[radial-gradient(circle_at_center,var(--color-accent-soft),transparent_68%)] opacity-70"
          />

          <div className="relative mx-auto flex max-w-5xl flex-col items-center text-center">
            <div className="animate-rise flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent shadow-lift">
                <span className="size-4 rotate-45 rounded-[4px] bg-foreground" />
              </span>
              <span className="font-display text-2xl font-bold tracking-tight">KUDI.</span>
            </div>

            <span className="animate-rise mt-10 text-label-caps text-accent-ink [animation-delay:80ms]">
              Built for busy shops
            </span>

            <h1 className="animate-rise text-display-lg mt-5 max-w-4xl [animation-delay:140ms]">
              Run the whole shop from the counter.
            </h1>

            <p className="animate-rise mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl [animation-delay:200ms]">
              Kudi is a point of sale and stock book for small retail businesses. Fast enough for a
              queue, honest enough for the books.
            </p>

            <div className="animate-rise mt-9 flex flex-col items-center gap-3 sm:flex-row [animation-delay:260ms]">
              <Link
                to="/auth"
                className="touch-target inline-flex items-center justify-center gap-2 bg-accent px-7 py-3.5 text-base font-semibold text-accent-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                Start selling free
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                to="/support"
                className="touch-target inline-flex items-center justify-center border border-border bg-surface px-7 py-3.5 text-base font-semibold transition-colors hover:bg-secondary"
              >
                See how it works
              </Link>
            </div>
          </div>

          <div className="animate-rise relative mx-auto mt-16 max-w-6xl [animation-delay:320ms]">
            <div className="absolute -left-3 top-10 hidden h-24 w-24 border-l border-t border-accent/50 lg:block" />
            <div className="absolute -right-3 bottom-10 hidden h-24 w-24 border-b border-r border-accent/50 lg:block" />

            <div className="relative overflow-hidden border border-border bg-background p-2 shadow-float sm:p-3">
              <div className="relative aspect-[16/8] overflow-hidden bg-secondary">
                <img
                  src={heroShop}
                  alt="Shopkeeper serving a customer at a busy counter"
                  className="h-full w-full object-cover"
                  width={1200}
                  height={600}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/35 via-transparent to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
                  <div className="border border-background/30 bg-foreground/85 px-4 py-3 text-left text-background backdrop-blur-md">
                    <p className="text-label-caps text-background/60">Today's sales</p>
                    <p className="numeric mt-1 text-2xl font-semibold">₦248,500</p>
                  </div>
                  <div className="hidden border border-background/30 bg-background/90 px-4 py-3 text-left text-foreground backdrop-blur-md sm:block">
                    <p className="text-label-caps text-accent-ink">Inventory</p>
                    <p className="mt-1 text-sm font-semibold">Always in view.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-background px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-display-sm max-w-xl">Everything the counter needs.</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="surface-card p-6">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
                    <feature.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-display-md">Open your register today.</h2>
          <p className="mt-4 text-muted-foreground">
            Create an account, name your shop, add your first products. It takes a few minutes.
          </p>
          <Link
            to="/auth"
            className="touch-target mt-8 inline-flex items-center gap-2 bg-foreground px-8 py-4 text-base font-semibold text-background transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Create free account
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
