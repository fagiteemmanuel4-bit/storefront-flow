import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["customers"];

export const Route = createFileRoute("/customer-management")({
  head: () => ({
    meta: [
      { title: "Customer management — Strap retail customer records" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Customer management — Strap retail customer records" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
