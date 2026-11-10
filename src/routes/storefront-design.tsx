import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["storefront"];

export const Route = createFileRoute("/storefront-design")({
  head: () => marketingHead({
    title: "Online storefront design — Strap",
    description: page.description,
    path: "/storefront-design",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
