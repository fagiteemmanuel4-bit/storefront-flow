import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/upgrade")({ component: UpgradePage });

function UpgradePage() {
  return (
    <AppShell title="STRAP upgrade">
      <main className="mx-auto max-w-2xl py-8 sm:py-14">
        <section className="rounded-3xl border border-border bg-surface p-7 text-center shadow-sm sm:p-10">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
            <Sparkles className="size-7" />
          </span>
          <p className="mt-5 text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">A platform-wide upgrade</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">All features are free right now.</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
            STRAP is getting a major upgrade. Over the next 1–2 weeks, some features may be temporarily unavailable while we improve the platform. All supported features are unlocked for everyone, and subscription plans are suspended during this period.
          </p>
          <p className="mt-5 text-sm font-semibold">We’ll be back bigger and better soon. Love you all ❤️</p>
          <Button asChild className="mt-7 rounded-xl"><Link to="/dashboard">Back to STRAP</Link></Button>
        </section>
      </main>
    </AppShell>
  );
}
