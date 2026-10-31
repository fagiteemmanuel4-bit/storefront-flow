import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  Copy,
  Edit3,
  Package,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { ProductFormDialog } from "@/components/pos/ProductFormDialog";
import { BarcodeScannerDialog } from "@/components/pos/BarcodeScannerDialog";
import { formatMoney } from "@/lib/currency";
import { errorMessage } from "@/lib/format";
import { canManageCatalog, type ProductWithStock } from "@/lib/pos-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";
import { getBusinessMode } from "@/lib/business-modes";
import { onlineSupabase } from "@/integrations/supabase/online-client";

export const Route = createFileRoute("/_authenticated/products")({ component: ProductsPage });
export async function fetchProductsWithStock(
  storeId: string,
  branchId: string,
): Promise<ProductWithStock[]> {
  const [{ data: products, error: pe }, { data: stock, error: se }] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("name"),
    supabase.from("branch_stock").select("product_id,quantity").eq("branch_id", branchId),
  ]);
  if (pe) throw new Error(pe.message);
  if (se) throw new Error(se.message);
  const map = new Map((stock ?? []).map((row) => [row.product_id, row.quantity]));
  return (products ?? []).map((product) => ({
    ...product,
    quantity: map.get(product.id) ?? 0,
  })) as ProductWithStock[];
}

