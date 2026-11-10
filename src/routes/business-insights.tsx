import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["insights"];

export const Route = createFileRoute("/business-insights")({
  head: () => ({
    meta: [
      { title: "Business insights — Strap retail reporting" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Business insights — Strap retail reporting" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
