import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";
const page = marketingPages["safety"];
export const Route = createFileRoute("/merchant-safety")({
  head: () => marketingHead({
    title: "Merchant safety — Strap trust and reporting",
    description: page.description,
    path: "/merchant-safety",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
