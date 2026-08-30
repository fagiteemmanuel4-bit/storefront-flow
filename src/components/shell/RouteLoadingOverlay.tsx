import { useEffect, useState } from "react";
import { useRouterState } from "@tanstack/react-router";

export function RouteLoadingOverlay() {
  const isLoading = useRouterState({ select: (state) => state.status === "pending" });
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (isLoading) { setVisible(true); return; } const timer = window.setTimeout(() => setVisible(false), 220); return () => window.clearTimeout(timer); }, [isLoading]);
  if (!visible) return null;
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm" aria-live="polite" aria-label="Loading Strap"><div className="w-[min(320px,calc(100vw-40px))] rounded-3xl border border-border bg-background p-6 text-center shadow-2xl"><div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-foreground"><span className="size-3.5 rotate-45 rounded-[2px] bg-accent"/></div><p className="mt-4 font-display text-lg font-bold">Loading Strap</p><p className="mt-1 text-xs text-muted-foreground">Preparing your workspace…</p><div className="mt-5 h-1 overflow-hidden rounded-full bg-secondary"><div className="h-full w-1/2 animate-[loading-bar_900ms_ease-in-out_infinite] rounded-full bg-accent"/></div></div></div>;
}
