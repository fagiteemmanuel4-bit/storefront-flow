import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";
const page = marketingPages["offline"];
export const Route = createFileRoute("/offline-selling")({
  head: () => ({ meta: [
    { title: "Offline selling — Strap connectivity guide" },
    { name: "description", content: page.description },
    { property: "og:title", content: "Offline selling — Strap connectivity guide" },
    { property: "og:description", content: page.description },
  ] }),
  component: () => <MarketingInfoPage page={page} />,
});
