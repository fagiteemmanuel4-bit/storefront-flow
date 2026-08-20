import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/stock-sense")({
  beforeLoad: () => {
    throw redirect({ to: "/product-import", replace: true });
  },
});
