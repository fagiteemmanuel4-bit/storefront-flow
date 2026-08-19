import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Mail, Minus, Phone, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/store/$slug")({ ssr: false, component: PublicStorefrontPage });

type CartItem = { productId: string; name: string; price: number; imageUrl: string; quantity: number };

type Hero = { id: string; image_url: string; title: string; subtitle: string; sort_order: number };

function PublicStorefrontPage() {
  const { slug } = Route.useParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [heroIndex, setHeroIndex] = useState(0);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", address: "", note: "", payment: "pay_on_delivery" });

  const catalogQuery = useQuery({
    queryKey: ["public-storefront", slug],
    queryFn: async () => {
      const { data, error } = await onlineSupabase.from("online_catalog").select("*").eq("slug", slug).order("featured", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });
  const heroesQuery = useQuery({
    queryKey: ["public-storefront-heroes", slug],
    queryFn: async () => {
      const { data, error } = await onlineSupabase.from("online_store_heroes").select("*").eq("slug", slug).order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as Hero[];
    },
  });
  const catalog = catalogQuery.data ?? [];
  const heroes = heroesQuery.data ?? [];
  const first = catalog[0];
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const currency = first?.currency ?? "NGN";

  useEffect(() => {
    setHeroIndex(0);
  }, [slug]);

  useEffect(() => {
    if (heroes.length <= 1) return;
    const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroes.length), 5000);
    return () => window.clearInterval(timer);
  }, [heroes.length]);

  function add(product: typeof first) {
    if (!product) return;
    setCart((items) => {
      const existing = items.find((item) => item.productId === product.product_id);
      return existing
        ? items.map((item) => item.productId === product.product_id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...items, { productId: product.product_id, name: product.name, price: Number(product.price), imageUrl: product.image_url, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  }

  function change(productId: string, delta: number) {
    setCart((items) => items.flatMap((item) => item.productId !== productId ? [item] : item.quantity + delta <= 0 ? [] : [{ ...item, quantity: item.quantity + delta }]));
  }

  async function placeOrder() {
    if (!customer.name || !customer.phone || !customer.address || cart.length === 0) {
      toast.error("Complete your name, phone, delivery address and cart first.");
      return;
    }
    setSubmitting(true);
    const result = await onlineSupabase.rpc("create_online_order", { _slug: slug, _customer_name: customer.name, _customer_email: customer.email, _customer_phone: customer.phone, _shipping_address: customer.address, _customer_note: customer.note, _payment_method: customer.payment, _items: cart.map((item) => ({ product_id: item.productId, quantity: item.quantity })) });
    setSubmitting(false);
    if (result.error) { toast.error(result.error.message); return; }
    setSuccess(String(result.data));
    setCart([]);
    setCheckoutOpen(false);
  }

  if (catalogQuery.isLoading || heroesQuery.isLoading) return <main className="flex min-h-screen items-center justify-center bg-background"><span className="size-8 animate-spin rounded-full border-[3px] border-foreground border-t-transparent" aria-label="Loading storefront" /></main>;
  if (catalogQuery.error || catalog.length === 0) return <main className="flex min-h-screen items-center justify-center bg-background px-5 text-center"><div className="storefront-card max-w-md p-9"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent"><ShoppingBag /></div><h1 className="text-display-md mt-6">This storefront isn't available.</h1><p className="mt-3 text-muted-foreground">The shop may still be setting up or this link is no longer active.</p></div></main>;

  const store = first!;
  const activeHero = heroes[heroIndex];

  return <main className="storefront-shell min-h-screen bg-background">
    <header className="sticky top-0 z-20 border-b border-border/80 bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          {store.logo_url ? <img src={store.logo_url} alt="" className="size-11 rounded-2xl border border-border object-cover" /> : <span className="flex size-11 items-center justify-center rounded-2xl bg-accent"><span className="size-4 rotate-45 rounded-[4px] bg-foreground" /></span>}
          <div className="min-w-0"><h1 className="truncate font-display text-lg font-bold">{store.display_name}</h1><p className="truncate text-xs text-muted-foreground">Official online store</p></div>
        </div>
        <button type="button" onClick={() => setCheckoutOpen(true)} className="touch-target relative flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:bg-secondary"><ShoppingBag className="size-4" /> Cart{cart.length > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px]">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}</button>
      </div>
    </header>

    <section className="mx-auto max-w-6xl px-5 pb-12 pt-8 lg:px-8 lg:pb-16 lg:pt-10">
      {activeHero ? <div className="group relative h-[360px] overflow-hidden rounded-[2rem] border border-border bg-foreground shadow-float sm:h-[440px]">
        <img key={activeHero.id} src={activeHero.image_url} alt="" className="absolute inset-0 h-full w-full object-cover transition duration-700" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10 lg:p-12">
          <p className="text-label-caps text-white/70">{store.display_name}</p>
          <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">{activeHero.title || "Everything you need, in one place."}</h2>
          {activeHero.subtitle && <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{activeHero.subtitle}</p>}
        </div>
        {heroes.length > 1 && <>
          <button type="button" aria-label="Previous banner" onClick={() => setHeroIndex((index) => (index - 1 + heroes.length) % heroes.length)} className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur transition hover:bg-black/45"><ArrowLeft className="size-4" /></button>
          <button type="button" aria-label="Next banner" onClick={() => setHeroIndex((index) => (index + 1) % heroes.length)} className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur transition hover:bg-black/45"><ArrowRight className="size-4" /></button>
          <div className="absolute bottom-5 right-6 flex gap-1.5 sm:right-10">{heroes.map((hero, index) => <button key={hero.id} type="button" aria-label={`Show banner ${index + 1}`} onClick={() => setHeroIndex(index)} className={`h-1.5 rounded-full transition-all ${index === heroIndex ? "w-7 bg-white" : "w-1.5 bg-white/50"}`} />)}</div>
        </>}
      </div> : <div className="storefront-card relative overflow-hidden p-7 sm:p-10 lg:p-14"><div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent-soft blur-3xl" /><div className="relative max-w-3xl"><p className="text-label-caps text-accent-ink">{store.display_name}</p><h2 className="text-display-lg mt-4">Everything you need, in one place.</h2><p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{store.store_description || "Browse our latest products and place an order directly with the store."}</p></div></div>}
      <div className="mt-5 flex flex-wrap gap-3">{store.store_description && !activeHero && null}{store.display_phone && <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground"><Phone className="size-4" />{store.display_phone}</span>}{store.display_email && <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground"><Mail className="size-4" />{store.display_email}</span>}</div>
    </section>

    <section className="mx-auto max-w-6xl px-5 pb-24 lg:px-8">
      <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-label-caps text-muted-foreground">Catalog</p><h3 className="text-display-md mt-2">Shop products</h3></div><span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground">{catalog.length} available</span></div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{catalog.map((product) => {
        const images = product.image_urls?.length ? product.image_urls : product.image_url ? [product.image_url] : [];
        return <article key={product.product_id} className="storefront-card group overflow-hidden">
          <ProductGallery images={images} name={product.name} />
          <div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{product.category || "Product"}</p><h4 className="mt-1 font-display text-lg font-semibold">{product.name}</h4></div>{product.featured && <span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-ink">Featured</span>}</div><p className="mt-3 min-h-10 text-sm leading-6 text-muted-foreground">{product.description || "Available now from this store."}</p><div className="mt-5 flex items-center justify-between gap-3"><span className="numeric text-lg font-bold">{formatMoney(Number(product.price), currency)}</span><Button className="rounded-xl" onClick={() => add(product)}>Add to cart</Button></div></div>
        </article>;
      })}</div>
    </section>

    <footer className="border-t border-border bg-surface px-5 py-8"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row"><span>Powered by Kudi</span><span>{store.shipping_note || "Delivery arrangements are confirmed by the store after checkout."}</span></div></footer>

    {success && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-5 backdrop-blur-sm"><div className="storefront-card w-full max-w-md p-7 text-center"><div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent"><Check className="size-7" /></div><p className="text-label-caps mt-6 text-accent-ink">Order received</p><h2 className="text-display-md mt-2">Thank you.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Your order number is <strong className="text-foreground">{success}</strong>. The store will review it and contact you using the details you provided.</p><Button className="mt-6 h-12 w-full rounded-xl" onClick={() => setSuccess("")}>Continue shopping</Button></div></div>}

    {checkoutOpen && <div className="fixed inset-0 z-50 bg-foreground/35 p-4 backdrop-blur-sm"><div className="ml-auto flex h-full w-full max-w-xl flex-col rounded-[1.75rem] border border-border bg-surface shadow-float"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="text-label-caps text-muted-foreground">Checkout</p><h2 className="font-display text-xl font-semibold">Your order</h2></div><button type="button" onClick={() => setCheckoutOpen(false)} className="size-10 rounded-xl border border-border">×</button></div><div className="flex-1 overflow-y-auto p-5"><div className="space-y-3">{cart.map((item) => <div key={item.productId} className="flex items-center gap-3 rounded-2xl border border-border p-3"><div className="size-12 overflow-hidden rounded-xl bg-secondary">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="numeric text-xs text-muted-foreground">{formatMoney(item.price,currency)}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => change(item.productId,-1)} className="size-8 rounded-lg border border-border"><Minus className="mx-auto size-3" /></button><span className="w-5 text-center text-sm">{item.quantity}</span><button type="button" onClick={() => change(item.productId,1)} className="size-8 rounded-lg border border-border"><Plus className="mx-auto size-3" /></button><button type="button" onClick={() => change(item.productId,-item.quantity)} className="ml-1 rounded-lg p-2 text-destructive"><Trash2 className="size-4" /></button></div></div>)}</div>{cart.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Your cart is empty.</p>}<div className="mt-6 space-y-3"><input value={customer.name} onChange={(e)=>setCustomer({...customer,name:e.target.value})} className="field" placeholder="Full name" /><input value={customer.phone} onChange={(e)=>setCustomer({...customer,phone:e.target.value})} className="field" placeholder="Phone number" /><input value={customer.email} onChange={(e)=>setCustomer({...customer,email:e.target.value})} className="field" placeholder="Email (optional)" type="email" /><textarea value={customer.address} onChange={(e)=>setCustomer({...customer,address:e.target.value})} className="field min-h-24 resize-none" placeholder="Delivery address" /><textarea value={customer.note} onChange={(e)=>setCustomer({...customer,note:e.target.value})} className="field min-h-20 resize-none" placeholder="Order note (optional)" /><select value={customer.payment} onChange={(e)=>setCustomer({...customer,payment:e.target.value})} className="field"><option value="pay_on_delivery">Pay on delivery</option><option value="bank_transfer">Bank transfer</option></select>{store.checkout_note && <p className="rounded-xl bg-secondary/60 p-3 text-xs leading-5 text-muted-foreground">{store.checkout_note}</p>}</div></div><div className="border-t border-border p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total</span><span className="numeric text-xl font-bold">{formatMoney(total,currency)}</span></div><Button disabled={submitting || cart.length===0} onClick={() => void placeOrder()} className="mt-4 h-12 w-full rounded-xl">{submitting ? "Placing order…" : <>Place order <ArrowRight className="ml-2 size-4" /></>}</Button></div></div></div>}
  </main>;
}

function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? "";
  return <div className="relative aspect-square overflow-hidden bg-secondary">
    {current ? <img src={current} alt={name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="size-10 text-muted-foreground" /></div>}
    {images.length > 1 && <><button type="button" aria-label="Previous product image" onClick={() => setIndex((value) => (value - 1 + images.length) % images.length)} className="absolute left-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"><ArrowLeft className="size-3.5" /></button><button type="button" aria-label="Next product image" onClick={() => setIndex((value) => (value + 1) % images.length)} className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"><ArrowRight className="size-3.5" /></button><div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">{images.map((image, dotIndex) => <button key={image} type="button" aria-label={`Show image ${dotIndex + 1}`} onClick={() => setIndex(dotIndex)} className={`h-1.5 rounded-full ${dotIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />)}</div></>}
  </div>;
}
