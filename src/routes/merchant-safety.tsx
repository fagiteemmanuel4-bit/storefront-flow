import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";
const page = marketingPages["safety"];
export const Route = createFileRoute("/merchant-safety")({
  head: () => ({ meta: [
    { title: "Merchant safety — Strap trust and reporting" },
    { name: "description", content: page.description },
    { property: "og:title", content: "Merchant safety — Strap trust and reporting" },
    { property: "og:description", content: page.description },
  ] }),
  component: () => <MarketingInfoPage page={page} />,
});
