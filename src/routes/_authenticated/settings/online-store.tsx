import { createFileRoute } from "@tanstack/react-router";
import { OnlineStoreSettingsPage } from "@/components/settings/OnlineStoreSettingsPage";

export const Route = createFileRoute("/_authenticated/settings/online-store")({ component: OnlineStoreSettingsPage });
