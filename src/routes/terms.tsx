import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Kudi" },
      { name: "description", content: "The terms that govern your use of the Kudi point of sale." },
      { property: "og:title", content: "Terms of Service — Kudi" },
      { property: "og:description", content: "The terms that govern your use of Kudi." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-display-md">Terms of Service</h1>
        <div className="mt-8 space-y-6 text-muted-foreground">
          <p>
            These terms are provided by the shop owner operating this Kudi workspace. Review and
            replace this text with your own agreement before trading publicly.
          </p>
          <section>
            <h2 className="font-display text-xl font-bold text-foreground">Your account</h2>
            <p className="mt-2">
              You are responsible for the staff accounts and PINs you create, and for the accuracy
              of the sales and stock records entered under them.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-foreground">Acceptable use</h2>
            <p className="mt-2">
              Do not use the service to record unlawful transactions or to access data belonging to
              another shop.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-foreground">Availability</h2>
            <p className="mt-2">
              The service is provided as is. We work to keep it available, but we do not guarantee
              uninterrupted access.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
