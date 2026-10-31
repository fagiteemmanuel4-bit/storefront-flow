import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  ChefHat,
  CloudUpload,
  Cpu,
  Download,
  ExternalLink,
  GitBranch,
  Globe2,
  HardDrive,
  HelpCircle,
  LockKeyhole,
  LogOut,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Puzzle,
  ReceiptText,
  ScanLine,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Trash2,
  TrendingUp,
  UserRound,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { activeStoreCache } from "@/lib/active-store";
import { getOfflineSales, removeOfflineSale } from "@/lib/offline-sales";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { AppMenuSheet } from "@/components/shell/AppMenuSheet";
import { UpdatesSheet } from "@/components/shell/UpdatesSheet";
import { ExportDataDialog } from "@/components/shell/ExportDataDialog";
import { DeleteStoreDialog } from "@/components/shell/DeleteStoreDialog";
import { SecurityModal } from "@/components/security/SecurityModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  clearStaffSession,
  getStaffSession,
  subscribeStaffSession,
  staffCan,
  STAFF_ROLE_META,
} from "@/lib/staff-session";
import { BusinessCalculatorFab } from "@/components/pos/BusinessCalculatorFab";
import { getBusinessMode } from "@/lib/business-modes";
import { getStoreSubscription } from "@/lib/plan-access";
import { hasEntitlement, type StrapTier } from "@/lib/commerceEntitlements";

const PRIMARY_NAV = [
  { to: "/pos", label: "Sell", icon: ScanLine, area: "pos" },
  { to: "/products", label: "Products", icon: Package, area: "products" },
  { to: "/online-store/orders", label: "Orders", icon: ShoppingBag, area: "orders" },
  { to: "/customers", label: "Customers", icon: Users, area: "customers" },
  { to: "/reports", label: "Analytics", icon: BarChart3, area: "reports" },
] as const;

const SECONDARY_NAV = [
  { to: "/online-store", label: "Online Store", icon: Store, area: "store" },
  { to: "/expenses", label: "Expenses", icon: ReceiptText, area: "expenses" },
  { to: "/staff", label: "Team", icon: Users, area: "staff" },
  { to: "/hardware", label: "Hardware", icon: HardDrive, area: "hardware" },
] as const;

const MORE_NAV = [
  { to: "/insights", label: "Insights", icon: TrendingUp, area: "reports" },
  { to: "/branches", label: "Branches", icon: GitBranch, area: "staff" },
  { to: "/stock-sense", label: "Stock Sense", icon: Boxes, area: "products" },
  { to: "/extensions", label: "Extensions", icon: Puzzle, area: "pos" },
  { to: "/activity", label: "Activity", icon: Activity, area: "pos" },
  { to: "/profile", label: "Profile", icon: UserRound, area: "pos" },
  { to: "/feature-discovery", label: "Feature tour", icon: Sparkles, area: "pos" },
] as const;

type NavItemType = {
  to: string;
  label: string;
  icon: typeof Store;
  area: string;
};

function isLockedPath(path: string, tier: StrapTier) {
  if (path.startsWith("/online-store")) return !hasEntitlement(tier, "onlineStore");
  if (path === "/reports" || path === "/insights")
    return !hasEntitlement(tier, "advancedAnalytics");
  if (path === "/stock-sense") return !hasEntitlement(tier, "stockSense");
  if (path === "/staff" || path === "/hardware") return tier === "free";
  return false;
}

function readSidebarCollapsed() {
  try {
    return window.localStorage.getItem("strap-sidebar-collapsed") === "1";
  } catch {
    return false;
  }
}

