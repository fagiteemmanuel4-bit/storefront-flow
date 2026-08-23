import { createFileRoute } from "@tanstack/react-router";
import { SettingsSectionPage } from "@/components/settings/SettingsCenter";

export const Route = createFileRoute("/_authenticated/settings/online-store")({ component: () => <SettingsSectionPage section="online-store" /> });
