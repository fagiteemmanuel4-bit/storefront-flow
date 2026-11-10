import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["checkout"];

export const Route = createFileRoute("/checkout")({
  head: () => marketingHead({
    title: "Sales & checkout — Strap point of sale",
    description: page.description,
    path: "/checkout",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
