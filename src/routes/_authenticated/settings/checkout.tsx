import { createFileRoute } from "@tanstack/react-router";
import { SettingsSectionPage } from "@/components/settings/SettingsCenter";
import { CheckoutSettingsFrame } from "@/components/settings/CheckoutSettingsFrame";

export const Route = createFileRoute("/_authenticated/settings/checkout")({ component: () => <CheckoutSettingsFrame><SettingsSectionPage section="checkout" /></CheckoutSettingsFrame> });
