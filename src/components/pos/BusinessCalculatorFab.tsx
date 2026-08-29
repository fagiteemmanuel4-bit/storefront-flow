import { useEffect, useMemo, useState } from "react";
import { Calculator, Grid2X2, List, Minus, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/currency";

const VIEW_KEY = "strap-sell-product-view";
type ViewMode = "grid" | "list";

export function BusinessCalculatorFab({ currency = "NGN" }: { currency?: string }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [discount, setDiscount] = useState("");
  const [tax, setTax] = useState("");
  const [received, setReceived] = useState("");
  const [view, setView] = useState<ViewMode>("grid");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "grid" || saved === "list") setView(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, view); } catch {}
    const root = document.querySelector("[data-tour=\"sell\"]");
    const grid = root?.parentElement?.querySelector("button.surface-card")?.parentElement;
    if (!grid) return;
    grid.classList.toggle("sell-products-list", view === "list");
    grid.classList.toggle("grid-cols-1", view === "list");
    grid.classList.toggle("grid-cols-2", view === "grid");
    grid.classList.toggle("sm:grid-cols-3", view === "grid");
  }, [view]);

  const values = useMemo(() => {
    const base = Math.max(0, Number(price) || 0) * Math.max(1, Number(quantity) || 1);
    const discountAmount = base * Math.max(0, Number(discount) || 0) / 100;
    const afterDiscount = Math.max(0, base - discountAmount);
    const taxAmount = afterDiscount * Math.max(0, Number(tax) || 0) / 100;
    const total = afterDiscount + taxAmount;
    const cash = Math.max(0, Number(received) || 0);
    return { base, discountAmount, taxAmount, total, change: Math.max(0, cash - total) };
  }, [price, quantity, discount, tax, received]);

  const clear = () => { setPrice(""); setQuantity("1"); setDiscount(""); setTax(""); setReceived(""); };

  return <>
    <style>{`[data-tour="sell"] + * .sell-products-list button.surface-card{flex-direction:row;align-items:center;gap:12px;min-height:68px;padding:12px 14px}[data-tour="sell"] + * .sell-products-list button.surface-card > span:first-child{flex:1}[data-tour="sell"] + * .sell-products-list button.surface-card > span:nth-child(2){margin-left:auto}[data-tour="sell"] + * .sell-products-list button.surface-card > span:nth-child(3){min-width:82px;text-align:right}`}</style>
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-50 lg:bottom-6 lg:right-6">
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface/95 p-1.5 shadow-2xl backdrop-blur-xl">
        <button type="button" aria-label="Grid product view" onClick={() => setView("grid")} className={cn("flex size-10 items-center justify-center rounded-xl", view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary")}><Grid2X2 className="size-4" /></button>
        <button type="button" aria-label="List product view" onClick={() => setView("list")} className={cn("flex size-10 items-center justify-center rounded-xl", view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary")}><List className="size-4" /></button>
        <span className="h-6 w-px bg-border" />
        <button type="button" onClick={() => setOpen(true)} className="flex h-10 items-center gap-2 rounded-xl bg-foreground px-3 text-sm font-semibold text-background shadow-sm transition hover:opacity-90"><Calculator className="size-4" /><span className="hidden sm:inline">Calculator</span></button>
      </div>
    </div>
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetContent className="max-h-[90dvh] overflow-y-auto">
        <BottomSheetHeader><BottomSheetTitle className="flex items-center gap-2"><Calculator className="size-5" />Business calculator</BottomSheetTitle></BottomSheetHeader>
        <div className="space-y-5 px-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price" value={price} onChange={setPrice} prefix={currency} />
            <Field label="Quantity" value={quantity} onChange={setQuantity} stepper min="1" />
            <Field label="Discount %" value={discount} onChange={setDiscount} />
            <Field label="Tax %" value={tax} onChange={setTax} />
          </div>
          <div className="rounded-2xl bg-secondary/60 p-4">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span className="numeric font-semibold">{formatMoney(values.base, currency)}</span></div>
            <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Discount</span><span className="numeric">−{formatMoney(values.discountAmount, currency)}</span></div>
            <div className="mt-2 flex justify-between text-sm"><span className="text-muted-foreground">Tax</span><span className="numeric">{formatMoney(values.taxAmount, currency)}</span></div>
            <div className="mt-4 flex items-end justify-between border-t border-border pt-4"><span className="font-display font-bold">Customer pays</span><span className="numeric text-2xl font-bold">{formatMoney(values.total, currency)}</span></div>
          </div>
          <Field label="Cash received" value={received} onChange={setReceived} prefix={currency} />
          <div className="flex items-center justify-between rounded-xl border border-border p-3"><span className="text-sm text-muted-foreground">Change to give</span><span className="numeric font-bold">{formatMoney(values.change, currency)}</span></div>
          <Button variant="outline" className="w-full" onClick={clear}>Clear calculator</Button>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  </>;
}

function Field({ label, value, onChange, prefix, stepper, min }: { label: string; value: string; onChange: (value: string) => void; prefix?: string; stepper?: boolean; min?: string }) {
  const change = (delta: number) => { const next = Math.max(Number(min ?? 0), (Number(value) || 0) + delta); onChange(String(next)); };
  return <label className="block text-sm font-semibold"><span className="mb-1.5 block text-xs text-muted-foreground">{label}</span><div className="relative flex items-center"><Input inputMode="decimal" min={min} value={value} onChange={(e) => onChange(e.target.value)} className={cn(prefix && "pr-12", stepper && "pr-20")} />{prefix && <span className="pointer-events-none absolute right-3 text-xs font-semibold text-muted-foreground">{prefix}</span>}{stepper && <span className="absolute right-1 flex items-center gap-0.5"><button type="button" onClick={() => change(-1)} className="flex size-8 items-center justify-center rounded-lg hover:bg-secondary"><Minus className="size-3.5" /></button><button type="button" onClick={() => change(1)} className="flex size-8 items-center justify-center rounded-lg hover:bg-secondary"><Plus className="size-3.5" /></button></span>}</div></label>;
}
