import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["expenses"];

export const Route = createFileRoute("/expense-management")({
  head: () => marketingHead({
    title: "Expense management — Strap retail operations",
    description: page.description,
    path: "/expense-management",
  }),
  component: () => <MarketingInfoPage page={page} />,
});
