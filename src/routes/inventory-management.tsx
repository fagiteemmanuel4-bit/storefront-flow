import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["inventory"];

export const Route = createFileRoute("/inventory-management")({
  head: () => ({
    meta: [
      { title: "Inventory management — Strap retail stock control" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Inventory management — Strap retail stock control" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
