import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Command, FileText, Package, Plus, ReceiptText, Search, Settings, ShoppingBag, Store, Users, X } from "lucide-react";

type QuickFindProps = { open: boolean; onOpenChange: (open: boolean) => void };

type QuickAction = { label: string; hint: string; to: string; icon: typeof Search; keywords: string };

const ACTIONS: QuickAction[] = [
  { label: "New sale", hint: "Open the fastest checkout workspace", to: "/pos", icon: Plus, keywords: "sell checkout sale pos charge" },
  { label: "Products", hint: "Find products, stock and catalogue", to: "/products", icon: Package, keywords: "product inventory stock catalogue" },
  { label: "Orders", hint: "Review orders and their status", to: "/online-store/orders", icon: ShoppingBag, keywords: "orders sales pending completed" },
  { label: "Customers", hint: "Find customers and purchase history", to: "/customers", icon: Users, keywords: "customer crm buyers clients" },
  { label: "Analytics", hint: "See business performance and reports", to: "/reports", icon: BarChart3, keywords: "analytics reports revenue insights" },
  { label: "Add expense", hint: "Record money leaving the business", to: "/expenses", icon: ReceiptText, keywords: "expense spending costs" },
  { label: "Online store", hint: "Manage your public storefront", to: "/online-store", icon: Store, keywords: "storefront website ecommerce online" },
  { label: "Settings", hint: "Store, account and security settings", to: "/settings", icon: Settings, keywords: "settings preferences account security" },
  { label: "Help", hint: "Open guides and support", to: "/help", icon: FileText, keywords: "help docs support guide" },
];

export function QuickFind({ open, onOpenChange }: QuickFindProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
      if (open && event.key === "Escape") {
        event.preventDefault();
        onOpenChange(false);
      }
    };
    const onSearchClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[aria-label="Search"]')) {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    window.addEventListener("keydown", onGlobalKeyDown);
    document.addEventListener("click", onSearchClick, true);
    return () => {
      window.removeEventListener("keydown", onGlobalKeyDown);
      document.removeEventListener("click", onSearchClick, true);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return ACTIONS;
    return ACTIONS.filter((action) => `${action.label} ${action.hint} ${action.keywords}`.toLowerCase().includes(normalized));
  }, [query]);

  const go = (to: string) => { onOpenChange(false); void navigate({ to: to as never }); };

  useEffect(() => {
    if (!open) return;
    const onEnter = (event: KeyboardEvent) => {
      if (event.key === "Enter" && results[0]) { event.preventDefault(); go(results[0].to); }
    };
    window.addEventListener("keydown", onEnter);
    return () => window.removeEventListener("keydown", onEnter);
  }, [open, results]);

  if (!open) return null;

  return <div className="fixed inset-0 z-[120] flex items-start justify-center bg-foreground/35 px-3 pt-[10vh] backdrop-blur-[2px]" role="presentation" onMouseDown={() => onOpenChange(false)}>
    <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl" role="dialog" aria-modal="true" aria-label="Find in Strap" onMouseDown={(event) => event.stopPropagation()}>
      <div className="flex items-center gap-3 border-b border-border px-4">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Strap or jump to a workspace…" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label="Search Strap" />
        <button type="button" onClick={() => onOpenChange(false)} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label="Close search"><X className="size-4" /></button>
      </div>
      <div className="max-h-[55vh] overflow-y-auto p-2">
        <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Jump to</div>
        {results.length ? results.map((action) => { const Icon = action.icon; return <button key={action.to} type="button" onClick={() => go(action.to)} className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary group-hover:bg-background"><Icon className="size-4" /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{action.label}</span><span className="block truncate text-xs text-muted-foreground">{action.hint}</span></span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </button>; }) : <div className="px-3 py-8 text-center"><p className="text-sm font-semibold">No matching Strap destination</p><p className="mt-1 text-xs text-muted-foreground">Try a product, order, customer, report, or action.</p></div>}
      </div>
      <div className="flex items-center justify-between border-t border-border bg-secondary/30 px-4 py-2.5 text-[11px] text-muted-foreground"><span className="flex items-center gap-1.5"><Command className="size-3.5" />Quick find</span><span className="hidden sm:inline">Enter to open · Esc to close</span></div>
    </div>
  </div>;
}

export function QuickFindHost() {
  const [open, setOpen] = useState(false);
  return <QuickFind open={open} onOpenChange={setOpen} />;
}
