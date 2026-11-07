import { createFileRoute } from "@tanstack/react-router";
import { StrapMcpSettingsPage } from "@/components/settings/StrapMcpSettings";

export const Route = createFileRoute("/_authenticated/settings/ai-agents")({
  component: StrapMcpSettingsPage,
});
