import { createFileRoute } from "@tanstack/react-router";
import { SettingsLayout } from "@/components/settings/SettingsCenter";

// Canonical authenticated Settings workspace; legacy /advanced-settings redirects to /settings/advanced.
export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsLayout });
