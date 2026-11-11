import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Globe2,
  Package,
  Plus,
  Receipt,
  ScanLine,
  TrendingUp,
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
  const todayRevenue = todaySales.reduce((sum, s) => {
    const amount = Number(s.total);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);
  const online = onlineStoreQuery.data;
  const lowStockCount = lowStockQuery.data?.length ?? 0;
  const pendingOrders = onlineOrdersQuery.data ?? 0;

  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-[30px] bg-[#111713] p-6 text-white shadow-[0_18px_45px_rgba(17,23,19,.14)] sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-[#c6f432]/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/60">{greeting}</p>
              <h2 className="mt-1 truncate font-display text-3xl font-bold tracking-tight sm:text-4xl">{store?.name ?? "Your store"}</h2>
              <p className="mt-2 text-sm text-white/65">{branch?.name ?? "All branches"} · Your business at a glance</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/pos" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#c6f432] px-5 text-sm font-bold text-[#101713] shadow-sm transition hover:bg-[#d2ff45]"><ScanLine className="size-4" /> Start selling</Link>
              <Link to="/products" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white transition hover:bg-white/10"><Plus className="size-4" /> Add product</Link>
            </div>
          </div>
        </section>
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Business overview">
          <div className="relative overflow-hidden rounded-[24px] border border-[#c6f432]/40 bg-[#c6f432] p-5 text-[#111713] shadow-[0_8px_24px_rgba(115,145,25,.12)] sm:col-span-2">
            <div className="flex items-start justify-between gap-3">
              <div><p className="flex items-center gap-2 text-sm font-semibold text-[#28320e]/75"><TrendingUp className="size-4" /> Revenue today</p>{todaySalesQuery.isLoading ? <Skeleton className="mt-4 h-10 w-40" /> : <p className="numeric mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{formatMoney(todayRevenue, currency)}</p>}<p className="mt-2 text-xs font-medium text-[#28320e]/70">{todaySales.length} completed sale{todaySales.length === 1 ? "" : "s"} today</p></div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-black/10"><Receipt className="size-6" /></span>
            </div>
          </div>
          <MetricCard icon={<Receipt className="size-4" />} label="Sales today" value={todaySalesQuery.isLoading ? null : String(todaySales.length)} hint="Completed transactions" />
          <MetricCard icon={<AlertTriangle className="size-4" />} label="Low-stock items" value={lowStockQuery.isLoading ? null : String(lowStockCount)} hint={lowStockCount ? "Restock these products" : "Stock levels look good"} warn={lowStockCount > 0} />
          <MetricCard icon={<Bell className="size-4" />} label="Pending online orders" value={onlineOrdersQuery.isLoading ? null : String(pendingOrders)} hint={online?.setup_completed ? "Orders waiting for action" : "Online store not set up"} warn={pendingOrders > 0} />
        </section>
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,.8fr)]">
          <div className="overflow-hidden rounded-[26px] border border-border bg-surface shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-display text-lg font-bold">Recent sales</h2><p className="mt-0.5 text-xs text-muted-foreground">Latest transactions from your store</p></div><Link to="/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-accent-ink">View reports <ArrowRight className="size-3.5" /></Link></div>
            {salesQuery.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : sales.length === 0 ? <EmptyState title="No sales yet" text="Your completed sales will appear here." /> : <ul className="divide-y divide-border">{sales.slice(0,6).map((sale) => <li key={sale.id} className="flex items-center justify-between gap-4 px-5 py-4"><div className="min-w-0"><p className="numeric truncate text-sm font-bold">{sale.reference}</p><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(sale.created_at)} · {sale.payment_method}</p></div><span className="numeric shrink-0 text-sm font-bold">{formatMoney(Number(sale.total), currency)}</span></li>)}</ul>}
          </div>
          <div className="space-y-4">
            <div className="overflow-hidden rounded-[26px] border border-border bg-surface shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4"><div><h2 className="font-display text-lg font-bold">Stock alerts</h2><p className="mt-0.5 text-xs text-muted-foreground">Products that need attention</p></div><Link to="/products" className="text-xs font-semibold text-accent-ink">View stock</Link></div>
              {lowStockQuery.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></div> : lowStockCount === 0 ? <EmptyState title="All clear" text="No products are below their stock threshold." /> : <ul className="divide-y divide-border">{lowStockQuery.data?.slice(0,5).map((row) => <li key={row.products!.id} className="flex items-center justify-between gap-3 px-5 py-3.5"><span className="truncate text-sm font-semibold">{row.products!.name}</span><span className="numeric rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-accent-ink">{row.quantity} left</span></li>)}</ul>}
            </div>
            <div className="rounded-[26px] border border-border bg-surface p-5 shadow-sm">
              <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary"><Globe2 className="size-5" /></span><div className="min-w-0"><h2 className="font-display font-bold">Online store</h2><p className="text-xs text-muted-foreground">{online?.setup_completed ? (online.is_published ? "Your storefront is published" : "Your storefront is ready") : "Not set up yet"}</p></div></div>
              <p className="mt-3 text-sm text-muted-foreground">{online?.setup_completed ? (pendingOrders ? pendingOrders + " order(s) need attention." : "Your online channel is ready for customers.") : "Publish your catalogue and start receiving orders online."}</p>
              <Link to={online?.setup_completed ? "/online-store/orders" : "/online-store/setup"} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-semibold text-background dark:bg-[#c6f432] dark:text-[#0e1116]">{online?.setup_completed ? "Review orders" : "Set up online store"}<ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>
        <section className="rounded-[26px] border border-border bg-surface p-5 shadow-sm">
          <div><h2 className="font-display text-lg font-bold">Quick access</h2><p className="mt-0.5 text-xs text-muted-foreground">The tools you use most</p></div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Link to="/pos" className="flex min-h-16 items-center gap-3 rounded-2xl bg-secondary/70 p-3 text-sm font-semibold transition hover:bg-accent-soft"><ScanLine className="size-5 shrink-0" />New sale</Link>
            <Link to="/products" className="flex min-h-16 items-center gap-3 rounded-2xl bg-secondary/70 p-3 text-sm font-semibold transition hover:bg-accent-soft"><Package className="size-5 shrink-0" />Products</Link>
            <Link to="/customers" className="flex min-h-16 items-center gap-3 rounded-2xl bg-secondary/70 p-3 text-sm font-semibold transition hover:bg-accent-soft"><TrendingUp className="size-5 shrink-0" />Customers</Link>
            <Link to="/reports" className="flex min-h-16 items-center gap-3 rounded-2xl bg-secondary/70 p-3 text-sm font-semibold transition hover:bg-accent-soft"><ArrowRight className="size-5 shrink-0" />Reports</Link>
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
