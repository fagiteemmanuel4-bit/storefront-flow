import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, CheckSquare, Eye, EyeOff, Filter, Globe2, RefreshCw, Search, Star, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/currency";
import type { OnlineProductRow } from "@/integrations/supabase/online-types";

export const Route = createFileRoute("/_authenticated/online-store/catalog")({ ssr: false, component: OnlineCatalogPage });

type Product = { id: string; name: string; category: string; price: number; image_url: string; is_active: boolean };
type CatalogRow = { product: Product; online: OnlineProductRow | null };
type FilterMode = "all" | "published" | "hidden" | "featured";

function OnlineCatalogPage() {
  const { store, role } = useStoreContext();
  const storeId = store?.id;
  const canManage = role === "owner" || role === "manager";
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<FilterMode>("all");
  const [sort, setSort] = useState<"name" | "price">("name");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);

  const productsQuery = useQuery<CatalogRow[]>({
    queryKey: ["online-catalog-products", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [{ data: products, error: productError }, { data: online, error: onlineError }] = await Promise.all([
        supabase.from("products").select("id,name,category,price,image_url,is_active").eq("store_id", storeId!).eq("is_active", true).order("name"),
        supabase.from("online_products").select("id,store_id,product_id,enabled,featured,description,created_at,updated_at").eq("store_id", storeId!),
      ]);
      if (productError) throw new Error(`Products: ${productError.message}`);
      if (onlineError) throw new Error(`Online catalog: ${onlineError.message}`);
      const map = new Map((online ?? []).map((item) => [item.product_id, item as OnlineProductRow]));
      return (products ?? []).map((product) => ({ product: product as Product, online: map.get(product.id) ?? null }));
    },
    retry: 2,
    staleTime: 10_000,
  });

  const rows = productsQuery.data ?? [];
  const categories = useMemo(() => Array.from(new Set(rows.map((r) => r.product.category).filter(Boolean))).sort(), [rows]);
  const filtered = useMemo(() => rows.filter(({ product, online }) => {
    const text = `${product.name} ${product.category}`.toLowerCase();
    const matchesText = text.includes(query.trim().toLowerCase());
    const matchesCategory = category === "all" || product.category === category;
    const published = Boolean(online?.enabled);
    const matchesStatus = status === "all" || (status === "published" && published) || (status === "hidden" && !published) || (status === "featured" && Boolean(online?.featured));
    return matchesText && matchesCategory && matchesStatus;
  }).sort((a, b) => sort === "name" ? a.product.name.localeCompare(b.product.name) : Number(b.product.price) - Number(a.product.price)), [rows, query, category, status, sort]);

  const selectedVisible = filtered.filter((r) => selected.has(r.product.id)).length;
  const allVisibleSelected = filtered.length > 0 && selectedVisible === filtered.length;
  const publishedCount = rows.filter((r) => r.online?.enabled).length;
  const featuredCount = rows.filter((r) => r.online?.featured).length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((r) => next.delete(r.product.id));
      else filtered.forEach((r) => next.add(r.product.id));
      return next;
    });
  }

  async function saveOnlineProduct(productId: string, values: { enabled?: boolean; featured?: boolean }) {
    if (!storeId || !canManage) return;
    const current = rows.find((r) => r.product.id === productId)?.online;
    const payload = { store_id: storeId, product_id: productId, enabled: values.enabled ?? current?.enabled ?? true, featured: values.featured ?? current?.featured ?? false, description: current?.description ?? "" };
    const result = await supabase.from("online_products").upsert(payload, { onConflict: "product_id" });
    if (result.error) throw new Error(result.error.message);
  }

  async function toggle(product: Product, current: OnlineProductRow | null) {
    if (!storeId || !canManage) return;
    setBusy(product.id);
    try {
      const next = !(current?.enabled ?? false);
      await saveOnlineProduct(product.id, { enabled: next, featured: current?.featured ?? false });
      await queryClient.invalidateQueries({ queryKey: ["online-catalog-products", storeId] });
      toast.success(next ? `${product.name} added to your online store` : `${product.name} hidden from your online store`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this product");
    } finally { setBusy(null); }
  }

  async function toggleFeatured(product: Product, current: OnlineProductRow | null) {
    if (!current?.enabled) { toast.error("Publish the product before featuring it."); return; }
    setBusy(product.id);
    try {
      await saveOnlineProduct(product.id, { enabled: true, featured: !current.featured });
      await queryClient.invalidateQueries({ queryKey: ["online-catalog-products", storeId] });
      toast.success(!current.featured ? `${product.name} is now featured` : `${product.name} removed from featured`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update this product"); }
    finally { setBusy(null); }
  }

  async function bulkPublish(enabled: boolean) {
    if (!storeId || !canManage || selected.size === 0) return;
    const ids = Array.from(selected);
    setBusy("bulk");
    try {
      for (const productId of ids) await saveOnlineProduct(productId, { enabled });
      setSelected(new Set());
      await queryClient.invalidateQueries({ queryKey: ["online-catalog-products", storeId] });
      toast.success(`${ids.length} product${ids.length === 1 ? "" : "s"} ${enabled ? "added to" : "removed from"} your online store`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Some products could not be updated"); }
    finally { setBusy(null); }
  }

  async function bulkFeature(featured: boolean) {
    if (!storeId || !canManage || selected.size === 0) return;
    const publishable = rows.filter((r) => selected.has(r.product.id) && r.online?.enabled);
    if (!publishable.length) { toast.error("Select published products to feature them."); return; }
    setBusy("bulk");
    try {
      for (const { product } of publishable) await saveOnlineProduct(product.id, { enabled: true, featured });
      await queryClient.invalidateQueries({ queryKey: ["online-catalog-products", storeId] });
      toast.success(`${publishable.length} product${publishable.length === 1 ? "" : "s"} ${featured ? "featured" : "unfeatured"}`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Some products could not be updated"); }
    finally { setBusy(null); }
  }

  return <AppShell title="Online catalog">
    <section className="overflow-hidden rounded-[1.75rem] border border-border bg-surface shadow-sm">
      <div className="relative overflow-hidden bg-foreground p-6 text-background sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-background/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl"><div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-background/60"><Globe2 className="size-4" /> Online store</div><h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Choose what customers can buy online.</h2><p className="mt-3 max-w-xl text-sm leading-6 text-background/65">Your POS products stay in Kudi. Publishing here simply makes them available in the public storefront.</p></div>
          <div className="grid grid-cols-3 gap-2"><Stat label="Products" value={rows.length} /><Stat label="Published" value={publishedCount} /><Stat label="Featured" value={featuredCount} /></div>
        </div>
      </div>
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[1fr_auto_auto_auto_auto]">
        <label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="field pl-10" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" /></label>
        <select className="field md:w-44" value={category} onChange={(e) => setCategory(e.target.value)}><option value="all">All categories</option>{categories.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <select className="field md:w-36" value={status} onChange={(e) => setStatus(e.target.value as FilterMode)}><option value="all">All status</option><option value="published">Published</option><option value="hidden">Not published</option><option value="featured">Featured</option></select>
        <select className="field md:w-32" value={sort} onChange={(e) => setSort(e.target.value as "name" | "price")}><option value="name">Name</option><option value="price">Price</option></select>
        <Button variant="outline" onClick={() => void productsQuery.refetch()} disabled={productsQuery.isFetching}><RefreshCw className={`mr-2 size-4 ${productsQuery.isFetching ? "animate-spin" : ""}`} />Refresh</Button>
      </div>
    </section>

    {selected.size > 0 && <div className="sticky top-[70px] z-30 mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur"><span className="mr-2 text-sm font-semibold">{selected.size} selected</span><Button size="sm" disabled={!canManage || busy === "bulk"} onClick={() => void bulkPublish(true)}><Eye className="mr-1.5 size-4" />Add to store</Button><Button size="sm" variant="outline" disabled={!canManage || busy === "bulk"} onClick={() => void bulkPublish(false)}><EyeOff className="mr-1.5 size-4" />Remove</Button><Button size="sm" variant="outline" disabled={!canManage || busy === "bulk"} onClick={() => void bulkFeature(true)}><Star className="mr-1.5 size-4" />Feature</Button><Button size="sm" variant="outline" disabled={!canManage || busy === "bulk"} onClick={() => void bulkFeature(false)}><Star className="mr-1.5 size-4" />Unfeature</Button><button className="ml-auto rounded-lg p-2 hover:bg-secondary" onClick={() => setSelected(new Set())}><X className="size-4" /></button></div>}

    <section className="mt-4 overflow-hidden rounded-[1.5rem] border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3"><button type="button" onClick={selectVisible} disabled={!canManage || filtered.length === 0} className="flex items-center gap-2 text-sm font-semibold"><CheckSquare className="size-4" />{allVisibleSelected ? "Clear visible" : "Select visible"}</button><span className="text-xs text-muted-foreground">{filtered.length} shown · {selectedVisible} selected</span></div>
      {productsQuery.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div> : productsQuery.error ? <div className="p-10 text-center"><div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><Globe2 className="size-5" /></div><h3 className="mt-4 font-display text-lg font-semibold">We couldn't load your online catalog.</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{productsQuery.error instanceof Error ? productsQuery.error.message : "The catalog service returned an unexpected error."}</p><Button className="mt-5" variant="outline" onClick={() => void productsQuery.refetch()}>Try again</Button></div> : filtered.length === 0 ? <div className="p-12 text-center"><Search className="mx-auto size-7 text-muted-foreground" /><h3 className="mt-4 font-display font-semibold">No matching products</h3><p className="mt-1 text-sm text-muted-foreground">Try another search or clear your filters.</p></div> : <ul className="divide-y divide-border">{filtered.map(({ product, online }) => { const published = Boolean(online?.enabled); const checked = selected.has(product.id); const isBusy = busy === product.id || busy === "bulk"; return <li key={product.id} className={`flex items-center gap-3 px-4 py-4 sm:gap-4 ${checked ? "bg-accent-soft/60" : ""}`}>
        <button type="button" disabled={!canManage} onClick={() => toggleSelect(product.id)} className={`flex size-5 shrink-0 items-center justify-center rounded border ${checked ? "border-foreground bg-foreground text-background" : "border-border"}`}>{checked && <Check className="size-3.5" />}</button>
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">{product.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-cover" /> : <Globe2 className="size-5 text-muted-foreground" />}</div>
        <div className="min-w-0 flex-1"><p className="truncate font-semibold">{product.name}</p><p className="truncate text-xs text-muted-foreground"><Tag className="mr-1 inline size-3" />{product.category || "Uncategorised"} · {formatMoney(Number(product.price), store?.currency ?? "NGN")}</p></div>
        {published && <button type="button" disabled={isBusy} title="Toggle featured" onClick={() => void toggleFeatured(product, online)} className={`flex size-9 items-center justify-center rounded-full ${online?.featured ? "bg-accent text-foreground" : "bg-secondary text-muted-foreground"}`}><Star className="size-4" fill={online?.featured ? "currentColor" : "none"} /></button>}
        <span className={`hidden text-xs font-semibold sm:inline ${published ? "text-success" : "text-muted-foreground"}`}>{published ? "Published" : "Not published"}</span>
        <Button size="sm" disabled={!canManage || isBusy} variant={published ? "outline" : "default"} onClick={() => void toggle(product, online)}>{published ? <><EyeOff className="mr-2 size-4" />Remove</> : <><Eye className="mr-2 size-4" />Add to store</>}</Button>
      </li>; })}</ul>}
    </section>
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>• Changes are saved immediately</span><span>• Products remain managed from Inventory</span><span>• Featured products appear first in the storefront</span></div>
  </AppShell>;
}

function Stat({ label, value }: { label: string; value: number }) { return <div className="min-w-20 rounded-xl border border-background/10 bg-background/5 px-3 py-2 text-center"><p className="text-lg font-bold tabular-nums">{value}</p><p className="text-[10px] uppercase tracking-wider text-background/50">{label}</p></div>; }
