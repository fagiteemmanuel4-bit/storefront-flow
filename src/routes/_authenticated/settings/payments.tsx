import { createFileRoute } from "@tanstack/react-router";
import { PaymentsSettingsPage } from "@/components/settings/PaymentsSettingsPage";

export const Route = createFileRoute("/_authenticated/settings/payments")({ component: PaymentsSettingsPage });
