import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, ScanLine, X } from "lucide-react";
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

type ProductImage = { id: string; image_url: string; sort_order: number };

type PendingImage = { file: File; preview: string };

export function ProductFormDialog({ open, onOpenChange, storeId, branchId, product, onSaved }: Props) {
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
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const queryClient = useQueryClient();

  const shelvesQuery = useQuery({ queryKey: ["shelves", storeId], enabled: Boolean(storeId) && open, queryFn: () => fetchShelves(storeId) });
  const shelves = shelvesQuery.data ?? [];
  const imageCount = existingImages.length + pendingImages.length;
  const canAddImages = imageCount < 6;

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
    setPendingImages([]);
    setExistingImages([]);
    if (product?.id) {
      void (async () => {
        const db = supabase as any;
        const { data } = await db.from("product_images").select("id,image_url,sort_order").eq("product_id", product.id).order("sort_order");
        setExistingImages((data ?? []) as ProductImage[]);
      })();
    }
  }, [open, product]);

  useEffect(() => () => pendingImages.forEach((image) => URL.revokeObjectURL(image.preview)), [pendingImages]);

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
    } finally { setCreatingShelf(false); }
  }

  function chooseImages(files: FileList | null) {
    if (!files || !canAddImages) return;
    const selected = Array.from(files).slice(0, 6 - imageCount);
    const invalid = selected.find((file) => !file.type.startsWith("image/") || file.size > 5_000_000);
    if (invalid) { toast.error("Images must be valid image files smaller than 5 MB each."); return; }
    setPendingImages((current) => [...current, ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  function removePending(index: number) {
    setPendingImages((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  async function saveImages(productId: string) {
    if (pendingImages.length === 0) return;
    const db = supabase as any;
    const startOrder = existingImages.length;
    const rows: Array<{ product_id: string; store_id: string; image_url: string; sort_order: number }> = [];
    for (let index = 0; index < pendingImages.length; index += 1) {
      const item = pendingImages[index];
      const extension = item.file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${storeId}/products/${productId}/${crypto.randomUUID()}.${extension}`;
      const upload = await supabase.storage.from("kudi-store-assets").upload(path, item.file, { upsert: false, contentType: item.file.type });
      if (upload.error) throw new Error(upload.error.message);
      const imageUrl = supabase.storage.from("kudi-store-assets").getPublicUrl(path).data.publicUrl;
      rows.push({ product_id: productId, store_id: storeId, image_url: imageUrl, sort_order: startOrder + index });
    }
    const { error } = await db.from("product_images").insert(rows);
    if (error) throw new Error(error.message);
    if (existingImages.length === 0 && rows[0]) {
      const { error: productError } = await supabase.from("products").update({ image_url: rows[0].image_url }).eq("id", productId);
      if (productError) throw new Error(productError.message);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ name, sku, barcode, category, price: Number(price), cost: Number(cost), lowStockThreshold: Number(threshold), quantity: Number(quantity) });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next); return;
    }
    setErrors({}); setSaving(true);
    try {
      const values = parsed.data;
      const payload = { store_id: storeId, name: values.name, sku: values.sku, barcode: values.barcode, category: values.category, price: values.price, cost: values.cost, low_stock_threshold: values.lowStockThreshold, shelf_id: shelfId === "none" ? null : shelfId };
      let productId = product?.id ?? null;
      if (productId) {
        const { error } = await supabase.from("products").update(payload).eq("id", productId);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw new Error(error.message);
        if (!data?.id) throw new Error("The product was not saved. Please try again.");
        productId = data.id;
      }
      const { error: stockError } = await supabase.from("branch_stock").upsert({ branch_id: branchId, product_id: productId, store_id: storeId, quantity: values.quantity }, { onConflict: "branch_id,product_id" });
      if (stockError) throw new Error(stockError.message);
      await saveImages(productId);
      await onSaved();
      toast.success(product ? "Product updated" : "Product added");
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error, "We couldn't save this product."));
    } finally { setSaving(false); }
  }

  return (
    <>
      <BottomSheet open={open} onOpenChange={onOpenChange}>
        <BottomSheetContent className="max-h-[90dvh] overflow-y-auto mx-auto w-full max-w-lg">
          <BottomSheetHeader>
            <BottomSheetTitle>{product ? "Edit product" : "Add product"}</BottomSheetTitle>
            <BottomSheetDescription>Prices are shared across every location. Stock counts are per location.</BottomSheetDescription>
          </BottomSheetHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Name" error={errors.name}><Input value={name} onChange={(e) => setName(e.target.value)} className="h-12" maxLength={120} placeholder="Peak Milk 400g" /></Field>
            <Field label="Product images">
              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((image) => <div key={image.id} className="aspect-square overflow-hidden rounded-xl border border-border bg-secondary"><img src={image.image_url} alt="" className="h-full w-full object-cover" /></div>)}
                {pendingImages.map((image, index) => <div key={image.preview} className="relative aspect-square overflow-hidden rounded-xl border border-accent bg-secondary"><img src={image.preview} alt="New product preview" className="h-full w-full object-cover" /><button type="button" onClick={() => removePending(index)} className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-foreground/80 text-background" aria-label="Remove image"><X className="size-3.5" /></button></div>)}
                {canAddImages && <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 text-center hover:bg-secondary"><ImagePlus className="size-6 text-muted-foreground" /><span className="mt-1 text-[11px] font-semibold text-muted-foreground">Add images</span><input type="file" accept="image/*" multiple className="hidden" onChange={(e) => chooseImages(e.target.files)} /></label>}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Up to 6 images. Each image must be under 5 MB. The first image becomes the main product image.</p>
            </Field>
            <Field label="Barcode" error={errors.barcode}><div className="flex gap-2"><Input value={barcode} onChange={(e) => setBarcode(e.target.value)} className="h-12" inputMode="numeric" maxLength={60} placeholder="Scan or type" /><Button type="button" variant="outline" className="h-12 shrink-0" onClick={() => setScanning(true)}><ScanLine className="size-4" /> Scan</Button></div></Field>
            <Field label="Shelf">{addingShelf ? <div className="flex gap-2"><Input value={newShelf} onChange={(e) => setNewShelf(e.target.value)} className="h-12" maxLength={60} placeholder="e.g. Books, Drinks, Accessories" /><Button type="button" className="h-12 shrink-0" disabled={creatingShelf} onClick={() => void handleCreateShelf()}>{creatingShelf ? "Saving…" : "Save"}</Button><Button type="button" variant="outline" className="h-12 shrink-0" onClick={() => setAddingShelf(false)}>Cancel</Button></div> : <div className="flex gap-2"><Select value={shelfId} onValueChange={setShelfId}><SelectTrigger className="h-12 flex-1"><SelectValue placeholder="No shelf" /></SelectTrigger><SelectContent><SelectItem value="none">No shelf</SelectItem>{shelves.map((shelf) => <SelectItem key={shelf.id} value={shelf.id}>{shelf.name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" className="h-12 shrink-0" onClick={() => setAddingShelf(true)}><Plus className="size-4" /> New</Button></div>}</Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Selling price" error={errors.price}><Input value={price} onChange={(e) => setPrice(e.target.value)} className="h-12" inputMode="decimal" /></Field>
              <Field label="Cost price" error={errors.cost}><Input value={cost} onChange={(e) => setCost(e.target.value)} className="h-12" inputMode="decimal" /></Field>
              <Field label="Stock at this location" error={errors.quantity}><Input value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-12" inputMode="numeric" /></Field>
              <Field label="Low-stock alert at" error={errors.lowStockThreshold}><Input value={threshold} onChange={(e) => setThreshold(e.target.value)} className="h-12" inputMode="numeric" /></Field>
              <Field label="SKU" error={errors.sku}><Input value={sku} onChange={(e) => setSku(e.target.value)} className="h-12" maxLength={60} /></Field>
              <Field label="Category" error={errors.category}><Input value={category} onChange={(e) => setCategory(e.target.value)} className="h-12" maxLength={60} /></Field>
            </div>
            <div className="flex gap-3 pt-1"><Button type="button" variant="outline" className="h-12 flex-1" onClick={() => onOpenChange(false)}>Cancel</Button><Button type="submit" className="h-12 flex-1" disabled={saving}>{saving ? "Saving…" : product ? "Save changes" : "Add product"}</Button></div>
          </form>
        </BottomSheetContent>
      </BottomSheet>
      <BarcodeScannerDialog open={scanning} onOpenChange={setScanning} onDetected={(value) => { setBarcode(value); toast.success(`Barcode captured: ${value}`); }} />
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}{error && <p className="text-sm text-destructive">{error}</p>}</div>;
}
