import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSettingsPage } from "@/components/settings/AppearanceSettingsPage";

export const Route = createFileRoute("/_authenticated/settings/appearance")({ component: AppearanceSettingsPage });
