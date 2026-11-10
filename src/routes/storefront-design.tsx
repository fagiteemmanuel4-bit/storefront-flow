import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["storefront"];

export const Route = createFileRoute("/storefront-design")({
  head: () => ({
    meta: [
      { title: "Online storefront design — Strap" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Online storefront design — Strap" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
