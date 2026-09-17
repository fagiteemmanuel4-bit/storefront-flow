import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Check, Download, ExtensionIcon, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EXTENSIONS, getInstalledExtensionIds, setExtensionInstalled } from "@/lib/extensions";

export const Route = createFileRoute("/_authenticated/extensions")({ component: ExtensionsPage });

function ExtensionsPage() {
  const [installed, setInstalled] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const sync = () => setInstalled(getInstalledExtensionIds());
    sync();
    window.addEventListener("strap-extensions-changed", sync);
    return () => window.removeEventListener("strap-extensions-changed", sync);
  }, []);
  const filtered = useMemo(() => EXTENSIONS.filter((item) => `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <AppShell title="Extensions"><div className="space-y-7">
    <section className="strap-entrance relative overflow-hidden rounded-[24px] border border-border bg-foreground px-6 py-8 text-background sm:px-8 lg:px-10">
      <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative max-w-2xl"><span className="flex size-10 items-center justify-center rounded-xl bg-background/10"><ExtensionIcon className="size-5" /></span><p className="mt-5 text-label-caps text-background/50">Strap extensions</p><h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Small tools. Built into the workflow.</h2><p className="mt-3 text-sm leading-6 text-background/65">Optional utilities that make everyday selling faster, without turning Strap into a cluttered toolbox.</p></div>
    </section>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-label-caps text-muted-foreground">Extension library</p><h3 className="mt-1 font-display text-xl font-semibold">Available tools</h3></div><div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search extensions" className="pl-9" aria-label="Search extensions"/></div></div>
    <div className="grid gap-4 md:grid-cols-2">{filtered.map((item) => { const isInstalled = installed.includes(item.id); const Icon = item.icon; return <article key={item.id} className="strap-entrance surface-card flex min-h-52 flex-col p-6"><div className="flex items-start justify-between gap-4"><span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5"/></span><span className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">{item.category}</span></div><div className="mt-5"><h4 className="font-display text-lg font-semibold">{item.name}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p></div><div className="mt-auto flex items-center justify-between gap-3 pt-6"><span className="text-xs text-muted-foreground">v{item.version}</span><Button variant={isInstalled ? "outline" : "default"} className="touch-target" onClick={() => setInstalled(setExtensionInstalled(item.id, !isInstalled))}>{isInstalled ? <><Check className="mr-2 size-4"/>Installed</> : <><Download className="mr-2 size-4"/>Install</>}</Button></div></article>; })}</div>
    {filtered.length === 0 && <div className="surface-card flex min-h-44 flex-col items-center justify-center p-6 text-center"><Sparkles className="size-5 text-muted-foreground"/><p className="mt-3 font-semibold">No matching extensions</p><p className="mt-1 text-sm text-muted-foreground">Try a different search term.</p></div>}
  </div></AppShell>;
}
