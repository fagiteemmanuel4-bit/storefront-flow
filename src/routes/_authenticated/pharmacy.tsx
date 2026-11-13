import { createFileRoute } from "@tanstack/react-router";
import { VerticalOperationsPage } from "@/components/vertical/VerticalOperationsPage";
export const Route = createFileRoute("/_authenticated/pharmacy")({ component: () => <VerticalOperationsPage mode="pharmacy" /> });
