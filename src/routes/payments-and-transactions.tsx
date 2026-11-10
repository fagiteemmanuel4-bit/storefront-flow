import { marketingHead } from "@/lib/marketingSeo";
import { createFileRoute } from "@tanstack/react-router";
import { MarketingInfoPage } from "@/components/site/MarketingInfoPage";
import { marketingPages } from "@/components/site/marketingPages";

const page = marketingPages["payments"];

export const Route = createFileRoute("/payments-and-transactions")({
  head: () => marketingHead({
    title: "Payments and transactions — Strap retail records",
    description: page.description,
    path: "/payments-and-transactions",
    image: page.image,
  }),
  component: () => <MarketingInfoPage page={page} path="/payments-and-transactions" />,
});
