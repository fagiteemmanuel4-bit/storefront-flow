import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["customers"];

export const Route = createFileRoute("/customer-management")({
  head: () => marketingHead({
    title: "Customer management — Strap retail customer records",
    description: page.description,
    path: "/customer-management",
    image: page.image,
  }),
  component: () => <MarketingInfoPage page={page} path="/customer-management" />,
});
