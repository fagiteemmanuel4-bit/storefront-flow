import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/advanced-settings")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/advanced" });
  },
});
