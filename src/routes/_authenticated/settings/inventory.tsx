import { createFileRoute } from "@tanstack/react-router";
import { SettingsSectionPage } from "@/components/settings/SettingsCenter";

export const Route = createFileRoute("/_authenticated/settings/inventory")({ component: () => <SettingsSectionPage section="inventory" /> });
