import { createFileRoute } from "@tanstack/react-router";

/**
 * Authentication UI intentionally cleared for the upcoming redesign.
 * The complete previous UI and authentication implementation is preserved in:
 * backups/auth-system-before-ui-reset-2026-11-14/
 */
export const Route = createFileRoute("/verify-email")({
  ssr: false,
  component: () => null,
});
