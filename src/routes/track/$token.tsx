import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Clock3, Package, Truck, XCircle } from "lucide-react";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { formatMoney } from "@/lib/currency";

export const Route = createFileRoute("/track/$token")({ ssr: false, component: OrderTrackingPage });

type Tracking = { found: boolean; order?: { order_number: string; status: string; subtotal: number; shipping_fee: number; total: number; created_at: string; updated_at: string; customer_name: string; shipping_address: string | null }; items?: Array<{ product_name: string; quantity: number; unit_price: number; line_total: number }> };

const steps = [
  { key: "pending", label: "Order placed", icon: Clock3 },
  { key: "confirmed", label: "Order confirmed", icon: CheckCircle2 },
  { key: "preparing", label: "Preparing your order", icon: Package },
  { key: "ready", label: "Ready for delivery / pickup", icon: Package },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function normalizeStatus(status: string) {
  const value = status.toLowerCase().replace(/[- ]/g, "_");
  if (["cancelled", "canceled", "refunded"].includes(value)) return value;
  if (value === "new" || value === "placed") return "pending";
  return value;
}

function OrderTrackingPage() {
  const { token } = Route.useParams();
  const query = useQuery({
    queryKey: ["public-order-tracking", token],
    queryFn: async () => {
      const { data, error } = await onlineSupabase.rpc("get_order_tracking", { p_token: token });
      if (error) throw new Error(error.message);
      return data as Tracking;
    },
    retry: 2,
  });

  if (query.isLoading) return <main className="flex min-h-screen items-center justify-center bg-background"><div className="text-sm text-muted-foreground">Loading your order…</div></main>;
  if (query.error || !query.data?.found || !query.data.order) return <main className="flex min-h-screen items-center justify-center bg-background px-5 text-center"><div className="storefront-card max-w-md p-9"><XCircle className="mx-auto size-10 text-destructive" /><h1 className="text-display-md mt-5">Tracking link not found</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">This tracking link may be invalid or no longer available. Please contact the store if you need help.</p></div></main>;

  const { order, items = [] } = query.data;
  const status = normalizeStatus(order.status);
  const cancelled = status === "cancelled" || status === "canceled" || status === "refunded";
  const currentIndex = Math.max(0, steps.findIndex((step) => step.key === status));

  return <main className="min-h-screen bg-background px-5 py-8 sm:py-12"><div className="mx-auto max-w-2xl"><div className="mb-8"><p className="text-label-caps text-muted-foreground">Kudi order tracking</p><h1 className="text-display-lg mt-2">Order #{order.order_number}</h1><p className="mt-2 text-sm text-muted-foreground">Keep this page or save this link to check your order anytime.</p></div>
    <section className="storefront-card p-6 sm:p-8"><div className="flex items-center gap-4"><div className="flex size-12 items-center justify-center rounded-2xl bg-accent"><Package className="size-6" /></div><div><p className="text-sm text-muted-foreground">Current status</p><p className="font-display text-xl font-bold capitalize">{status.replaceAll("_", " ")}</p></div></div>
      {cancelled ? <div className="mt-7 rounded-2xl border border-destructive/20 bg-destructive/5 p-5"><div className="flex gap-3"><XCircle className="mt-0.5 size-5 text-destructive" /><div><p className="font-semibold">This order is {status}.</p><p className="mt-1 text-sm text-muted-foreground">Please contact the store if you need more information.</p></div></div></div> : <div className="mt-8 space-y-0">{steps.map((step, index) => { const done = index <= currentIndex; const Icon = step.icon; return <div key={step.key} className="flex gap-4"><div className="flex flex-col items-center"><div className={`flex size-9 shrink-0 items-center justify-center rounded-full ${done ? "bg-accent text-foreground" : "border border-border bg-surface text-muted-foreground"}`}><Icon className="size-4" /></div>{index < steps.length - 1 && <div className={`my-1 min-h-8 w-px ${index < currentIndex ? "bg-accent" : "bg-border"}`} />}</div><div className="pt-1"><p className={`text-sm font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>{index === currentIndex && <p className="mt-1 text-xs text-muted-foreground">Your order is currently here.</p>}</div></div>; })}</div>}
    </section>
    <section className="storefront-card mt-5 p-6 sm:p-8"><h2 className="font-display text-lg font-semibold">Order details</h2><div className="mt-5 divide-y divide-border">{items.map((item) => <div key={`${item.product_name}-${item.quantity}`} className="flex justify-between gap-4 py-3 text-sm"><span>{item.product_name} × {item.quantity}</span><span className="numeric font-semibold">{formatMoney(item.line_total, "NGN")}</span></div>)}</div><div className="mt-4 space-y-2 border-t border-border pt-4 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatMoney(order.subtotal, "NGN")}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{formatMoney(order.shipping_fee, "NGN")}</span></div><div className="flex justify-between pt-2 text-base font-bold"><span>Total</span><span>{formatMoney(order.total, "NGN")}</span></div></div></section>
    <section className="mt-5 rounded-2xl border border-border bg-surface p-5 text-sm"><p className="font-semibold">Delivery address</p><p className="mt-2 leading-6 text-muted-foreground">{order.shipping_address || "Store pickup"}</p></section>
    <p className="mt-8 text-center text-xs text-muted-foreground">Powered by Kudi</p></div></main>;
}
