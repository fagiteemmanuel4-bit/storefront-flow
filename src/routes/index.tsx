import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, ScanLine, Store, Wallet } from "lucide-react";
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
        <section className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="text-label-caps inline-flex items-center rounded-full bg-accent-soft px-3 py-1 text-accent-ink">
              Built for street giants
            </span>
            <h1 className="text-display-lg mt-5">Run the whole shop from the counter.</h1>
            <p className="mt-5 max-w-lg text-lg text-muted-foreground">
              Kudi is a point of sale and stock book for small retail businesses. Fast enough for a
              queue, honest enough for the books.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth"
                className="touch-target inline-flex items-center rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-accent-foreground shadow-lift transition-transform hover:-translate-y-0.5"
              >
                Start selling free
              </Link>
              <Link
                to="/support"
                className="touch-target inline-flex items-center rounded-full border border-border px-7 py-3.5 text-base font-semibold transition-colors hover:bg-secondary"
              >
                See how it works
              </Link>
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border shadow-lift">
            <img
              src={heroShop}
              alt="Shopkeeper serving a customer at a busy counter"
              className="h-full w-full object-cover"
              width={1200}
              height={900}
            />
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
            className="touch-target mt-8 inline-flex items-center rounded-full bg-foreground px-8 py-4 text-base font-semibold text-background transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Create free account
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
