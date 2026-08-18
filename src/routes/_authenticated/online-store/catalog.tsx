import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Globe2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/currency";
import type { OnlineProductRow } from "@/integrations/supabase/online-types";

export const Route = createFileRoute("/_authenticated/online-store/catalog")({ ssr: false, component: OnlineCatalogPage });

type Product = { id: string; name: string; category: string; price: number; image_url: string; is_active: boolean };

function OnlineCatalogPage() {
  const { store, role } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id;
  const canManage = role === "owner" || role === "manager";

  const productsQuery = useQuery({
    queryKey: ["online-catalog-products", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const [{ data: products, error: productError }, { data: online, error: onlineError }] = await Promise.all([
        supabase.from("products").select("id,name,category,price,image_url,is_active").eq("store_id", storeId!).eq("is_active", true).order("name"),
        onlineSupabase.from("online_products").select("*").eq("store_id", storeId!),
      ]);
      if (productError) throw new Error(productError.message);
      if (onlineError) throw new Error(onlineError.message);
      const onlineMap = new Map((online ?? []).map((item) => [item.product_id, item]));
      return (products ?? []).map((product) => ({ product, online: onlineMap.get(product.id) ?? null }));
    },
  });

  async function toggle(product: Product, current: OnlineProductRow | null) {
    if (!storeId || !canManage) return;
    const nextEnabled = !(current?.enabled ?? false);
    const result = current
      ? await onlineSupabase.from("online_products").update({ enabled: nextEnabled }).eq("product_id", product.id)
      : await onlineSupabase.from("online_products").insert({ store_id: storeId, product_id: product.id, enabled: true, featured: false, description: "" });
    if (result.error) { toast.error(result.error.message); return; }
    await queryClient.invalidateQueries({ queryKey: ["online-catalog-products", storeId] });
    toast.success(nextEnabled ? `${product.name} is now visible online` : `${product.name} hidden from storefront`);
  }

  async function toggleFeatured(product: Product, current: OnlineProductRow | null) {
    if (!storeId || !canManage) return;
    if (!current?.enabled) { toast.error("Publish the product before featuring it."); return; }
    const result = await onlineSupabase.from("online_products").update({ featured: !current.featured }).eq("product_id", product.id);
    if (result.error) { toast.error(result.error.message); return; }
    await queryClient.invalidateQueries({ queryKey: ["online-catalog-products", storeId] });
  }

  return <AppShell title="Online catalog">
    <div className="border border-border bg-accent-soft p-5"><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center bg-accent"><Globe2 className="size-5" /></span><div><h2 className="font-display font-semibold">Choose what customers see</h2><p className="mt-1 text-sm text-muted-foreground">Your Kudi product catalog stays shared with your POS. Turn products on here to publish them to the online store.</p></div></div></div>
    <div className="surface-card mt-5 overflow-hidden">
      {productsQuery.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : productsQuery.error ? <p className="p-5 text-sm text-destructive">Could not load products.</p> : productsQuery.data?.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">Add products in Stock & products first.</p> : <ul className="divide-y divide-border">{productsQuery.data?.map(({ product, online }) => { const published = Boolean(online?.enabled); return <li key={product.id} className="flex items-center gap-4 px-5 py-4"><div className="flex size-14 shrink-0 items-center justify-center overflow-hidden bg-secondary">{product.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-cover" /> : <Globe2 className="size-5 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{product.name}</p><p className="text-xs text-muted-foreground">{product.category || "Uncategorised"} · {formatMoney(Number(product.price), store?.currency ?? "NGN")}</p></div>{published && <button type="button" title="Feature product" onClick={() => void toggleFeatured(product, online)} className={`flex size-9 items-center justify-center rounded-full ${online?.featured ? "bg-accent text-foreground" : "bg-secondary text-muted-foreground"}`}><Star className="size-4" /></button>}<span className={`hidden text-xs font-semibold sm:inline ${published ? "text-success" : "text-muted-foreground"}`}>{published ? "Published" : "Hidden"}</span><Button disabled={!canManage} variant={published ? "outline" : "default"} onClick={() => void toggle(product, online)}>{published ? <><EyeOff className="mr-2 size-4" />Hide</> : <><Eye className="mr-2 size-4" />Publish</>}</Button></li>; })}</ul>}
    </div>
    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Star className="size-3.5" /> Featured products appear first on the storefront.</div>
  </AppShell>;
}
