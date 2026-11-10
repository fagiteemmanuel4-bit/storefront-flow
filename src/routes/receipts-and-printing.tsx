import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["receipts"];

export const Route = createFileRoute("/receipts-and-printing")({
  head: () => ({
    meta: [
      { title: "Receipts and printing — Strap retail tools" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Receipts and printing — Strap retail tools" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
