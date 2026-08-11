import { useEffect, useState } from "react";
import { ScanLine } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import type { ProductWithStock } from "@/lib/pos-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarcodeScannerDialog } from "@/components/pos/BarcodeScannerDialog";

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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{product ? "Edit product" : "Add product"}</DialogTitle>
            <DialogDescription>
              Prices are shared across every location. Stock counts are per location.
            </DialogDescription>
          </DialogHeader>

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
        </DialogContent>
      </Dialog>

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
