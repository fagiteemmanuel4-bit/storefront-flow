import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Download, Puzzle, Search, Sparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXTENSIONS, getInstalledExtensionIds, setExtensionInstalled } from "@/lib/extensions";
import { useStoreContext } from "@/components/shell/StoreProvider";

export const Route = createFileRoute("/_authenticated/extensions")({
  component: ExtensionsPage,
});

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
    () =>
      EXTENSIONS.filter((item) =>
        `${item.name} ${item.description} ${item.category}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <AppShell title="Extensions">
      <div className="space-y-7">
        <section className="strap-entrance relative isolate overflow-hidden rounded-[28px] border border-foreground/10 bg-foreground px-5 py-7 text-background shadow-float sm:px-8 sm:py-9 lg:px-10">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_15%,rgba(246,190,57,0.25),transparent_38%),radial-gradient(ellipse_at_0%_100%,rgba(255,255,255,0.08),transparent_40%)]" />
          <div className="pointer-events-none absolute -right-10 -top-16 -z-10 size-56 rounded-full border border-background/10 sm:size-72" />
          <div className="pointer-events-none absolute -right-2 -top-8 -z-10 size-40 rounded-full border border-background/10 sm:size-52" />
          <div className="relative grid gap-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <div className="max-w-2xl">
              <span className="inline-flex size-11 items-center justify-center rounded-2xl border border-background/15 bg-background/10 shadow-lg">
                <Puzzle className="size-5 text-[#f6c453]" />
              </span>
              <p className="mt-5 text-label-caps text-background/65">Strap · Extension library</p>
              <h2 className="mt-2 max-w-xl font-display text-3xl font-bold leading-tight tracking-tight text-background sm:text-4xl">
                Your workflow, with a little extra power.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-background/75 sm:text-base">
                Add lightweight tools when you need them. Your core sales, stock and store workflows stay right where you expect them.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:min-w-52 md:grid-cols-1">
              <div className="rounded-2xl border border-background/15 bg-background/[0.08] p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-background/65">In your library</p>
                <p className="mt-1 font-display text-2xl font-bold text-background">{EXTENSIONS.length}</p>
                <p className="mt-1 text-xs text-background/60">Available tools</p>
              </div>
              <div className="rounded-2xl border border-background/15 bg-background/[0.08] p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-background/65">Ready to use</p>
                <p className="mt-1 font-display text-2xl font-bold text-background">{installed.length}</p>
                <p className="mt-1 text-xs text-background/60">Installed by you</p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4" aria-labelledby="extension-library-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-label-caps text-muted-foreground">Make it yours</p>
              <h3 id="extension-library-heading" className="mt-1 font-display text-2xl font-bold tracking-tight">
                Explore extensions
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">Small, practical tools designed to fit into your day.</p>
            </div>
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools or categories"
                className="h-12 rounded-2xl border-border/80 bg-surface pl-10 shadow-sm focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Search extensions"
              />
            </div>
          </div>

          {filtered.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => {
                const isInstalled = installed.includes(item.id);
                const Icon = item.icon;
                const Active = item.component;
                return (
                  <article
                    key={item.id}
                    className="surface-card group flex min-h-64 flex-col overflow-hidden p-5 sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent-soft text-accent-ink shadow-sm transition-transform duration-200 group-hover:scale-105">
                        <Icon className="size-5" />
                      </span>
                      <span className="rounded-full border border-border bg-secondary/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-secondary-foreground">
                        {item.category}
                      </span>
                    </div>
                    <div className="mt-5">
                      <h4 className="font-display text-lg font-bold tracking-tight">{item.name}</h4>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                      <span className="text-xs font-medium text-muted-foreground">Version {item.version}</span>
                      <Button
                        variant={isInstalled ? "outline" : "default"}
                        className="touch-target rounded-xl"
                        onClick={() => setInstalled(setExtensionInstalled(item.id, !isInstalled))}
                      >
                        {isInstalled ? (
                          <>
                            <Check className="size-4" />
                            Installed
                          </>
                        ) : (
                          <>
                            <Download className="size-4" />
                            Install
                          </>
                        )}
                      </Button>
                    </div>
                    {isInstalled && (
                      <div className="mt-5 rounded-2xl border border-success/20 bg-success-soft/55 p-4">
                        <p className="mb-3 flex items-center gap-2 text-xs font-semibold text-success">
                          <Zap className="size-3.5" />
                          Extension active
                        </p>
                        <Active currency={store?.currency ?? "NGN"} />
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="surface-card flex min-h-60 flex-col items-center justify-center p-8 text-center shadow-lift">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
                <Sparkles className="size-5" />
              </span>
              <p className="mt-4 font-display text-lg font-bold">No matching extensions</p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                Try another search term or category to find the tool you need.
              </p>
              {query && (
                <Button variant="outline" className="mt-4 rounded-xl" onClick={() => setQuery("")}>
                  Clear search
                </Button>
              )}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
