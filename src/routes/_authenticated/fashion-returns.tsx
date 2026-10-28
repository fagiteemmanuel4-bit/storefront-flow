import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Search, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/currency";
import { formatDateTime, errorMessage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/fashion-returns")({ component: FashionReturnsPage });
type Sale = { id: string; reference: string; branch_id: string; created_at: string; total: number; payment_method: string };
type SaleItem = { id: string; product_id: string | null; product_name: string; quantity: number; unit_price: number; line_total: number; variant_size: string | null; variant_color: string | null };

function FashionReturnsPage() {
  const { store, branch } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const [searchText, setSearchText] = useState("");
  const [activeReference, setActiveReference] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const db = supabase as any;

  const saleQuery = useQuery({
    queryKey: ["fashion-return-sale", storeId, activeReference],
    enabled: Boolean(storeId && activeReference),
    queryFn: async () => {
      const { data, error } = await db.from("sales").select("id,reference,branch_id,created_at,total,payment_method").eq("store_id", storeId!).eq("reference", activeReference).maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as Sale | null;
    },
  });
  const sale = saleQuery.data;
  const itemsQuery = useQuery({
    queryKey: ["fashion-return-items", sale?.id],
    enabled: Boolean(sale?.id),
    queryFn: async () => {
      const { data, error } = await db.from("sale_items").select("id,product_id,product_name,quantity,unit_price,line_total,variant_size,variant_color").eq("sale_id", sale!.id).order("product_name");
      if (error) throw new Error(error.message);
      return (data ?? []) as SaleItem[];
    },
  });
  const previousReturnsQuery = useQuery({
    queryKey: ["fashion-return-quantities", sale?.id],
    enabled: Boolean(sale?.id),
    queryFn: async () => {
      const { data, error } = await db.from("sale_return_items").select("sale_item_id,quantity").eq("sale_id", sale!.id);
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{ sale_item_id: string; quantity: number }>;
    },
  });
  const returned = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of previousReturnsQuery.data ?? []) map.set(row.sale_item_id, (map.get(row.sale_item_id) ?? 0) + row.quantity);
    return map;
  }, [previousReturnsQuery.data]);

  useEffect(() => { setQuantities({}); setReason(""); }, [sale?.id]);

  async function processReturn() {
    if (!storeId || !sale) return;
    const items = (itemsQuery.data ?? []).map((item) => ({ sale_item_id: item.id, quantity: Number(quantities[item.id] ?? 0) })).filter((item) => item.quantity > 0);
    if (!items.length) { toast.error("Enter a return quantity for at least one item."); return; }
    if (reason.trim().length < 3) { toast.error("Add a short reason for the return or exchange."); return; }
    setSaving(true);
    try {
      const { data, error } = await db.rpc("process_fashion_return", { _store_id: storeId, _sale_id: sale.id, _reason: reason.trim(), _items: items });
      if (error) throw new Error(error.message);
      const { data: saved } = await db.from("sale_returns").select("reference").eq("id", data).maybeSingle();
      toast.success("Return " + (saved?.reference ?? "") + " recorded and stock restored.");
      setQuantities({});
      setReason("");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fashion-return-quantities", sale.id] }),
        queryClient.invalidateQueries({ queryKey: ["products", storeId] }),
        queryClient.invalidateQueries({ queryKey: ["fashion-variant-stock", storeId] }),
      ]);
    } catch (error) {
      toast.error(errorMessage(error, "The return could not be recorded."));
    } finally {
      setSaving(false);
    }
  }

  return <AppShell title="Returns & exchanges">
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary"><ArrowLeftRight className="size-5"/></span><div><h2 className="font-display text-lg font-bold">Find the original sale</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Enter the receipt reference. Strap checks previous returns and restores the exact size/colour stock where available.</p></div></div>
        <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={(event)=>{event.preventDefault();setActiveReference(searchText.trim());}}>
          <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={searchText} onChange={(event)=>setSearchText(event.target.value)} className="h-12 pl-9" placeholder="e.g. KUD-20261028-…"/></div>
          <Button type="submit" className="h-12" disabled={!searchText.trim()}><Search className="mr-2 size-4"/>Find sale</Button>
        </form>
        {saleQuery.isFetching && <p className="mt-3 text-sm text-muted-foreground">Looking up sale…</p>}
        {saleQuery.error && <p className="mt-3 text-sm text-destructive">{errorMessage(saleQuery.error,"Sale lookup failed.")}</p>}
        {activeReference && !saleQuery.isFetching && !saleQuery.error && !sale && <p className="mt-3 text-sm text-muted-foreground">No sale found with that reference in this store.</p>}
      </section>

      {sale && <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border bg-secondary/35 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Original receipt</p><h2 className="mt-1 font-display text-xl font-bold">{sale.reference}</h2><p className="mt-1 text-xs text-muted-foreground">{formatDateTime(sale.created_at)} · {sale.payment_method}</p></div>
          <div className="sm:text-right"><p className="text-xs text-muted-foreground">Original sale total</p><p className="numeric text-2xl font-bold">{formatMoney(Number(sale.total),currency)}</p></div>
        </div>
        {itemsQuery.isLoading ? <div className="p-5 text-sm text-muted-foreground">Loading sale items…</div> : itemsQuery.error ? <div className="p-5 text-sm text-destructive">{errorMessage(itemsQuery.error,"Sale items could not be loaded.")}</div> : <div className="divide-y divide-border">
          {(itemsQuery.data ?? []).map((item) => {
            const alreadyReturned = returned.get(item.id) ?? 0;
            const remaining = Math.max(0,item.quantity-alreadyReturned);
            const selectedQuantity = Number(quantities[item.id] ?? 0);
            return <div key={item.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_110px_125px] sm:items-center sm:p-5">
              <div className="min-w-0"><p className="font-semibold">{item.product_name}</p>{item.variant_size && item.variant_color && <p className="mt-1 text-xs font-medium text-accent-ink">{item.variant_size} / {item.variant_color}</p>}<p className="mt-1 text-xs text-muted-foreground">{formatMoney(Number(item.unit_price),currency)} each · Sold {item.quantity}{alreadyReturned>0?" · Returned "+alreadyReturned:""}</p></div>
              <div className="flex items-center justify-between gap-2 sm:block"><label htmlFor={"return-"+item.id} className="text-xs font-semibold text-muted-foreground">Return qty</label><Input id={"return-"+item.id} type="number" min={0} max={remaining} step={1} disabled={remaining===0} value={quantities[item.id] ?? "0"} onChange={(event)=>setQuantities((current)=>({...current,[item.id]:event.target.value}))} className="h-10 w-24 text-right sm:mt-1 sm:w-full"/></div>
              <p className="numeric text-sm font-semibold sm:text-right">{formatMoney(Number(item.unit_price)*Math.max(0,selectedQuantity),currency)}</p>
              {remaining===0 && <p className="text-xs font-medium text-success sm:col-span-3">Fully returned</p>}
            </div>;
          })}
        </div>}
        <div className="border-t border-border p-5">
          <label className="mb-1.5 block text-sm font-semibold">Reason / exchange note</label>
          <textarea value={reason} onChange={(event)=>setReason(event.target.value)} rows={3} maxLength={500} className="field w-full resize-y" placeholder="e.g. Size exchange, wrong colour, damaged item…"/>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-lg text-xs leading-5 text-muted-foreground">This records the returned items and restores stock. For an exchange, record the replacement as a new sale after this return is saved.</p><Button className="h-12 shrink-0" disabled={saving||itemsQuery.isLoading} onClick={()=>void processReturn()}><Undo2 className="mr-2 size-4"/>{saving?"Saving return…":"Record return"}</Button></div>
        </div>
      </section>}
    </div>
  </AppShell>;
}
