import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["orders"];

export const Route = createFileRoute("/online-orders")({
  head: () => marketingHead({
    title: "Online order management — Strap",
    description: page.description,
    path: "/online-orders",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
