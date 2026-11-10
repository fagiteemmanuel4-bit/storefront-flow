import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";
const page = marketingPages["imports"];
export const Route = createFileRoute("/product-imports")({
  head: () => ({ meta: [
    { title: "Product imports — Strap catalogue tools" },
    { name: "description", content: page.description },
    { property: "og:title", content: "Product imports — Strap catalogue tools" },
    { property: "og:description", content: page.description },
  ] }),
  component: () => <MarketingInfoPage page={page} />,
});
