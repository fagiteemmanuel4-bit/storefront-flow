import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, Mail, Minus, Phone, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { formatMoney } from "@/lib/currency";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/store/$slug")({ ssr: false, component: PublicStorefrontPage });

type Store = { id: string; store_id: string; slug: string; display_name: string; logo_url: string; display_email: string; display_phone: string; description: string; shipping_note: string; checkout_note: string; currency: string };
type Product = { product_id: string; name: string; category: string; price: number; image_url: string; image_urls: string[]; featured: boolean; description: string; stock_quantity: number };
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

  const storeQuery = useQuery({
    queryKey: ["public-store", slug],
    queryFn: async () => {
      const { data, error } = await onlineSupabase.from("online_stores").select("id,store_id,slug,display_name,logo_url,display_email,display_phone,description,shipping_note,checkout_note,is_published,setup_completed").eq("slug", slug.toLowerCase().trim()).eq("is_published", true).eq("setup_completed", true).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Storefront not found");
      const { data: merchant } = await onlineSupabase.from("stores").select("currency").eq("id", data.store_id).maybeSingle();
      return { ...data, currency: merchant?.currency ?? "NGN" } as Store;
    },
    retry: 3,
  });
  const store = storeQuery.data;

  const catalogQuery = useQuery({
    queryKey: ["public-store-products", slug],
    enabled: Boolean(store?.store_id),
    queryFn: async () => {
      const { data, error } = await onlineSupabase.rpc("get_public_store_catalog", { _slug: slug });
      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    },
    retry: 3,
    staleTime: 15_000,
  });

  const heroesQuery = useQuery({
    queryKey: ["public-store-heroes", store?.store_id],
    enabled: Boolean(store?.store_id),
    queryFn: async () => {
      const { data, error } = await onlineSupabase.from("store_hero_banners").select("id,image_url,title,subtitle,sort_order").eq("store_id", store!.store_id).eq("is_active", true).order("sort_order");
      if (error) throw new Error(error.message);
      return (data ?? []) as Hero[];
    },
    retry: 3,
  });

  const catalog = catalogQuery.data ?? [];
  const heroes = heroesQuery.data ?? [];
  const total = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  useEffect(() => { setHeroIndex(0); }, [slug]);
  useEffect(() => { if (heroes.length <= 1) return; const timer = window.setInterval(() => setHeroIndex((index) => (index + 1) % heroes.length), 5000); return () => window.clearInterval(timer); }, [heroes.length]);

  function add(product: Product) {
    if (product.stock_quantity <= 0) { toast.error(`${product.name} is currently out of stock`); return; }
    setCart((items) => {
      const existing = items.find((item) => item.productId === product.product_id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) { toast.error(`Only ${product.stock_quantity} ${product.name} available`); return items; }
        return items.map((item) => item.productId === product.product_id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...items, { productId: product.product_id, name: product.name, price: product.price, imageUrl: product.image_url, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  }
  function change(productId: string, delta: number) {
    const product = catalog.find((item) => item.product_id === productId);
    setCart((items) => items.flatMap((item) => {
      if (item.productId !== productId) return [item];
      const next = item.quantity + delta;
      if (product && next > product.stock_quantity) { toast.error(`Only ${product.stock_quantity} ${product.name} available`); return [item]; }
      return next <= 0 ? [] : [{ ...item, quantity: next }];
    }));
  }
  async function placeOrder() {
    if (!store || !customer.name.trim() || !customer.phone.trim() || !customer.address.trim() || cart.length === 0) { toast.error("Complete your name, phone, delivery address and cart first."); return; }
    setSubmitting(true);
    try {
      const result = await onlineSupabase.rpc("create_online_order", { _slug: slug, _customer_name: customer.name, _customer_email: customer.email, _customer_phone: customer.phone, _shipping_address: customer.address, _customer_note: customer.note, _payment_method: customer.payment, _items: cart.map((item) => ({ product_id: item.productId, quantity: item.quantity })) });
      if (result.error) throw new Error(result.error.message);
      setSuccess(String(result.data)); setCart([]); setCheckoutOpen(false); setCustomer({ name: "", email: "", phone: "", address: "", note: "", payment: "pay_on_delivery" }); void catalogQuery.refetch();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not place your order."); } finally { setSubmitting(false); }
  }

  if (storeQuery.isLoading) return <LoadingStore />;
  if (storeQuery.error || !store) return <main className="flex min-h-screen items-center justify-center bg-background px-5 text-center"><div className="storefront-card max-w-md p-9"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-accent"><ShoppingBag /></div><h1 className="text-display-md mt-6">This storefront isn't available.</h1><p className="mt-3 text-muted-foreground">The shop may still be setting up or this link is no longer active.</p><a className="mt-6 inline-flex text-sm font-semibold underline" href="/">Go to Strap</a></div></main>;
  const activeHero = heroes[heroIndex];

  return <main className="storefront-shell min-h-screen bg-background">
    <header className="sticky top-0 z-20 border-b border-border/80 bg-surface/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 lg:px-8"><div className="flex min-w-0 items-center gap-3">{store.logo_url ? <img src={store.logo_url} alt={`${store.display_name} logo`} className="size-11 rounded-2xl border border-border object-cover" /> : <span className="flex size-11 items-center justify-center rounded-2xl bg-accent"><span className="size-4 rotate-45 rounded-[4px] bg-foreground" /></span>}<div className="min-w-0"><h1 className="truncate font-display text-lg font-bold">{store.display_name}</h1><p className="truncate text-xs text-muted-foreground">Official online store</p></div></div><button type="button" onClick={() => setCheckoutOpen(true)} className="touch-target relative flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:bg-secondary"><ShoppingBag className="size-4" /> Cart{cart.length > 0 && <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[10px]">{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>}</button></div></header>
    <section className="mx-auto max-w-6xl px-5 pb-12 pt-8 lg:px-8 lg:pb-16 lg:pt-10">
      {activeHero ? <div className="group relative h-[360px] overflow-hidden rounded-[2rem] border border-border bg-foreground shadow-float sm:h-[440px]"><img key={activeHero.id} src={activeHero.image_url} alt={activeHero.title || `${store.display_name} banner`} className="absolute inset-0 h-full w-full object-cover transition duration-700" /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-10 lg:p-12"><p className="text-label-caps text-white/70">{store.display_name}</p><h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">{activeHero.title || "Everything you need, in one place."}</h2>{activeHero.subtitle && <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">{activeHero.subtitle}</p>}</div>{heroes.length > 1 && <><button type="button" aria-label="Previous banner" onClick={() => setHeroIndex((index) => (index - 1 + heroes.length) % heroes.length)} className="absolute left-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur transition hover:bg-black/45"><ArrowLeft className="size-4" /></button><button type="button" aria-label="Next banner" onClick={() => setHeroIndex((index) => (index + 1) % heroes.length)} className="absolute right-4 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white backdrop-blur transition hover:bg-black/45"><ArrowRight className="size-4" /></button><div className="absolute bottom-5 right-6 flex gap-1.5 sm:right-10">{heroes.map((hero, index) => <button key={hero.id} type="button" aria-label={`Show banner ${index + 1}`} onClick={() => setHeroIndex(index)} className={`h-1.5 rounded-full transition-all ${index === heroIndex ? "w-7 bg-white" : "w-1.5 bg-white/50"}`} />)}</div></>}</div> : <div className="storefront-card relative overflow-hidden p-7 sm:p-10 lg:p-14"><div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-accent-soft blur-3xl" /><div className="relative max-w-3xl"><p className="text-label-caps text-accent-ink">{store.display_name}</p><h2 className="text-display-lg mt-4">{store.description || "Everything you need, in one place."}</h2><p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">Browse our latest products and place an order directly with the store.</p></div></div>}
      <div className="mt-5 flex flex-wrap gap-3">{store.display_phone && <a href={`tel:${store.display_phone}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground"><Phone className="size-4" />{store.display_phone}</a>}{store.display_email && <a href={`mailto:${store.display_email}`} className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-2 text-sm text-muted-foreground"><Mail className="size-4" />{store.display_email}</a>}</div>
    </section>
    <section className="mx-auto max-w-6xl px-5 pb-24 lg:px-8"><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-label-caps text-muted-foreground">Catalog</p><h3 className="text-display-md mt-2">Shop products</h3></div><span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground">{catalog.length} available</span></div>{catalogQuery.isLoading ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3].map((item) => <div key={item} className="storefront-card h-80 animate-pulse bg-secondary/50" />)}</div> : catalogQuery.error ? <div className="storefront-card p-8 text-center"><p className="font-semibold">Products couldn't be loaded.</p><p className="mt-2 text-sm text-muted-foreground">{catalogQuery.error instanceof Error ? catalogQuery.error.message : "Please refresh in a moment."}</p><Button variant="outline" className="mt-4 rounded-xl" onClick={() => void catalogQuery.refetch()}>Retry catalog</Button></div> : catalog.length === 0 ? <div className="storefront-card p-10 text-center"><ShoppingBag className="mx-auto size-8 text-muted-foreground" /><h4 className="mt-4 font-display text-lg font-semibold">Coming soon</h4><p className="mt-2 text-sm text-muted-foreground">This store is live, but the owner hasn't published products yet.</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{catalog.map((product) => <article key={product.product_id} className="storefront-card group overflow-hidden"><ProductGallery images={product.image_urls.length ? product.image_urls : [product.image_url]} name={product.name} /><div className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-muted-foreground">{product.category || "Product"}</p><h4 className="mt-1 font-display text-lg font-semibold">{product.name}</h4></div>{product.featured && <span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-accent-ink">Featured</span>}</div><p className="mt-3 min-h-10 text-sm leading-6 text-muted-foreground">{product.description || "Available now from this store."}</p><div className="mt-4 flex items-center justify-between gap-3"><div><span className="numeric text-lg font-bold">{formatMoney(product.price, store.currency)}</span><p className={`mt-1 text-xs font-semibold ${product.stock_quantity > 0 ? "text-success" : "text-destructive"}`}>{product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}</p></div><Button className="rounded-xl" disabled={product.stock_quantity <= 0} onClick={() => add(product)}>{product.stock_quantity <= 0 ? "Sold out" : "Add to cart"}</Button></div></div></article>)}</div>}</section>
    <footer className="border-t border-border bg-surface px-5 py-8"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-3 text-xs text-muted-foreground sm:flex-row"><span>Powered by Strap</span><span>{store.shipping_note || "Delivery arrangements are confirmed by the store after checkout."}</span></div></footer>
    {success && <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-5 backdrop-blur-sm"><div className="storefront-card w-full max-w-md p-7 text-center"><div className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent"><Check className="size-7" /></div><p className="text-label-caps mt-6 text-accent-ink">Order received</p><h2 className="text-display-md mt-2">Thank you.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Your order number is <strong className="text-foreground">{success}</strong>. The store will review it and contact you using the details you provided.</p><Button className="mt-6 h-12 w-full rounded-xl" onClick={() => setSuccess("")}>Continue shopping</Button></div></div>}
    {checkoutOpen && <div className="fixed inset-0 z-50 bg-foreground/35 p-4 backdrop-blur-sm"><div className="ml-auto flex h-full w-full max-w-xl flex-col rounded-[1.75rem] border border-border bg-surface shadow-float"><div className="flex items-center justify-between border-b border-border p-5"><div><p className="text-label-caps text-muted-foreground">Checkout</p><h2 className="font-display text-xl font-semibold">Your order</h2></div><button type="button" onClick={() => setCheckoutOpen(false)} className="size-10 rounded-xl border border-border">×</button></div><div className="flex-1 overflow-y-auto p-5"><div className="space-y-3">{cart.map((item) => <div key={item.productId} className="flex items-center gap-3 rounded-2xl border border-border p-3"><div className="size-12 overflow-hidden rounded-xl bg-secondary">{item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.name}</p><p className="numeric text-xs text-muted-foreground">{formatMoney(item.price,store.currency)}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => change(item.productId,-1)} className="size-8 rounded-lg border border-border"><Minus className="mx-auto size-3" /></button><span className="w-5 text-center text-sm">{item.quantity}</span><button type="button" onClick={() => change(item.productId,1)} className="size-8 rounded-lg border border-border"><Plus className="mx-auto size-3" /></button><button type="button" onClick={() => change(item.productId,-item.quantity)} className="ml-1 rounded-lg p-2 text-destructive"><Trash2 className="size-4" /></button></div></div>)}</div>{cart.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Your cart is empty.</p>}<div className="mt-6 space-y-3"><input value={customer.name} onChange={(e)=>setCustomer({...customer,name:e.target.value})} className="field" placeholder="Full name" autoComplete="name" /><input value={customer.phone} onChange={(e)=>setCustomer({...customer,phone:e.target.value})} className="field" placeholder="Phone number" autoComplete="tel" /><input value={customer.email} onChange={(e)=>setCustomer({...customer,email:e.target.value})} className="field" placeholder="Email (optional)" type="email" autoComplete="email" /><textarea value={customer.address} onChange={(e)=>setCustomer({...customer,address:e.target.value})} className="field min-h-24 resize-none" placeholder="Delivery address" autoComplete="street-address" /><textarea value={customer.note} onChange={(e)=>setCustomer({...customer,note:e.target.value})} className="field min-h-20 resize-none" placeholder="Order note (optional)" /><select value={customer.payment} onChange={(e)=>setCustomer({...customer,payment:e.target.value})} className="field"><option value="pay_on_delivery">Pay on delivery</option><option value="bank_transfer">Bank transfer</option></select>{store.checkout_note && <p className="rounded-xl bg-secondary/60 p-3 text-xs leading-5 text-muted-foreground">{store.checkout_note}</p>}</div></div><div className="border-t border-border p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Total</span><span className="numeric text-xl font-bold">{formatMoney(total,store.currency)}</span></div><Button disabled={submitting || cart.length===0} onClick={() => void placeOrder()} className="mt-4 h-12 w-full rounded-xl">{submitting ? "Placing order…" : <>Place order <ArrowRight className="ml-2 size-4" /></>}</Button></div></div></div>}
  </main>;
}

function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const validImages = images.filter(Boolean);
  const active = validImages[index] || validImages[0];
  return <div className="aspect-[4/3] overflow-hidden bg-secondary relative">
    {active ? <img src={active} alt={name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex h-full items-center justify-center"><ShoppingBag className="size-9 text-muted-foreground" /></div>}
    {validImages.length > 1 && <><button type="button" aria-label={`Previous image for ${name}`} onClick={() => setIndex((value) => (value - 1 + validImages.length) % validImages.length)} className="absolute left-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"><ArrowLeft className="size-3.5" /></button><button type="button" aria-label={`Next image for ${name}`} onClick={() => setIndex((value) => (value + 1) % validImages.length)} className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur"><ArrowRight className="size-3.5" /></button><div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">{validImages.map((_, imageIndex) => <span key={imageIndex} className={`h-1.5 rounded-full ${imageIndex === index ? "w-4 bg-white" : "w-1.5 bg-white/60"}`} />)}</div></>}
  </div>;
}
function LoadingStore() { return <main className="flex min-h-screen items-center justify-center bg-background"><span className="size-8 animate-spin rounded-full border-[3px] border-foreground border-t-transparent" aria-label="Loading storefront" /></main>; }
