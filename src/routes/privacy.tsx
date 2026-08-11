import { createFileRoute } from "@tanstack/react-router";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Kudi" },
      { name: "description", content: "How Kudi handles your shop, staff and customer data." },
      { property: "og:title", content: "Privacy Policy — Kudi" },
      { property: "og:description", content: "How Kudi handles your shop and customer data." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-surface">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <h1 className="text-display-md">Privacy Policy</h1>
        <div className="mt-8 space-y-6 text-muted-foreground">
          <p>
            This notice is written by the shop owner operating this workspace. Replace it with your
            own policy, confirmed against how you actually handle data.
          </p>
          <section>
            <h2 className="font-display text-xl font-bold text-foreground">What is stored</h2>
            <p className="mt-2">
              Account email and name, shop and branch details, products and stock counts, sales and
              payment method, and any customer name or phone number you record against credit.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-foreground">Who can see it</h2>
            <p className="mt-2">
              Shop data is separated per shop. Only members you invite to your shop can read its
              records.
            </p>
          </section>
          <section>
            <h2 className="font-display text-xl font-bold text-foreground">Contact</h2>
            <p className="mt-2">
              Reach the shop owner through the details on the support page for access or deletion
              requests.
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
