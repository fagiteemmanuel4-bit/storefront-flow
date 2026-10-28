import { createFileRoute } from "@tanstack/react-router";
import { PasswordOtp } from "@/components/settings/PasswordOtp";

export const Route = createFileRoute("/_authenticated/settings/password")({ component: PasswordOtp });
