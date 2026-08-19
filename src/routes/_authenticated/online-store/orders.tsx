import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCircle2, Clock3, ExternalLink, PackageCheck, Search, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/currency";
import type { OnlineOrderItemRow, OnlineOrderRow } from "@/integrations/supabase/online-types";

export const Route = createFileRoute("/_authenticated/online-store/orders")({ ssr: false, component: OnlineOrdersPage });
const STATUS = ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"] as const;
type Status = (typeof STATUS)[number];
type OrderWithItems = OnlineOrderRow & { items: OnlineOrderItemRow[] };
type NotificationRow = { id: string; user_id: string; store_id: string; type: string; title: string; body: string; data: Record<string, unknown>; read_at: string | null; created_at: string };

function OnlineOrdersPage() {
  const { store, role } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id;
  const canManage = role === "owner" || role === "manager";
  const [filter, setFilter] = useState<"all" | Status>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const ordersQuery = useQuery({
    queryKey: ["online-orders", storeId], enabled: Boolean(storeId),
    queryFn: async (): Promise<OrderWithItems[]> => {
      const [{ data: orders, error: oe }, { data: items, error: ie }] = await Promise.all([
        onlineSupabase.from("online_orders").select("*").eq("store_id", storeId!).order("created_at", { ascending: false }),
        onlineSupabase.from("online_order_items").select("*").eq("store_id", storeId!),
      ]);
      if (oe) throw new Error(oe.message); if (ie) throw new Error(ie.message);
      const map = new Map<string, OnlineOrderItemRow[]>();
      for (const item of items ?? []) map.set(item.order_id, [...(map.get(item.order_id) ?? []), item]);
      return (orders ?? []).map((order) => ({ ...order, items: map.get(order.id) ?? [] }));
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", storeId], enabled: Boolean(storeId),
    queryFn: async (): Promise<NotificationRow[]> => {
      const client = onlineSupabase as any;
      const { data, error } = await client.from("notifications").select("*").eq("store_id", storeId!).order("created_at", { ascending: false }).limit(40);
      if (error) throw new Error(error.message); return data ?? [];
    },
  });

  const storefrontQuery = useQuery({
    queryKey: ["online-order-storefront", storeId], enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await onlineSupabase.from("online_stores").select("slug").eq("store_id", storeId!).maybeSingle();
      if (error) throw new Error(error.message); return data;
    },
  });

  useEffect(() => {
    if (!storeId) return;
    const channel = onlineSupabase.channel(`kudi-order-center-${storeId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "online_orders", filter: `store_id=eq.${storeId}` }, (payload) => {
        const order = payload.new as OnlineOrderRow;
        if (payload.eventType === "INSERT") toast.success(`New order ${order.order_number}`, { description: `${order.customer_name} · ${formatMoney(Number(order.total), store?.currency ?? "NGN")}` });
        else toast.info(`Order ${order.order_number} updated`, { description: `Status: ${String(order.status).replaceAll("_", " ")}` });
        void queryClient.invalidateQueries({ queryKey: ["online-orders", storeId] });
        void queryClient.invalidateQueries({ queryKey: ["notifications", storeId] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `store_id=eq.${storeId}` }, (payload) => {
        const n = payload.new as NotificationRow;
        toast.info(n.title, { description: n.body });
        void queryClient.invalidateQueries({ queryKey: ["notifications", storeId] });
      }).subscribe();
    return () => { void onlineSupabase.removeChannel(channel); };
  }, [queryClient, storeId, store?.currency]);

  const orders = ordersQuery.data ?? [];
  const filtered = useMemo(() => orders.filter((o) => (filter === "all" || o.status === filter) && (!search || `${o.order_number} ${o.customer_name} ${o.customer_phone}`.toLowerCase().includes(search.toLowerCase()))), [orders, filter, search]);
  const stats = useMemo(() => ({ all: orders.length, pending: orders.filter(o => o.status === "pending").length, processing: orders.filter(o => ["confirmed", "processing"].includes(o.status)).length, shipped: orders.filter(o => o.status === "shipped").length, completed: orders.filter(o => o.status === "completed").length }), [orders]);
  const unread = (notificationsQuery.data ?? []).filter(n => !n.read_at).length;
  const activeOrder = orders.find(o => o.id === selected) ?? null;

  async function changeStatus(order: OnlineOrderRow, status: Status) {
    if (!canManage || order.status === status) return;
    const { error } = await onlineSupabase.from("online_orders").update({ status }).eq("id", order.id).eq("store_id", storeId!);
    if (error) { toast.error(error.message); return; }
    toast.success(`Order ${order.order_number} is now ${status.replaceAll("_", " ")}.`);
    await queryClient.invalidateQueries({ queryKey: ["online-orders", storeId] });
    await queryClient.invalidateQueries({ queryKey: ["notifications", storeId] });
  }

  async function markAllRead() {
    const client = onlineSupabase as any;
    const { error } = await client.from("notifications").update({ read_at: new Date().toISOString() }).eq("store_id", storeId!).is("read_at", null);
    if (error) toast.error(error.message); else { toast.success("Notifications marked as read"); await queryClient.invalidateQueries({ queryKey: ["notifications", storeId] }); }
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) return toast.error("Browser notifications are not supported here.");
    const permission = await Notification.requestPermission();
    if (permission === "granted") toast.success("Browser order alerts are enabled.");
  }

  return <AppShell title="Orders">
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-label-caps text-muted-foreground">Online store</p><h1 className="font-display text-2xl font-bold tracking-tight">Order center</h1><p className="mt-1 text-sm text-muted-foreground">Track, process and complete every customer order from one place.</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void enableBrowserNotifications()}><Bell className="mr-2 size-4" />Alerts</Button>
          <Button variant={notificationsOpen ? "default" : "outline"} onClick={() => setNotificationsOpen(v => !v)}><Bell className="mr-2 size-4" />Notifications {unread > 0 && <span className="ml-1 rounded-full bg-accent px-1.5 text-[10px]">{unread}</span>}</Button>
        </div>
      </header>

      {notificationsOpen && <section className="surface-card p-4">
        <div className="flex items-center justify-between gap-3"><div><h2 className="font-display font-semibold">Notification center</h2><p className="text-xs text-muted-foreground">Order activity is delivered here in real time.</p></div><Button size="sm" variant="ghost" onClick={() => void markAllRead()}><Check className="mr-1 size-4" />Mark all read</Button></div>
        <div className="mt-3 max-h-72 overflow-auto divide-y divide-border">{(notificationsQuery.data ?? []).length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p> : (notificationsQuery.data ?? []).map(n => <button key={n.id} onClick={() => { const id = String(n.data?.order_id ?? ""); if (id) setSelected(id); }} className={`block w-full px-2 py-3 text-left hover:bg-secondary ${!n.read_at ? "bg-accent-soft" : ""}`}><div className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-accent" style={{ opacity: n.read_at ? .2 : 1 }} /><div className="min-w-0"><p className="text-sm font-semibold">{n.title}</p><p className="text-xs text-muted-foreground">{n.body}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p></div></div></button>)}</div>
      </section>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{([['all','All orders',stats.all],['pending','Pending',stats.pending],['processing','Processing',stats.processing],['shipped','Shipped',stats.shipped],['completed','Completed',stats.completed]] as const).map(([key,label,count]) => <button key={key} onClick={() => setFilter(key as any)} className={`surface-card p-4 text-left transition hover:-translate-y-0.5 ${filter === key ? "ring-2 ring-accent" : ""}`}><p className="text-label-caps text-muted-foreground">{label}</p><p className="numeric mt-1 text-2xl font-bold">{count}</p></button>)}</div>

      <div className="flex flex-wrap gap-3"><div className="relative min-w-[240px] flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order number, customer or phone…" className="pl-9" /></div><select value={filter} onChange={e => setFilter(e.target.value as any)} className="h-10 rounded-md border border-border bg-surface px-3 text-sm capitalize"><option value="all">All statuses</option>{STATUS.map(s => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}</select></div>

      <section className="surface-card overflow-hidden">
        {ordersQuery.isLoading ? <p className="p-8 text-sm text-muted-foreground">Loading orders…</p> : ordersQuery.error ? <div className="p-8"><p className="font-semibold">Could not load orders.</p><p className="mt-1 text-sm text-muted-foreground">{ordersQuery.error.message}</p></div> : filtered.length === 0 ? <div className="p-12 text-center"><PackageCheck className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-4 font-display text-lg font-semibold">No matching orders</h2><p className="mt-1 text-sm text-muted-foreground">Try another status or search term.</p></div> : <div className="divide-y divide-border">{filtered.map(order => <article key={order.id} className="p-5 hover:bg-secondary/30">
          <div className="flex flex-wrap items-start justify-between gap-4"><button className="text-left" onClick={() => setSelected(order.id)}><div className="flex items-center gap-2"><span className="numeric font-bold">{order.order_number}</span><StatusBadge status={order.status} /></div><p className="mt-1 text-sm text-muted-foreground">{order.customer_name} · {order.customer_phone}</p></button><div className="text-right"><p className="numeric text-lg font-bold">{formatMoney(Number(order.total), store?.currency ?? "NGN")}</p><p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p></div></div>
          <div className="mt-4 flex flex-wrap gap-2">{order.items.slice(0,3).map(item => <span key={item.id} className="rounded-full bg-secondary px-3 py-1 text-xs">{item.product_name} × {item.quantity}</span>)}{order.items.length > 3 && <span className="rounded-full bg-secondary px-3 py-1 text-xs">+{order.items.length - 3} more</span>}</div>
          <div className="mt-4 flex flex-wrap items-center gap-2">{order.status === "pending" && <Button size="sm" onClick={() => void changeStatus(order,"confirmed")} disabled={!canManage}><CheckCircle2 className="mr-1 size-4" />Confirm</Button>}{["confirmed","processing"].includes(order.status) && <Button size="sm" onClick={() => void changeStatus(order,"shipped")} disabled={!canManage}><Truck className="mr-1 size-4" />Mark shipped</Button>}{order.status === "shipped" && <Button size="sm" onClick={() => void changeStatus(order,"completed")} disabled={!canManage}><PackageCheck className="mr-1 size-4" />Complete</Button>}{!['completed','cancelled'].includes(order.status) && <Button size="sm" variant="outline" onClick={() => void changeStatus(order,"cancelled")} disabled={!canManage}><XCircle className="mr-1 size-4" />Cancel</Button>}<Button size="sm" variant="ghost" onClick={() => setSelected(order.id)}>View details</Button>{storefrontQuery.data?.slug && <a className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent-ink" href={`/store/${storefrontQuery.data.slug}`} target="_blank" rel="noreferrer">Storefront <ExternalLink className="size-3" /></a>}</div>
        </article>)}</div>}
      </section>
    </div>

    {activeOrder && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6" onClick={() => setSelected(null)}><div className="max-h-[90vh] w-full max-w-2xl overflow-auto bg-surface p-6 shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-label-caps text-muted-foreground">Order details</p><h2 className="mt-1 font-display text-xl font-bold">{activeOrder.order_number}</h2><p className="mt-1 text-sm text-muted-foreground">{activeOrder.customer_name} · {activeOrder.customer_phone}</p></div><Button variant="ghost" onClick={() => setSelected(null)}>Close</Button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="bg-secondary p-4"><p className="text-label-caps text-muted-foreground">Delivery address</p><p className="mt-1 text-sm leading-6">{activeOrder.shipping_address}</p></div><div className="bg-secondary p-4"><p className="text-label-caps text-muted-foreground">Payment</p><p className="mt-1 text-sm">{activeOrder.payment_method === "bank_transfer" ? "Bank transfer" : "Pay on delivery"}</p>{activeOrder.customer_note && <p className="mt-2 text-xs text-muted-foreground">Note: {activeOrder.customer_note}</p>}</div></div><div className="mt-5 divide-y divide-border border border-border">{activeOrder.items.map(item => <div key={item.id} className="flex justify-between gap-4 p-4 text-sm"><div><p className="font-medium">{item.product_name}</p><p className="text-xs text-muted-foreground">{item.quantity} × {formatMoney(Number(item.unit_price), store?.currency ?? "NGN")}</p></div><p className="numeric font-semibold">{formatMoney(Number(item.line_total), store?.currency ?? "NGN")}</p></div>)}</div><div className="mt-5 flex flex-wrap gap-2">{STATUS.map(s => <button key={s} disabled={!canManage} onClick={() => void changeStatus(activeOrder,s)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${activeOrder.status === s ? "border-transparent bg-accent" : "border-border text-muted-foreground"}`}>{s}</button>)}</div></div></div>}
  </AppShell>;
}

function StatusBadge({ status }: { status: string }) { const Icon = status === "pending" ? Clock3 : status === "shipped" ? Truck : status === "completed" ? CheckCircle2 : status === "cancelled" ? XCircle : PackageCheck; return <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[10px] font-bold capitalize"><Icon className="size-3" />{status.replaceAll("_", " ")}</span>; }
