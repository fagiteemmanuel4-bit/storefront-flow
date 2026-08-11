import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, ScanLine, Search, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "Stock & products — Kudi" },
      {
        name: "description",
        content: "Add products, scan barcodes and keep per-location stock counts accurate.",
      },
      { property: "og:title", content: "Stock & products — Kudi" },
      { property: "og:description", content: "Products, barcodes and per-location stock." },
    ],
  }),
  component: ProductsPage,
});

export async function fetchProductsWithStock(
  storeId: string,
  branchId: string,
): Promise<ProductWithStock[]> {
  const [{ data: products, error: productError }, { data: stock, error: stockError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("store_id", storeId)
        .eq("is_active", true)
        .order("name"),
      supabase.from("branch_stock").select("product_id, quantity").eq("branch_id", branchId),
    ]);
  if (productError) throw new Error(productError.message);
  if (stockError) throw new Error(stockError.message);
  const byProduct = new Map((stock ?? []).map((s) => [s.product_id, s.quantity]));
  return (products ?? []).map((p) => ({ ...p, quantity: byProduct.get(p.id) ?? 0 }));
}

function ProductsPage() {
  const { store, branch, role } = useStoreContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [scanning, setScanning] = useState(false);
  const [editing, setEditing] = useState<ProductWithStock | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProductWithStock | null>(null);
  const [deleting, setDeleting] = useState(false);

  const storeId = store?.id ?? null;
  const branchId = branch?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const mayManage = canManageCatalog(role);

  const productsQuery = useQuery({
    queryKey: ["products", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: () => fetchProductsWithStock(storeId as string, branchId as string),
  });

  const products = useMemo(() => {
    const list = productsQuery.data ?? [];
    const term = search.trim().toLowerCase();
    if (!term) return list;
    return list.filter((p) =>
      [p.name, p.sku, p.barcode, p.category].some((field) => field.toLowerCase().includes(term)),
    );
  }, [productsQuery.data, search]);

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["products"] });
    await queryClient.invalidateQueries({ queryKey: ["low-stock"] });
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("products").delete().eq("id", pendingDelete.id);
      if (error) throw new Error(error.message);
      await refresh();
      toast.success(`${pendingDelete.name} removed`);
      setPendingDelete(null);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't remove this product."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Stock & products">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU or barcode"
            className="h-12 pl-9"
            aria-label="Search products"
          />
        </div>
        <Button
          variant="outline"
          className="h-12 touch-target"
          onClick={() => setScanning(true)}
          aria-label="Search by scanning a barcode"
        >
          <ScanLine className="size-4" aria-hidden />
          <span className="hidden sm:inline">Scan</span>
        </Button>
        {mayManage && (
          <Button
            className="h-12 touch-target"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" aria-hidden /> Add product
          </Button>
        )}
      </div>

      <div className="surface-card mt-5 overflow-hidden">
        {productsQuery.isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : productsQuery.error ? (
          <p className="p-5 text-sm text-destructive">
            {errorMessage(productsQuery.error, "Products could not be loaded.")}
          </p>
        ) : products.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-display text-lg font-semibold">
              {search ? "Nothing matched that search" : "No products yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search
                ? "Try a different name or barcode."
                : "Add your first product to start selling."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {products.map((product) => {
              const low = product.quantity <= product.low_stock_threshold;
              return (
                <li
                  key={product.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{product.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[product.category, product.barcode && `#${product.barcode}`]
                        .filter(Boolean)
                        .join(" · ") || "No barcode"}
                    </p>
                  </div>
                  <span
                    className={`numeric rounded-md px-2.5 py-1 text-xs font-bold ${
                      low ? "bg-warning-soft text-accent-ink" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {product.quantity} in stock
                  </span>
                  <span className="numeric w-24 text-right text-sm font-bold">
                    {formatMoney(Number(product.price), currency)}
                  </span>
                  {mayManage && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="touch-target"
                        aria-label={`Edit ${product.name}`}
                        onClick={() => {
                          setEditing(product);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="touch-target text-destructive"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => setPendingDelete(product)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {storeId && branchId && (
        <ProductFormDialog
          open={formOpen}
          onOpenChange={setFormOpen}
          storeId={storeId}
          branchId={branchId}
          product={editing}
          onSaved={refresh}
        />
      )}

      <BarcodeScannerDialog
        open={scanning}
        onOpenChange={setScanning}
        onDetected={(value) => setSearch(value)}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The product and its stock counts are deleted. Past sales keep their record of what was
              sold.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? "Removing…" : "Remove product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
