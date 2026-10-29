import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Download, Puzzle, Search, Sparkles, ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXTENSIONS, getInstalledExtensionIds, setExtensionInstalled } from "@/lib/extensions";
import { useStoreContext } from "@/components/shell/StoreProvider";

export const Route = createFileRoute("/_authenticated/extensions")({ component: ExtensionsPage });

function ExtensionsPage() {
  const { store } = useStoreContext();
  const [installed, setInstalled] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const sync = () => setInstalled(getInstalledExtensionIds());
    sync();
    window.addEventListener("strap-extensions-changed", sync);
    return () => window.removeEventListener("strap-extensions-changed", sync);
  }, []);

  const filtered = useMemo(
    () => EXTENSIONS.filter((item) => `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  return (
    <AppShell title="Extensions">
      <div className="space-y-7 sm:space-y-9">
        <section className="strap-entrance relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#191a17] px-5 py-7 text-white shadow-[0_28px_70px_-32px_rgba(24,24,20,.5)] sm:rounded-[32px] sm:px-8 sm:py-9 lg:px-10">
          <div className="pointer-events-none absolute -right-14 -top-24 -z-10 size-64 rounded-full bg-[#f5c542]/25 blur-3xl sm:size-80" />
          <div className="pointer-events-none absolute -bottom-24 right-1/4 -z-10 size-48 rounded-full bg-white/5 blur-3xl" />
          <div className="relative max-w-2xl">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[.08] shadow-inner">
              <Puzzle className="size-5 text-[#f5c542]" />
            </div>
            <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#f5c542]">Strap workspace · add-ons</p>
            <h2 className="mt-2 max-w-xl font-display text-3xl font-bold leading-tight tracking-[-.045em] sm:text-4xl">Make your workflow work harder.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">A focused collection of optional tools designed to make daily shop operations smoother — without adding clutter.</p>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs font-medium text-white/65">
              <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5">Simple to enable</span>
              <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5">Built for your shop</span>
            </div>
          </div>
          <Sparkles className="pointer-events-none absolute bottom-7 right-8 hidden size-10 text-[#f5c542]/70 sm:block" />
        </section>

        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent-ink">Extension library</p>
            <h3 className="mt-1 font-display text-2xl font-semibold tracking-[-.035em]">Tools for your day</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">Browse the tools and keep the ones that fit your workflow.</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools or categories…" className="h-12 rounded-2xl border-border/80 bg-surface pl-10 shadow-[0_8px_22px_-16px_rgba(20,20,18,.24)] focus-visible:ring-4 focus-visible:ring-accent/15" aria-label="Search extensions" />
          </div>
        </section>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => {
            const isInstalled = installed.includes(item.id);
            const Icon = item.icon;
            const Active = item.component;
            return (
              <article key={item.id} className="group strap-entrance flex min-h-56 flex-col overflow-hidden rounded-[24px] border border-border/80 bg-surface p-5 shadow-[0_2px_8px_-5px_rgba(25,25,20,.18),0_18px_42px_-30px_rgba(25,25,20,.22)] transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-[0_18px_48px_-24px_rgba(25,25,20,.28)] sm:rounded-[28px] sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-accent/15 bg-accent-soft text-accent-ink shadow-inner transition group-hover:scale-[1.04]">
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded-full border border-border/70 bg-secondary/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-muted-foreground">{item.category}</span>
                </div>
                <div className="mt-5">
                  <h4 className="font-display text-lg font-semibold tracking-[-.02em]">{item.name}</h4>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                  <span className="text-xs font-medium text-muted-foreground">Version {item.version}</span>
                  <Button variant={isInstalled ? "outline" : "default"} className="touch-target rounded-full px-4 shadow-[0_5px_14px_-9px_rgba(20,20,18,.4)]" onClick={() => setInstalled(setExtensionInstalled(item.id, !isInstalled))}>
                    {isInstalled ? <><Check className="mr-2 size-4" />Enabled</> : <><Download className="mr-2 size-4" />Enable tool</>}
                  </Button>
                </div>
                {isInstalled && <div className="mt-5 rounded-2xl border border-border/70 bg-background/80 p-4">
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><span className="size-1.5 rounded-full bg-emerald-500" />Ready to use</div>
                  <Active currency={store?.currency ?? "NGN"} />
                </div>}
                <div className="mt-4 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground/70"><ArrowUpRight className="size-3.5" />Optional workspace tool</div>
              </article>
            );
          })}
        </div>
        {filtered.length === 0 && <div className="flex min-h-56 flex-col items-center justify-center rounded-[28px] border border-dashed border-border bg-surface/70 p-6 text-center shadow-sm">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Search className="size-5" /></span>
          <p className="mt-4 font-display text-lg font-semibold">No matching tools</p>
          <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Try another keyword or category to find what you need.</p>
        </div>}
      </div>
    </AppShell>
  );
}
