import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Boxes,
  ChartNoAxesCombined,
  Globe2,
  Package,
  Plus,
  Receipt,
  ScanLine,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAllRows } from "@/lib/supabase-pagination";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Strap" },
      {
        name: "description",
        content: "A live command centre for sales, stock, customers and your online store.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { store, branch } = useStoreContext();
  const storeId = store?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const salesQuery = useQuery({
    queryKey: ["sales", storeId, branch?.id ?? null],
    enabled: Boolean(storeId),
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select("id, reference, total, payment_method, created_at, branch_id")
        .eq("store_id", storeId as string);
      if (branch?.id) query = query.eq("branch_id", branch.id);
      const { data, error } = await query.order("created_at", { ascending: false }).limit(25);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const todaySalesQuery = useQuery({
    queryKey: ["dashboard-today-sales", storeId, branch?.id ?? null, startOfToday.toISOString()],
    enabled: Boolean(storeId),
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select("total, created_at")
        .eq("store_id", storeId as string);
      if (branch?.id) query = query.eq("branch_id", branch.id);
      return await fetchAllRows<{ total: number | string; created_at: string }>(
        query
          .gte("created_at", startOfToday.toISOString())
          .order("created_at", { ascending: false })
          .order("id"),
      );
    },
  });

  const lowStockQuery = useQuery({
    queryKey: ["low-stock", storeId, branch?.id],
    enabled: Boolean(storeId && branch?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_stock")
        .select("quantity, products!inner(id, name, low_stock_threshold)")
        .eq("store_id", storeId as string)
        .eq("branch_id", branch!.id);
      if (error) throw new Error(error.message);
      return (data ?? [])
        .filter((row) => row.products && row.quantity <= row.products.low_stock_threshold)
        .sort((a, b) => a.quantity - b.quantity);
    },
  });

  const onlineStoreQuery = useQuery({
    queryKey: ["dashboard-online-store", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await onlineSupabase
        .from("online_stores")
        .select("slug,display_name,is_published,setup_completed")
        .eq("store_id", storeId as string)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  const onlineOrdersQuery = useQuery({
    queryKey: ["dashboard-online-orders", storeId],
    enabled: Boolean(storeId && onlineStoreQuery.data?.setup_completed),
    queryFn: async () => {
      const { data, error } = await onlineSupabase
        .from("online_orders")
        .select("id")
        .eq("store_id", storeId as string)
        .eq("status", "pending");
      if (error) throw new Error(error.message);
      return data?.length ?? 0;
    },
  });

  const sales = salesQuery.data ?? [];
  const todaySales = todaySalesQuery.data ?? [];
  const todayRevenue = todaySales.reduce((sum, sale) => {
    const amount = Number(sale.total);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const online = onlineStoreQuery.data;
  const lowStockCount = lowStockQuery.data?.length ?? 0;
  const pendingOrders = onlineOrdersQuery.data ?? 0;

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
        ? "Good afternoon"
        : "Good evening";

  return (
    <AppShell title="Dashboard">
      <div className="mx-auto w-full max-w-[1440px] space-y-6 pb-10 sm:space-y-7">
        <section className="relative isolate overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm sm:rounded-[32px]">
          <div className="absolute inset-y-0 right-0 -z-10 w-2/3 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklch,var(--color-accent)_17%,transparent),transparent_68%)]" />
          <div className="grid gap-7 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:p-9">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                <span className="size-2 rounded-full bg-success" />
                {greeting} <span aria-hidden="true">·</span> Business overview
              </div>
              <h2 className="max-w-2xl break-words text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                {store?.name ?? "Your store"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                {branch?.name ?? "All branches"} <span className="mx-1.5">/</span> Here's what's happening today.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
              <Link
                to="/pos"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#c6f432] px-4 text-sm font-bold text-[#101713] shadow-sm transition hover:bg-[#d4ff50] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9ac51c] sm:px-5"
              >
                <ScanLine className="size-4" /> Start selling
              </Link>
              <Link
                to="/products"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5"
              >
                <Plus className="size-4" /> Add product
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border border-t border-border bg-background/65">
            <QuickStat icon={<ShoppingBag className="size-4" />} label="Sales today" value={todaySalesQuery.isLoading ? "—" : String(todaySales.length)} />
            <QuickStat icon={<Boxes className="size-4" />} label="Low stock" value={lowStockQuery.isLoading ? "—" : String(lowStockCount)} />
            <QuickStat icon={<Bell className="size-4" />} label="To action" value={onlineOrdersQuery.isLoading ? "—" : String(pendingOrders)} />
          </div>
        </section>

        <section aria-label="Business performance" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="relative overflow-hidden rounded-[26px] bg-[#c6f432] p-5 text-[#111713] shadow-[0_12px_32px_rgba(115,145,25,.12)] sm:col-span-2 sm:p-6">
            <div className="absolute -right-10 -top-16 size-48 rounded-full border-[28px] border-black/[0.045]" />
            <div className="relative flex h-full min-h-[148px] flex-col justify-between gap-6">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-sm font-bold text-[#26310d]/75">
                  <ChartNoAxesCombined className="size-4" /> Revenue today
                </p>
                <span className="flex size-10 items-center justify-center rounded-full bg-black/[0.08]">
                  <TrendingUp className="size-5" />
                </span>
              </div>
              {todaySalesQuery.isLoading ? (
                <Skeleton className="h-10 w-48 bg-black/10" />
              ) : (
                <p className="numeric break-all text-3xl font-extrabold leading-none tracking-tight sm:text-4xl lg:text-[2.65rem]">
                  {formatMoney(todayRevenue, currency)}
                </p>
              )}
              <p className="text-xs font-semibold text-[#26310d]/70">
                {todaySales.length} completed sale{todaySales.length === 1 ? "" : "s"} today
              </p>
            </div>
          </div>
          <MetricCard
            icon={<Receipt className="size-4" />}
            label="Completed sales"
            value={todaySalesQuery.isLoading ? null : String(todaySales.length)}
            hint="Transactions recorded today"
          />
          <MetricCard
            icon={<AlertTriangle className="size-4" />}
            label="Low-stock items"
            value={lowStockQuery.isLoading ? null : String(lowStockCount)}
            hint={lowStockCount ? "Products to replenish" : "Stock levels look good"}
            tone={lowStockCount > 0 ? "warning" : "default"}
          />
          <MetricCard
            icon={<Bell className="size-4" />}
            label="Pending orders"
            value={onlineOrdersQuery.isLoading ? null : String(pendingOrders)}
            hint={online?.setup_completed ? "Online orders waiting" : "Online store not set up"}
            tone={pendingOrders > 0 ? "warning" : "default"}
          />
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.85fr)]">
          <div className="min-w-0 overflow-hidden rounded-[26px] border border-border bg-surface shadow-sm">
            <SectionHeading
              eyebrow="Activity"
              title="Recent sales"
              description="The latest transactions from your store"
              action={<Link to="/reports" className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-xl px-3 text-xs font-bold text-accent-ink transition hover:bg-accent-soft">View reports <ArrowUpRight className="size-4" /></Link>}
            />
            {salesQuery.isLoading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sales.length === 0 ? (
              <EmptyState title="No sales yet" text="Your completed sales will appear here." />
            ) : (
              <>
                <ul className="divide-y divide-border">
                  {sales.slice(0, 6).map((sale) => (
                    <li key={sale.id} className="flex min-w-0 items-center justify-between gap-3 px-4 py-4 transition hover:bg-secondary/35 sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                          <Receipt className="size-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="numeric truncate text-sm font-bold">{sale.reference}</p>
                          <p className="mt-1 truncate text-xs text-muted-foreground">{formatDateTime(sale.created_at)} <span className="mx-1">·</span> {sale.payment_method}</p>
                        </div>
                      </div>
                      <span className="numeric shrink-0 text-right text-sm font-bold sm:text-base">{formatMoney(Number(sale.total), currency)}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-border px-5 py-3">
                  <Link to="/reports" className="inline-flex min-h-9 items-center gap-2 text-xs font-bold text-muted-foreground transition hover:text-foreground">Open sales report <ArrowRight className="size-3.5" /></Link>
                </div>
              </>
            )}
          </div>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="min-w-0 overflow-hidden rounded-[26px] border border-border bg-surface shadow-sm">
              <SectionHeading
                eyebrow="Inventory"
                title="Stock alerts"
                description="Items that may need a restock"
                action={<Link to="/products" className="inline-flex min-h-10 items-center rounded-xl px-3 text-xs font-bold text-accent-ink transition hover:bg-accent-soft">View stock</Link>}
              />
              {lowStockQuery.isLoading ? (
                <div className="space-y-3 p-5"><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></div>
              ) : lowStockCount === 0 ? (
                <EmptyState title="All clear" text="No products are below their stock threshold." />
              ) : (
                <ul className="divide-y divide-border">
                  {lowStockQuery.data?.slice(0, 5).map((row) => (
                    <li key={row.products!.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                      <span className="min-w-0 truncate text-sm font-semibold">{row.products!.name}</span>
                      <span className="numeric shrink-0 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-accent-ink">{row.quantity} left</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-[26px] border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Globe2 className="size-5" /></span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[.12em] text-muted-foreground">Sales channel</p>
                    <h3 className="mt-1 font-bold">Online store</h3>
                  </div>
                </div>
                <span className={`mt-1 size-2.5 shrink-0 rounded-full ${online?.is_published ? "bg-success" : "bg-warning"}`} />
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                {online?.setup_completed
                  ? online.is_published
                    ? pendingOrders ? pendingOrders + " order(s) need attention." : "Your storefront is published and ready for customers."
                    : "Your storefront is set up and ready to publish."
                  : "Set up your storefront to start receiving orders online."}
              </p>
              <Link
                to={online?.setup_completed ? "/online-store/orders" : "/online-store/setup"}
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background transition hover:opacity-90"
              >
                {online?.setup_completed ? "Review orders" : "Set up online store"} <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[26px] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <SectionHeading
            eyebrow="Shortcuts"
            title="Quick access"
            description="Jump straight into the tools you use most"
          />
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <QuickLink to="/pos" icon={<ScanLine className="size-5" />} label="New sale" />
            <QuickLink to="/products" icon={<Package className="size-5" />} label="Products" />
            <QuickLink to="/customers" icon={<Users className="size-5" />} label="Customers" />
            <QuickLink to="/reports" icon={<ChartNoAxesCombined className="size-5" />} label="Reports" />
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function QuickStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 px-3 py-3.5 sm:gap-3 sm:px-6 sm:py-4">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground sm:size-9">{icon}</span>
      <div className="min-w-0">
        <p className="numeric text-lg font-bold leading-none sm:text-xl">{value}</p>
        <p className="mt-1 truncate text-[10px] font-medium text-muted-foreground sm:text-xs">{label}</p>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  hint: string;
  tone?: "default" | "warning";
}) {
  return (
    <div className="flex min-h-[148px] min-w-0 flex-col justify-between rounded-[24px] border border-border bg-surface p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-xs font-semibold text-muted-foreground sm:text-sm">
          {icon}<span className="truncate">{label}</span>
        </p>
        <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${tone === "warning" ? "bg-warning-soft text-accent-ink" : "bg-secondary text-muted-foreground"}`}>
          {icon}
        </span>
      </div>
      {value === null ? (
        <Skeleton className="mt-4 h-9 w-24" />
      ) : (
        <p className={`numeric mt-4 text-3xl font-bold tracking-tight ${tone === "warning" ? "text-accent-ink" : "text-foreground"}`}>{value}</p>
      )}
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{hint}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted-foreground">{eyebrow}</p>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-foreground">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: "/pos" | "/products" | "/customers" | "/reports"; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="group flex min-h-[76px] min-w-0 items-center gap-3 rounded-2xl border border-border bg-background p-3 text-sm font-semibold transition hover:border-accent/50 hover:bg-accent-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground transition group-hover:bg-accent group-hover:text-accent-foreground">{icon}</span>
      <span className="truncate">{label}</span>
      <ArrowUpRight className="ml-auto size-4 shrink-0 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="px-5 py-10 text-center">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-muted-foreground">{text}</p>
    </div>
  );
}
