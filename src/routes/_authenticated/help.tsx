import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BarChart3, ChevronDown, Package, Printer, Search, ShieldCheck, ShoppingCart, Store, Zap } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/_authenticated/help")({ ssr: false, component: HelpPage });

const guides = [
  [Store, "Set up your store", "Getting started", "Create your Kudi store, choose a name, configure currency and publish your online storefront."],
  [Package, "Manage stock", "Inventory", "Add products, update prices and quantities, upload multiple images, search your stock and keep low-stock items visible."],
  [ShoppingCart, "Make a sale", "Sales", "Use the POS to add products, adjust quantities, apply discounts and complete a sale. Your stock updates automatically."],
  [Store, "Build your online store", "Online store", "Publish products, feature products, manage hero banners and share your storefront link with customers."],
  [BarChart3, "Read your reports", "Reports", "Use sales, expenses and trading summaries to understand revenue, profit and activity over a selected period."],
  [Printer, "Receipt printing", "Coming soon", "Bluetooth receipt printing is being prepared. You can already create your own receipt layout in the Kudi designer."],
  [ShieldCheck, "Roles and permissions", "Account", "Owners and managers can manage store operations while member access follows the permissions configured for the store."],
  [Zap, "Quick workflows", "Tips", "Use search, filters, bulk actions and keyboard-friendly controls to move through large inventories faster."],
] as const;

function HelpPage() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const filtered = useMemo(() => guides.filter((g) => `${g[1]} ${g[2]} ${g[3]}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <AppShell title="Help & guides">
    <div className="overflow-hidden rounded-[2rem] border border-border bg-surface shadow-lift">
      <div className="bg-accent-soft p-6 sm:p-10"><p className="text-label-caps text-muted-foreground">Kudi documentation</p><h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Learn how to run your store.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Practical guides for selling, inventory, online commerce and the tools that keep Kudi moving.</p><label className="relative mt-7 block max-w-xl"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search guides, features and workflows…" className="field h-12 pl-11" /></label></div>
      <div className="grid gap-px bg-border sm:grid-cols-2">{filtered.map(([Icon, title, category, text]) => { const expanded = open === title; return <article key={title} className="bg-surface p-5 sm:p-6"><button type="button" className="flex w-full items-start gap-4 text-left" onClick={() => setOpen(expanded ? null : title)}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft"><Icon className="size-5" /></span><span className="min-w-0 flex-1"><span className="text-label-caps text-muted-foreground">{category}</span><span className="mt-1 block font-display font-semibold">{title}</span></span><ChevronDown className={`mt-1 size-4 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} /></button>{expanded && <div className="mt-4 pl-14 text-sm leading-6 text-muted-foreground">{text}<p className="mt-3 text-xs font-semibold text-foreground">Tip: Start with the smallest workflow that solves the task, then use bulk tools when your store grows.</p></div>}</article>; })}</div>
      {filtered.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">No guide matched “{query}”.</div>}
    </div>
  </AppShell>;
}
