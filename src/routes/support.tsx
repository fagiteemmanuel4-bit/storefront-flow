import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Help centre — Kudi point of sale" },
      {
        name: "description",
        content:
          "Getting started with Kudi: set up your shop, add stock, and ring up your first sale.",
      },
      { property: "og:title", content: "Help centre — Kudi point of sale" },
      { property: "og:description", content: "Set up your shop and ring up your first sale." },
    ],
  }),
  component: Support,
});

const STEPS = [
  {
    title: "1. Create your shop",
    body: "Sign up, then name your shop, pick your currency and add your first branch.",
  },
  {
    title: "2. Load your stock",
    body: "Under Stock, add each product with its price and quantity. Scan the barcode so the till recognises it later.",
  },
  {
    title: "3. Sell",
    body: "Open Sell, scan or tap products into the cart, choose how the customer paid, and charge.",
  },
  {
    title: "4. Check the numbers",
    body: "The dashboard shows today's takings, low stock and what is selling.",
  },
];

function Support() {
  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-display-md">Help centre</h1>
        <p className="mt-4 text-muted-foreground">
          Four steps from empty counter to first receipt.
        </p>
        <div className="mt-10 space-y-4">
          {STEPS.map((step) => (
            <div key={step.title} className="surface-card p-6">
              <h2 className="font-display text-lg font-bold">{step.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </div>
          ))}
        </div>
        <Link
          to="/auth"
          className="touch-target mt-10 inline-flex items-center rounded-full bg-accent px-7 py-3.5 text-base font-semibold text-accent-foreground"
        >
          Start now
        </Link>
      </main>
      <SiteFooter />
    </div>
  );
}
