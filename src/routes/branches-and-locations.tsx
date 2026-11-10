import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["branches"];

export const Route = createFileRoute("/branches-and-locations")({
  head: () => marketingHead({
    title: "Multi-location retail — Strap branches and stock",
    description: page.description,
    path: "/branches-and-locations",
    image: page.image,
  }),
  component: () => <MarketingInfoPage page={page} path="/branches-and-locations" />,
});
