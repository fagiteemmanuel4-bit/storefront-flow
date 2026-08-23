import { createFileRoute } from "@tanstack/react-router";
import { SettingsHomeShell } from "@/components/settings/SettingsShell";

export const Route = createFileRoute("/_authenticated/settings/")({ component: SettingsHomeShell });
