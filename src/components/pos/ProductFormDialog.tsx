import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, ScanLine } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import type { ProductWithStock } from "@/lib/pos-types";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeScannerDialog } from "@/components/pos/BarcodeScannerDialog";
import { createShelf, fetchShelves } from "@/lib/shelves";

const schema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(120),
  sku: z.string().trim().max(60),
  barcode: z.string().trim().max(60),
  category: z.string().trim().max(60),
  price: z.number().min(0, "Price can't be negative"),
  cost: z.number().min(0, "Cost can't be negative"),
  lowStockThreshold: z.number().int().min(0, "Can't be negative"),
  quantity: z.number().int().min(0, "Can't be negative"),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  branchId: string;
  product: ProductWithStock | null;
  onSaved: () => Promise<void> | void;
};

export function ProductFormDialog({
  open,
  onOpenChange,
  storeId,
  branchId,
  product,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("0");
  const [cost, setCost] = useState("0");
  const [threshold, setThreshold] = useState("5");
  const [quantity, setQuantity] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [shelfId, setShelfId] = useState<string>("none");
  const [newShelf, setNewShelf] = useState("");
  const [addingShelf, setAddingShelf] = useState(false);
  const [creatingShelf, setCreatingShelf] = useState(false);
  const queryClient = useQueryClient();

  const shelvesQuery = useQuery({
    queryKey: ["shelves", storeId],
    enabled: Boolean(storeId) && open,
    queryFn: () => fetchShelves(storeId),
  });
  const shelves = shelvesQuery.data ?? [];

  async function handleCreateShelf() {
    setCreatingShelf(true);
    try {
      const shelf = await createShelf(storeId, newShelf);
      await queryClient.invalidateQueries({ queryKey: ["shelves", storeId] });
      setShelfId(shelf.id);
      setNewShelf("");
      setAddingShelf(false);
      toast.success(`Shelf "${shelf.name}" created`);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't create that shelf."));
    } finally {
      setCreatingShelf(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setName(product?.name ?? "");
    setSku(product?.sku ?? "");
    setBarcode(product?.barcode ?? "");
    setCategory(product?.category ?? "");
    setPrice(product ? String(product.price) : "0");
    setCost(product ? String(product.cost) : "0");
    setThreshold(product ? String(product.low_stock_threshold) : "5");
    setQuantity(product ? String(product.quantity) : "0");
    setShelfId(product?.shelf_id ?? "none");
    setAddingShelf(false);
    setNewShelf("");
  }, [open, product]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({
      name,
      sku,
      barcode,
      category,
      price: Number(price),
      cost: Number(cost),
      lowStockThreshold: Number(threshold),
      quantity: Number(quantity),
    });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const values = parsed.data;
      // Explicit values only — never write `undefined` into a column.
      const payload = {
        store_id: storeId,
        name: values.name,
        sku: values.sku,
        barcode: values.barcode,
        category: values.category,
        price: values.price,
        cost: values.cost,
        low_stock_threshold: values.lowStockThreshold,
        shelf_id: shelfId === "none" ? null : shelfId,
      };

      let productId = product?.id ?? null;

      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw new Error(error.message);
        if (!data?.id) throw new Error("The product was not saved. Please try again.");
        productId = data.id;
      }

      const { error: stockError } = await supabase.from("branch_stock").upsert(
        {
          branch_id: branchId,
          product_id: productId,
          store_id: storeId,
          quantity: values.quantity,
        },
        { onConflict: "branch_id,product_id" },
      );
      if (stockError) throw new Error(stockError.message);

      await onSaved();
      toast.success(product ? "Product updated" : "Product added");
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save this product."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent className="max-h-[90dvh] overflow-y-auto mx-auto w-full max-w-lg">
          <BottomSheetHeader>
            <BottomSheetTitle>{product ? "Edit product" : "Add product"}</BottomSheetTitle>
            <BottomSheetDescription>
              Prices are shared across every location. Stock counts are per location.
            </BottomSheetDescription>
          </BottomSheetHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name" error={errors["name"]}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
                maxLength={120}
                placeholder="Peak Milk 400g"
              />
            </Field>

            <Field label="Barcode" error={errors["barcode"]}>
              <div className="flex gap-2">
                <Input
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  className="h-12"
                  inputMode="numeric"
                  maxLength={60}
                  placeholder="Scan or type"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 shrink-0"
                  onClick={() => setScanning(true)}
                >
                  <ScanLine className="size-4" aria-hidden /> Scan
                </Button>
              </div>
            </Field>

            <Field label="Shelf">
              {addingShelf ? (
                <div className="flex gap-2">
                  <Input
                    value={newShelf}
                    onChange={(e) => setNewShelf(e.target.value)}
                    className="h-12"
                    maxLength={60}
                    placeholder="e.g. Books, Drinks, Accessories"
                  />
                  <Button
                    type="button"
                    className="h-12 shrink-0"
                    disabled={creatingShelf}
                    onClick={() => void handleCreateShelf()}
                  >
                    {creatingShelf ? "Saving…" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 shrink-0"
                    onClick={() => setAddingShelf(false)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select value={shelfId} onValueChange={setShelfId}>
                    <SelectTrigger className="h-12 flex-1">
                      <SelectValue placeholder="No shelf" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No shelf</SelectItem>
                      {shelves.map((shelf) => (
                        <SelectItem key={shelf.id} value={shelf.id}>
                          {shelf.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 shrink-0"
                    onClick={() => setAddingShelf(true)}
                  >
                    <Plus className="size-4" aria-hidden /> New
                  </Button>
                </div>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Selling price" error={errors["price"]}>
                <Input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-12"
                  inputMode="decimal"
                />
              </Field>
              <Field label="Cost price" error={errors["cost"]}>
                <Input
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="h-12"
                  inputMode="decimal"
                />
              </Field>
              <Field label="Stock at this location" error={errors["quantity"]}>
                <Input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-12"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Low-stock alert at" error={errors["lowStockThreshold"]}>
                <Input
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  className="h-12"
                  inputMode="numeric"
                />
              </Field>
              <Field label="SKU" error={errors["sku"]}>
                <Input
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="h-12"
                  maxLength={60}
                />
              </Field>
              <Field label="Category" error={errors["category"]}>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-12"
                  maxLength={60}
                />
              </Field>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" className="h-12 flex-1" disabled={saving}>
                {saving ? "Saving…" : product ? "Save changes" : "Add product"}
              </Button>
            </div>
          </form>
        </BottomSheetContent>
      </BottomSheet>

      <BarcodeScannerDialog
        open={scanning}
        onOpenChange={setScanning}
        onDetected={(value) => {
          setBarcode(value);
          toast.success(`Barcode captured: ${value}`);
        }}
      />
    </>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
