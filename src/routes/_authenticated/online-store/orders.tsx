import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCircle2, Clock3, ExternalLink, PackageCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/currency";
import type { OnlineOrderItemRow, OnlineOrderRow } from "@/integrations/supabase/online-types";

export const Route = createFileRoute("/_authenticated/online-store/orders")({ ssr: false, component: OnlineOrdersPage });
const STATUS = ["pending", "confirmed", "processing", "shipped", "completed", "cancelled"] as const;

type OrderWithItems = OnlineOrderRow & { items: OnlineOrderItemRow[] };

function OnlineOrdersPage() {
  const { store, role } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id;
  const canManage = role === "owner" || role === "manager";

  const ordersQuery = useQuery({
    queryKey: ["online-orders", storeId],
    enabled: Boolean(storeId),
    queryFn: async (): Promise<OrderWithItems[]> => {
      const [{ data: orders, error: ordersError }, { data: items, error: itemsError }] = await Promise.all([
        onlineSupabase.from("online_orders").select("*").eq("store_id", storeId!).order("created_at", { ascending: false }),
        onlineSupabase.from("online_order_items").select("*").eq("store_id", storeId!),
      ]);
      if (ordersError) throw new Error(ordersError.message);
      if (itemsError) throw new Error(itemsError.message);
      const itemMap = new Map<string, OnlineOrderItemRow[]>();
      for (const item of items ?? []) {
        const current = itemMap.get(item.order_id) ?? [];
        current.push(item);
        itemMap.set(item.order_id, current);
      }
      return (orders ?? []).map((order) => ({ ...order, items: itemMap.get(order.id) ?? [] }));
    },
  });

  const storefrontQuery = useQuery({
    queryKey: ["online-order-storefront", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await onlineSupabase.from("online_stores").select("slug").eq("store_id", storeId!).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });

  useEffect(() => {
    if (!storeId) return;
    const channel = onlineSupabase
      .channel(`kudi-online-orders-${storeId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "online_orders", filter: `store_id=eq.${storeId}` },
        (payload) => {
          const order = payload.new as OnlineOrderRow;
          toast.success(`New online order ${order.order_number}`, {
            description: `${order.customer_name} · ${formatMoney(Number(order.total), store?.currency ?? "NGN")}`,
          });
          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            new Notification("New Kudi order", { body: `${order.order_number} from ${order.customer_name}` });
          }
          void queryClient.invalidateQueries({ queryKey: ["online-orders", storeId] });
          void queryClient.invalidateQueries({ queryKey: ["online-orders-pending", storeId] });
          void queryClient.invalidateQueries({ queryKey: ["online-store-menu", storeId] });
        },
      )
      .subscribe();
    return () => {
      void onlineSupabase.removeChannel(channel);
    };
  }, [queryClient, storeId, store?.currency]);

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      toast.error("Browser notifications are not supported here.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") toast.success("Order notifications enabled on this browser.");
  }

  async function changeStatus(order: OnlineOrderRow, status: string) {
    if (!canManage) return;
    const { error } = await onlineSupabase.from("online_orders").update({ status }).eq("id", order.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["online-orders", storeId] });
    await queryClient.invalidateQueries({ queryKey: ["online-orders-pending", storeId] });
    toast.success(`Order ${order.order_number} marked ${status}.`);
  }

  const orders = ordersQuery.data ?? [];
  const pending = orders.filter((o) => o.status === "pending").length;

  return (
    <AppShell title="Online orders">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border bg-accent-soft p-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center bg-accent"><Bell className="size-5" /></span>
          <div>
            <p className="font-display font-semibold">{pending ? `${pending} order${pending === 1 ? "" : "s"} need${pending === 1 ? "s" : ""} attention` : "Your order inbox is clear"}</p>
            <p className="mt-1 text-sm text-muted-foreground">New orders appear here instantly while Kudi is open.</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => void enableBrowserNotifications()}>Enable notifications</Button>
      </div>

      <div className="surface-card mt-5 overflow-hidden">
        {ordersQuery.isLoading ? <p className="p-6 text-sm text-muted-foreground">Loading orders…</p> : ordersQuery.error ? <p className="p-6 text-sm text-destructive">Could not load online orders.</p> : orders.length === 0 ? (
          <div className="p-10 text-center"><PackageCheck className="mx-auto size-9 text-muted-foreground" /><h2 className="mt-4 font-display text-lg font-semibold">No online orders yet</h2><p className="mt-1 text-sm text-muted-foreground">Publish a product and share your storefront link to start receiving orders.</p></div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <article key={order.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2"><span className="numeric font-bold">{order.order_number}</span><StatusIcon status={order.status} /></div>
                    <p className="mt-1 text-sm text-muted-foreground">{order.customer_name} · {order.customer_phone}</p>
                  </div>
                  <p className="numeric text-lg font-bold">{formatMoney(Number(order.total), store?.currency ?? "NGN")}</p>
                </div>

                <div className="mt-4 border border-border bg-surface">
                  <div className="border-b border-border px-4 py-3 text-label-caps text-muted-foreground">Items ordered</div>
                  <div className="divide-y divide-border">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                        <div className="min-w-0"><p className="truncate font-medium">{item.product_name}</p><p className="text-xs text-muted-foreground">Qty {item.quantity} × {formatMoney(Number(item.unit_price), store?.currency ?? "NGN")}</p></div>
                        <span className="numeric shrink-0 font-semibold">{formatMoney(Number(item.line_total), store?.currency ?? "NGN")}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div className="bg-secondary/60 p-3"><p className="text-label-caps text-muted-foreground">Delivery</p><p className="mt-1 leading-6">{order.shipping_address}</p></div>
                  <div className="bg-secondary/60 p-3"><p className="text-label-caps text-muted-foreground">Payment</p><p className="mt-1">{order.payment_method === "bank_transfer" ? "Bank transfer" : "Pay on delivery"}</p>{order.customer_note && <p className="mt-2 text-xs text-muted-foreground">Note: {order.customer_note}</p>}</div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {STATUS.map((status) => <button key={status} type="button" disabled={!canManage} onClick={() => void changeStatus(order, status)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${order.status === status ? "border-transparent bg-accent text-foreground" : "border-border bg-surface text-muted-foreground hover:text-foreground"}`}>{status}</button>)}
                  {storefrontQuery.data?.slug && <a href={`/store/${storefrontQuery.data.slug}`} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-accent-ink">Storefront <ExternalLink className="size-3" /></a>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatusIcon({ status }: { status: string }) {
  const Icon = status === "pending" ? Clock3 : status === "shipped" ? Truck : status === "completed" ? CheckCircle2 : PackageCheck;
  return <Icon className="size-4 text-accent-ink" aria-hidden />;
}
