import { createFileRoute } from "@tanstack/react-router";
import { SettingsLayout } from "@/components/settings/SettingsCenter";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsLayout });
