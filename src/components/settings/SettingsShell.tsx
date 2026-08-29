import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { Bell, ChevronRight, CreditCard, Database, Globe2, KeyRound, Laptop, Palette, Receipt, ShieldCheck, SlidersHorizontal, Store, Users, WalletCards } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { cn } from "@/lib/utils";

const items = [
  { path: "/settings/store-profile", title: "Store profile", description: "Business identity, contact and regional settings", icon: Store, group: "Store" },
  { path: "/settings/appearance", title: "Store appearance", description: "Branding, typography and storefront style", icon: Palette, group: "Store" },
  { path: "/settings/online-store", title: "Online store", description: "Publishing, catalogue and SEO", icon: Globe2, group: "Store" },
  { path: "/settings/receipts", title: "Receipts", description: "Receipt identity, content and printing", icon: Receipt, group: "Commerce" },
  { path: "/settings/checkout", title: "Checkout & sales", description: "Checkout, discounts, tax and POS behaviour", icon: CreditCard, group: "Commerce" },
  { path: "/settings/inventory", title: "Inventory", description: "Stock, valuation, branches and alerts", icon: Database, group: "Commerce" },
  { path: "/settings/payments", title: "Payments", description: "Secure payment infrastructure", icon: WalletCards, group: "Commerce" },
  { path: "/settings/staff", title: "Staff & permissions", description: "Team members, roles and access", icon: Users, group: "Team" },
  { path: "/settings/notifications", title: "Notifications", description: "Operational notification preferences", icon: Bell, group: "Team" },
  { path: "/settings/security", title: "Security", description: "Account protection and sessions", icon: ShieldCheck, group: "Security" },
  { path: "/settings/password", title: "Change password", description: "Verify email and change password", icon: KeyRound, group: "Account" },
  { path: "/settings/sessions", title: "Active sessions", description: "Review and revoke authenticated sessions", icon: Laptop, group: "Account" },
] as const;

function groups() { const result = new Map<string, typeof items[number][]>(); for (const item of items) result.set(item.group, [...(result.get(item.group) ?? []), item]); return [...result.entries()]; }

export function SettingsShell() {
  const location = useLocation();
  return <AppShell title="Settings">
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="border-b border-border pb-5 sm:pb-6"><p className="text-label-caps text-accent-ink">Strap settings</p><h1 className="mt-2 font-display text-4xl font-bold tracking-tight">Settings</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Manage your account, store and commerce preferences from one focused workspace.</p></header>
      <div className="grid gap-5 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-6">
        <aside className="settings-nav h-fit rounded-2xl border border-border bg-surface p-2 lg:sticky lg:top-24"><nav aria-label="Settings navigation">
          <Link to="/settings" className={cn("mb-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold", location.pathname === "/settings" ? "bg-accent-soft text-accent-ink" : "hover:bg-secondary")}><SlidersHorizontal className="size-4" />Settings home</Link>
          {groups().map(([group, groupItems]) => <div key={group} className="settings-nav-group mb-2"><p className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{group}</p>{groupItems.map((item) => { const Icon = item.icon; const active = location.pathname === item.path; return <Link key={item.path} to={item.path} className={cn("group flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition", active ? "bg-accent-soft text-accent-ink" : "hover:bg-secondary")}><Icon className="size-4 shrink-0"/><span className="min-w-0 flex-1 truncate text-sm font-semibold">{item.title}</span><ChevronRight className={cn("size-3.5", active ? "opacity-100" : "opacity-0 group-hover:opacity-60")} /></Link>; })}</div>)}
        </nav></aside>
        <main className="min-w-0"><Outlet /></main>
      </div>
    </div>
  </AppShell>;
}

export function SettingsHomeShell() { return <div className="space-y-6"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => { const Icon = item.icon; return <Link key={item.path} to={item.path} className="group rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"><div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5" /></span><ChevronRight className="size-4 text-muted-foreground transition group-hover:translate-x-1" /></div><h2 className="mt-4 font-semibold">{item.title}</h2><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{item.description}</p></Link>; })}</div><div className="rounded-2xl border border-border bg-surface p-6"><p className="text-sm leading-6 text-muted-foreground">Settings are saved to Strap's existing Supabase data structures. Payments and custom domains remain unavailable until their production infrastructure is ready.</p></div></div>; }
