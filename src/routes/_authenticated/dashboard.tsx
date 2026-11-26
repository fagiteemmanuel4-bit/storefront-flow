import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  const navigate = useNavigate();
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
      <div className="strap-dashboard mx-auto w-full max-w-[1440px] space-y-6 pb-10">
        <section className="strap-dashboard-hero">
          <div className="strap-dashboard-hero-main">
            <div className="strap-dashboard-kicker">
              <span className="strap-dashboard-live-dot" />
              <span>{greeting}</span>
              <span className="strap-dashboard-separator">/</span>
              <span>Daily overview</span>
            </div>
            <h2>{store?.name ?? "Your store"}</h2>
            <p>{branch?.name ?? "All branches"} <span aria-hidden="true">·</span> A clear view of what needs your attention today.</p>
            <div className="strap-dashboard-actions">
              <Link to="/pos" className="strap-dashboard-primary-action">
                <ScanLine className="size-4" /> Start selling
              </Link>
              <Link to="/products" className="strap-dashboard-secondary-action">
                <Plus className="size-4" /> Add product
              </Link>
            </div>
          </div>
          <div className="strap-dashboard-date">
            <span>YOUR BUSINESS</span>
            <strong>{new Intl.DateTimeFormat("en-NG", { weekday: "long" }).format(new Date())}</strong>
            <span>{new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}</span>
          </div>

        </section>

        <section aria-label="Business performance" className="strap-dashboard-performance">
          <div className="strap-dashboard-revenue">
            <div className="strap-dashboard-card-topline">
              <span><ChartNoAxesCombined className="size-4" /> Revenue today</span>
              <span className="strap-dashboard-icon-mark"><TrendingUp className="size-5" /></span>
            </div>
            {todaySalesQuery.isLoading ? (
              <Skeleton className="mt-8 h-11 w-48 bg-black/10" />
            ) : (
              <p className="strap-dashboard-revenue-value">{formatMoney(todayRevenue, currency)}</p>
            )}
            <p className="strap-dashboard-revenue-note">
              From {todaySales.length} completed sale{todaySales.length === 1 ? "" : "s"} today
            </p>
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

        <section className="strap-dashboard-content-grid">
          <div className="strap-dashboard-panel">
            <SectionHeading
              eyebrow="Latest activity"
              title="Recent sales"
              description="The latest transactions from your store"
              action={
                <Link to="/reports" className="strap-dashboard-section-action">
                  View reports <ArrowUpRight className="size-4" />
                </Link>
              }
            />
            {salesQuery.isLoading ? (
              <div className="space-y-3 p-5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : sales.length === 0 ? (
              <EmptyState title="No sales yet" text="Your completed sales will appear here. Start your first sale whenever you're ready." />
            ) : (
              <>
                <ul className="strap-dashboard-sales-list">
                  {sales.slice(0, 6).map((sale) => (
                    <li key={sale.id}>
                      <span className="strap-dashboard-row-icon"><Receipt className="size-4" /></span>
                      <div className="strap-dashboard-sale-detail">
                        <strong className="numeric">{sale.reference}</strong>
                        <span>{formatDateTime(sale.created_at)} <span aria-hidden="true">·</span> {sale.payment_method}</span>
                      </div>
                      <strong className="strap-dashboard-sale-total numeric">{formatMoney(Number(sale.total), currency)}</strong>
                    </li>
                  ))}
                </ul>
                <div className="strap-dashboard-panel-footer">
                  <Link to="/reports">Open sales report <ArrowRight className="size-3.5" /></Link>
                </div>
              </>
            )}
          </div>

          <div className="strap-dashboard-side-stack">
            <div className="strap-dashboard-panel">
              <SectionHeading
                eyebrow="Inventory"
                title="Stock alerts"
                description="Items that may need a restock"
                action={
                  <Link to="/products" className="strap-dashboard-section-action">
                    View stock <ArrowUpRight className="size-4" />
                  </Link>
                }
              />
              {lowStockQuery.isLoading ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              ) : lowStockCount === 0 ? (
                <EmptyState title="All clear" text="No products are below their stock threshold." />
              ) : (
                <ul className="strap-dashboard-stock-list">
                  {lowStockQuery.data?.slice(0, 5).map((row) => (
                    <li key={row.products!.id}>
                      <span>{row.products!.name}</span>
                      <strong className="numeric">{row.quantity} left</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="strap-dashboard-online">
              <div className="strap-dashboard-online-heading">
                <span className="strap-dashboard-online-icon"><Globe2 className="size-5" /></span>
                <div>
                  <span>Sales channel</span>
                  <h3>Online store</h3>
                </div>
                <span className={`strap-dashboard-online-status ${online?.is_published ? "is-live" : "is-setup"}`} />
              </div>
              <p>
                {online?.setup_completed
                  ? online.is_published
                    ? pendingOrders
                      ? pendingOrders + " order(s) need attention."
                      : "Your storefront is published and ready for customers."
                    : "Your storefront is set up and ready to publish."
                  : "Set up your storefront to start receiving orders online."}
              </p>
              <button
                type="button"
                onClick={() =>
                  void navigate({
                    to: online?.setup_completed ? "/online-store/orders" : "/online-store/setup",
                  })
                }
                className="strap-dashboard-online-action"
              >
                {online?.setup_completed ? "Review orders" : "Set up online store"}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="strap-dashboard-panel strap-dashboard-shortcuts">
          <SectionHeading
            eyebrow="Your workspace"
            title="Quick access"
            description="The tools you use most, one tap away"
          />
          <div className="strap-dashboard-quick-links">
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
    <div className={`strap-dashboard-metric ${tone === "warning" ? "is-warning" : ""}`}>
      <div className="strap-dashboard-metric-label">{icon}<span>{label}</span></div>
      {value === null ? (
        <Skeleton className="mt-5 h-9 w-24" />
      ) : (
        <strong className="strap-dashboard-metric-value numeric">{value}</strong>
      )}
      <p>{hint}</p>
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
    <div className="strap-dashboard-section-heading">
      <div>
        <span>{eyebrow}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
}: {
  to: "/pos" | "/products" | "/customers" | "/reports";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link to={to} className="strap-dashboard-quick-link">
      <span>{icon}</span>
      <strong>{label}</strong>
      <ArrowUpRight className="strap-dashboard-quick-link-arrow size-4" />
    </Link>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="strap-dashboard-empty">
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}
