import { createFileRoute } from "@tanstack/react-router";
import { RevokeSessionsPage } from "@/components/settings/RevokeSessionsPage";

export const Route = createFileRoute("/_authenticated/settings/sessions/revoke")({ component: RevokeSessionsPage });
