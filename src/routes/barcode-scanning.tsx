import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["barcode"];

export const Route = createFileRoute("/barcode-scanning")({
  head: () => marketingHead({
    title: "Barcode scanning — Strap retail checkout",
    description: page.description,
    path: "/barcode-scanning",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
