import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["expenses"];

export const Route = createFileRoute("/expense-management")({
  head: () => ({
    meta: [
      { title: "Expense management — Strap retail operations" },
      { name: "description", content: page.description },
      { property: "og:title", content: "Expense management — Strap retail operations" },
      { property: "og:description", content: page.description },
    ],
  }),
  component: () => <MarketingInfoPage page={page} />,
});
