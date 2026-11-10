import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";
const page = marketingPages["contact"];
export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [
    { title: "Contact and support — Strap" },
    { name: "description", content: page.description },
    { property: "og:title", content: "Contact and support — Strap" },
    { property: "og:description", content: page.description },
  ] }),
  component: () => <MarketingInfoPage page={page} />,
});
