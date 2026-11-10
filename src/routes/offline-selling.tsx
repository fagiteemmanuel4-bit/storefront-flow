import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";
const page = marketingPages["offline"];
export const Route = createFileRoute("/offline-selling")({
  head: () => marketingHead({
    title: "Offline selling — Strap connectivity guide",
    description: page.description,
    path: "/offline-selling",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
