import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["teams"];

export const Route = createFileRoute("/team-management")({
  head: () => ({
    meta: [
      { title: "Team management — Strap roles and staff access" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Team management — Strap roles and staff access" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
