import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BarChart3, CloudUpload, FileBarChart, FileSpreadsheet, Globe2, Package, ScanLine, Settings2, Users, Wifi, WifiOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { activeStoreCache } from "@/lib/active-store";
import { getOfflineSales, removeOfflineSale } from "@/lib/offline-sales";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { AppMenuSheet } from "@/components/shell/AppMenuSheet";
import { UpdatesSheet } from "@/components/shell/UpdatesSheet";
import { ProductTour } from "@/components/shell/ProductTour";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getStaffSession, subscribeStaffSession, staffCan, STAFF_ROLE_META } from "@/lib/staff-session";

const NAV = [
  { to: "/pos", label: "Sell", icon: ScanLine, tour: "sell", area: "pos" },
  { to: "/products", label: "Stock", icon: Package, tour: "stock", area: "products" },
  { to: "/customers", label: "Customers", icon: Users, tour: "customers", area: "customers" },
  { to: "/reports", label: "Reports", icon: FileBarChart, tour: "reports", area: "reports" },
  { to: "/dashboard", label: "Today", icon: BarChart3, area: "dashboard" },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { store, branch, branches, memberships, role, setActiveStore, setActiveBranch, isLoading } = useStoreContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);
  const [staffSession, setStaffSessionState] = useState(() => getStaffSession(store?.id));
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const routerStatus = useRouterState({ select: (s) => s.status });
  const routeLoading = routerStatus === "pending";
  const staffActive = Boolean(staffSession && store?.id === staffSession.storeId);
  const effectiveRole = staffActive ? staffSession!.role : role;
  const canImport = !staffActive ? role === "owner" || role === "manager" : staffCan(staffSession!.role, "import");
  const visibleNav = useMemo(() => NAV.filter((item) => !staffActive || staffCan(staffSession!.role, item.area)), [staffActive, staffSession]);

  useEffect(() => { setStaffSessionState(getStaffSession(store?.id)); return subscribeStaffSession(() => setStaffSessionState(getStaffSession(store?.id))); }, [store?.id]);
  useEffect(() => { setOnline(navigator.onLine); const on = () => setOnline(true); const off = () => setOnline(false); window.addEventListener("online", on); window.addEventListener("offline", off); return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); }; }, []);
  useEffect(() => { const refresh = () => setQueued(getOfflineSales().length); refresh(); window.addEventListener("kudi-offline-queue-changed", refresh); return () => window.removeEventListener("kudi-offline-queue-changed", refresh); }, []);
  useEffect(() => { if (!isLoading && memberships.length === 0) void navigate({ to: "/onboarding", replace: true }); }, [isLoading, memberships.length, navigate]);
  useEffect(() => { if (!staffActive) return; const allowed = visibleNav.some((item) => item.to === pathname) || pathname === "/staff" || pathname.startsWith("/help"); if (!allowed) void navigate({ to: STAFF_ROLE_META[staffSession!.role].defaultRoute as any, replace: true }); }, [navigate, pathname, staffActive, staffSession, visibleNav]);
  useEffect(() => { if (!online || !store?.id || staffActive) return; let cancelled = false; async function sync() { const queue = getOfflineSales().filter((sale) => sale.storeId === store.id); for (const sale of queue) { if (cancelled) return; const { error } = await supabase.rpc("create_sale", { _store_id: sale.storeId, _branch_id: sale.branchId, _payment_method: sale.paymentMethod, _items: sale.items, _note: sale.note, _customer_id: sale.customerId, _offline_id: sale.offlineId }); if (error) { console.warn("Kudi offline sale waiting to sync", error.message); continue; } removeOfflineSale(sale.offlineId); await queryClient.invalidateQueries({ queryKey: ["products", sale.storeId, sale.branchId] }); await queryClient.invalidateQueries({ queryKey: ["customers", sale.storeId] }); } } void sync(); const onOnline = () => void sync(); window.addEventListener("online", onOnline); return () => { cancelled = true; window.removeEventListener("online", onOnline); }; }, [online, store?.id, queryClient, staffActive]);
  async function handleSignOut() { await queryClient.cancelQueries(); queryClient.clear(); activeStoreCache.clear(); await supabase.auth.signOut(); void navigate({ to: "/auth", replace: true }); }

  return <div className="kudi-app-shell min-h-screen bg-background pb-24 lg:pb-0">
    {routeLoading && <div className="kudi-route-progress" role="status" aria-label="Loading page"><span /></div>}
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <Link to="/pos" className="flex items-center gap-2" aria-label="Kudi home"><span className="flex size-8 items-center justify-center rounded-full bg-accent"><span className="size-3 rotate-45 rounded-[3px] bg-foreground" /></span><span className="font-display text-lg font-bold tracking-tight">KUDI.</span></Link>
        <div className="ml-auto flex items-center gap-2">
          {memberships.length > 1 && store && <Select value={store.id} onValueChange={setActiveStore}><SelectTrigger className="h-10 w-[9.5rem] rounded-lg text-sm"><SelectValue /></SelectTrigger><SelectContent>{memberships.map((m) => <SelectItem key={m.store.id} value={m.store.id}>{m.store.name}</SelectItem>)}</SelectContent></Select>}
          {branches.length > 1 && branch && <Select value={branch.id} onValueChange={setActiveBranch}><SelectTrigger className="h-10 w-[8.5rem] rounded-lg text-sm"><SelectValue /></SelectTrigger><SelectContent>{branches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select>}
          <nav className="hidden items-center gap-1 rounded-full border border-border bg-secondary/60 p-1 lg:flex" aria-label="Primary navigation">{visibleNav.map((item) => <Link key={item.to} to={item.to} data-tour={item.tour} className={cn("rounded-full px-4 py-2 text-sm font-semibold transition-all", pathname === item.to ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>{item.label}</Link>)}</nav>
          {pathname === "/products" && canImport && <Link to="/product-import" aria-label="Import products" className="touch-target flex items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-ink transition hover:-translate-y-0.5"><FileSpreadsheet className="size-4" /><span className="hidden sm:inline">Import</span></Link>}
          {pathname === "/pos" && (!staffActive || staffCan(staffSession!.role, "pos")) && <Link to="/unit-sale" className="touch-target hidden items-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-3 py-2 text-sm font-semibold text-accent-ink transition hover:-translate-y-0.5 sm:flex"><Package className="size-4" /><span>Pack / piece</span></Link>}
          <div className={cn("hidden items-center gap-1 rounded-full border px-3 py-2 text-xs font-semibold sm:flex", online ? "border-border bg-secondary/60 text-muted-foreground" : "border-accent/30 bg-accent-soft text-accent-ink")} title={online ? "Kudi is online" : "Kudi is offline"}>{online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}{queued > 0 ? <><span>{queued} queued</span><CloudUpload className="size-3.5" /></> : <span>{online ? "Online" : "Offline"}</span>}</div>
          <button type="button" aria-label="Open menu" aria-expanded={menuOpen} data-tour="menu" onClick={() => setMenuOpen(true)} className="touch-target group flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 transition-all hover:bg-accent-soft active:scale-95"><Settings2 className="size-4" /><span className="hidden text-sm font-semibold sm:inline">Menu</span></button>
        </div>
      </div>
    </header>
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10"><div className="mb-6 flex flex-wrap items-end justify-between gap-3 lg:mb-8"><div><p className="text-label-caps flex items-center gap-1.5 text-muted-foreground"><Globe2 className="size-3.5" aria-hidden />{store?.name ?? "Loading shop"}{branch ? ` · ${branch.name}` : ""}{staffActive ? ` · ${staffSession!.name}` : ""}</p><h1 className="mt-1 text-title-lg lg:text-display-md">{title}</h1></div></div>{children}</div>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden" aria-label="Primary"><div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">{visibleNav.slice(0, 5).map((item) => { const Icon = item.icon; const active = pathname === item.to; return <Link key={item.to} to={item.to} data-tour={item.tour} className={cn("touch-target flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold", active ? "text-accent-ink" : "text-muted-foreground")}><span className={cn("flex h-8 w-14 items-center justify-center rounded-full", active ? "bg-accent-soft" : "bg-transparent")}><Icon className="size-5" /></span>{item.label}</Link>; })}</div></nav>
    <UpdatesSheet /><ProductTour /><AppMenuSheet open={menuOpen} onOpenChange={setMenuOpen} store={store} branchName={branch?.name ?? null} role={effectiveRole as any} onSignOut={() => { setMenuOpen(false); void handleSignOut(); }} />
  </div>;
}
