import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["branches"];

export const Route = createFileRoute("/branches-and-locations")({
  head: () => ({
    meta: [
      { title: "Multi-location retail — Strap branches and stock" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Multi-location retail — Strap branches and stock" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
