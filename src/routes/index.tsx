import { createFileRoute, redirect } from "@tanstack/react-router";

// The previous marketing landing page is intentionally paused while its replacement is prepared.
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/auth" });
  },
});
