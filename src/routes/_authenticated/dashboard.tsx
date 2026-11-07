import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  ChevronRight,
  Globe2,
  Package,
  Plus,
  Receipt,
  ScanLine,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/format";
import { getBusinessMode } from "@/lib/business-modes";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Today's trading — Strap" },
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
  const [storeNudgeDismissed, setStoreNudgeDismissed] = useState(false);
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
  // Keep recent sales bounded; fetch every sale today for accurate metrics.
  const todaySalesQuery = useQuery({
    queryKey: ["dashboard-today-sales", storeId, branch?.id ?? null, startOfToday.toISOString()],
    enabled: Boolean(storeId),
    queryFn: async () => {
      let query = supabase
        .from("sales")
        .select("total, created_at")
        .eq("store_id", storeId as string);
      if (branch?.id) query = query.eq("branch_id", branch.id);
      const { data, error } = await query
        .gte("created_at", startOfToday.toISOString())
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
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
  const todayRevenue = todaySales.reduce((sum, s) => {
    const amount = Number(s.total);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const online = onlineStoreQuery.data;
  const lowStockCount = lowStockQuery.data?.length ?? 0;
  const pendingOrders = onlineOrdersQuery.data ?? 0;
  const businessMode = getBusinessMode(
    (store?.storefront_settings as any)?.businessMode ?? store?.business_type,
  );
  const isFashion = businessMode.key === "fashion";

  return (
    <AppShell title={isFashion ? "Fashion studio" : "Today's trading"}>
      <div className="space-y-6 pb-8">
        <div className="flex flex-wrap gap-2.5">
          <Link
            to={isFashion ? "/products" : "/pos"}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90 dark:bg-[#c6f432] dark:text-[#0e1116]"
          >
            {isFashion ? <Package className="size-4" /> : <ScanLine className="size-4" />}
            {isFashion ? "Manage collection" : "Sell now"}
          </Link>
          <Link
            to="/products"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-surface px-5 text-sm font-semibold transition hover:border-foreground/40"
          >
            <Plus className="size-4" />
            Add product
          </Link>
        </div>

        <section
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          aria-label="Today at a glance"
        >
          <MetricCard
            icon={<TrendingUp className="size-4" />}
            label="Revenue today"
            value={todaySalesQuery.isLoading ? null : formatMoney(todayRevenue, currency)}
            hint={`${todaySales.length} sale${todaySales.length === 1 ? "" : "s"} completed`}
          />
          <MetricCard
            icon={<Receipt className="size-4" />}
            label="Sales today"
            value={todaySalesQuery.isLoading ? null : String(todaySales.length)}
            hint="Counter activity"
          />
          <MetricCard
            icon={<AlertTriangle className="size-4" />}
            label="Needs attention"
            value={lowStockQuery.isLoading ? null : String(lowStockCount)}
            hint={lowStockCount ? "Below stock threshold" : "Stock looks healthy"}
            warn={lowStockCount > 0}
          />
          <MetricCard
            icon={<Bell className="size-4" />}
            label="Online orders"
            value={onlineOrdersQuery.isLoading ? null : String(pendingOrders)}
            hint={online?.setup_completed ? "Waiting for action" : "Store not active"}
            warn={pendingOrders > 0}
          />
        </section>

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <section
            className="rounded-2xl border border-border bg-surface overflow-hidden"
            aria-labelledby="recent-sales"
          >
            <SectionHead id="recent-sales" title="Recent sales" to="/reports" link="Reports" />
            {salesQuery.isLoading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sales.length === 0 ? (
              <EmptyState
                title="No sales recorded yet"
                text="Ring one up from the Sell screen and it will appear here."
              />
            ) : (
              <ul className="divide-y divide-border">
                {sales.slice(0, 8).map((sale) => (
                  <li key={sale.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="numeric truncate text-sm font-semibold">{sale.reference}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {formatDateTime(sale.created_at)} · {sale.payment_method}
                      </p>
                    </div>
                    <span className="numeric shrink-0 text-sm font-bold">
                      {formatMoney(Number(sale.total), currency)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="space-y-5">
            <section
              className="rounded-2xl border border-border bg-surface overflow-hidden"
              aria-labelledby="low-stock"
            >
              <SectionHead id="low-stock" title="Low stock" to="/products" link="Open stock" />
              {lowStockQuery.isLoading ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : lowStockCount === 0 ? (
                <EmptyState
                  title="Everything is above threshold"
                  text="Strap will flag products here when they need attention."
                />
              ) : (
                <ul className="divide-y divide-border">
                  {lowStockQuery.data?.slice(0, 6).map((row) => (
                    <li
                      key={row.products!.id}
                      className="flex items-center justify-between gap-3 px-5 py-3"
                    >
                      <span className="truncate text-sm font-medium">{row.products!.name}</span>
                      <span className="numeric shrink-0 rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-accent-ink">
                        {row.quantity} left
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {online?.setup_completed ? (
              <section
                className="rounded-2xl border border-border bg-surface p-5"
                aria-labelledby="online-store"
              >
                <div className="flex items-start gap-3">
                  <Globe2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div className="min-w-0">
                    <h2 id="online-store" className="font-display text-lg font-bold">
                      {online.display_name}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {pendingOrders
                        ? `${pendingOrders} pending order${pendingOrders === 1 ? "" : "s"} need your attention.`
                        : "Your online store is live and ready for customers."}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        to="/online-store/orders"
                        className="inline-flex min-h-10 items-center rounded-xl bg-foreground px-4 text-sm font-semibold text-background dark:bg-[#c6f432] dark:text-[#0e1116]"
                      >
                        Orders
                      </Link>
                      <Link
                        to="/online-store/catalog"
                        className="inline-flex min-h-10 items-center rounded-xl border border-border px-4 text-sm font-semibold hover:border-foreground/40"
                      >
                        Catalogue
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            ) : !storeNudgeDismissed ? (
              <section
                className="rounded-2xl border border-border bg-surface relative p-5"
                aria-labelledby="online-store"
              >
                <button
                  type="button"
                  onClick={() => setStoreNudgeDismissed(true)}
                  aria-label="Dismiss online store reminder"
                  className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
                <div className="flex items-start gap-3 pr-8">
                  <Globe2 className="mt-0.5 size-5 shrink-0" aria-hidden />
                  <div>
                    <h2 id="online-store" className="font-display text-lg font-bold">
                      Sell online too
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Turn your catalogue into a storefront and take orders beyond your shop.
                    </p>
                    <Link
                      to="/online-store/setup"
                      className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background dark:bg-[#c6f432] dark:text-[#0e1116]"
                    >
                      Set up online store
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <section
          className="rounded-2xl border border-border bg-surface overflow-hidden"
          aria-labelledby="quick-actions"
        >
          <SectionHead
            id="quick-actions"
            title={"Suggested for " + businessMode.label.toLowerCase()}
            to="/settings/store-profile"
            link="Change mode"
          />
          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {businessMode.quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.to as any}
                className="group flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border p-4 transition hover:border-foreground/40"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{action.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function SectionHead({
  id,
  title,
  to,
  link,
}: {
  id: string;
  title: string;
  to: string;
  link: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
      <h2 id={id} className="font-display text-lg font-bold">
        {title}
      </h2>
      <Link
        to={to as any}
        className="text-xs font-semibold underline underline-offset-4 hover:text-accent-ink"
      >
        {link}
      </Link>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  hint,
  warn = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  hint: string;
  warn?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </p>
      {value === null ? (
        <Skeleton className="mt-3 h-9 w-28" />
      ) : (
        <p
          className={`numeric mt-2 font-display text-3xl font-bold tracking-tight ${warn ? "text-accent-ink" : ""}`}
        >
          {value}
        </p>
      )}
      <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>
    </div>
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
