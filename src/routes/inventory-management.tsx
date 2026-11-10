import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["inventory"];

export const Route = createFileRoute("/inventory-management")({
  head: () => marketingHead({
    title: "Inventory management — Strap retail stock control",
    description: page.description,
    path: "/inventory-management",
    image: page.image,
  }),
  component: () => <MarketingInfoPage page={page} path="/inventory-management" />,
});