type Filter = "all" | "low" | "out" | "published";
function ProductsPage() {
  const { store, branch, role } = useStoreContext();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<ProductWithStock | null>(null);
  const [editing, setEditing] = useState<ProductWithStock | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const canManage = canManageCatalog(role);
  const storeId = store?.id ?? null;
  const branchId = branch?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const businessMode = getBusinessMode(
    (store?.storefront_settings as any)?.businessMode ?? store?.business_type,
  );
  const isFashion = businessMode.key === "fashion";
  const isGrocery = businessMode.key === "grocery-provision";
  const query = useQuery({
    queryKey: ["products", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: () => fetchProductsWithStock(storeId!, branchId!),
  });
  const products = query.data ?? [];
  const fashionDetailsQuery = useQuery({
    queryKey: ["fashion-product-details", storeId],
    enabled: Boolean(isFashion && storeId),
    queryFn: async () => {
      const db = supabase as any;
      const { data, error } = await db
        .from("product_fashion_details")
        .select("product_id,size_options,color_options,material,style_notes")
        .eq("store_id", storeId!);
      if (error) throw new Error(error.message);
      return Object.fromEntries((data ?? []).map((row: any) => [row.product_id, row]));
    },
  });
  const onlineStoreQuery = useQuery({
    queryKey: ["fashion-share-store", storeId],
    enabled: Boolean(isFashion && storeId),
    queryFn: async () => {
      const { data, error } = await onlineSupabase
        .from("online_stores")
        .select("slug,display_name,is_published,setup_completed")
        .eq("store_id", storeId!)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    },
  });
  const variantStockQuery = useQuery({
    queryKey: ["fashion-variant-stock", storeId, branchId],
    enabled: Boolean(isFashion && storeId && branchId),
    queryFn: async () => {
      const db = supabase as any;
      const { data, error } = await db
        .from("fashion_variant_stock")
        .select("id,product_id,size,color,quantity")
        .eq("store_id", storeId!)
        .eq("branch_id", branchId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{
        id: string;
        product_id: string;
        size: string;
        color: string;
        quantity: number;
      }>;
    },
  });
  const batchStockQuery = useQuery({
    queryKey: ["inventory-batch-products", storeId, branchId],
    enabled: Boolean(isGrocery && storeId && branchId),
    queryFn: async () => {
      const db = supabase as any;
      const { data, error } = await db
        .from("inventory_batches")
        .select("product_id")
        .eq("store_id", storeId!)
        .eq("branch_id", branchId!);
      if (error) throw new Error(error.message);
      return new Set((data ?? []).map((row: any) => row.product_id as string));
    },
  });
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      const text =
        `${p.name} ${p.category ?? ""} ${isFashion ? "" : `${p.sku ?? ""} ${p.barcode ?? ""}`}`.toLowerCase();
      if (term && !text.includes(term)) return false;
      if (filter === "low") return p.quantity > 0 && p.quantity <= p.low_stock_threshold;
      if (filter === "out") return p.quantity < 1;
      if (filter === "published") return Boolean((p as any).is_published);
      return true;
    });
  }, [products, search, filter, isFashion]);
  const refresh = async () => {
    await client.invalidateQueries({ queryKey: ["products", storeId, branchId] });
    setSelected(null);
  };
  function shareFashionProduct(product: ProductWithStock) {
    const details = (fashionDetailsQuery.data as Record<string, any> | undefined)?.[product.id];
    const sizeList = (details?.size_options ?? []) as string[];
    const colorList = (details?.color_options ?? []) as string[];
    const variants = (variantStockQuery.data ?? []).filter(
      (v) => v.product_id === product.id && v.quantity > 0,
    );
    const storefront = onlineStoreQuery.data;
    const link =
      storefront?.slug && storefront.is_published
        ? `${window.location.origin}/store/${storefront.slug}`
        : "";
    const lines = [
      `✨ ${product.name}`,
      `Price: ${formatMoney(Number(product.price), currency)}`,
      product.category ? `Category: ${product.category}` : "",
      sizeList.length ? `Available sizes: ${sizeList.join(", ")}` : "",
      colorList.length ? `Colours: ${colorList.join(", ")}` : "",
      variants.length
        ? `In stock by option: ${variants.map((v) => `${v.size} / ${v.color}: ${v.quantity}`).join("; ")}`
        : "",
      details?.material ? `Fabric: ${details.material}` : "",
      details?.style_notes ? `Details: ${details.style_notes}` : "",
      product.image_url ? `Photo: ${product.image_url}` : "",
      link ? `Shop online: ${link}` : "",
      `Available at ${store?.name ?? "our store"}. Message us to order.`,
    ].filter(Boolean);
    window.open(
      `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  async function duplicate() {
    if (!selected || !canManage) return;
    const payload = { ...selected, name: `${selected.name} copy`, sku: null, barcode: null };
    delete (payload as any).id;
    delete (payload as any).quantity;
    delete (payload as any).created_at;
    delete (payload as any).updated_at;
    const { error } = await supabase.from("products").insert(payload as any);
    if (error) toast.error(error.message);
    else {
      toast.success("Product duplicated");
      await refresh();
    }
  }
  async function adjustStock(delta: number) {
    if (!selected || !branchId || !canManage) return;
    if (isFashion && (variantStockQuery.data ?? []).some((v) => v.product_id === selected.id)) {
      toast.error(
        "This style has size/colour stock. Edit the product to adjust the exact variant instead.",
      );
      return;
    }
    if (isGrocery && batchStockQuery.isLoading) {
      toast.error("Checking batch tracking; try again in a moment.");
      return;
    }
    if (isGrocery && batchStockQuery.data?.has(selected.id)) {
      toast.error(
        "This product is batch-tracked. Receive or adjust stock from Batch & expiry inventory.",
      );
      return;
    }
    const next = Math.max(0, selected.quantity + delta);
    const { error } = await supabase
      .from("branch_stock")
      .upsert(
        { branch_id: branchId, product_id: selected.id, quantity: next },
        { onConflict: "branch_id,product_id" },
      );
    if (error) toast.error(error.message);
    else {
      toast.success(`Stock set to ${next}`);
      await refresh();
    }
  }
  async function togglePublished() {
    if (!selected || !canManage) return;
    const next = !Boolean((selected as any).is_published);
    const { error } = await supabase
      .from("products")
      .update({ is_published: next })
      .eq("id", selected.id);
    if (error) toast.error(error.message);
    else {
      toast.success(next ? "Product published" : "Product unpublished");
      await refresh();
    }
  }
  async function remove() {
    if (!selected || !canManage) return;
    setDeleteBusy(true);
    const { error } = await supabase.from("products").delete().eq("id", selected.id);
    setDeleteBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Product deleted");
      await refresh();
    }
  }
  return (
    <AppShell title={isFashion ? "Fashion catalogue" : "Products"}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                isFashion ? "Search styles, names or categories" : "Search products, SKU or barcode"
              }
              className="h-12 pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {!isFashion && (
              <Button variant="outline" className="h-12" onClick={() => setScanOpen(true)}>
                Scan barcode
              </Button>
            )}
            {canManage && (
              <>
                <Button
                  variant="outline"
                  className="h-12"
                  onClick={() => void navigate({ to: "/product-import" })}
                >
                  <Upload className="mr-2 size-4" />
                  Import products
                </Button>
                <Button
                  className="h-12"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  {isFashion ? "Add clothing" : "Add product"}
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist">
          {(
            [
              ["all", "All"],
              ["low", "Low stock"],
              ["out", "Out of stock"],
              ["published", "Published"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition",
                filter === key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-surface hover:bg-secondary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <section className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="hidden border-b border-border bg-secondary/40 px-5 py-3 text-[11px] font-bold uppercase tracking-[.14em] text-muted-foreground lg:grid lg:grid-cols-[minmax(260px,1.5fr)_120px_140px_120px_52px] lg:gap-4">
            <span>Product</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Status</span>
            <span />
          </div>
          {query.isLoading ? (
            <div className="space-y-3 p-5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary" />
              ))}
            </div>
          ) : query.error ? (
            <div className="p-8 text-sm text-destructive">
              {errorMessage(query.error, "Products could not be loaded.")}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto size-9 text-muted-foreground" />
              <h2 className="mt-3 font-display text-lg font-semibold">No products found</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another filter or add your first product.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((p) => {
                const published = Boolean((p as any).is_published);
                const low = p.quantity > 0 && p.quantity <= p.low_stock_threshold;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p)}
                    className="group flex w-full items-center gap-3 px-4 py-4 text-left transition hover:bg-secondary/40 lg:grid lg:grid-cols-[minmax(260px,1.5fr)_120px_140px_120px_52px] lg:gap-4 lg:px-5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 lg:flex-initial">
                      <span className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                        {isFashion && p.image_url ? (
                          <img
                            src={p.image_url}
                            alt=""
                            loading="lazy"
                            className="size-full object-cover"
                          />
                        ) : (
                          <Package className="size-5 text-muted-foreground" />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{p.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {isFashion ? p.category || "Clothing & apparel" : `SKU ${p.sku || "—"}`}
                        </span>
                        {isFashion &&
                          Boolean(
                            (fashionDetailsQuery.data as Record<string, any> | undefined)?.[p.id],
                          ) && (
                            <span className="mt-1 block truncate text-[11px] text-muted-foreground">
                              {[
                                (
                                  (fashionDetailsQuery.data as Record<string, any>)[p.id]
                                    .size_options ?? []
                                ).join(", "),
                                (
                                  (fashionDetailsQuery.data as Record<string, any>)[p.id]
                                    .color_options ?? []
                                ).join(", "),
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                            </span>
                          )}
                        {isFashion &&
                          (variantStockQuery.data ?? []).filter((v) => v.product_id === p.id)
                            .length > 0 && (
                            <span className="mt-1 block truncate text-[10px] font-medium text-accent-ink">
                              {(variantStockQuery.data ?? [])
                                .filter((v) => v.product_id === p.id)
                                .map((v) => `${v.size}/${v.color}: ${v.quantity}`)
                                .join(" · ")}
                            </span>
                          )}
                      </span>
                    </div>
                    <span className="numeric hidden text-sm font-semibold lg:block">
                      {formatMoney(Number(p.price), currency)}
                    </span>
                    <span
                      className={cn(
                        "numeric text-xs font-bold lg:text-sm",
                        p.quantity < 1
                          ? "text-destructive"
                          : low
                            ? "text-accent-ink"
                            : "text-muted-foreground",
                      )}
                    >
                      {p.quantity} {isFashion ? "available" : "in stock"}
                    </span>
                    <span className="hidden lg:block">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          published
                            ? "bg-accent-soft text-accent-ink"
                            : "bg-secondary text-muted-foreground",
                        )}
                      >
                        {published ? "Published" : "Draft"}
                      </span>
                    </span>
                    <ChevronRight className="ml-auto size-5 text-muted-foreground transition group-hover:translate-x-0.5 lg:ml-0" />
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        storeId={storeId!}
        branchId={branchId!}
        product={editing}
        businessMode={businessMode.key}
        onSaved={refresh}
      />
      {!isFashion && (
        <BarcodeScannerDialog
          open={scanOpen}
          onOpenChange={setScanOpen}
          onDetected={(value) => setSearch(value)}
        />
      )}{" "}
      <BottomSheet
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <BottomSheetContent className="max-h-[82dvh] overflow-y-auto">
          <BottomSheetHeader>
            <BottomSheetTitle>{selected?.name ?? "Product actions"}</BottomSheetTitle>
          </BottomSheetHeader>
          {selected && (
            <div className="space-y-2 px-4 pb-5">
              <div className="mb-3 rounded-2xl bg-secondary/50 p-4">
                <p className="text-xs text-muted-foreground">
                  {selected.sku ? `SKU ${selected.sku}` : "No SKU"}
                </p>
                <p className="mt-1 text-2xl font-bold">
                  {formatMoney(Number(selected.price), currency)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {selected.quantity} {isFashion ? "available" : "in stock"}
                </p>
                {isFashion && (
                  <div className="mt-3 space-y-2 text-sm">
                    {Boolean(
                      (fashionDetailsQuery.data as Record<string, any> | undefined)?.[selected.id]
                        ?.size_options?.length,
                    ) && (
                      <p>
                        <span className="text-muted-foreground">Sizes:</span>{" "}
                        {(fashionDetailsQuery.data as Record<string, any>)[
                          selected.id
                        ].size_options.join(", ")}
                      </p>
                    )}
                    {Boolean(
                      (fashionDetailsQuery.data as Record<string, any> | undefined)?.[selected.id]
                        ?.color_options?.length,
                    ) && (
                      <p>
                        <span className="text-muted-foreground">Colours:</span>{" "}
                        {(fashionDetailsQuery.data as Record<string, any>)[
                          selected.id
                        ].color_options.join(", ")}
                      </p>
                    )}
                    {Boolean(
                      (fashionDetailsQuery.data as Record<string, any> | undefined)?.[selected.id]
                        ?.material,
                    ) && (
                      <p>
                        <span className="text-muted-foreground">Fabric:</span>{" "}
                        {(fashionDetailsQuery.data as Record<string, any>)[selected.id].material}
                      </p>
                    )}
                    {(variantStockQuery.data ?? []).some((v) => v.product_id === selected.id) && (
                      <div className="border-t border-border pt-2">
                        <p className="mb-1 font-semibold">Stock by size / colour</p>
                        {(variantStockQuery.data ?? [])
                          .filter((v) => v.product_id === selected.id)
                          .map((v) => (
                            <p key={v.id} className="flex justify-between gap-3 text-xs">
                              <span>
                                {v.size} / {v.color}
                              </span>
                              <span className="numeric font-semibold">{v.quantity} available</span>
                            </p>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              {isFashion && (
                <button
                  className="flex w-full items-center gap-3 rounded-xl p-3 text-left font-semibold text-emerald-700 hover:bg-emerald-500/10"
                  onClick={() => shareFashionProduct(selected)}
                >
                  <Share2 className="size-4" />
                  Share on WhatsApp
                </button>
              )}
              {canManage && (
                <>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-secondary"
                    onClick={() => {
                      setEditing(selected);
                      setSelected(null);
                      setFormOpen(true);
                    }}
                  >
                    <Edit3 className="size-4" />
                    Edit product
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-secondary"
                    onClick={() => void duplicate()}
                  >
                    <Copy className="size-4" />
                    Duplicate
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-secondary"
                    onClick={() => void adjustStock(1)}
                  >
                    <SlidersHorizontal className="size-4" />
                    Increase stock
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-secondary"
                    onClick={() => void adjustStock(-1)}
                  >
                    <SlidersHorizontal className="size-4" />
                    Decrease stock
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-secondary"
                    onClick={() => void togglePublished()}
                  >
                    <Upload className="size-4" />
                    {Boolean((selected as any).is_published) ? "Unpublish" : "Publish"}
                  </button>
                  <button
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left text-destructive hover:bg-destructive/10"
                    onClick={() => void remove()}
                    disabled={deleteBusy}
                  >
                    <Trash2 className="size-4" />
                    {deleteBusy ? "Deleting…" : "Delete"}
                  </button>
                </>
              )}
            </div>
          )}
        </BottomSheetContent>
      </BottomSheet>
    </AppShell>
  );
}
