import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Download,
  ExternalLink,
  FileBarChart,
  Globe2,
  HardDrive,
  HelpCircle,
  LogOut,
  LockKeyhole,
  Package,
  Plus,
  ReceiptText,
  ScanLine,
  Settings,
  ShoppingBag,
  Store,
  Trash2,
  Users,
  Cpu,
  Wrench,
  ChefHat,
  CookingPot,
  AlertTriangle,
  Boxes,
  Truck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ExportDataDialog } from "@/components/shell/ExportDataDialog";
import { DeleteStoreDialog } from "@/components/shell/DeleteStoreDialog";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { cn } from "@/lib/utils";
import type { StoreRow, StoreRole } from "@/lib/pos-types";
import { clearStaffSession, getStaffSession } from "@/lib/staff-session";
import { getBusinessMode } from "@/lib/business-modes";
function MenuLink({
  to,
  icon: Icon,
  label,
  hint,
  onClick,
  badge,
  featured = false,
  locked = false,
}: {
  to:
    | "/reports"
    | "/stock-sense"
    | "/expenses"
    | "/online-store"
    | "/online-store/orders"
    | "/online-store/catalog"
    | "/help"
    | "/customers"
    | "/products"
    | "/staff"
    | "/hardware"
    | "/electronics-workspace"
    | "/fashion-returns"
    | "/food-service"
    | "/grocery-inventory";
  icon: typeof Store;
  label: string;
  hint: string;
  onClick: () => void;
  badge?: number;
  featured?: boolean;
  locked?: boolean;
}) {
  return (
    <Link
      to={(locked ? "/upgrade" : to) as any}
      onClick={onClick}
      className={cn(
        "group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 transition-colors active:bg-secondary",
        featured
          ? "border-accent/20 bg-accent-soft/70"
          : "border-transparent hover:border-border hover:bg-secondary/70",
      )}
    >
      <span
        className={cn(
          "relative flex size-10 shrink-0 items-center justify-center rounded-xl",
          featured ? "bg-accent text-accent-foreground" : "bg-secondary group-hover:bg-accent-soft",
        )}
      >
        <Icon className="size-[18px]" />
        {badge ? (
          <span className="absolute -right-1 -top-1 flex min-w-4 h-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold tracking-tight">{label}</span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
function ActionLink({
  to,
  icon: Icon,
  label,
  onClick,
  locked = false,
}: {
  to:
    | "/products"
    | "/pos"
    | "/online-store"
    | "/online-store/orders"
    | "/expenses"
    | "/electronics-workspace"
    | "/food-service"
    | "/grocery-inventory";
  icon: typeof Store;
  label: string;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <Link
      to={(locked ? "/upgrade" : to) as any}
      onClick={onClick}
      className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-border/70 bg-secondary/45 px-2 py-3 text-center transition hover:border-accent/30 hover:bg-accent-soft active:scale-[.98]"
    >
      <span className="relative flex size-9 items-center justify-center rounded-xl bg-background">
        <Icon className="size-[17px]" />
        {locked && <LockKeyhole className="absolute -right-1 -top-1 size-3.5 text-accent-ink" aria-label="Business plan required" />}
      </span>
      <span className="text-[11px] font-semibold leading-tight">{label}</span>
    </Link>
  );
}
function StoreMark({ store }: { store: StoreRow | null }) {
  const settings = store?.storefront_settings;
  const logoUrl =
    settings && typeof settings === "object" && !Array.isArray(settings) && "logoUrl" in settings
      ? String((settings as Record<string, unknown>).logoUrl ?? "")
      : "";
  const initials = (store?.name ?? "S").trim().slice(0, 2).toUpperCase();
  return (
    <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-background font-display text-sm font-bold shadow-lg ring-1 ring-black/5">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${store?.name ?? "Store"} logo`}
          className="size-full object-cover"
        />
      ) : (
        initials
      )}
    </span>
  );
}
export function AppMenuSheet({
  open,
  onOpenChange,
  store,
  branchName,
  role,
  onSignOut,
  canExport,
  canOnlineStore,
  canAnalytics,
  canTeam,
  canStockSense,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreRow | null;
  branchName: string | null;
  role: StoreRole | null;
  onSignOut: () => void;
  canExport: boolean;
  canOnlineStore: boolean;
  canAnalytics: boolean;
  canTeam: boolean;
  canStockSense: boolean;
}) {
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [staffActive, setStaffActive] = useState(() => getStaffSession(store?.id));
  const isOwner = role === "owner";
  const canManageStaff = role === "owner" || role === "manager";
  const businessMode = getBusinessMode(
    (store?.storefront_settings as any)?.businessMode ?? (store as any)?.business_type,
  );
  const isFashion = businessMode.key === "fashion";
  const isElectronics = businessMode.key === "electronics";
  const isFoodService = businessMode.key === "food-service";
  const isGrocery = businessMode.key === "grocery-provision";
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
  const pendingOrdersQuery = useQuery({
    queryKey: ["online-orders-pending", store?.id],
    enabled: Boolean(store?.id && storefrontQuery.data?.setup_completed),
    queryFn: async () => {
      const { count, error } = await onlineSupabase
        .from("online_orders")
        .select("id", { count: "exact", head: true })
        .eq("store_id", store!.id)
        .eq("status", "pending");
      if (error) throw new Error(error.message);
      return count ?? 0;
    },
  });
  const storefront = storefrontQuery.data;
  useEffect(() => {
    const handler = () => {
      void storefrontQuery.refetch();
      void pendingOrdersQuery.refetch();
      setStaffActive(getStaffSession(store?.id));
    };
    window.addEventListener("kudi-storefront-updated", handler);
    window.addEventListener("kudi-staff-session-changed", handler);
    return () => {
      window.removeEventListener("kudi-storefront-updated", handler);
      window.removeEventListener("kudi-staff-session-changed", handler);
    };
  }, [store?.id, storefrontQuery, pendingOrdersQuery]);
  const close = () => onOpenChange(false);
  const endStaffSession = () => {
    clearStaffSession();
    setStaffActive(null);
    close();
  };
  const pendingOrders = pendingOrdersQuery.data ?? 0;
  const storefrontPath = storefront?.slug ? `/store/${storefront.slug}` : "";
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="kudi-mobile-menu flex h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-l-[28px] border-l border-border/70 bg-background/95 p-0 shadow-2xl backdrop-blur-xl sm:h-full sm:w-[min(96vw,460px)] sm:rounded-l-none"
        >
          <SheetHeader className="relative shrink-0 border-b border-border/70 px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] text-left sm:pt-6">
            <div className="relative flex items-center gap-3">
              <StoreMark store={store} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl tracking-tight">Menu</SheetTitle>
                  <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Strap
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {store?.name ?? "Your shop"}
                  {branchName ? ` · ${branchName}` : ""} ·{" "}
                  {staffActive ? `${staffActive.name} · ${staffActive.role}` : (role ?? "member")}
                </p>
              </div>
            </div>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 pb-6 [scrollbar-width:thin]">
            {staffActive && (
              <div className="mb-5 rounded-2xl border border-accent/20 bg-accent-soft/70 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-accent/20">
                    <Users className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Staff session
                    </p>
                    <p className="mt-1 font-semibold">{staffActive.name}</p>
                    <p className="text-xs text-muted-foreground">{staffActive.role}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={endStaffSession}
                  className="mt-3 text-xs font-semibold text-accent-ink hover:underline"
                >
                  End staff session
                </button>
              </div>
            )}
            <section>
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Quick actions
              </p>
              <div className="grid grid-cols-2 gap-2">
                {isElectronics ? (
                  <>
                    <ActionLink
                      to="/electronics-workspace"
                      icon={Cpu}
                      label="Register device"
                      onClick={close}
                    />
                    <ActionLink to="/pos" icon={ScanLine} label="New sale" onClick={close} />
                    <ActionLink
                      to="/electronics-workspace"
                      icon={Wrench}
                      label="Repair desk"
                      onClick={close}
                    />
                    <ActionLink to="/products" icon={Package} label="Catalogue" onClick={close} />
                  </>
                ) : isFoodService ? (
                  <>
                    <ActionLink
                      to="/food-service"
                      icon={ChefHat}
                      label="Kitchen & menu"
                      onClick={close}
                    />
                    <ActionLink to="/pos" icon={ScanLine} label="Sell menu" onClick={close} />
                    <ActionLink
                      to="/food-service"
                      icon={CookingPot}
                      label="Recipes"
                      onClick={close}
                    />
                    <ActionLink
                      to="/food-service"
                      icon={AlertTriangle}
                      label="Waste log"
                      onClick={close}
                    />
                  </>
                ) : isGrocery ? (
                  <>
                    <ActionLink
                      to="/grocery-inventory"
                      icon={Boxes}
                      label="Batch & expiry"
                      onClick={close}
                    />
                    <ActionLink to="/pos" icon={ScanLine} label="Sell items" onClick={close} />
                    <ActionLink
                      to="/grocery-inventory"
                      icon={Truck}
                      label="Restock list"
                      onClick={close}
                    />
                    <ActionLink to="/products" icon={Package} label="Catalogue" onClick={close} />
                  </>
                ) : (
                  <>
                    <ActionLink
                      to="/products"
                      icon={Plus}
                      label={isFashion ? "Add clothing" : "Add product"}
                      onClick={close}
                    />
                    <ActionLink
                      to={isFashion ? "/online-store" : "/pos"}
                      icon={isFashion ? Globe2 : ScanLine}
                      label={isFashion ? "Promote store" : "New sale"}
                      onClick={close}
                      locked={isFashion && !canOnlineStore}
                    />
                    <ActionLink
                      to="/online-store/orders"
                      icon={ShoppingBag}
                      label={isFashion ? "Customer orders" : "View orders"}
                      onClick={close}
                      locked={!canOnlineStore}
                    />
                    <ActionLink
                      to={isFashion ? "/products" : "/expenses"}
                      icon={isFashion ? Package : ReceiptText}
                      label={isFashion ? "Open collection" : "Add expense"}
                      onClick={close}
                    />
                  </>
                )}
              </div>
            </section>
            <div className="my-5 border-t border-border/70" />
            <section>
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Manage
              </p>
              <div className="space-y-1.5">
                <MenuLink
                  to="/products"
                  icon={Package}
                  label={isFashion ? "Clothing collection" : "Products"}
                  hint={isFashion ? "Photos, sizes, colours and prices" : "Catalogue and stock"}
                  onClick={close}
                />
                {isElectronics && (
                  <MenuLink
                    to="/electronics-workspace"
                    icon={Cpu}
                    label="Devices & repairs"
                    hint="Serials, IMEIs, warranty and repair queue"
                    onClick={close}
                    featured
                  />
                )}
                {isFoodService && (
                  <MenuLink
                    to="/food-service"
                    icon={ChefHat}
                    label="Kitchen & menu"
                    hint="Modifiers, recipes, tickets and waste"
                    onClick={close}
                    featured
                  />
                )}
                {isGrocery && (
                  <MenuLink
                    to="/grocery-inventory"
                    icon={Boxes}
                    label="Batches & expiry"
                    hint="Lot tracking, FEFO checkout and restock suggestions"
                    onClick={close}
                    featured
                  />
                )}
                {isFashion && (
                  <MenuLink
                    to="/fashion-returns"
                    icon={ReceiptText}
                    label="Returns & exchanges"
                    hint="Restock returned clothing"
                    onClick={close}
                  />
                )}
                <MenuLink
                  to="/online-store/orders"
                  icon={ShoppingBag}
                  label="Orders"
                  hint="Sales from every channel"
                  badge={pendingOrders}
                  onClick={close}
                  locked={!canOnlineStore}
                />
                <MenuLink
                  to="/customers"
                  icon={Users}
                  label="Customers"
                  hint="Customer history and relationships"
                  onClick={close}
                />
                <MenuLink
                  to="/expenses"
                  icon={ReceiptText}
                  label="Expenses"
                  hint="Track business spending"
                  onClick={close}
                />
              </div>
            </section>
            <div className="my-5 border-t border-border/70" />
            <section>
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {isFashion ? "Online shop & promotion" : "Storefront"}
              </p>
              <div className="space-y-1.5">
                {canManageStaff && (
                  <MenuLink
                    to="/online-store"
                    icon={Store}
                    label="Online Store"
                    hint="Manage your public storefront"
                    onClick={close}
                    featured
                    locked={!canOnlineStore}
                  />
                )}
                {storefront?.setup_completed && (
                  <>
                    {
                      <MenuLink
                        to="/online-store/catalog"
                        icon={Globe2}
                        label="Catalog"
                        hint="Publish and organise products"
                        onClick={close}
                        locked={!canOnlineStore}
                      />
                    }{" "}
                    {storefrontPath && (
                      <a
                        href={storefrontPath}
                        onClick={close}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-border hover:bg-secondary/70"
                      >
                        <span className="flex size-10 items-center justify-center rounded-xl bg-secondary group-hover:bg-accent-soft">
                          <ExternalLink className="size-[18px]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold">Live storefront</span>
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {storefront.is_published
                              ? "Open your live store"
                              : "Storefront needs attention"}
                          </span>
                        </span>
                        <ExternalLink className="size-4 text-muted-foreground" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </section>
            <div className="my-5 border-t border-border/70" />
            <section>
              <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                More
              </p>
              <div className="space-y-1.5">
                <MenuLink
                  to="/reports"
                  icon={FileBarChart}
                  label="Reports"
                  hint="Trading insight and performance"
                  onClick={close}
                  locked={!canAnalytics}
                />
                <MenuLink
                  to="/staff"
                  icon={Users}
                  label="Team"
                  hint="Staff accounts and permissions"
                  onClick={close}
                  locked={!canTeam}
                />
                <MenuLink
                  to="/hardware"
                  icon={HardDrive}
                  label="Hardware"
                  hint="Printers and connected devices"
                  onClick={close}
                  locked={!canTeam}
                />
                <MenuLink
                  to="/stock-sense"
                  icon={Boxes}
                  label="Stock Sense"
                  hint="Stock health and replenishment suggestions"
                  onClick={close}
                  locked={!canStockSense}
                />
                <MenuLink
                  to="/help"
                  icon={HelpCircle}
                  label="Help"
                  hint="Guides and support"
                  onClick={close}
                />
                <Link
                  to="/settings"
                  onClick={close}
                  className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-border hover:bg-secondary/70"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-secondary group-hover:bg-accent-soft">
                    <Settings className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">Settings</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      Store, account and security
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </div>
            </section>
            <div className="mt-5 rounded-2xl border border-border bg-secondary/35 p-3">
              {canExport ? (
                <button
                  type="button"
                  onClick={() => {
                    close();
                    setExportOpen(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-semibold hover:bg-background"
                >
                  <Download className="size-4" />
                  Download store data
                </button>
              ) : (
                <Link
                  to="/upgrade"
                  onClick={close}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-semibold text-accent-ink hover:bg-background"
                >
                  <LockKeyhole className="size-4" />
                  <span className="min-w-0 flex-1">Download store data</span>
                  <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[9px] font-bold uppercase">
                    Business
                  </span>
                </Link>
              )}
            </div>
          </div>
          <div className="shrink-0 border-t border-border/70 bg-background/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
            <Button variant="outline" className="h-11 w-full rounded-xl" onClick={onSignOut}>
              <LogOut className="mr-2 size-4" />
              Log out
            </Button>
            {isOwner && !staffActive && (
              <button
                className="mt-2 w-full rounded-xl px-3 py-2 text-xs font-semibold text-destructive transition hover:bg-destructive/10"
                onClick={() => {
                  close();
                  setDeleteOpen(true);
                }}
              >
                <Trash2 className="mr-1.5 inline size-3.5" />
                Delete store
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
      <ExportDataDialog store={store} open={exportOpen} onOpenChange={setExportOpen} canExport={canExport} />
      <DeleteStoreDialog store={store} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
