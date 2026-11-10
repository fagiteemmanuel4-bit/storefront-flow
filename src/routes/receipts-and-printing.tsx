import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["receipts"];

export const Route = createFileRoute("/receipts-and-printing")({
  head: () => marketingHead({
    title: "Receipts and printing — Strap retail tools",
    description: page.description,
    path: "/receipts-and-printing",
    image: page.image,
  }),
  component: () => <MarketingInfoPage page={page} />,
});
