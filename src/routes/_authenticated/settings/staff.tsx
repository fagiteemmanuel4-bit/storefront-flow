import { createFileRoute } from "@tanstack/react-router";
import { StaffManager } from "@/components/settings/StaffManager";

export const Route = createFileRoute("/_authenticated/settings/staff")({ component: StaffManager });
