import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["barcode"];

export const Route = createFileRoute("/barcode-scanning")({
  head: () => ({
    meta: [
      { title: "Barcode scanning — Strap retail checkout" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Barcode scanning — Strap retail checkout" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
