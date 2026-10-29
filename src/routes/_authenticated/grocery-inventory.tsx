import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Boxes, PackagePlus, RefreshCw, Truck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchProductsWithStock } from "@/routes/_authenticated/products";
import { formatMoney } from "@/lib/currency";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/grocery-inventory")({
  component: GroceryInventoryPage,
});
type Tab = "batches" | "restock" | "waste";
type Product = {
  id: string;
  name: string;
  quantity: number;
  low_stock_threshold: number;
  cost: number | null;
  price: number;
};
type Batch = {
  id: string;
  product_id: string;
  batch_number: string;
  expiry_date: string | null;
  quantity: number;
  cost_per_unit: number;
  supplier_name: string;
  status: string;
  received_at: string;
  notes: string;
};
type Waste = {
  id: string;
  product_id: string;
  batch_number: string;
  quantity: number;
  reason: string;
  created_at: string;
};
type SoldLine = {
  product_id: string | null;
  quantity: number;
  units_per_sale: number;
  sale_id: string;
};
type Sale = { id: string; created_at: string };

function GroceryInventoryPage() {
  const { store, branch, role } = useStoreContext();
  const client = useQueryClient();
  const db = supabase as any;
  const storeId = store?.id ?? null;
  const branchId = branch?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const canManage = role === "owner" || role === "manager";
  const [tab, setTab] = useState<Tab>("batches");
  const [productId, setProductId] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [batchQuantity, setBatchQuantity] = useState("1");
  const [batchCost, setBatchCost] = useState("0");
  const [supplierName, setSupplierName] = useState("");
  const [batchNotes, setBatchNotes] = useState("");
  const [wasteBatchId, setWasteBatchId] = useState("");
  const [wasteQuantity, setWasteQuantity] = useState("1");
  const [wasteReason, setWasteReason] = useState("");
  const [saving, setSaving] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["products", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: () => fetchProductsWithStock(storeId!, branchId!),
  });
  const batchesQuery = useQuery({
    queryKey: ["inventory-batches", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: async () => {
      const { error: refreshError } = await db.rpc("refresh_expired_inventory_batches", {
        _store_id: storeId!,
        _branch_id: branchId!,
      });
      if (refreshError) throw new Error(refreshError.message);
      const { data, error } = await db
        .from("inventory_batches")
        .select(
          "id,product_id,batch_number,expiry_date,quantity,cost_per_unit,supplier_name,status,received_at,notes",
        )
        .eq("store_id", storeId!)
        .eq("branch_id", branchId!)
        .order("expiry_date", { ascending: true, nullsFirst: false })
        .order("received_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Batch[];
    },
  });
  const wasteQuery = useQuery({
    queryKey: ["inventory-waste", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: async () => {
      const { data, error } = await db
        .from("inventory_waste_records")
        .select("id,product_id,batch_number,quantity,reason,created_at")
        .eq("store_id", storeId!)
        .eq("branch_id", branchId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as Waste[];
    },
  });
  const salesQuery = useQuery({
    queryKey: ["grocery-restock-sales", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: async () => {
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: sales, error: se } = await db
        .from("sales")
        .select("id,created_at")
        .eq("store_id", storeId!)
        .eq("branch_id", branchId!)
        .gte("created_at", since)
        .order("created_at", { ascending: false });
      if (se) throw new Error(se.message);
      const ids = (sales ?? []).map((sale: Sale) => sale.id);
      if (!ids.length) return [] as SoldLine[];
      const { data: items, error: ie } = await db
        .from("sale_items")
        .select("product_id,quantity,units_per_sale,sale_id")
        .in("sale_id", ids);
      if (ie) throw new Error(ie.message);
      return dataOrEmpty(items) as SoldLine[];
    },
  });
  const products = (productsQuery.data ?? []) as Product[];
  const batches = batchesQuery.data ?? [];
  const waste = wasteQuery.data ?? [];
  const activeBatches = batches.filter((b) => b.status === "active" && b.quantity > 0);
  const nearExpiry = activeBatches.filter(
    (b) =>
      b.expiry_date &&
      new Date(b.expiry_date + "T00:00:00").getTime() - Date.now() <= 30 * 24 * 60 * 60 * 1000 &&
      new Date(b.expiry_date + "T23:59:59").getTime() >= Date.now(),
  );
  const soldByProduct = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of salesQuery.data ?? []) {
      if (!item.product_id) continue;
      map.set(
        item.product_id,
        (map.get(item.product_id) ?? 0) + Number(item.quantity) * Number(item.units_per_sale || 1),
      );
    }
    return map;
  }, [salesQuery.data]);
  const restockSuggestions = useMemo(
    () =>
      products
        .map((p) => {
          const sold = soldByProduct.get(p.id) ?? 0;
          const daily = sold / 30;
          const target = Math.max(Number(p.low_stock_threshold || 0) * 2, Math.ceil(daily * 14));
          const latestSupplier =
            [...batches]
              .filter((batch) => batch.product_id === p.id && batch.supplier_name)
              .sort(
                (a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime(),
              )[0]?.supplier_name ?? "";
          return {
            ...p,
            sold30: sold,
            target,
            suggested: Math.max(0, target - p.quantity),
            daily,
            latestSupplier,
          };
        })
        .filter((p) => p.quantity <= p.low_stock_threshold || p.suggested > 0)
        .sort((a, b) => b.suggested - a.suggested || a.quantity - b.quantity),
    [products, soldByProduct, batches],
  );

  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["inventory-batches", storeId, branchId] }),
      client.invalidateQueries({ queryKey: ["inventory-waste", storeId, branchId] }),
      client.invalidateQueries({ queryKey: ["products", storeId, branchId] }),
      client.invalidateQueries({ queryKey: ["grocery-restock-sales", storeId, branchId] }),
    ]);
  }
  async function addBatch(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !branchId || !productId) {
      toast.error("Choose a product.");
      return;
    }
    if (!batchNumber.trim()) {
      toast.error("Enter a batch or lot number.");
      return;
    }
    const quantity = Number(batchQuantity);
    const cost = Number(batchCost);
    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error("Quantity must be a whole number greater than zero.");
      return;
    }
    if (!Number.isFinite(cost) || cost < 0) {
      toast.error("Enter a valid unit cost.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await db
        .from("inventory_batches")
        .insert({
          store_id: storeId,
          branch_id: branchId,
          product_id: productId,
          batch_number: batchNumber.trim(),
          expiry_date: expiryDate || null,
          quantity,
          cost_per_unit: cost,
          supplier_name: supplierName.trim(),
          notes: batchNotes.trim(),
        });
      if (error) throw new Error(error.message);
      toast.success("Batch received and stock updated.");
      setBatchNumber("");
      setExpiryDate("");
      setBatchQuantity("1");
      setBatchCost("0");
      setSupplierName("");
      setBatchNotes("");
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error, "Batch could not be received."));
    } finally {
      setSaving(false);
    }
  }
  async function updateBatchStatus(batch: Batch, status: string) {
    if (!canManage) return;
    const { error } = await db
      .from("inventory_batches")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", batch.id)
      .eq("store_id", storeId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Batch status updated.");
    await refresh();
  }
  async function recordWaste(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !branchId || !wasteBatchId) {
      toast.error("Choose a batch.");
      return;
    }
    const quantity = Number(wasteQuantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      toast.error("Waste quantity must be a whole number greater than zero.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await db.rpc("record_inventory_batch_waste", {
        _store_id: storeId,
        _branch_id: branchId,
        _batch_id: wasteBatchId,
        _quantity: quantity,
        _reason: wasteReason.trim(),
      });
      if (error) throw new Error(error.message);
      toast.success("Waste recorded and batch stock adjusted.");
      setWasteQuantity("1");
      setWasteReason("");
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error, "Waste could not be recorded."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Batch & expiry inventory">
      <div className="space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label-caps text-muted-foreground">Groceries & provision</p>
            <h1 className="mt-1 font-display text-2xl font-bold">
              Batches, expiry & replenishment
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track stock by lot, sell the earliest-expiring eligible batch first, and spot
              replenishment needs before shelves run empty.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: "batches", label: "Batch stock", icon: <Boxes className="size-4" /> },
                { id: "restock", label: "Restock list", icon: <Truck className="size-4" /> },
                { id: "waste", label: "Waste log", icon: <AlertTriangle className="size-4" /> },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setTab(option.id)}
                className={
                  "flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold " +
                  (tab === option.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface hover:bg-secondary")
                }
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </header>
        {tab === "batches" && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
            <section className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="flex items-center justify-between gap-3 border-b border-border p-4">
                <div>
                  <h2 className="font-display font-semibold">Batch stock</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Checkout allocates active batches by FEFO (first expiry, first out).
                  </p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">
                  {activeBatches.length} active
                </span>
              </div>
              {nearExpiry.length > 0 && (
                <div className="flex items-start gap-2 border-b border-amber-500/20 bg-amber-500/10 p-4 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700" />
                  <span>
                    {nearExpiry.length} batch(es) expire within 30 days. Sell or review these first.
                  </span>
                </div>
              )}
              {batchesQuery.isLoading ? (
                <div className="p-5 text-sm text-muted-foreground">Loading batches…</div>
              ) : batchesQuery.error ? (
                <div className="p-5 text-sm text-destructive">
                  {errorMessage(batchesQuery.error, "Batch stock could not be loaded.")}
                </div>
              ) : batches.length === 0 ? (
                <div className="p-10 text-center">
                  <Boxes className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 font-semibold">No batches recorded</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Receive the first batch to enable expiry-aware stock tracking for a product.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {batches.map((batch) => {
                    const product = products.find((p) => p.id === batch.product_id);
                    const days = batch.expiry_date
                      ? Math.ceil(
                          (new Date(batch.expiry_date + "T23:59:59").getTime() - Date.now()) /
                            (24 * 60 * 60 * 1000),
                        )
                      : null;
                    return (
                      <div
                        key={batch.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                          <Boxes className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {product?.name ?? "Product"} · {batch.batch_number}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {batch.supplier_name || "Supplier not recorded"} · Received{" "}
                            {new Date(batch.received_at).toLocaleDateString()}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {batch.expiry_date
                              ? "Expiry " +
                                new Date(batch.expiry_date + "T00:00:00").toLocaleDateString()
                              : "No expiry date recorded"}
                            {days !== null && days >= 0 && days <= 30
                              ? " · " + days + " days left"
                              : ""}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="numeric text-lg font-bold">{batch.quantity}</p>
                          <p className="text-[10px] text-muted-foreground">units</p>
                        </div>
                        <span
                          className={
                            "w-fit rounded-full px-2.5 py-1 text-xs font-semibold " +
                            (batch.status === "active"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : batch.status === "expired"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-secondary text-muted-foreground")
                          }
                        >
                          {batch.status}
                        </span>
                        {canManage && batch.status === "active" && (
                          <button
                            type="button"
                            onClick={() =>
                              void updateBatchStatus(
                                batch,
                                days !== null && days < 0 ? "expired" : "hold",
                              )
                            }
                            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                            title={days !== null && days < 0 ? "Mark expired" : "Place on hold"}
                          >
                            <AlertTriangle className="size-4" />
                          </button>
                        )}
                        {canManage && batch.status === "hold" && (days === null || days >= 0) && (
                          <button
                            type="button"
                            onClick={() => void updateBatchStatus(batch, "active")}
                            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
                            title="Reactivate batch"
                          >
                            <RefreshCw className="size-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                  <PackagePlus className="size-5" />
                </span>
                <div>
                  <h2 className="font-display font-semibold">Receive a batch</h2>
                  <p className="text-xs text-muted-foreground">
                    Active batches become the stock source for this product and branch.
                  </p>
                </div>
              </div>
              {!canManage ? (
                <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                  Only owners and managers can receive batches.
                </p>
              ) : (
                <form onSubmit={addBatch} className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold">Product</span>
                    <select
                      required
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="field h-11 w-full"
                    >
                      <option value="">Choose product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {p.quantity} in stock
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold">Batch / lot number</span>
                    <Input
                      required
                      value={batchNumber}
                      onChange={(e) => setBatchNumber(e.target.value)}
                      className="h-11"
                      placeholder="LOT-2026-001"
                    />
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold">Expiry date</span>
                      <Input
                        type="date"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        className="h-11"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold">Quantity (units)</span>
                      <Input
                        type="number"
                        min={1}
                        step={1}
                        required
                        value={batchQuantity}
                        onChange={(e) => setBatchQuantity(e.target.value)}
                        className="h-11"
                      />
                    </label>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold">Unit cost</span>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={batchCost}
                        onChange={(e) => setBatchCost(e.target.value)}
                        className="h-11"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold">Supplier</span>
                      <Input
                        value={supplierName}
                        onChange={(e) => setSupplierName(e.target.value)}
                        className="h-11"
                        placeholder="Supplier name"
                      />
                    </label>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold">Notes</span>
                    <textarea
                      value={batchNotes}
                      onChange={(e) => setBatchNotes(e.target.value)}
                      rows={2}
                      className="field w-full resize-y"
                      placeholder="Invoice, storage location or delivery notes"
                    />
                  </label>
                  <Button className="h-11 w-full" disabled={saving}>
                    {saving ? "Receiving…" : "Receive batch"}
                  </Button>
                </form>
              )}
            </section>
          </div>
        )}
        {tab === "restock" && (
          <section className="overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="border-b border-border p-4">
              <h2 className="font-display font-semibold">Supplier restock suggestions</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Suggested quantities aim for 14 days of demand or twice the low-stock threshold,
                whichever is higher. Based on the last 30 days; review before ordering.
              </p>
            </div>
            {salesQuery.isLoading || productsQuery.isLoading ? (
              <div className="p-5 text-sm text-muted-foreground">Calculating demand…</div>
            ) : salesQuery.error ? (
              <div className="p-5 text-sm text-destructive">
                {errorMessage(salesQuery.error, "Sales history could not be loaded.")}
              </div>
            ) : restockSuggestions.length === 0 ? (
              <div className="p-10 text-center">
                <RefreshCw className="mx-auto size-8 text-muted-foreground" />
                <p className="mt-3 font-semibold">Stock looks healthy</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  No products currently need a restock suggestion.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-secondary/40 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 text-left">Product</th>
                      <th className="px-5 py-3 text-right">Stock</th>
                      <th className="px-5 py-3 text-left">Last supplier</th>
                      <th className="px-5 py-3 text-right">Sold (30d)</th>
                      <th className="px-5 py-3 text-right">Target</th>
                      <th className="px-5 py-3 text-right">Suggest order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {restockSuggestions.map((p) => (
                      <tr key={p.id}>
                        <td className="px-5 py-3.5 font-semibold">{p.name}</td>
                        <td className="numeric px-5 py-3.5 text-right">{p.quantity}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">
                          {p.latestSupplier || "Not recorded"}
                        </td>
                        <td className="numeric px-5 py-3.5 text-right">{p.sold30}</td>
                        <td className="numeric px-5 py-3.5 text-right">{p.target}</td>
                        <td className="numeric px-5 py-3.5 text-right font-bold">
                          {p.suggested > 0 ? p.suggested : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        {tab === "waste" && (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]">
            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                  <AlertTriangle className="size-5" />
                </span>
                <div>
                  <h2 className="font-display font-semibold">Record batch waste</h2>
                  <p className="text-xs text-muted-foreground">
                    Record damaged, expired or spoiled stock with a reason.
                  </p>
                </div>
              </div>
              <form onSubmit={recordWaste} className="space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Batch</span>
                  <select
                    required
                    value={wasteBatchId}
                    onChange={(e) => setWasteBatchId(e.target.value)}
                    className="field h-11 w-full"
                  >
                    <option value="">Choose batch</option>
                    {batches
                      .filter((b) => b.quantity > 0)
                      .map((b) => (
                        <option key={b.id} value={b.id}>
                          {products.find((p) => p.id === b.product_id)?.name ?? "Product"} ·{" "}
                          {b.batch_number} · {b.quantity} units
                        </option>
                      ))}
                  </select>
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Quantity wasted</span>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={wasteQuantity}
                    onChange={(e) => setWasteQuantity(e.target.value)}
                    className="h-11"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Reason</span>
                  <textarea
                    required
                    value={wasteReason}
                    onChange={(e) => setWasteReason(e.target.value)}
                    rows={3}
                    className="field w-full resize-y"
                    placeholder="Expired, damaged packaging, spoilage…"
                  />
                </label>
                <Button className="h-11 w-full" disabled={saving}>
                  Record waste and adjust stock
                </Button>
              </form>
            </section>
            <section className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="border-b border-border p-4">
                <h2 className="font-display font-semibold">Recent waste records</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Latest 100 records for this branch.
                </p>
              </div>
              {wasteQuery.isLoading ? (
                <div className="p-5 text-sm text-muted-foreground">Loading waste records…</div>
              ) : wasteQuery.error ? (
                <div className="p-5 text-sm text-destructive">
                  {errorMessage(wasteQuery.error, "Waste records could not be loaded.")}
                </div>
              ) : waste.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No waste recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {waste.map((w) => (
                    <div key={w.id} className="flex items-start justify-between gap-3 p-4">
                      <div>
                        <p className="font-semibold">
                          {products.find((p) => p.id === w.product_id)?.name ?? "Product"} ·{" "}
                          {w.batch_number} · {w.quantity} units
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{w.reason}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {new Date(w.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function dataOrEmpty<T>(value: T[] | null | undefined): T[] {
  return value ?? [];
}
