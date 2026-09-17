import { useRouterState } from "@tanstack/react-router";

/**
 * The application uses a single loading language: a 2px progress line.
 * Keep this component for existing consumers; do not introduce page-level
 * skeletons or full-screen loading cards for route transitions.
 */
export function RouteLoadingOverlay() {
  const isLoading = useRouterState({ select: (state) => state.status === "pending" });
  if (!isLoading) return null;
  return <div className="strap-route-progress" role="progressbar" aria-label="Loading" aria-busy="true" />;
}
