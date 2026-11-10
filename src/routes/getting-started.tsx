import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["gettingStarted"];

export const Route = createFileRoute("/getting-started")({
  head: () => marketingHead({
    title: "Getting started — Strap shop setup guide",
    description: page.description,
    path: "/getting-started",
    image: page.image,
  }),
  component: () => <MarketingInfoPage page={page} />,
});
