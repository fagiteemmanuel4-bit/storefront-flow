import { createFileRoute } from "@tanstack/react-router";
import { SettingsHome } from "@/components/settings/SettingsCenter";

export const Route = createFileRoute("/_authenticated/settings/")({ component: SettingsHome });
