import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["teams"];

export const Route = createFileRoute("/team-management")({
  head: () => marketingHead({
    title: "Team management — Strap roles and staff access",
    description: page.description,
    path: "/team-management",
    image: page.image,
  }),
  component: () => <MarketingInfoPage page={page} path="/team-management" />,
});
