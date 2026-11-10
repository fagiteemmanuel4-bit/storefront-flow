import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["checkout"];

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Sales & checkout — Strap point of sale" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Sales & checkout — Strap point of sale" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
