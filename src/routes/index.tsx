import { createFileRoute } from "@tanstack/react-router";
import { Landing } from "./landing";
import { marketingHead } from "@/lib/marketingSeo";

export const Route = createFileRoute("/")({
  head: () => marketingHead({
    title: "Strap — Retail POS, Inventory and Online Store Software",
    description: "Manage sales, products, inventory, customers, staff, branches, expenses and online orders in one retail operations workspace.",
    path: "/",
  }),
  component: Landing,
});