function NavItem({
  item,
  pathname,
  staffActive,
  staffSession,
  collapsed,
  locked,
}: {
  item: NavItemType;
  pathname: string;
  staffActive: boolean;
  staffSession: ReturnType<typeof getStaffSession>;
  collapsed: boolean;
  locked: boolean;
}) {
  const active =
    pathname === item.to ||
    (item.to === "/online-store/orders" && pathname.startsWith("/online-store/orders")) ||
    (item.to === "/online-store" && pathname.startsWith("/online-store"));
  const allowed = !staffActive || Boolean(staffSession && staffCan(staffSession.role, item.area));
  if (!allowed) return null;
  return (
    <Link
      to={(locked ? "/upgrade" : item.to) as any}
      aria-current={active ? "page" : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={locked ? item.label + " · Business plan" : item.label}
      className={cn(
        "group relative flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        collapsed && "justify-center px-2",
        active
          ? "bg-accent-soft text-accent-ink"
          : locked
            ? "text-muted-foreground hover:bg-accent-soft/60 hover:text-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <item.icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {locked && (
        <LockKeyhole
          className={cn(
            "size-3.5 shrink-0 text-accent-ink",
            collapsed && "absolute right-1 top-1",
          )}
          aria-label="Requires Business plan"
        />
      )}
    </Link>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { store, branch, branches, memberships, role, setActiveStore, setActiveBranch, isLoading } =
    useStoreContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);
  const [online, setOnline] = useState(true);
  const [queued, setQueued] = useState(0);
  const [staffSession, setStaffSessionState] = useState(() => getStaffSession(store?.id));
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const routerStatus = useRouterState({ select: (s) => s.status });
  const routeLoading = routerStatus === "pending";
  const staffActive = Boolean(staffSession && store?.id === staffSession.storeId);
  const effectiveRole = staffActive ? staffSession!.role : role;
  const isOwner = role === "owner";
  const canManageStaff = role === "owner" || role === "manager";
  const subscriptionQuery = useQuery({
    queryKey: ["store-subscription", store?.id],
    queryFn: () => getStoreSubscription(store!.id),
    enabled: Boolean(store?.id),
    staleTime: 60_000,
  });
  const subscriptionTier: StrapTier =
    subscriptionQuery.data?.status === "active" ? subscriptionQuery.data.plan : "free";
  const canExport = hasEntitlement(subscriptionTier, "storeExport");
  const canOnlineStore = hasEntitlement(subscriptionTier, "onlineStore");
  const canAnalytics = hasEntitlement(subscriptionTier, "advancedAnalytics");
  const canTeam = subscriptionTier !== "free";
  const canStockSense = hasEntitlement(subscriptionTier, "stockSense");
  const storefrontQuery = useQuery({
    queryKey: ["online-store-menu", store?.id],
    enabled: Boolean(store?.id),
    queryFn: async () => {
      const { data, error } = await onlineSupabase
        .from("online_stores")
        .select("slug,setup_completed,is_published")
        .eq("store_id", store!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const storefront = storefrontQuery.data;
  const storefrontPath = storefront?.slug ? "/store/" + storefront.slug : "";
  const toggleSidebar = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem("strap-sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* persistence is optional */
      }
      return next;
    });
  };
  const businessMode = getBusinessMode(
    (store?.storefront_settings as any)?.businessMode ?? store?.business_type,
  );
  const isFashion = businessMode.key === "fashion";
  const isElectronics = businessMode.key === "electronics";
  const isFoodService = businessMode.key === "food-service";
  const isGrocery = businessMode.key === "grocery-provision";
  const primaryNav = isFashion
    ? [
        { to: "/products", label: "Collection", icon: Package, area: "products" },
        { to: "/online-store", label: "Storefront", icon: Store, area: "store" },
        { to: "/online-store/orders", label: "Orders", icon: ReceiptText, area: "orders" },
        { to: "/pos", label: "Sell", icon: ScanLine, area: "pos" },
        { to: "/customers", label: "Customers", icon: Users, area: "customers" },
        { to: "/reports", label: "Sales", icon: BarChart3, area: "reports" },
      ]
    : isElectronics
      ? [
          { to: "/electronics-workspace", label: "Devices & repairs", icon: Cpu, area: "products" },
          { to: "/pos", label: "Sell", icon: ScanLine, area: "pos" },
          { to: "/products", label: "Catalogue", icon: Package, area: "products" },
          { to: "/reports", label: "Sales", icon: BarChart3, area: "reports" },
        ]
      : isFoodService
        ? [
            { to: "/food-service", label: "Kitchen & menu", icon: ChefHat, area: "orders" },
            { to: "/pos", label: "Sell", icon: ScanLine, area: "pos" },
            { to: "/products", label: "Ingredients", icon: Package, area: "products" },
            { to: "/reports", label: "Sales", icon: BarChart3, area: "reports" },
          ]
        : isGrocery
          ? [
              {
                to: "/grocery-inventory",
                label: "Batches & expiry",
                icon: Boxes,
                area: "products",
              },
              { to: "/pos", label: "Sell", icon: ScanLine, area: "pos" },
              { to: "/products", label: "Catalogue", icon: Package, area: "products" },
              { to: "/reports", label: "Sales", icon: BarChart3, area: "reports" },
            ]
          : PRIMARY_NAV;
  const secondaryNav = isFashion
    ? [
        ...SECONDARY_NAV.filter((item) => item.to !== "/online-store"),
        { to: "/fashion-returns", label: "Returns & exchanges", icon: ReceiptText, area: "products" },
      ]
    : isElectronics
      ? SECONDARY_NAV.filter((item) => item.to !== "/online-store")
      : SECONDARY_NAV;
  useEffect(() => {
    setStaffSessionState(getStaffSession(store?.id));
    return subscribeStaffSession(() => setStaffSessionState(getStaffSession(store?.id)));
  }, [store?.id]);
  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true),
      off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  useEffect(() => {
    const refresh = () => setQueued(getOfflineSales().length);
    refresh();
    window.addEventListener("kudi-offline-queue-changed", refresh);
    return () => window.removeEventListener("kudi-offline-queue-changed", refresh);
  }, []);
  useEffect(() => {
    if (!isLoading && memberships.length === 0) void navigate({ to: "/onboarding", replace: true });
  }, [isLoading, memberships.length, navigate]);
  useEffect(() => {
    if (!staffActive) return;
    const allowed =
      [...primaryNav, ...secondaryNav, ...MORE_NAV].some(
        (item) => pathname === item.to || pathname.startsWith(item.to + "/"),
      ) ||
      pathname === "/help" ||
      pathname.startsWith("/help") ||
      pathname === "/settings" ||
      pathname.startsWith("/settings");
    if (!allowed)
      void navigate({ to: STAFF_ROLE_META[staffSession!.role].defaultRoute as any, replace: true });
  }, [navigate, pathname, staffActive, staffSession, primaryNav, secondaryNav]);
  useEffect(() => {
    const activeStoreId = store?.id;
    if (!online || !activeStoreId || staffActive) return;
    let cancelled = false;
    async function sync() {
      const queue = getOfflineSales().filter((sale) => sale.storeId === activeStoreId);
      for (const sale of queue) {
        if (cancelled) return;
        const { error } = await supabase.rpc("create_sale", {
          _store_id: sale.storeId,
          _branch_id: sale.branchId,
          _payment_method: sale.paymentMethod,
          _items: sale.items,
          _note: sale.note,
          _customer_id: sale.customerId ?? undefined,
          _offline_id: sale.offlineId,
        });
        if (error) continue;
        removeOfflineSale(sale.offlineId);
        await queryClient.invalidateQueries({
          queryKey: ["products", sale.storeId, sale.branchId],
        });
        await queryClient.invalidateQueries({ queryKey: ["customers", sale.storeId] });
      }
    }
    void sync();
    const onOnline = () => void sync();
    window.addEventListener("online", onOnline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
    };
  }, [online, store?.id, queryClient, staffActive]);
  useEffect(() => {
    const openMobileMenu = () => setMenuOpen(true);
    window.addEventListener("strap-open-mobile-menu", openMobileMenu);
    return () => window.removeEventListener("strap-open-mobile-menu", openMobileMenu);
  }, []);
  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    activeStoreCache.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="kudi-app-shell min-h-[100dvh] overflow-x-hidden bg-background lg:pb-0">
      {routeLoading && (
        <div
          className="fixed inset-x-0 top-0 z-[100] h-1 overflow-hidden bg-accent-soft"
          role="status"
          aria-label="Loading page"
        >
          <div className="h-full w-1/3 animate-[loading-slide_1.1s_ease-in-out_infinite] rounded-full bg-accent" />
        </div>
      )}

      <aside
        data-tour="desktop-sidebar"
        className={cn(
          "fixed inset-y-3 left-3 z-40 hidden flex-col overflow-hidden rounded-[26px] border border-border/80 bg-surface/95 shadow-[0_18px_50px_-24px_rgba(28,25,20,.24)] backdrop-blur-xl transition-[width] duration-200 ease-out lg:flex",
          sidebarCollapsed ? "w-[4.75rem]" : "w-[15rem]",
        )}
      >
        <div
          className={cn(
            "relative flex h-16 shrink-0 items-center border-b border-border/70",
            sidebarCollapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          <Link to="/pos" className="flex min-w-0 items-center gap-2" aria-label="Strap home">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent">
              <span className="size-3 rotate-45 rounded-[3px] bg-foreground" />
            </span>
            {!sidebarCollapsed && (
              <span className="font-display text-lg font-bold tracking-tight">STRAP.</span>
            )}
          </Link>
          <button
            type="button"
            data-tour="sidebar-collapse"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleSidebar}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              sidebarCollapsed && "absolute right-2 top-2",
            )}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2.5 py-4 [scrollbar-width:thin]">
          <section data-tour="sidebar-navigation">
            {!sidebarCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Workspace
              </p>
            )}
            <nav className="space-y-1" aria-label="Primary navigation">
              {primaryNav.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  pathname={pathname}
                  staffActive={staffActive}
                  staffSession={staffSession}
                  collapsed={sidebarCollapsed}
                  locked={isLockedPath(item.to, subscriptionTier)}
                />
              ))}
            </nav>
          </section>

          <div className="my-4 border-t border-border/70" />
          <section data-tour="sidebar-manage">
            {!sidebarCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {isFashion ? "Business tools" : "Manage"}
              </p>
            )}
            <nav className="space-y-1" aria-label="Business tools">
              {secondaryNav.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  pathname={pathname}
                  staffActive={staffActive}
                  staffSession={staffSession}
                  collapsed={sidebarCollapsed}
                  locked={isLockedPath(item.to, subscriptionTier)}
                />
              ))}
              {canManageStaff && storefront?.setup_completed && storefrontPath && (
                <a
                  href={storefrontPath}
                  title="Open live storefront"
                  aria-label={sidebarCollapsed ? "Open live storefront" : undefined}
                  className={cn(
                    "flex min-h-10 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground",
                    sidebarCollapsed && "justify-center px-2",
                  )}
                >
                  <ExternalLink className="size-[18px] shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="min-w-0 flex-1 truncate">Live storefront</span>
                  )}
                </a>
              )}
              {isElectronics && (
                <NavItem
                  item={{
                    to: "/electronics-workspace",
                    label: "Devices & repairs",
                    icon: Cpu,
                    area: "products",
                  }}
                  pathname={pathname}
                  staffActive={staffActive}
                  staffSession={staffSession}
                  collapsed={sidebarCollapsed}
                  locked={false}
                />
              )}
              {isFoodService && (
                <NavItem
                  item={{
                    to: "/food-service",
                    label: "Kitchen & menu",
                    icon: ChefHat,
                    area: "orders",
                  }}
                  pathname={pathname}
                  staffActive={staffActive}
                  staffSession={staffSession}
                  collapsed={sidebarCollapsed}
                  locked={false}
                />
              )}
              {isGrocery && (
                <NavItem
                  item={{
                    to: "/grocery-inventory",
                    label: "Batches & expiry",
                    icon: Boxes,
                    area: "products",
                  }}
                  pathname={pathname}
                  staffActive={staffActive}
                  staffSession={staffSession}
                  collapsed={sidebarCollapsed}
                  locked={false}
                />
              )}
            </nav>
          </section>

          <div className="my-4 border-t border-border/70" />
          <section data-tour="sidebar-more">
            {!sidebarCollapsed && (
              <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                More
              </p>
            )}
            <nav className="space-y-1" aria-label="More workspace tools">
              {MORE_NAV.map((item) => (
                <NavItem
                  key={item.to}
                  item={item}
                  pathname={pathname}
                  staffActive={staffActive}
                  staffSession={staffSession}
                  collapsed={sidebarCollapsed}
                  locked={isLockedPath(item.to, subscriptionTier)}
                />
              ))}
              <NavItem
                item={{ to: "/help", label: "Help", icon: HelpCircle, area: "pos" }}
                pathname={pathname}
                staffActive={staffActive}
                staffSession={staffSession}
                collapsed={sidebarCollapsed}
                locked={false}
              />
              {!staffActive && (
                <NavItem
                  item={{ to: "/settings", label: "Settings", icon: Settings, area: "pos" }}
                  pathname={pathname}
                  staffActive={staffActive}
                  staffSession={staffSession}
                  collapsed={sidebarCollapsed}
                  locked={false}
                />
              )}
            </nav>
          </section>
        </div>

        <div className="shrink-0 border-t border-border/70 p-2.5">
          {staffActive && (
            <div
              className={cn(
                "mb-2 rounded-xl border border-accent/20 bg-accent-soft/60 p-2",
                sidebarCollapsed && "px-1.5",
              )}
              data-tour="staff-session"
            >
              <div className={cn("flex items-center gap-2", sidebarCollapsed && "justify-center")}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/25 text-xs font-bold">
                  {staffSession!.name.slice(0, 1).toUpperCase()}
                </span>
                {!sidebarCollapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">
                      {staffSession!.name}
                    </span>
                    <span className="block truncate text-[10px] text-muted-foreground">
                      {staffSession!.role}
                    </span>
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  clearStaffSession();
                  setStaffSessionState(null);
                }}
                className={cn(
                  "mt-2 w-full rounded-lg px-2 py-1.5 text-left text-[10px] font-semibold text-accent-ink hover:bg-background/70",
                  sidebarCollapsed && "text-center",
                )}
                title="End staff session"
              >
                {sidebarCollapsed ? "End" : "End staff session"}
              </button>
            </div>
          )}

          <div className="space-y-1" data-tour="sidebar-actions">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("strap-start-guided-tour"))}
              title="Start guided tour"
              aria-label={sidebarCollapsed ? "Start guided tour" : undefined}
              className={cn(
                "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground",
                sidebarCollapsed && "justify-center px-2",
              )}
            >
              <Sparkles className="size-[18px] shrink-0" />
              {!sidebarCollapsed && <span>Guided tour</span>}
            </button>
            <button
              type="button"
              data-tour="sidebar-export"
              onClick={() => {
                if (canExport) setExportOpen(true);
                else void navigate({ to: "/upgrade" });
              }}
              title={canExport ? "Download store data" : "Download store data · Business plan"}
              aria-label={sidebarCollapsed ? "Download store data" : undefined}
              className={cn(
                "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-secondary",
                sidebarCollapsed && "justify-center px-2",
                canExport ? "text-muted-foreground hover:text-foreground" : "text-accent-ink",
              )}
            >
              {canExport ? (
                <Download className="size-[18px] shrink-0" />
              ) : (
                <LockKeyhole className="size-[18px] shrink-0" />
              )}
              {!sidebarCollapsed && (
                <>
                  <span className="min-w-0 flex-1 text-left">Download data</span>
                  {!canExport && (
                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent-ink">
                      Business
                    </span>
                  )}
                </>
              )}
            </button>
            {!staffActive && isOwner && (
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                title="Delete store"
                aria-label={sidebarCollapsed ? "Delete store" : undefined}
                className={cn(
                  "flex min-h-9 w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive",
                  sidebarCollapsed && "justify-center px-2",
                )}
              >
                <Trash2 className="size-4 shrink-0" />
                {!sidebarCollapsed && <span>Delete store</span>}
              </button>
            )}
            <button
              type="button"
              onClick={() => setLogoutOpen(true)}
              title="Log out"
              aria-label={sidebarCollapsed ? "Log out" : undefined}
              className={cn(
                "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground",
                sidebarCollapsed && "justify-center px-2",
              )}
            >
              <LogOut className="size-[18px] shrink-0" />
              {!sidebarCollapsed && <span>Log out</span>}
            </button>
          </div>

          <div
            className={cn(
              "mt-3 rounded-xl border border-border bg-secondary/50 p-2",
              sidebarCollapsed && "flex flex-col items-center gap-1.5 p-1.5",
            )}
            data-tour="store-switcher"
          >
            <div className={cn("flex min-w-0 items-center gap-2", sidebarCollapsed && "flex-col")}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-xs font-bold text-background">
                {(store?.name ?? "S").slice(0, 2).toUpperCase()}
              </span>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{store?.name ?? "Your shop"}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {branch?.name ?? "Main branch"}
                  </p>
                </div>
              )}
            </div>
            <div className={cn("mt-2 flex items-center gap-1", sidebarCollapsed && "mt-1 flex-col")}>
              {memberships.length > 1 && (
                <Select value={store?.id ?? undefined} onValueChange={setActiveStore}>
                  <SelectTrigger
                    className={cn(
                      "h-8 min-w-0 flex-1 rounded-lg border-0 bg-background/80 text-[10px] shadow-none",
                      sidebarCollapsed &&
                        "w-9 flex-none justify-center px-0 [&>svg:last-child]:hidden",
                    )}
                  >
                    <Store className="size-3.5 shrink-0" />
                    {!sidebarCollapsed && <SelectValue placeholder="Switch store" />}
                  </SelectTrigger>
                  <SelectContent>
                    {memberships.map((membership) => (
                      <SelectItem key={membership.store.id} value={membership.store.id}>
                        {membership.store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {branches.length > 1 && (
                <Select value={branch?.id ?? undefined} onValueChange={setActiveBranch}>
                  <SelectTrigger
                    className={cn(
                      "h-8 min-w-0 flex-1 rounded-lg border-0 bg-background/80 text-[10px] shadow-none",
                      sidebarCollapsed &&
                        "w-9 flex-none justify-center px-0 [&>svg:last-child]:hidden",
                    )}
                  >
                    <GitBranch className="size-3.5 shrink-0" />
                    {!sidebarCollapsed && <SelectValue placeholder="Switch branch" />}
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branchOption) => (
                      <SelectItem key={branchOption.id} value={branchOption.id}>
                        {branchOption.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "min-h-[100dvh] transition-[padding] duration-200 ease-out",
          sidebarCollapsed ? "lg:pl-[6.75rem]" : "lg:pl-[17rem]",
        )}
      >
        <div className="px-3 pb-24 pt-3 sm:px-4 lg:px-6 lg:pb-6">
          <main
            data-tour="main-content"
            className="mx-auto min-h-[calc(100dvh-1.5rem)] w-full max-w-[1360px] rounded-[26px] border border-border/80 bg-surface/85 px-4 py-5 shadow-[0_18px_50px_-30px_rgba(28,25,20,.2)] backdrop-blur-xl sm:px-6 lg:px-7 lg:py-6"
          >
            <header
              data-tour="page-heading"
              className="mb-6 flex min-w-0 flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="flex max-w-full items-center gap-1.5 truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <Globe2 className="size-3.5 shrink-0" aria-hidden />
                  {store?.name ?? "Loading shop"}
                  {branch ? " · " + branch.name : ""}
                  {staffActive ? " · " + staffSession!.name : ""}
                </p>
                <h1 className="mt-1 truncate text-xl font-semibold leading-tight tracking-tight sm:text-2xl">
                  {title}
                </h1>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                {pathname === "/pos" && <BusinessCalculatorFab className="shrink-0" />}
                <button
                  type="button"
                  data-tour="quick-find"
                  aria-label="Search"
                  title="Search Strap (Ctrl/⌘ K)"
                  className="hidden size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground lg:flex"
                >
                  <Search className="size-4" aria-hidden />
                  <span className="sr-only">Search Strap</span>
                </button>
                <div data-tour="updates" className="flex shrink-0">
                  <UpdatesSheet />
                </div>
                <div
                  data-tour="connection-status"
                  className={cn(
                    "hidden items-center gap-1 rounded-xl border px-2.5 py-2 text-xs font-semibold sm:flex",
                    online
                      ? "border-border bg-secondary/60 text-muted-foreground"
                      : "border-accent/30 bg-accent-soft text-accent-ink",
                  )}
                  title={online ? "Strap is online" : "Strap is offline"}
                >
                  {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
                  {queued > 0 ? (
                    <>
                      <span>{queued} queued</span>
                      <CloudUpload className="size-3.5" />
                    </>
                  ) : (
                    <span>{online ? "Online" : "Offline"}</span>
                  )}
                </div>

              </div>
            </header>

            <div className="min-w-0">{children}</div>
          </main>
        </div>
      </div>

      <AppMenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        store={store}
        branchName={branch?.name ?? null}
        role={effectiveRole as any}
        canExport={canExport}
        canOnlineStore={canOnlineStore}
        canAnalytics={canAnalytics}
        canTeam={canTeam}
        canStockSense={canStockSense}
        onSignOut={() => {
          setMenuOpen(false);
          setLogoutOpen(true);
        }}
      />

      <ExportDataDialog
        store={store}
        open={exportOpen}
        onOpenChange={setExportOpen}
        canExport={canExport}
      />
      <DeleteStoreDialog store={store} open={deleteOpen} onOpenChange={setDeleteOpen} />

      <SecurityModal
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        title="Log out of Strap?"
        description="You will need to sign in again to access this store. Any saved cloud data remains safely stored in Supabase."
        footer={
          <>
            <Button variant="outline" onClick={() => setLogoutOpen(false)}>
              Stay signed in
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setLogoutOpen(false);
                void handleSignOut();
              }}
            >
              <LogOut className="mr-2 size-4" />
              Log out
            </Button>
          </>
        }
      >
        <div className="rounded-2xl border border-border bg-secondary/40 p-4 text-sm leading-6 text-muted-foreground">
          Strap will close the current session and return to sign-in. It does not delete your store.
        </div>
      </SecurityModal>
    </div>
  );
}
}
