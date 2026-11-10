import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["security"];

export const Route = createFileRoute("/store-security")({
  head: () => ({
    meta: [
      { title: "Store security — Strap account and access protection" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Store security — Strap account and access protection" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
