import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";
const page = marketingPages["imports"];
export const Route = createFileRoute("/product-imports")({
  head: () => marketingHead({
    title: "Product imports — Strap catalogue tools",
    description: page.description,
    path: "/product-imports",
    image: page.image,
  }),
  component: () => <MarketingInfoPage page={page} path="/product-imports" />,
});
