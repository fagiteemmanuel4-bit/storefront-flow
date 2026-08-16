import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Minus, Plus, ScanLine, Search, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { BarcodeScannerDialog } from "@/components/pos/BarcodeScannerDialog";
import { fetchProductsWithStock } from "@/routes/_authenticated/products";
import { formatMoney } from "@/lib/currency";
import { errorMessage, formatDateTime } from "@/lib/format";
import { PAYMENT_METHODS, type PaymentMethod, type ProductWithStock } from "@/lib/pos-types";
import { playSaleCompleteSound } from "@/lib/sound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pos")({
  head: () => ({
    meta: [
      { title: "Sell — Kudi point of sale" },
      {
        name: "description",
        content: "Ring up a sale: scan or tap products, take payment, and print a receipt.",
      },
      { property: "og:title", content: "Sell — Kudi point of sale" },
      { property: "og:description", content: "Scan or tap products and take payment." },
    ],
  }),
  component: PosPage,
});

type CartLine = { product: ProductWithStock; quantity: number };

type Receipt = {
  reference: string;
  total: number;
  subtotal: number;
  tax: number;
  method: PaymentMethod;
  at: string;
  lines: { name: string; quantity: number; lineTotal: number }[];
};

function PosPage() {
  const { store, branch } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id ?? null;
  const branchId = branch?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const taxRate = Number(store?.tax_rate ?? 0);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [charging, setCharging] = useState(false);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["products", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: () => fetchProductsWithStock(storeId as string, branchId as string),
  });

  const products = productsQuery.data ?? [];

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      [p.name, p.sku, p.barcode, p.category].some((f) => f.toLowerCase().includes(term)),
    );
  }, [products, search]);

  const addToCart = useCallback((product: ProductWithStock) => {
    setCart((current) => {
      const existing = current.find((line) => line.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          toast.error(`Only ${product.quantity} of ${product.name} in stock here.`);
          return current;
        }
        return current.map((line) =>
          line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      if (product.quantity < 1) {
        toast.error(`${product.name} is out of stock at this location.`);
        return current;
      }
      return [...current, { product, quantity: 1 }];
    });
  }, []);

  const handleScan = useCallback(
    (value: string) => {
      const match = products.find((p) => p.barcode && p.barcode === value.trim());
      if (!match) {
        // Keep the camera running — just tell the cashier this code isn't known yet.
        toast.error(`No product with barcode ${value}. Add it under Stock first.`);
        return;
      }
      addToCart(match);
      toast.success(`${match.name} added`);
    },
    [products, addToCart],
  );


  function changeQty(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((line) => {
          if (line.product.id !== productId) return line;
          const next = line.quantity + delta;
          if (next > line.product.quantity) {
            toast.error(`Only ${line.product.quantity} in stock here.`);
            return line;
          }
          return { ...line, quantity: next };
        })
        .filter((line) => line.quantity > 0),
    );
  }

  const subtotal = cart.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0);
  const tax = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
  const total = subtotal + tax;

  async function completeSale() {
    if (!storeId || !branchId) {
      toast.error("No shop location selected.");
      return;
    }
    if (cart.length === 0) {
      toast.error("The cart is empty.");
      return;
    }
    setCharging(true);
    try {
      const { data: saleId, error } = await supabase.rpc("create_sale", {
        _store_id: storeId,
        _branch_id: branchId,
        _payment_method: method,
        _items: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })),
        _note: "",
      });
      if (error) throw new Error(error.message);
      if (!saleId) throw new Error("The sale was not recorded. Nothing has been charged.");

      // Read the saved row back so the receipt shows what the database stored,
      // not what the client hoped it stored.
      const { data: saved, error: readError } = await supabase
        .from("sales")
        .select("reference, subtotal, tax, total, payment_method, created_at")
        .eq("id", saleId)
        .single();
      if (readError) throw new Error(readError.message);
      if (!saved) throw new Error("The sale could not be confirmed. Check Today's trading.");

      playSaleCompleteSound();
      setReceipt({
        reference: saved.reference,
        subtotal: Number(saved.subtotal),
        tax: Number(saved.tax),
        total: Number(saved.total),
        method: saved.payment_method,
        at: saved.created_at,
        lines: cart.map((line) => ({
          name: line.product.name,
          quantity: line.quantity,
          lineTotal: Number(line.product.price) * line.quantity,
        })),
      });
      setCart([]);
      setCartOpen(false);
      await queryClient.invalidateQueries();
      toast.success(`Sale ${saved.reference} saved`);
    } catch (error) {
      toast.error(errorMessage(error, "The sale was not completed."));
    } finally {
      setCharging(false);
    }
  }

  const cartPanel = (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {cart.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Tap a product or scan a barcode to start.
          </p>
        ) : (
          cart.map((line) => (
            <div
              key={line.product.id}
              className="animate-line-in flex items-center gap-3 rounded-xl border border-border bg-background p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{line.product.name}</p>
                <p className="numeric text-xs text-muted-foreground">
                  {formatMoney(Number(line.product.price), currency)} each
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9"
                  aria-label={`Reduce ${line.product.name}`}
                  onClick={() => changeQty(line.product.id, -1)}
                >
                  <Minus className="size-4" aria-hidden />
                </Button>
                <span className="numeric w-7 text-center text-sm font-bold">{line.quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9"
                  aria-label={`Add another ${line.product.name}`}
                  onClick={() => changeQty(line.product.id, 1)}
                >
                  <Plus className="size-4" aria-hidden />
                </Button>
              </div>
              <span className="numeric w-20 text-right text-sm font-bold">
                {formatMoney(Number(line.product.price) * line.quantity, currency)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 text-destructive"
                aria-label={`Remove ${line.product.name}`}
                onClick={() => changeQty(line.product.id, -line.quantity)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span className="numeric">{formatMoney(subtotal, currency)}</span>
        </div>
        {taxRate > 0 && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax ({taxRate}%)</span>
            <span className="numeric">{formatMoney(tax, currency)}</span>
          </div>
        )}
        <div className="flex items-end justify-between">
          <span className="font-display text-lg font-bold">Total</span>
          <span className="numeric text-2xl font-bold">{formatMoney(total, currency)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setMethod(option.value)}
              className={cn(
                "touch-target rounded-lg border px-3 py-2 text-sm font-semibold transition-colors active:scale-[0.98]",
                method === option.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background hover:bg-secondary",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <Button
          className="h-14 w-full text-base"
          disabled={charging || cart.length === 0}
          onClick={() => void completeSale()}
        >
          {charging ? "Saving sale…" : `Charge ${formatMoney(total, currency)}`}
        </Button>
      </div>
    </div>
  );

  return (
    <AppShell title="Sell">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products"
            className="h-12 pl-9"
            aria-label="Search products"
          />
        </div>
        <Button variant="outline" className="h-12 touch-target" onClick={() => setScanning(true)}>
          <ScanLine className="size-4" aria-hidden />
          <span className="hidden sm:inline">Scan to add</span>
        </Button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div>
          {productsQuery.isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="surface-card p-8 text-center">
              <p className="font-display text-lg font-semibold">Nothing to sell yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add products under Stock, then they'll appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {visible.map((product) => {
                const out = product.quantity < 1;
                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={out}
                    onClick={() => addToCart(product)}
                    className={cn(
                      "surface-card touch-target flex flex-col items-start gap-1 p-4 text-left transition-all active:scale-[0.97]",
                      out
                        ? "cursor-not-allowed opacity-50"
                        : "hover:-translate-y-0.5 hover:shadow-lift",
                    )}
                  >
                    <span className="line-clamp-2 text-sm font-semibold">{product.name}</span>
                    <span className="numeric text-base font-bold text-accent-ink">
                      {formatMoney(Number(product.price), currency)}
                    </span>
                    <span
                      className={cn(
                        "text-xs",
                        product.quantity <= product.low_stock_threshold
                          ? "font-semibold text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {out ? "Out of stock" : `${product.quantity} in stock`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <aside className="surface-card sticky top-24 hidden h-fit p-5 lg:block">
          <h2 className="mb-4 font-display text-lg font-bold">Current sale</h2>
          {cartPanel}
        </aside>
      </div>

      {/* Mobile: cart lives in a bottom sheet triggered by a persistent bar */}
      {cart.length > 0 && (
        <div className="fixed inset-x-0 bottom-[68px] z-40 px-4 lg:hidden">
          <Button
            className="h-14 w-full justify-between text-base shadow-float"
            onClick={() => setCartOpen(true)}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className="size-4" aria-hidden />
              {cart.reduce((n, l) => n + l.quantity, 0)} item
              {cart.reduce((n, l) => n + l.quantity, 0) === 1 ? "" : "s"}
            </span>
            <span className="numeric">{formatMoney(total, currency)}</span>
          </Button>
        </div>
      )}

      <BottomSheet open={cartOpen} onOpenChange={setCartOpen}>
        <BottomSheetContent className="flex max-h-[86dvh] flex-col mx-auto w-full max-w-md">
          <BottomSheetHeader>
            <BottomSheetTitle>Current sale</BottomSheetTitle>
            <BottomSheetDescription>Review the cart, then take payment.</BottomSheetDescription>
          </BottomSheetHeader>
          {cartPanel}
        </BottomSheetContent>
      </BottomSheet>

      <BarcodeScannerDialog
        open={scanning}
        onOpenChange={setScanning}
        onDetected={handleScan}
        continuous
        footer={
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              {cart.reduce((sum, l) => sum + l.quantity, 0)} item
              {cart.reduce((sum, l) => sum + l.quantity, 0) === 1 ? "" : "s"} in cart
            </span>
            <span className="numeric font-semibold">{formatMoney(total, currency)}</span>
          </div>
        }
      />


      <BottomSheet open={Boolean(receipt)} onOpenChange={(open) => !open && setReceipt(null)}>
        <BottomSheetContent className="mx-auto w-full max-w-sm">
          <BottomSheetHeader>
            <BottomSheetTitle className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-success text-success-foreground">
                <Check className="size-4" aria-hidden />
              </span>
              Sale saved
            </BottomSheetTitle>
            <BottomSheetDescription>
              Receipt {receipt?.reference} · {receipt ? formatDateTime(receipt.at) : ""}
            </BottomSheetDescription>
          </BottomSheetHeader>
          <div className="space-y-2 border-y border-dashed border-border py-4 text-sm">
            {receipt?.lines.map((line) => (
              <div key={line.name} className="flex justify-between gap-3">
                <span className="truncate">
                  {line.quantity} × {line.name}
                </span>
                <span className="numeric">{formatMoney(line.lineTotal, currency)}</span>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="numeric">{formatMoney(receipt?.subtotal ?? 0, currency)}</span>
            </div>
            {(receipt?.tax ?? 0) > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span className="numeric">{formatMoney(receipt?.tax ?? 0, currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-display text-lg font-bold">
              <span>Paid by {receipt?.method}</span>
              <span className="numeric">{formatMoney(receipt?.total ?? 0, currency)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="h-12 flex-1"
              onClick={() => {
                if (typeof window !== "undefined") window.print();
              }}
            >
              Print
            </Button>
            <Button className="h-12 flex-1" onClick={() => setReceipt(null)}>
              New sale
            </Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </AppShell>
  );
}
