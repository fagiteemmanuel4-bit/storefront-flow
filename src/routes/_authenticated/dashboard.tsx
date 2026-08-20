import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ArrowRight, Bell, Globe2, Package, Receipt, ScanLine, TrendingUp, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Kudi" }, { name: "description", content: "Your Kudi command centre for sales, stock, customers and your online store." }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { store, branch } = useStoreContext();
  const storeId = store?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const salesQuery = useQuery({ queryKey: ["sales", storeId], enabled: Boolean(storeId), queryFn: async () => { const { data, error } = await supabase.from("sales").select("id, reference, total, payment_method, created_at, branch_id").eq("store_id", storeId as string).order("created_at", { ascending: false }).limit(25); if (error) throw new Error(error.message); return data ?? []; } });
  const lowStockQuery = useQuery({ queryKey: ["low-stock", storeId, branch?.id], enabled: Boolean(storeId && branch?.id), queryFn: async () => { const { data, error } = await supabase.from("branch_stock").select("quantity, products!inner(id, name, low_stock_threshold)").eq("store_id", storeId as string).eq("branch_id", branch!.id); if (error) throw new Error(error.message); return (data ?? []).filter((row) => row.products && row.quantity <= row.products.low_stock_threshold).sort((a, b) => a.quantity - b.quantity); } });
  const onlineStoreQuery = useQuery({ queryKey: ["dashboard-online-store", storeId], enabled: Boolean(storeId), queryFn: async () => { const { data, error } = await onlineSupabase.from("online_stores").select("slug,display_name,is_published,setup_completed").eq("store_id", storeId as string).maybeSingle(); if (error) throw new Error(error.message); return data; } });
  const onlineOrdersQuery = useQuery({ queryKey: ["dashboard-online-orders", storeId], enabled: Boolean(storeId && onlineStoreQuery.data?.setup_completed), queryFn: async () => { const { data, error } = await onlineSupabase.from("online_orders").select("id").eq("store_id", storeId as string).eq("status", "pending"); if (error) throw new Error(error.message); return data?.length ?? 0; } });
  const sales = salesQuery.data ?? [];
  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
  const todaySales = sales.filter((s) => new Date(s.created_at) >= startOfToday);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);
  const online = onlineStoreQuery.data;
  const lowStockCount = lowStockQuery.data?.length ?? 0;

  return <AppShell title="Dashboard">
    <div className="space-y-6 pb-8">
      <section className="relative isolate overflow-hidden rounded-[2rem] border border-border bg-foreground px-6 py-7 text-background shadow-float sm:px-8 sm:py-9">
        <div className="pointer-events-none absolute -right-28 -top-28 -z-10 size-80 rounded-full bg-accent/25 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 -z-10 size-48 rounded-full bg-white/5 blur-3xl" />
        <div className="relative flex flex-col gap-7 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-background/55"><span className="flex size-7 items-center justify-center rounded-lg bg-accent text-foreground"><Zap className="size-3.5" /></span>Business command centre</div>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Run today's business from one place.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-background/65">Sales, stock, online orders and customer activity are brought together so you can act before small problems become expensive ones.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/pos" className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-bold text-foreground shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><ScanLine className="size-4" /> Sell now</Link>
            <Link to="/products" className="inline-flex items-center gap-2 rounded-xl border border-background/15 bg-background/10 px-4 py-3 text-sm font-semibold text-background transition hover:bg-background/15"><Package className="size-4" /> Stock</Link>
          </div>
        </div>
        <div className="relative mt-7 grid gap-2 border-t border-background/10 pt-5 text-xs text-background/55 sm:grid-cols-3">
          <div><span className="block text-background/35">Today</span><strong className="mt-1 block text-background">{salesQuery.isLoading ? "Loading…" : `${todaySales.length} sales`}</strong></div>
          <div><span className="block text-background/35">Inventory</span><strong className="mt-1 block text-background">{lowStockQuery.isLoading ? "Checking…" : lowStockCount ? `${lowStockCount} need attention` : "Healthy"}</strong></div>
          <div><span className="block text-background/35">Online</span><strong className="mt-1 block text-background">{online?.setup_completed ? `${onlineOrdersQuery.data ?? 0} pending orders` : "Not connected"}</strong></div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={<TrendingUp className="size-4" />} label="Revenue today" value={salesQuery.isLoading ? null : formatMoney(todayRevenue, currency)} hint={`${todaySales.length} sale${todaySales.length === 1 ? "" : "s"}`} />
        <MetricCard icon={<Receipt className="size-4" />} label="Sales today" value={salesQuery.isLoading ? null : String(todaySales.length)} hint="Completed counter activity" />
        <MetricCard icon={<AlertTriangle className="size-4" />} label="Needs attention" value={lowStockQuery.isLoading ? null : String(lowStockCount)} hint={lowStockCount ? "Products below threshold" : "Stock looks healthy"} tone={lowStockCount ? "warning" : "default"} />
        <MetricCard icon={<Bell className="size-4" />} label="Online orders" value={onlineOrdersQuery.isLoading ? null : String(onlineOrdersQuery.data ?? 0)} hint={online?.setup_completed ? "Waiting for action" : "Online store not active"} tone={(onlineOrdersQuery.data ?? 0) > 0 ? "warning" : "default"} />
      </section>

      {online?.setup_completed ? <section className="overflow-hidden rounded-[1.5rem] border border-accent/20 bg-accent-soft/70 p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-4"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent shadow-sm"><Globe2 className="size-6" /></span><div><div className="flex flex-wrap items-center gap-2"><p className="text-label-caps text-accent-ink">Online store</p><span className="rounded-full bg-success/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-success">Live</span></div><h2 className="mt-1 font-display text-xl font-semibold">{online.display_name}</h2><p className="mt-1 text-sm text-muted-foreground">{onlineOrdersQuery.data ? `${onlineOrdersQuery.data} pending online order${onlineOrdersQuery.data === 1 ? "" : "s"} need your attention.` : "Your storefront is ready for customers."}</p></div></div><div className="flex flex-wrap gap-2"><Link to="/online-store/catalog" className="touch-target inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5">Manage catalogue <ArrowRight className="size-4" /></Link><Link to="/online-store/orders" className="touch-target inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:-translate-y-0.5"><Bell className="size-4" /> Orders</Link></div></div></section> : <section className="rounded-[1.5rem] border border-dashed border-border bg-surface p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-label-caps text-muted-foreground">Sell beyond the counter</p><h2 className="mt-1 font-display text-xl font-semibold">Your online store is one setup away.</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">Publish selected products, receive customer orders and share one clean storefront link.</p></div><button type="button" onClick={() => window.open("/online-store/setup", "_blank", "noopener,noreferrer")} className="touch-target inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5">Set up store <ArrowRight className="size-4" /></button></div></section>}

      <div className="grid gap-6 xl:grid-cols-[1.45fr_.85fr]">
        <section className="surface-card overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-label-caps text-muted-foreground">Live activity</p><h2 className="mt-1 font-display text-lg font-semibold">Recent sales</h2></div><Link to="/reports" className="inline-flex items-center gap-1 text-xs font-semibold text-accent-ink hover:underline">View reports <ArrowRight className="size-3" /></Link></div>{salesQuery.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : sales.length === 0 ? <EmptyState icon={<Receipt className="size-7" />} title="No sales recorded yet." text="Ring one up from the Sell screen and it will appear here." /> : <ul className="divide-y divide-border">{sales.map((sale) => <li key={sale.id} className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-secondary/40"><div className="min-w-0"><p className="numeric text-sm font-bold">{sale.reference}</p><p className="mt-1 truncate text-xs text-muted-foreground">{formatDateTime(sale.created_at)} · {sale.payment_method}</p></div><span className="numeric shrink-0 text-sm font-bold">{formatMoney(Number(sale.total), currency)}</span></li>)}</ul>}</section>
        <section className="surface-card overflow-hidden"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-label-caps text-muted-foreground">Inventory watch</p><h2 className="mt-1 font-display text-lg font-semibold">Low stock {branch ? `· ${branch.name}` : ""}</h2></div><Link to="/products" className="inline-flex items-center gap-1 text-xs font-semibold text-accent-ink hover:underline">Open stock <ArrowRight className="size-3" /></Link></div>{lowStockQuery.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-9 w-full" /><Skeleton className="h-9 w-full" /></div> : lowStockCount === 0 ? <EmptyState icon={<Package className="size-7" />} title="Everything is above threshold." text="Kudi will flag products here when they need attention." /> : <ul className="divide-y divide-border">{lowStockQuery.data?.map((row) => <li key={row.products!.id} className="flex items-center justify-between gap-3 px-5 py-3.5"><span className="truncate text-sm font-medium">{row.products!.name}</span><span className="numeric rounded-full bg-warning-soft px-2.5 py-1 text-xs font-bold text-accent-ink">{row.quantity} left</span></li>)}</ul>}</section>
      </div>

      <section><div className="mb-3 flex items-center justify-between"><div><p className="text-label-caps text-muted-foreground">Shortcuts</p><h2 className="mt-1 font-display text-lg font-semibold">Keep moving</h2></div></div><div className="grid gap-3 sm:grid-cols-3"><QuickAction to="/pos" icon={<ScanLine className="size-5" />} title="Open POS" text="Start a sale quickly." /><QuickAction to="/products" icon={<Package className="size-5" />} title="Manage stock" text="Add, edit or count products." /><QuickAction to="/customers" icon={<Users className="size-5" />} title="Customers" text="See purchase relationships." /></div></section>
    </div>
  </AppShell>;
}

function MetricCard({ icon, label, value, hint, tone = "default" }: { icon: React.ReactNode; label: string; value: string | null; hint: string; tone?: "default" | "warning" }) {
  return <div className={`surface-card group relative overflow-hidden p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-float ${tone === "warning" ? "border-accent/30" : ""}`}><div className="pointer-events-none absolute -right-8 -top-8 size-20 rounded-full bg-accent/5 blur-2xl" /><div className="relative flex items-center justify-between gap-3"><p className="text-label-caps flex items-center gap-1.5 text-muted-foreground">{icon}{label}</p><span className={`size-2 rounded-full ${tone === "warning" ? "bg-accent" : "bg-success"}`} /></div>{value === null ? <Skeleton className="mt-4 h-9 w-28" /> : <p className={`numeric mt-3 text-3xl font-bold tracking-tight ${tone === "warning" ? "text-accent-ink" : ""}`}>{value}</p>}<p className="mt-2 text-xs text-muted-foreground">{hint}</p></div>;
}

function EmptyState({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="p-8 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">{icon}</span><p className="mt-3 text-sm font-semibold">{title}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>; }

function QuickAction({ to, icon, title, text }: { to: "/pos" | "/products" | "/customers"; icon: React.ReactNode; title: string; text: string }) {
  return <Link to={to} className="group rounded-2xl border border-border bg-surface p-5 transition duration-200 hover:-translate-y-1 hover:border-accent/40 hover:shadow-float"><span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-ink transition group-hover:scale-105">{icon}</span><h3 className="mt-4 font-display text-base font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{text}</p><span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-accent-ink">Open <ArrowRight className="size-3.5 transition group-hover:translate-x-1" /></span></Link>;
}
