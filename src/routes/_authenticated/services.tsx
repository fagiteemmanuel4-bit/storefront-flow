import { createFileRoute } from "@tanstack/react-router";
import { VerticalOperationsPage } from "@/components/vertical/VerticalOperationsPage";
export const Route = createFileRoute("/_authenticated/services")({ component: () => <VerticalOperationsPage mode="services" /> });
