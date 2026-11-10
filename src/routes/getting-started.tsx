import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["gettingStarted"];

export const Route = createFileRoute("/getting-started")({
  head: () => ({
    meta: [
      { title: "Getting started — Strap shop setup guide" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Getting started — Strap shop setup guide" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
