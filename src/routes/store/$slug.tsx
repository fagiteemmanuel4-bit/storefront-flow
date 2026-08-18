import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Mail, MapPin, Minus, Phone, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/store/$slug")({ ssr: false, component: PublicStorefrontPage });

type CartItem = { productId: string; name: string; price: number; imageUrl: string; quantity: number };

function PublicStorefrontPage() {
  const { slug } = Route.useParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "", note: "", payment: "pay_on_delivery" });

  const catalogQuery = useQuery({
    queryKey: ["public-storefront", slug],
    queryFn: async () => {
      const { data, error } = await onlineSupabase.from("online_catalog").select("*").eq("slug", slug).order("featured", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const catalog = catalogQuery.data ?? [];
  const first = catalog[0];
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const currency = first?.currency ?? "NGN";

  function add(product: typeof first) {
    if (!product) return;
    setCart((items) => { const existing = items.find((item) => item.productId === product.product_id); return existing ? items.map((item) => item.productId === product.product_id ? { ...item, quantity: item.quantity + 1 } : item) : [...items, { productId: product.product_id, name: product.name, price: Number(product.price), imageUrl: product.image_url, quantity: 1 }]; });
    toast.success(`${product.name} added to cart`);
  }
  function change(productId: string, delta: number) { setCart((items) => items.flatMap((item) => item.productId !== productId ? [item] : item.quantity + delta <= 0 ? [] : [{ ...item, quantity: item.quantity + delta }])); }

  async function placeOrder() {
    if (!customer.name || !customer.phone || !customer.address || cart.length === 0) { toast.error("Please complete your name, phone, address and cart."); return; }
    setSubmitting(true);
    const result = await onlineSupabase.rpc("create_online_order", { _slug: slug, _customer_name: customer.name, _customer_email: customer.email, _customer_phone: customer.phone, _shipping_address: customer.address, _customer_note: customer.note, _payment_method: customer.payment, _items: cart.map((item) => ({ product_id: item.productId, quantity: item.quantity })) });
    setSubmitting(false);
    if (result.error) { toast.error(result.error.message); return; }
    setSuccess(String(result.data)); setCart([]); setCheckoutOpen(false);
  }

  if (catalogQuery.isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><p className="text-sm text-muted-foreground">Opening storefront…</p></div>;
  if (catalogQuery.error || catalog.length === 0) return <div className="flex min-h-screen items-center justify-center bg-background px-5 text-center"><div><div className="mx-auto flex size-16 items-center justify-center bg-accent"><ShoppingBag /></div><h1 className="text-display-md mt-6">This storefront isn't available.</h1><p className="mt-3 text-muted-foreground">The shop may still be setting up or the link may no longer be active.</p></div></div>;

  const store = first!;
  return <main className="min-h-screen bg-background">
    <header className="border-b border-border bg-surface"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5"><div className="flex min-w-0 items-center gap-3">{store.logo_url ? <img src={store.logo_url} alt="" className="size-11 rounded-xl object-cover" /> : <span className="flex size-11 items-center justify-center rounded-xl bg-accent"><span className="size-4 rotate-45 rounded-[4px] bg-foreground" /></span>}<div className="min-w-0"><h1 className="truncate font-display text-xl font-bold">{store.display_name}</h1><p className="truncate text-xs text-muted-foreground">{store.store_description || "Shop online with Kudi"}</p></div></div><button type="button" onClick={() => setCheckoutOpen(true)} className="touch-target relative flex items-center gap-2 border border-border bg-surface px-4 py-2.5 text-sm font-semibold hover:bg-secondary"><ShoppingBag className="size-4" /> Cart{cart.length > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px]">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}</button></div></header>
    <section className="mx-auto max-w-6xl px-5 pb-14 pt-12"><div className="max-w-3xl"><p className="text-label-caps text-accent-ink">Official online store</p><h2 className="text-display-lg mt-3">{store.display_name}.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">{store.store_description || "Browse our latest products and place an order directly with the store."}</p><div className="mt-5 flex flex-wrap gap-4 text-sm text-muted-foreground">{store.display_phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-4" />{store.display_phone}</span>}{store.display_email && <span className="inline-flex items-center gap-1.5"><Mail className="size-4" />{store.display_email}</span>}</div></div></section>
    <section className="mx-auto max-w-6xl px-5 pb-24"><div className="mb-5 flex items-end justify-between gap-4"><div><p className="text-label-caps text-muted-foreground">Catalog</p><h3 className="text-display-md mt-2">Shop products</h3></div><span className="text-sm text-muted-foreground">{catalog.length} available</span></div><div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{catalog.map((product) => <article key={product.product_id} className="group overflow-hidden border border-border bg-surface shadow-lift"><div className="aspect-square overflow-hidden bg-secondary">{product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="size-10 text-muted-foreground" /></div>}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{product.category || "Product"}</p><h4 className="mt-1 font-display text-lg font-semibold">{product.name}</h4></div>{product.featured && <span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-ink">Featured</span>}</div><p className="mt-3 min-h-10 text-sm text-muted-foreground">{product.description || "Available now from this store."}</p><div className="mt-5 flex items-center justify-between gap-3"><span className="numeric text-lg font-bold">{formatMoney(Number(product.price), currency)}</span><Button onClick={() => add(product)}>Add to cart</Button></div></div></article>)}</div></section>
    <footer className="border-t border-border bg-surface px-5 py-8"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row"><span>Powered by Kudi</span><span>{store.shipping_note || "Delivery arrangements are confirmed by the store after checkout."}</span></div></footer>

    {success && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-5 backdrop-blur-sm"><div className="w-full max-w-md border border-border bg-surface p-7 text-center shadow-float"><div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent"><Check className="size-7" /></div><p className="text-label-caps mt-6 text-accent-ink">Order received</p><h2 className="text-display-md mt-2">Thank you.</h2><p className="mt-3 text-sm text-muted-foreground">Your order number is <strong className="text-foreground">{success}</strong>. The store will review it and contact you using the details you provided.</p><Button className="mt-6 w-full" onClick={() => setSuccess("")}>Continue shopping</Button></div></div>}

    {checkoutOpen && <div className="fixed inset-0 z-50 bg-foreground/35 p-4 backdrop-blur-sm"><div className="ml-auto flex h-full w-full max-w-xl flex-col border border-border bg-surface shadow-float"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="text-label-caps text-muted-foreground">Checkout</p><h2 className="font-display text-xl font-semibold">Your order</h2></div><button type="button" onClick={() => setCheckoutOpen(false)} className="size-10 border border-border">×</button></div><div className="flex-1 overflow-y-auto p-5"><div className="space-y-3">{cart.map((item) => <div key={item.productId} className="flex items-center gap-3 border-b border-border pb-3"><div className="size-12 overflow-hidden bg-secondary">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="numeric text-xs text-muted-foreground">{formatMoney(item.price,currency)}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => change(item.productId,-1)} className="size-8 border border-border"><Minus className="mx-auto size-3" /></button><span className="w-5 text-center text-sm">{item.quantity}</span><button type="button" onClick={() => change(item.productId,1)} className="size-8 border border-border"><Plus className="mx-auto size-3" /></button><button type="button" onClick={() => change(item.productId,-item.quantity)} className="ml-1 text-destructive"><Trash2 className="size-4" /></button></div></div>)}</div>{cart.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Your cart is empty.</p>}<div className="mt-6 space-y-3"><input value={customer.name} onChange={(e)=>setCustomer({...customer,name:e.target.value})} className="field" placeholder="Full name" /><input value={customer.phone} onChange={(e)=>setCustomer({...customer,phone:e.target.value})} className="field" placeholder="Phone number" /><input value={customer.email} onChange={(e)=>setCustomer({...customer,email:e.target.value})} className="field" placeholder="Email (optional)" type="email" /><textarea value={customer.address} onChange={(e)=>setCustomer({...customer,address:e.target.value})} className="field min-h-24 resize-none" placeholder="Delivery address" /><textarea value={customer.note} onChange={(e)=>setCustomer({...customer,note:e.target.value})} className="field min-h-20 resize-none" placeholder="Order note (optional)" /><select value={customer.payment} onChange={(e)=>setCustomer({...customer,payment:e.target.value})} className="field"><option value="pay_on_delivery">Pay on delivery</option><option value="bank_transfer">Bank transfer</option></select></div></div><div className="border-t border-border p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total</span><span className="numeric text-xl font-bold">{formatMoney(total,currency)}</span></div><Button disabled={submitting || cart.length===0} onClick={() => void placeOrder()} className="mt-4 w-full">{submitting ? "Placing order…" : <>Place order <ArrowRight className="ml-2 size-4" /></>}</Button></div></div></div>}
  </main>;
}
