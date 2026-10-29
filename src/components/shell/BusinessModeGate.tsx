import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BUSINESS_MODES, type BusinessModeKey } from "@/lib/business-modes";
import { AppShell } from "@/components/shell/AppShell";

export function BusinessModeGate({ modeKey, children }: { modeKey: BusinessModeKey; children: ReactNode }) {
  const mode = BUSINESS_MODES.find((item) => item.key === modeKey);
  if (!mode || mode.availability === "available") return <>{children}</>;

  return (
    <AppShell title={mode.label}>
      <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-background p-6 shadow-sm sm:p-8">
        <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent-ink">Coming soon</span>
        <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">{mode.label} is not active yet</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">We are preparing this specialist workspace. For now, General Store is the active mode. Your existing products, sales, customers and stock remain available.</p>
        <Link to="/dashboard" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Return to General Store</Link>
      </section>
    </AppShell>
  );
}
