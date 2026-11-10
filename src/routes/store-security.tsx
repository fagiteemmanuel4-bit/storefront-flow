import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["security"];

export const Route = createFileRoute("/store-security")({
  head: () => marketingHead({
    title: "Store security — Strap account and access protection",
    description: page.description,
    path: "/store-security",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
