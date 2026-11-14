import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/feature-discovery")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});
