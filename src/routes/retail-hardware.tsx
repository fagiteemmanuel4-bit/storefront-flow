import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["hardware"];

export const Route = createFileRoute("/retail-hardware")({
  head: () => ({
    meta: [
      { title: "Retail hardware — Strap scanner and printer setup" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Retail hardware — Strap scanner and printer setup" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
