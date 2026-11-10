import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["hardware"];

export const Route = createFileRoute("/retail-hardware")({
  head: () => marketingHead({
    title: "Retail hardware — Strap scanner and printer setup",
    description: page.description,
    path: "/retail-hardware",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
