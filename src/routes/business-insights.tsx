import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["insights"];

export const Route = createFileRoute("/business-insights")({
  head: () => marketingHead({
    title: "Business insights — Strap retail reporting",
    description: page.description,
    path: "/business-insights",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
