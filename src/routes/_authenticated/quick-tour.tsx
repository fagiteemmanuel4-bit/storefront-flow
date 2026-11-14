import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Compass, Play } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/quick-tour")({
  component: QuickTourPage,
});

function QuickTourPage() {
  const [started, setStarted] = useState(false);

  function startTour() {
    setStarted(true);
    window.dispatchEvent(new Event("strap-start-welcome-tour"));
  }

  return (
    <AppShell title="Quick tour">
      <div className="mx-auto max-w-3xl space-y-5">
        <section className="rounded-3xl border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft">
            <Compass className="size-6" />
          </div>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">
            Guided workspace tour
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Get comfortable with Strap.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            Take a guided walk through navigation, store and branch switching, quick search, updates,
            connection status and workspace help. This guide stays separate from the page-specific
            tours, so you can replay either one whenever you need it.
          </p>
          <Button onClick={startTour} className="mt-6">
            <Play className="mr-2 size-4" />
            {started ? "Replay full tour" : "Start full tour"}
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
