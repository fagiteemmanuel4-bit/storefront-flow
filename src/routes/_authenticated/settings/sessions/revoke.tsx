import { createFileRoute } from "@tanstack/react-router";
import { RevokeSessionsPage } from "@/components/settings/SettingsCenter";

export const Route = createFileRoute("/_authenticated/settings/sessions/revoke")({ component: RevokeSessionsPage });
