import { createFileRoute } from "@tanstack/react-router";
import { Route as LandingRoute } from "./landing";
export const Route=createFileRoute("/")({component:LandingRoute.options.component as React.ComponentType});
