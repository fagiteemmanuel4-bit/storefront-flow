import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Boxes,
  ChefHat,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Cpu,
  Download,
  ExternalLink,
  GitBranch,
  HardDrive,
  HelpCircle,
  LayoutDashboard,
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

const HOME_NAV = {
  to: "/dashboard",
  label: "Home",
  icon: LayoutDashboard,
  area: "dashboard",
} as const;

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
        "group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
        collapsed && "justify-center px-2",
        active
          ? "bg-[#c6f432] font-semibold text-[#0e1116]"
          : "text-[#b4bac6] hover:bg-white/[0.07] hover:text-white",
      )}
    >
      <item.icon className="size-[18px] shrink-0" />
      {!collapsed && <span className="min-w-0 flex-1 truncate">{item.label}</span>}
      {locked && (
        <LockKeyhole
          className={cn("size-3.5 shrink-0 opacity-70", collapsed && "absolute right-1 top-1")}
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
  const [accountOpen, setAccountOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement | null>(null);
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
  const primaryNav = useMemo(
    () =>
      isFashion
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
              {
                to: "/electronics-workspace",
                label: "Devices & repairs",
                icon: Cpu,
                area: "products",
              },
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
              : PRIMARY_NAV,
    [isFashion, isElectronics, isFoodService, isGrocery],
  );
  const secondaryNav = useMemo(
    () =>
      isFashion
        ? [
            ...SECONDARY_NAV.filter((item) => item.to !== "/online-store"),
            {
              to: "/fashion-returns",
              label: "Returns & exchanges",
              icon: ReceiptText,
              area: "products",
            },
          ]
        : isElectronics
          ? SECONDARY_NAV.filter((item) => item.to !== "/online-store")
          : SECONDARY_NAV,
    [isFashion, isElectronics],
  );
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
      [HOME_NAV, ...primaryNav, ...secondaryNav, ...MORE_NAV].some(
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
    let syncing = false;
    async function sync() {
      if (cancelled || syncing) return;
      syncing = true;
      try {
        const queue = getOfflineSales().filter((sale) => sale.storeId === activeStoreId);
        for (const sale of queue) {
          if (cancelled) return;
          try {
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
            await queryClient.invalidateQueries({
              queryKey: ["customers", sale.storeId],
            });
          } catch {
            // Keep the sale queued so a later online event can retry it.
            continue;
          }
        }
      } finally {
        syncing = false;
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
  useEffect(() => {
    if (!accountOpen) return;
    const onDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node))
        setAccountOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);
  const moreActive = MORE_NAV.some(
    (item) => pathname === item.to || pathname.startsWith(item.to + "/"),
  );
  const initials = (store?.name ?? "S").slice(0, 2).toUpperCase();
  const menuItem =
    "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-[#d5d8de] transition hover:bg-white/[0.07] hover:text-white";
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
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/10 bg-[#0e1116] text-[#b4bac6] transition-[width] duration-200 ease-out lg:flex",
          sidebarCollapsed ? "w-[4.75rem]" : "w-[15.5rem]",
        )}
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center justify-between",
            sidebarCollapsed ? "px-3" : "pl-5 pr-3",
          )}
        >
          <Link
            to={"/dashboard" as any}
            className="flex min-w-0 items-center gap-2.5 text-white"
            aria-label="Strap home"
          >
            <span
              className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-[#c6f432]"
              aria-hidden="true"
            >
              <span className="size-2.5 rounded-full bg-[#c6f432]" />
            </span>
            {!sidebarCollapsed && (
              <span className="font-display text-xl font-bold tracking-tight">Strap</span>
            )}
          </Link>
          <button
            type="button"
            data-tour="sidebar-collapse"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-pressed={sidebarCollapsed}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={toggleSidebar}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-[#8a919e] transition hover:bg-white/[0.07] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f432]"
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-4 pt-2 [scrollbar-width:thin]">
          <section data-tour="sidebar-navigation">
            {!sidebarCollapsed && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a919e]">
                Workspace
              </p>
            )}
            <nav className="space-y-0.5" aria-label="Primary navigation">
              <NavItem
                item={HOME_NAV}
                pathname={pathname}
                staffActive={staffActive}
                staffSession={staffSession}
                collapsed={sidebarCollapsed}
                locked={false}
              />
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

          <section data-tour="sidebar-manage" className="mt-5">
            {!sidebarCollapsed && (
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a919e]">
                {isFashion ? "Business tools" : "Manage"}
              </p>
            )}
            <nav className="space-y-0.5" aria-label="Business tools">
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
                <Link
                  to={(canOnlineStore ? storefrontPath : "/upgrade") as any}
                  title={
                    canOnlineStore ? "Open live storefront" : "Live storefront · Business plan"
                  }
                  aria-label={sidebarCollapsed ? "Open live storefront" : undefined}
                  className={cn(menuItem, "px-3", sidebarCollapsed && "justify-center px-2")}
                >
                  {canOnlineStore ? (
                    <ExternalLink className="size-[18px] shrink-0" />
                  ) : (
                    <LockKeyhole className="size-[18px] shrink-0" />
                  )}
                  {!sidebarCollapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate">Live storefront</span>
                      {!canOnlineStore && (
                        <span className="rounded-full bg-[#c6f432]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#c6f432]">
                          Business
                        </span>
                      )}
                    </>
                  )}
                </Link>
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

          <section data-tour="sidebar-more" className="mt-5">
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setMoreOpen((open) => !open)}
                aria-expanded={moreOpen || moreActive}
                className="flex min-h-9 w-full items-center justify-between rounded-lg px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8a919e] transition hover:text-white"
              >
                More tools
                {moreOpen || moreActive ? (
                  <ChevronUp className="size-3.5" />
                ) : (
                  <ChevronDown className="size-3.5" />
                )}
              </button>
            )}
            {(sidebarCollapsed || moreOpen || moreActive) && (
              <nav className="mt-1 space-y-0.5" aria-label="More workspace tools">
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
              </nav>
            )}
          </section>
        </div>

        <div className="relative shrink-0 border-t border-white/10 p-3" ref={accountRef}>
          <nav className="mb-2 space-y-0.5" aria-label="Support and settings">
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

          {staffActive && (
            <div
              className={cn(
                "mb-2 rounded-xl border border-white/10 bg-white/[0.05] p-2",
                sidebarCollapsed && "px-1.5",
              )}
              data-tour="staff-session"
            >
              <div className={cn("flex items-center gap-2", sidebarCollapsed && "justify-center")}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#c6f432] text-xs font-bold text-[#0e1116]">
                  {staffSession!.name.slice(0, 1).toUpperCase()}
                </span>
                {!sidebarCollapsed && (
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-white">
                      {staffSession!.name}
                    </span>
                    <span className="block truncate text-[10px] text-[#8a919e]">
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
                  "mt-2 min-h-9 w-full rounded-lg px-2 text-left text-xs font-semibold text-[#c6f432] hover:bg-white/[0.07]",
                  sidebarCollapsed && "text-center",
                )}
                title="End staff session"
              >
                {sidebarCollapsed ? "End" : "End staff session"}
              </button>
            </div>
          )}

          <div data-tour="store-switcher">
            <button
              type="button"
              data-tour="sidebar-actions"
              aria-haspopup="menu"
              aria-expanded={accountOpen}
              aria-label={sidebarCollapsed ? "Open account menu" : undefined}
              onClick={() => setAccountOpen((open) => !open)}
              className={cn(
                "flex min-h-14 w-full items-center gap-3 rounded-xl bg-white/[0.05] p-2.5 text-left transition hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f432]",
                sidebarCollapsed && "justify-center p-2",
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#c6f432] text-xs font-bold text-[#0e1116]">
                {initials}
              </span>
              {!sidebarCollapsed && (
                <>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-white">
                      {store?.name ?? "Your shop"}
                    </span>
                    <span className="block truncate text-xs text-[#8a919e]">
                      {branch?.name ?? "Main branch"}
                    </span>
                  </span>
                  <ChevronUp className="size-4 shrink-0 text-[#8a919e]" />
                </>
              )}
            </button>

            {accountOpen && (
              <div
                role="menu"
                aria-label="Account menu"
                className={cn(
                  "absolute z-50 rounded-2xl border border-white/10 bg-[#161b22] p-2 shadow-2xl",
                  sidebarCollapsed
                    ? "bottom-3 left-full ml-2 w-64"
                    : "bottom-full left-3 right-3 mb-2",
                )}
              >
                {(memberships.length > 1 || branches.length > 1) && (
                  <div className="mb-2 space-y-2 border-b border-white/10 p-1 pb-3">
                    {memberships.length > 1 && (
                      <Select value={store?.id ?? undefined} onValueChange={setActiveStore}>
                        <SelectTrigger
                          aria-label="Switch store"
                          className="h-10 w-full rounded-xl border-white/15 bg-transparent text-sm text-white shadow-none"
                        >
                          <Store className="mr-2 size-4 shrink-0" />
                          <SelectValue placeholder="Switch store" />
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
                          aria-label="Switch branch"
                          className="h-10 w-full rounded-xl border-white/15 bg-transparent text-sm text-white shadow-none"
                        >
                          <GitBranch className="mr-2 size-4 shrink-0" />
                          <SelectValue placeholder="Switch branch" />
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
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    window.dispatchEvent(new Event("strap-start-guided-tour"));
                  }}
                  className={menuItem}
                >
                  <Sparkles className="size-[18px] shrink-0" />
                  Guided tour
                </button>
                <button
                  type="button"
                  role="menuitem"
                  data-tour="sidebar-export"
                  onClick={() => {
                    setAccountOpen(false);
                    if (canExport) setExportOpen(true);
                    else void navigate({ to: "/upgrade" });
                  }}
                  className={menuItem}
                >
                  {canExport ? (
                    <Download className="size-[18px] shrink-0" />
                  ) : (
                    <LockKeyhole className="size-[18px] shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 text-left">Download data</span>
                  {!canExport && (
                    <span className="rounded-full bg-[#c6f432]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#c6f432]">
                      Business
                    </span>
                  )}
                </button>
                {!staffActive && isOwner && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setAccountOpen(false);
                      setDeleteOpen(true);
                    }}
                    className={cn(menuItem, "hover:bg-red-500/15 hover:text-red-300")}
                  >
                    <Trash2 className="size-[18px] shrink-0" />
                    Delete store
                  </button>
                )}
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setAccountOpen(false);
                    setLogoutOpen(true);
                  }}
                  className={menuItem}
                >
                  <LogOut className="size-[18px] shrink-0" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      <div
        className={cn(
          "min-h-[100dvh] transition-[padding] duration-200 ease-out",
          sidebarCollapsed ? "lg:pl-[4.75rem]" : "lg:pl-[15.5rem]",
        )}
      >
        <div className="px-3 pb-24 pt-3 sm:px-4 lg:px-8 lg:pb-12 lg:pt-6">
          <main
            data-tour="main-content"
            className="mx-auto min-h-[calc(100dvh-1.5rem)] w-full max-w-[1360px] rounded-[22px] border border-border/80 bg-surface/85 px-4 py-5 shadow-sm sm:px-6 lg:min-h-0 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none"
          >
            <header
              data-tour="page-heading"
              className="mb-6 flex min-w-0 flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-center sm:justify-between lg:mb-8"
            >
              <div className="min-w-0">
                <p className="max-w-full truncate text-xs text-muted-foreground">
                  {store?.name ?? "Loading shop"}
                  {branch ? " · " + branch.name : ""}
                  {staffActive ? " · " + staffSession!.name : ""}
                </p>
                <h1 className="mt-1 truncate font-display text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
                  {title}
                </h1>
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                {pathname === "/pos" && (
                  <div className="hidden lg:block">
                    <BusinessCalculatorFab className="shrink-0" />
                  </div>
                )}
                {pathname === "/pos" && (
                  <button
                    type="button"
                    aria-label="Scan barcode"
                    title="Scan barcode"
                    onClick={() => window.dispatchEvent(new Event("strap-open-barcode-scanner"))}
                    className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-foreground transition hover:bg-secondary lg:hidden"
                  >
                    <ScanLine className="size-[18px]" aria-hidden />
                  </button>
                )}
                <button
                  type="button"
                  data-tour="quick-find"
                  aria-label="Search"
                  title="Search Strap (Ctrl/⌘ K)"
                  className="hidden h-11 min-w-[12rem] shrink-0 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm text-muted-foreground transition hover:border-foreground/40 hover:text-foreground lg:flex"
                >
                  <Search className="size-4" aria-hidden />
                  <span>Search</span>
                  <kbd className="ml-auto rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold">
                    ⌘K
                  </kbd>
                </button>
                <div data-tour="updates" className="hidden shrink-0 lg:flex">
                  <UpdatesSheet />
                </div>
                <div
                  data-tour="connection-status"
                  className={cn(
                    "hidden h-11 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold sm:flex",
                    online
                      ? "border-border bg-surface text-muted-foreground"
                      : "border-transparent bg-accent-soft text-accent-ink",
                  )}
                  title={online ? "Strap is online" : "Strap is offline"}
                >
                  {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
                  {queued > 0 ? (
                    <>
                      <span>{queued} queued</span>
                      <CloudUpload className="size-4" />
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
