import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["orders"];

export const Route = createFileRoute("/online-orders")({
  head: () => ({
    meta: [
      { title: "Online order management — Strap" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Online order management — Strap" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
