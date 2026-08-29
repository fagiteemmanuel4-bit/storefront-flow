import { Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Bell, ChevronRight, CreditCard, Database, Globe2, KeyRound, Laptop, Menu, Palette, Receipt, Save, ShieldCheck, SlidersHorizontal, Store, Users, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const items = [
  { path: "/settings/store-profile", title: "Store profile", description: "Business identity, contact and regional settings", icon: Store, group: "Store" },
  { path: "/settings/appearance", title: "Store appearance", description: "Branding, typography and storefront style", icon: Palette, group: "Store" },
  { path: "/settings/online-store", title: "Online store", description: "Publishing, catalogue and SEO", icon: Globe2, group: "Store" },
  { path: "/settings/receipts", title: "Receipts", description: "Receipt identity, content and printing", icon: Receipt, group: "Commerce" },
  { path: "/settings/checkout", title: "Checkout & sales", description: "Checkout, discounts, tax and POS behaviour", icon: CreditCard, group: "Commerce" },
  { path: "/settings/inventory", title: "Inventory", description: "Stock, valuation, branches and alerts", icon: Database, group: "Commerce" },
  { path: "/settings/payments", title: "Payments", description: "Payment infrastructure", icon: WalletCards, group: "Commerce" },
  { path: "/settings/staff", title: "Staff & permissions", description: "Team members, roles and access", icon: Users, group: "Team" },
  { path: "/settings/notifications", title: "Notifications", description: "Operational notification preferences", icon: Bell, group: "Team" },
  { path: "/settings/security", title: "Security", description: "Account protection and sessions", icon: ShieldCheck, group: "Security" },
  { path: "/settings/password", title: "Change password", description: "Verify email and change password", icon: KeyRound, group: "Account" },
  { path: "/settings/sessions", title: "Active sessions", description: "Review and revoke authenticated sessions", icon: Laptop, group: "Account" },
  { path: "/settings/advanced", title: "Advanced", description: "Deeper operational and developer controls", icon: SlidersHorizontal, group: "Advanced" },
] as const;
const groups = [...new Set(items.map(i => i.group))];

export function SettingsShell() {
  const location = useLocation();
  return location.pathname === "/settings" ? null : <FocusedSettingsPage />;
}

function FocusedSettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  const current = useMemo(() => items.find(item => location.pathname === item.path), [location.pathname]);

  useEffect(() => {
    const markDirty = () => setDirty(true);
    const onSave = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (button && /^(save|save changes|saving)/i.test(button.textContent?.trim() ?? "")) setTimeout(() => setDirty(false), 0);
    };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } };
    document.addEventListener("input", markDirty, true);
    document.addEventListener("change", markDirty, true);
    document.addEventListener("click", onSave, true);
    window.addEventListener("beforeunload", beforeUnload);
    return () => { document.removeEventListener("input", markDirty, true); document.removeEventListener("change", markDirty, true); document.removeEventListener("click", onSave, true); window.removeEventListener("beforeunload", beforeUnload); };
  }, [dirty]);

  const requestNavigation = (path: string) => {
    if (!dirty) { setMenuOpen(false); void navigate({ to: path }); return; }
    setPendingPath(path); setConfirmOpen(true);
  };
  const clickExisting = (labels: string[]) => {
    const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(b => labels.includes(b.textContent?.trim() ?? ""));
    button?.click();
  };
  const discard = () => { clickExisting(["Discard"]); setDirty(false); setConfirmOpen(false); setMenuOpen(false); const path = pendingPath; setPendingPath(null); if (path) void navigate({ to: path }); };
  const save = () => { clickExisting(["Save changes", "Save"]); setDirty(false); setConfirmOpen(false); setMenuOpen(false); const path = pendingPath; setPendingPath(null); if (path) setTimeout(() => void navigate({ to: path }), 0); };

  return <div className="min-h-[100dvh] bg-background">
    <header className="border-b border-border/70 bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-3 sm:h-[72px] sm:px-6">
        <button type="button" onClick={() => requestNavigation("/dashboard")} className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold transition active:scale-[.98] hover:bg-secondary" aria-label="Back to dashboard"><ArrowLeft className="size-4"/><span className="hidden sm:inline">Dashboard</span></button>
        <div className="min-w-0 flex-1 text-center"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Settings</p><h1 className="truncate text-sm font-bold sm:text-base">{current?.title ?? "Settings"}</h1></div>
        <button type="button" disabled={!dirty} onClick={() => clickExisting(["Save changes", "Save"])} className={cn("flex size-10 items-center justify-center rounded-xl border border-border transition", dirty ? "bg-foreground text-background hover:opacity-90" : "bg-surface text-muted-foreground opacity-50")} aria-label="Save changes"><Save className="size-4"/></button>
        <button type="button" onClick={() => setMenuOpen(true)} className="flex size-10 items-center justify-center rounded-xl border border-border bg-surface transition active:scale-[.97] hover:bg-secondary" aria-label="Open settings navigation"><Menu className="size-4"/></button>
      </div>
    </header>
    <main className="mx-auto w-full max-w-4xl px-4 py-7 pb-28 sm:px-6 sm:py-10"><Outlet /></main>
    {dirty && <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,.06)]"><div className="mx-auto flex max-w-4xl items-center justify-between gap-3"><div><p className="text-sm font-semibold">Unsaved changes</p><p className="hidden text-xs text-muted-foreground sm:block">Save before leaving this section.</p></div><div className="flex gap-2"><Button variant="ghost" onClick={() => clickExisting(["Discard"])}>Discard</Button><Button onClick={() => clickExisting(["Save changes", "Save"])}>Save changes</Button></div></div></div>}
    <Sheet open={menuOpen} onOpenChange={setMenuOpen}><SheetContent side="right" className="w-full max-w-sm p-0 duration-100 ease-out"><SheetHeader className="border-b border-border px-5 py-5 text-left"><SheetTitle>Settings</SheetTitle></SheetHeader><div className="flex-1 overflow-y-auto p-3">{groups.map(group => <section key={group} className="mb-4"><p className="px-2 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{group}</p>{items.filter(i => i.group === group).map(item => { const Icon = item.icon; return <button key={item.path} type="button" onClick={() => requestNavigation(item.path)} className={cn("flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors active:bg-secondary hover:bg-secondary", location.pathname === item.path && "bg-accent-soft")}><span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary"><Icon className="size-4"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.title}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.description}</span></span><ChevronRight className="size-4 text-muted-foreground"/></button>; })}</section>)}</div></SheetContent></Sheet>
    {confirmOpen && <div className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/30 p-4 sm:items-center"><div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl border border-border bg-background p-5 shadow-2xl"><h2 className="font-display text-lg font-bold">Unsaved changes</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">You have changes that haven't been saved. Save them before leaving?</p><div className="mt-6 grid gap-2 sm:grid-cols-3"><Button variant="ghost" onClick={() => { setConfirmOpen(false); setPendingPath(null); }}>Keep editing</Button><Button variant="outline" onClick={discard}>Discard</Button><Button onClick={save}>Save</Button></div></div></div>}
  </div>;
}
