import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["payments"];

export const Route = createFileRoute("/payments-and-transactions")({
  head: () => ({
    meta: [
      { title: "Payments and transactions — Strap retail records" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Payments and transactions — Strap retail records" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
