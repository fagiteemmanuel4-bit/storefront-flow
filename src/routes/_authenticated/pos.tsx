import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Check, ChevronDown, Clock3, ExternalLink, Minus, Plus, Printer, RotateCcw, ScanLine, Search, ShoppingCart, Trash2, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { BarcodeScannerDialog } from "@/components/pos/BarcodeScannerDialog";
import { fetchProductsWithStock } from "@/routes/_authenticated/products";
import { formatMoney } from "@/lib/currency";
import { errorMessage, formatDateTime } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethod, type ProductWithStock } from "@/lib/pos-types";
import { enqueueOfflineSale, getOfflineSales } from "@/lib/offline-sales";
import { playSaleCompleteSound } from "@/lib/sound";
import { startKeyboardScanner } from "@/lib/hardware";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pos")({ ssr: false, component: PosPage });
type CartLine = { product: ProductWithStock; quantity: number };
type Customer = { id: string; name: string; phone: string };
type Receipt = { reference: string; total: number; subtotal: number; tax: number; method: PaymentMethod; at: string; lines: { name: string; quantity: number; lineTotal: number }[]; customerName?: string };

function PosPage() {
  const { store, branch } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id ?? null;
  const branchId = branch?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const taxRate = Number(store?.tax_rate ?? 0);
  const holdStorageKey = storeId && branchId ? `kudi-held-carts:${storeId}:${branchId}` : null;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [scanning, setScanning] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [charging, setCharging] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [holds, setHolds] = useState<Record<string, CartLine[]>>({});
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [offlineCount, setOfflineCount] = useState(0);
  const [online, setOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);

  const productsQuery = useQuery({ queryKey: ["products", storeId, branchId], enabled: Boolean(storeId && branchId), queryFn: () => fetchProductsWithStock(storeId as string, branchId as string) });
  const customersQuery = useQuery({ queryKey: ["customers", storeId, "picker"], enabled: Boolean(storeId), queryFn: async () => { const { data, error } = await supabase.from("customers").select("id,name,phone").eq("store_id", storeId!).order("name").limit(500); if (error) throw new Error(error.message); return (data ?? []) as Customer[]; } });
  const products = productsQuery.data ?? [];
  const customers = customersQuery.data ?? [];
  const selectedCustomer = customers.find((c) => c.id === customerId);

  useEffect(() => { setOfflineCount(getOfflineSales().length); const refresh = () => setOfflineCount(getOfflineSales().length); window.addEventListener("kudi-offline-queue-changed", refresh); return () => window.removeEventListener("kudi-offline-queue-changed", refresh); }, []);
  useEffect(() => { const on = () => setOnline(true); const off = () => setOnline(false); window.addEventListener("online", on); window.addEventListener("offline", off); return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); }; }, []);
  useEffect(() => { if (!holdStorageKey) { setHolds({}); return; } try { setHolds(JSON.parse(localStorage.getItem(holdStorageKey) || "{}")); } catch { setHolds({}); } }, [holdStorageKey]);

  const categories = useMemo(() => Array.from(new Set(products.map((p) => p.category).filter(Boolean))).sort(), [products]);
  const visible = useMemo(() => { const term = search.trim().toLowerCase(); return products.filter((p) => (category === "all" || p.category === category) && (!term || [p.name, p.sku, p.barcode, p.category].some((f) => String(f ?? "").toLowerCase().includes(term)))); }, [products, search, category]);
  const addToCart = useCallback((product: ProductWithStock) => { setCart((current) => { const existing = current.find((l) => l.product.id === product.id); if (product.quantity < 1) { toast.error(`${product.name} is out of stock.`); return current; } if (existing) { if (existing.quantity >= product.quantity) { toast.error(`Only ${product.quantity} available.`); return current; } return current.map((l) => l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l); } return [...current, { product, quantity: 1 }]; }); }, []);
  const scanProduct = useCallback((value: string) => { const normalized = value.trim(); if (!normalized) return; const match = products.find((p) => String(p.barcode ?? "").trim() === normalized || String(p.sku ?? "").trim().toLowerCase() === normalized.toLowerCase()); if (!match) { toast.error(`No product with barcode or SKU ${normalized}.`); return; } addToCart(match); toast.success(`${match.name} added`); }, [products, addToCart]);
  useEffect(() => startKeyboardScanner(({ value }) => scanProduct(value)), [scanProduct]);
  function changeQty(id: string, delta: number) { setCart((current) => current.map((l) => { if (l.product.id !== id) return l; const next = l.quantity + delta; if (next > l.product.quantity) { toast.error(`Only ${l.product.quantity} available.`); return l; } return { ...l, quantity: next }; }).filter((l) => l.quantity > 0)); }
  function clearCart() { setCart([]); setCashReceived(""); setMethod("cash"); setCustomerId(null); }
  const subtotal = cart.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);
  const tax = Math.round(subtotal * taxRate) / 100;
  const total = subtotal + tax;
  const received = Number(cashReceived) || 0;
  const change = Math.max(0, received - total);
  function saveHolds(next: Record<string, CartLine[]>) { setHolds(next); if (holdStorageKey) localStorage.setItem(holdStorageKey, JSON.stringify(next)); }
  function holdSale() { if (!cart.length) return toast.error("Add items before holding a sale."); const base = new Date().toLocaleTimeString(); const duplicateCount = Object.keys(holds).filter((key) => key.startsWith(`Sale ${base}`)).length; const name = duplicateCount ? `Sale ${base} #${duplicateCount + 1}` : `Sale ${base}`; saveHolds({ ...holds, [name]: cart }); clearCart(); toast.success(`${name} held`); }
  function recallSale(name: string) { const held = holds[name]; if (!held) return; setCart(held); const next = { ...holds }; delete next[name]; saveHolds(next); setCashReceived(""); setMethod("cash"); toast.success(`${name} recalled`); }
  function choosePaymentMethod(next: PaymentMethod) { setMethod(next); if (next !== "cash") setCashReceived(""); }

  async function completeSale() {
    if (!storeId || !branchId || !cart.length) return toast.error("Add products to the sale first.");
    if (method === "cash" && received < total && navigator.onLine) return toast.error(`Cash received must be at least ${formatMoney(total, currency)}.`);
    if (!Number.isFinite(total) || total <= 0) return toast.error("The sale total is invalid.");
    const offlineId = crypto.randomUUID();
    const items = cart.map((l) => ({ product_id: l.product.id, quantity: l.quantity }));
    setCharging(true);
    try {
      if (!navigator.onLine) { enqueueOfflineSale({ offlineId, storeId, branchId, paymentMethod: method, items, customerId, note: "", createdAt: new Date().toISOString() }); clearCart(); toast.success("Sale saved on this device. It will sync automatically when you reconnect."); return; }
      const { data: saleId, error } = await supabase.rpc("create_sale", { _store_id: storeId, _branch_id: branchId, _payment_method: method, _items: items, _note: "", _customer_id: customerId, _offline_id: offlineId });
      if (error) throw new Error(error.message);
      if (!saleId) throw new Error("The sale was not recorded.");
      const { data: saved, error: readError } = await supabase.from("sales").select("reference, subtotal, tax, total, payment_method, created_at").eq("id", saleId).single();
      if (readError) throw new Error(readError.message);
      if (!saved) throw new Error("Sale confirmation failed.");
      playSaleCompleteSound();
      setReceipt({ reference: saved.reference, subtotal: Number(saved.subtotal), tax: Number(saved.tax), total: Number(saved.total), method: saved.payment_method, at: saved.created_at, customerName: selectedCustomer?.name, lines: cart.map((l) => ({ name: l.product.name, quantity: l.quantity, lineTotal: Number(l.product.price) * l.quantity })) });
      clearCart(); setCartOpen(false); await queryClient.invalidateQueries({ queryKey: ["products", storeId, branchId] }); await queryClient.invalidateQueries({ queryKey: ["customers", storeId] }); toast.success(`Sale ${saved.reference} saved`);
    } catch (e) {
      if (!navigator.onLine || /network|fetch|failed to fetch/i.test(errorMessage(e, ""))) { enqueueOfflineSale({ offlineId, storeId, branchId, paymentMethod: method, items, customerId, note: "", createdAt: new Date().toISOString() }); clearCart(); toast.success("Connection dropped. Sale saved on this device and queued for sync."); } else toast.error(errorMessage(e, "The sale was not completed."));
    } finally { setCharging(false); }
  }

  function escapeHtml(value: string) { return value.replace(/[&<>\"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[char] ?? char)); }
  function printReceipt() { if (!receipt) return; const popup = window.open("", "kudi-receipt", "width=420,height=720"); if (!popup) { toast.error("Allow pop-ups for Strap to print receipts."); return; } const rows = receipt.lines.map((l) => `<div style="display:flex;justify-content:space-between;gap:12px;margin:6px 0"><span>${escapeHtml(l.name)} × ${l.quantity}</span><span>${escapeHtml(formatMoney(l.lineTotal, currency))}</span></div>`).join(""); popup.document.write(`<html><head><title>${escapeHtml(receipt.reference)}</title><style>body{font-family:Arial,sans-serif;padding:24px;max-width:340px;margin:auto;color:#111}h1{text-align:center;font-size:20px}.line{border-top:1px dashed #999;margin:16px 0}@media print{body{padding:8px}}</style></head><body><h1>${escapeHtml(store?.name ?? "STRAP STORE")}</h1><p style="text-align:center;font-size:11px">${escapeHtml(receipt.reference)}<br/>${escapeHtml(formatDateTime(receipt.at))}${receipt.customerName ? `<br/>Customer: ${escapeHtml(receipt.customerName)}` : ""}</p><div class="line"></div>${rows}<div class="line"></div><div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px"><span>Total</span><span>${escapeHtml(formatMoney(receipt.total, currency))}</span></div><p style="text-align:center;font-size:11px;margin-top:28px">Thank you for shopping with us.</p><script>window.onload=()=>window.print()</script></body></html>`); popup.document.close(); popup.focus(); }

  const cartPanel = <div className="flex h-full flex-col"><div className="flex-1 space-y-3 overflow-y-auto">{!cart.length ? <p className="py-8 text-center text-sm text-muted-foreground">Tap a product or scan a barcode to start.</p> : cart.map((line) => <div key={line.product.id} className="flex items-center gap-2 rounded-xl border border-border bg-background p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{line.product.name}</p><p className="numeric text-xs text-muted-foreground">{formatMoney(Number(line.product.price), currency)} each</p></div><div className="flex items-center gap-1"><Button variant="outline" size="icon" className="size-8" onClick={() => changeQty(line.product.id, -1)}><Minus className="size-3.5" /></Button><span className="numeric w-6 text-center text-sm font-bold">{line.quantity}</span><Button variant="outline" size="icon" className="size-8" onClick={() => changeQty(line.product.id, 1)}><Plus className="size-3.5" /></Button></div><span className="numeric w-20 text-right text-sm font-bold">{formatMoney(Number(line.product.price) * line.quantity, currency)}</span><Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => changeQty(line.product.id, -line.quantity)}><Trash2 className="size-3.5" /></Button></div>)}</div><div className="mt-4 space-y-3 border-t border-border pt-4"><div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatMoney(subtotal, currency)}</span></div>{taxRate > 0 && <div className="flex justify-between text-sm text-muted-foreground"><span>Tax ({taxRate}%)</span><span>{formatMoney(tax, currency)}</span></div>}<div className="flex items-end justify-between"><span className="font-display text-lg font-bold">Total</span><span className="numeric text-2xl font-bold text-accent-ink">{formatMoney(total, currency)}</span></div>{customers.length > 0 && <div className="rounded-xl bg-secondary p-3"><label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground"><UserRound className="size-3.5" />Customer</label><select className="field mt-2 w-full" value={customerId ?? ""} onChange={(e) => setCustomerId(e.target.value || null)}><option value="">Walk-in customer</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}</select><Link to="/customers" className="mt-2 inline-flex text-xs font-semibold text-accent-ink hover:underline">Manage customers</Link></div>}{method === "cash" && <div className="rounded-xl bg-secondary p-3"><label className="text-xs font-semibold text-muted-foreground">Cash received</label><div className="mt-2 flex gap-2"><Input inputMode="decimal" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder={String(total)} /><Button variant="outline" onClick={() => setCashReceived(String(total))}>Exact</Button></div><p className="mt-2 text-sm font-semibold">Change: {formatMoney(change, currency)}</p></div>}<div className="grid grid-cols-2 gap-2">{PAYMENT_METHODS.map((o) => <button key={o.value} type="button" onClick={() => choosePaymentMethod(o.value)} className={cn("touch-target rounded-xl border px-3 py-2 text-sm font-semibold", method === o.value ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:bg-secondary")}>{o.label}</button>)}</div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={clearCart} disabled={!cart.length}><RotateCcw className="mr-2 size-4" />Clear</Button><Button className="h-12 flex-[2]" disabled={charging || !cart.length} onClick={() => void completeSale()}>{charging ? "Saving…" : `Charge ${formatMoney(total, currency)}`}</Button></div></div></div>;

  return <AppShell title="Sell"><div data-tour="sell" className="pos-sell-page">
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, name or barcode" className="h-11 rounded-xl border-border bg-surface pl-9 shadow-none" /></div>
    </div>
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select aria-label="Filter by category" className="field h-10 rounded-full border-border bg-surface px-4 text-xs font-semibold" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
      <Button variant="outline" aria-label="Scan barcode" className="h-10 rounded-full border-border bg-surface px-4 text-xs font-semibold" onClick={() => setScanning(true)}><ScanLine className="mr-1.5 size-4" />Scan</Button>
      <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-xs font-medium"><span className={cn("size-2 rounded-full", online && offlineCount === 0 ? "bg-emerald-500" : online ? "bg-amber-500" : "bg-red-500")} />{online ? (offlineCount > 0 ? `${offlineCount} sale${offlineCount === 1 ? "" : "s"} waiting to sync` : "Online") : "Offline"}</div>
      <Button variant="outline" size="sm" onClick={holdSale} disabled={!cart.length} className="h-10 rounded-full border-border px-4 text-xs font-semibold"><Clock3 className="mr-1.5 size-4" />Hold sale</Button>
      {Object.keys(holds).length > 0 && <details className="relative"><summary className="cursor-pointer list-none rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold">Held sales ({Object.keys(holds).length})</summary><div className="absolute left-0 top-11 z-40 w-64 rounded-2xl border border-border bg-surface p-2 shadow-xl">{Object.keys(holds).map((name) => <button key={name} className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary" onClick={() => recallSale(name)}><span className="truncate">{name}</span><RotateCcw className="size-3.5" /></button>)}</div></details>}
      <Link to="/receipt-designer" target="_blank" className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground hover:bg-secondary"><Printer className="size-3.5" />Receipt designer <ExternalLink className="size-3" /></Link>
    </div>
    <div className="mt-4 grid gap-5 lg:grid-cols-[1.7fr_1fr]">
      <div>{productsQuery.isLoading ? <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{[1,2,3,4,5,6].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div> : visible.length === 0 ? <div className="surface-card p-8 text-center"><p className="font-display text-lg font-semibold">Nothing to sell</p><p className="mt-1 text-sm text-muted-foreground">Add products under Stock, then they will appear here.</p></div> : <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{visible.map((product) => { const out = product.quantity < 1; return <button key={product.id} type="button" disabled={out} onClick={() => addToCart(product)} className={cn("surface-card pos-product-card touch-target flex min-h-[122px] flex-col items-start gap-1 p-4 text-left transition-all", out ? "pos-product-out opacity-70" : "hover:-translate-y-0.5 hover:shadow-lift active:scale-[.98]") }><span className="line-clamp-2 text-sm font-semibold leading-5">{product.name}</span><span className="numeric mt-auto text-base font-bold text-accent-ink">{formatMoney(Number(product.price), currency)}</span><span className={cn("text-xs", out ? "font-bold text-red-600" : product.quantity <= product.low_stock_threshold ? "font-semibold text-amber-700" : "text-muted-foreground")}>{out ? "Out of stock" : `${product.quantity} in stock`}</span></button>; })}</div>}</div>
      <aside className="surface-card sticky top-24 hidden h-fit p-5 lg:block"><div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-bold">Current sale</h2><Calculator className="size-4 text-muted-foreground" /></div>{cartPanel}</aside>
    </div>
    {cart.length > 0 && <div className="fixed inset-x-0 bottom-[68px] z-40 px-4 lg:hidden"><Button className="h-14 w-full justify-between rounded-2xl text-base shadow-float" onClick={() => setCartOpen(true)}><span className="flex items-center gap-2"><ShoppingCart className="size-4" />{cart.reduce((n, l) => n + l.quantity, 0)} items</span><span>{formatMoney(total, currency)}</span></Button></div>}
    <BottomSheet open={cartOpen} onOpenChange={setCartOpen}><BottomSheetContent className="mx-auto max-h-[88dvh] w-full max-w-md overflow-y-auto"><BottomSheetHeader><BottomSheetTitle>Current sale</BottomSheetTitle></BottomSheetHeader>{cartPanel}</BottomSheetContent></BottomSheet>
    {receipt && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-4 sm:items-center"><div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 shadow-2xl"><div className="flex items-start gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-accent-soft"><Check className="size-5" /></span><div className="flex-1"><p className="text-label-caps text-muted-foreground">Sale complete</p><h2 className="font-display text-xl font-bold">{receipt.reference}</h2><p className="text-xs text-muted-foreground">{formatDateTime(receipt.at)}{receipt.customerName ? ` · ${receipt.customerName}` : ""}</p></div><button onClick={() => setReceipt(null)} aria-label="Close receipt"><X className="size-5" /></button></div><div className="my-5 space-y-2 border-y border-border py-4">{receipt.lines.map((l, index) => <div key={`${l.name}-${index}`} className="flex justify-between text-sm"><span>{l.name} × {l.quantity}</span><span>{formatMoney(l.lineTotal, currency)}</span></div>)}<div className="flex justify-between pt-2 text-lg font-bold"><span>Total</span><span>{formatMoney(receipt.total, currency)}</span></div></div><div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={printReceipt}><Printer className="mr-2 size-4" />Print receipt</Button><Link to="/receipt-designer" target="_blank" className="flex flex-1 items-center justify-center rounded-xl border border-border text-sm font-semibold">Design receipt</Link></div></div></div>}
    <BarcodeScannerDialog open={scanning} onOpenChange={setScanning} onDetected={scanProduct} />
  </div></AppShell>;
}
