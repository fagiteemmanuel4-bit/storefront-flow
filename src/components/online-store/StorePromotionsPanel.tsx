import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, Percent, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/currency";

type Props = { storeId: string; currency: string; canManage: boolean };
type Row = {
  product: { id: string; name: string; price: number; category: string | null };
  online: any;
};

export function StorePromotionsPanel({ storeId, currency, canManage }: Props) {
  const client = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [type, setType] = useState<"percentage" | "fixed">("percentage");
  const [value, setValue] = useState("");
  const [label, setLabel] = useState("Special offer");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [saving, setSaving] = useState(false);
  const query = useQuery({
    queryKey: ["store-promotions-products", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [products, online] = await Promise.all([
        supabase.from("products").select("id,name,price,category").eq("store_id", storeId).eq("is_active", true).order("name"),
        (supabase as any).from("online_products").select("*").eq("store_id", storeId),
      ]);
      if (products.error) throw new Error(products.error.message);
      if (online.error) throw new Error(online.error.message);
      const map = new Map((online.data || []).map((row: any) => [row.product_id, row]));
      return (products.data || []).map((product: any) => ({ product, online: map.get(product.id) || null })) as Row[];
    },
  });
  const rows = query.data || [];
  const published = useMemo(() => rows.filter((row) => row.online?.enabled), [rows]);
  const selectedRows = published.filter((row) => selected.includes(row.product.id));
  const amount = Number(value);
  const invalid = !Number.isFinite(amount) || amount <= 0 || (type === "percentage" && amount > 100);
  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }
  async function save() {
    if (!canManage || !selectedRows.length) return;
    if (invalid) {
      toast.error(type === "percentage" ? "Enter a percentage between 0 and 100." : "Enter a discount amount greater than zero.");
      return;
    }
    if (starts && ends && new Date(ends) <= new Date(starts)) {
      toast.error("The end date must be after the start date.");
      return;
    }
    setSaving(true);
    try {
      for (const row of selectedRows) {
        const online = row.online || {};
        const slug = online.slug || row.product.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const { error } = await (supabase as any).from("online_products").upsert({
          store_id: storeId,
          product_id: row.product.id,
          enabled: true,
          featured: online.featured || false,
          description: online.description || "",
          slug,
          discount_type: type,
          discount_value: amount,
          discount_label: label.trim() || "Sale",
          discount_starts_at: starts ? new Date(starts).toISOString() : null,
          discount_ends_at: ends ? new Date(ends).toISOString() : null,
        }, { onConflict: "product_id" });
        if (error) throw new Error(error.message);
      }
      await Promise.all([
        client.invalidateQueries({ queryKey: ["store-promotions-products", storeId] }),
        client.invalidateQueries({ queryKey: ["online-catalog-products", storeId] }),
        client.invalidateQueries({ queryKey: ["public-store-products"] }),
      ]);
      toast.success("Promotion saved for " + selectedRows.length + " product(s).");
      setSelected([]);
      setValue("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this promotion.");
    } finally {
      setSaving(false);
    }
  }
  async function clear(row: Row) {
    if (!row.online) return;
    const { error } = await (supabase as any).from("online_products").update({
      discount_type: null, discount_value: null, discount_starts_at: null, discount_ends_at: null, discount_label: "",
    }).eq("store_id", storeId).eq("product_id", row.product.id);
    if (error) toast.error(error.message);
    else {
      await client.invalidateQueries({ queryKey: ["store-promotions-products", storeId] });
      await client.invalidateQueries({ queryKey: ["online-catalog-products", storeId] });
      toast.success("Promotion removed.");
    }
  }
  return (
    <section className="mt-4 overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
      <details>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5">
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent-ink"><Percent className="size-5" /></span>
            <span className="min-w-0">
              <span className="block font-bold">Promotions & discounts</span>
              <span className="block text-sm text-muted-foreground">Set sale prices for one or many published products</span>
            </span>
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{published.filter((row) => row.online?.discount_type).length} on sale</span>
        </summary>
        <div className="grid gap-5 border-t border-border p-4 lg:grid-cols-[1.1fr_.9fr] lg:p-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">Choose products</h3>
              <button type="button" className="text-xs font-semibold underline" onClick={() => setSelected(selected.length === published.length ? [] : published.map((row) => row.product.id))}>{selected.length === published.length ? "Clear selection" : "Select all published"}</button>
            </div>
            {query.isLoading ? <p className="text-sm text-muted-foreground">Loading products…</p> : published.length === 0 ? <p className="rounded-2xl bg-secondary/50 p-4 text-sm text-muted-foreground">Publish products to your online store first. Your own POS products can be published from this catalogue.</p> : (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {published.map((row) => (
                  <label key={row.product.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border p-3 transition hover:bg-secondary/50">
                    <input type="checkbox" checked={selected.includes(row.product.id)} onChange={() => toggle(row.product.id)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{row.product.name}</span>
                      <span className="block text-xs text-muted-foreground">{formatMoney(Number(row.product.price), currency)}{row.online?.discount_type ? " · Promotion active" : ""}</span>
                    </span>
                    {row.online?.discount_type && <button type="button" className="rounded-lg p-2 text-muted-foreground hover:bg-secondary" title="Remove promotion" onClick={(event) => { event.preventDefault(); void clear(row); }}><X className="size-4" /></button>}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-2"><Tag className="size-4" /><h3 className="font-semibold">Discount setup</h3></div>
            <label className="block space-y-1.5 text-sm font-medium">Discount type
              <select className="field" value={type} onChange={(event) => setType(event.target.value as "percentage" | "fixed")}>
                <option value="percentage">Percentage off (%)</option>
                <option value="fixed">Fixed amount off ({currency === "NGN" ? "₦" : currency})</option>
              </select>
            </label>
            <label className="block space-y-1.5 text-sm font-medium">Discount value
              <input className="field" type="number" min="0.01" max={type === "percentage" ? 100 : undefined} step="0.01" value={value} onChange={(event) => setValue(event.target.value)} placeholder={type === "percentage" ? "e.g. 15" : "e.g. 2500"} />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">Sale label
              <input className="field" maxLength={40} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Weekend sale, Flash deal…" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium">Starts (optional)
                <input className="field" type="datetime-local" value={starts} onChange={(event) => setStarts(event.target.value)} />
              </label>
              <label className="block space-y-1.5 text-sm font-medium">Ends (optional)
                <input className="field" type="datetime-local" value={ends} onChange={(event) => setEnds(event.target.value)} />
              </label>
            </div>
            {selectedRows.length > 0 && !invalid && (
              <div className="rounded-xl border border-border bg-surface p-3 text-sm">
                <p className="mb-2 font-semibold">Price preview</p>
                {selectedRows.slice(0, 3).map((row) => {
                  const sale = Math.max(0, Number(row.product.price) - (type === "percentage" ? Number(row.product.price) * amount / 100 : amount));
                  return <div key={row.product.id} className="flex justify-between gap-2 py-1"><span className="truncate">{row.product.name}</span><span className="shrink-0 font-semibold">{formatMoney(sale, currency)} <span className="font-normal text-muted-foreground line-through">{formatMoney(Number(row.product.price), currency)}</span></span></div>;
                })}
                {selectedRows.length > 3 && <p className="mt-1 text-xs text-muted-foreground">Plus {selectedRows.length - 3} more products.</p>}
              </div>
            )}
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><CalendarClock className="mt-0.5 size-4 shrink-0" />Start and end dates activate and expire the sale automatically. Discounts change storefront prices only; your POS base prices and stock are not changed.</p>
            <Button className="w-full" disabled={!canManage || !selectedRows.length || invalid || saving} onClick={() => void save()}>{saving ? "Saving promotion…" : "Apply to " + selectedRows.length + " product(s)"}</Button>
          </div>
        </div>
      </details>
    </section>
  );
}
