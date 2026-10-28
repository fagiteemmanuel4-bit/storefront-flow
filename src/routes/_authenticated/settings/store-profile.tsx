import { createFileRoute } from "@tanstack/react-router";
import { SettingsSectionPage } from "@/components/settings/SettingsCenter";

export const Route = createFileRoute("/_authenticated/settings/store-profile")({ component: () => <SettingsSectionPage section="store-profile" /> });
