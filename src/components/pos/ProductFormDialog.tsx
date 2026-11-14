import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImagePlus, Package, Plus, ScanLine, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { onlineSupabase } from "@/integrations/supabase/online-client";
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
import type { BusinessModeKey } from "@/lib/business-modes";

const schema = z.object({
  name: z.string().trim().min(1, "Product name is required").max(120),
  sku: z.string().trim().max(60),
  barcode: z.string().trim().max(60),
  category: z.string().trim().max(60),
  price: z.number().min(0),
  cost: z.number().min(0),
  lowStockThreshold: z.number().int().min(0),
  quantity: z.number().int().min(0),
  unitsPerPack: z.number().int().min(1),
  packPrice: z.number().min(0),
  piecePrice: z.number().min(0),
});

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  branchId: string;
  product: ProductWithStock | null;
  onSaved: () => Promise<void> | void;
  businessMode?: BusinessModeKey;
  profileFields?: Array<{ id: string; label: string; type: string; required: boolean; column?: string; source?: string; runtimeReady: boolean; surfaces: string[] }>;
};
type ProductImage = { id: string; image_url: string; sort_order: number };
type PendingImage = { file: File; preview: string };

export function ProductFormDialog({
  open,
  onOpenChange,
  storeId,
  branchId,
  product,
  onSaved,
  businessMode = "general-retail",
  profileFields = [],
}: Props) {
  const isFashion = businessMode === "fashion";
  const isGrocery = businessMode === "grocery-provision";
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [barcode, setBarcode] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("0");
  const [cost, setCost] = useState("0");
  const [threshold, setThreshold] = useState("5");
  const [quantity, setQuantity] = useState("0");
  const [packMode, setPackMode] = useState(false);
  const [unitsPerPack, setUnitsPerPack] = useState("1");
  const [packPrice, setPackPrice] = useState("0");
  const [piecePrice, setPiecePrice] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [shelfId, setShelfId] = useState("none");
  const [newShelf, setNewShelf] = useState("");
  const [addingShelf, setAddingShelf] = useState(false);
  const [creatingShelf, setCreatingShelf] = useState(false);
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [sizes, setSizes] = useState("");
  const [colors, setColors] = useState("");
  const [material, setMaterial] = useState("");
  const [styleNotes, setStyleNotes] = useState("");
  const [profileValues, setProfileValues] = useState<Record<string, string>>({});
  const [variantInventory, setVariantInventory] = useState("");
  const [loadingFashionVariants, setLoadingFashionVariants] = useState(false);
  const [productLoadError, setProductLoadError] = useState(false);
  const [variantLoadError, setVariantLoadError] = useState(false);
  const pendingImagesRef = useRef<PendingImage[]>([]);
  const queryClient = useQueryClient();
  const shelvesQuery = useQuery({
    queryKey: ["shelves", storeId],
    enabled: Boolean(storeId) && open,
    queryFn: () => fetchShelves(storeId),
  });
  const shelves = shelvesQuery.data ?? [];
  const imageCount = existingImages.length + pendingImages.length;
  const canAddImages = imageCount < 6;

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const p = product as any;
    setErrors({});
    setShowExtraDetails(
      Boolean(product?.barcode || product?.sku || product?.category || isFashion),
    );
    setName(product?.name ?? "");
    setSku(product?.sku ?? "");
    setBarcode(product?.barcode ?? "");
    setCategory(product?.category ?? "");
    setPrice(product ? String(product.price) : "0");
    setCost(product ? String(product.cost) : "0");
    setThreshold(product ? String(product.low_stock_threshold) : "5");
    setQuantity(product ? String(product.quantity) : "0");
    setShelfId(product?.shelf_id ?? "none");
    const isPack = Number(p?.units_per_pack ?? 1) > 1;
    setPackMode(isPack);
    setUnitsPerPack(String(p?.units_per_pack ?? 1));
    setPiecePrice(String(p?.piece_price ?? product?.price ?? 0));
    setPackPrice(
      String(p?.pack_price ?? Number(p?.units_per_pack ?? 1) * Number(product?.price ?? 0)),
    );
    setAddingShelf(false);
    setNewShelf("");
    pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    pendingImagesRef.current = [];
    setPendingImages([]);
    setExistingImages([]);
    setSizes("");
    setColors("");
    setMaterial("");
    setStyleNotes("");
    setProfileValues({});
    setVariantInventory("");
    setProductLoadError(false);

    if (product?.id) {
      void (async () => {
        const db = supabase as any;
        try {
          const [
            { data: images, error: imagesError },
            { data: details, error: detailsError },
            { data: modeDetails, error: modeDetailsError },
            { data: onlineProduct, error: onlineProductError },
          ] = await Promise.all([
            db
              .from("product_images")
              .select("id,image_url,sort_order")
              .eq("product_id", product.id)
              .order("sort_order"),
            isFashion
              ? db
                  .from("product_fashion_details")
                  .select("size_options,color_options,material,style_notes")
                  .eq("product_id", product.id)
                  .maybeSingle()
              : Promise.resolve({ data: null, error: null }),
            profileFields.some((field) => field.runtimeReady && ["product_mode_details.details", "online_products.description"].includes(field.source ?? ""))
              ? db
                  .from("product_mode_details")
                  .select("details")
                  .eq("store_id", storeId)
                  .eq("product_id", product.id)
                  .eq("mode_key", businessMode)
                  .maybeSingle()
              : Promise.resolve({ data: null, error: null }),
            profileFields.some((field) => field.runtimeReady && field.source === "online_products.description")
              ? onlineSupabase
                  .from("online_products")
                  .select("description")
                  .eq("store_id", storeId)
                  .eq("product_id", product.id)
                  .maybeSingle()
              : Promise.resolve({ data: null, error: null }),
          ]);
          if (cancelled) return;
          if (imagesError || detailsError || modeDetailsError || onlineProductError) {
            setProductLoadError(true);
            toast.error(
              "We couldn't load this product's saved details. Check your connection and reopen it before saving.",
            );
            return;
          }
          setExistingImages((images ?? []) as ProductImage[]);
          const savedModeDetails = (modeDetails?.details ?? {}) as Record<string, unknown>;
          setProfileValues(Object.fromEntries(
            profileFields
              .filter((field) => field.runtimeReady && ["product_mode_details.details", "online_products.description"].includes(field.source ?? ""))
              .map((field) => {
                const value = field.source === "online_products.description"
                  ? onlineProduct?.description
                  : savedModeDetails[field.id];
                return [field.id, Array.isArray(value) ? value.join(", ") : value === null || value === undefined ? "" : String(value)];
              }),
          ));
          if (details) {
            setSizes((details.size_options ?? []).join(", "));
            setColors((details.color_options ?? []).join(", "));
            setMaterial(details.material ?? "");
            setStyleNotes(details.style_notes ?? "");
          }
        } catch (error) {
          if (!cancelled) {
            setProductLoadError(true);
            toast.error(errorMessage(error, "We couldn't load this product's saved details."));
          }
        }
      })();
    }

    return () => {
      cancelled = true;
    };
  }, [open, product, isFashion, profileFields]);

  useEffect(() => {
    if (!open || !product?.id || !isFashion) {
      setLoadingFashionVariants(false);
      setVariantLoadError(false);
      return;
    }
    let cancelled = false;
    setLoadingFashionVariants(true);
    setVariantLoadError(false);
    void (async () => {
      try {
        const { data: variants, error } = await (supabase as any)
          .from("fashion_variant_stock")
          .select("size,color,quantity")
          .eq("product_id", product.id)
          .eq("branch_id", branchId)
          .order("size")
          .order("color");
        if (cancelled) return;
        if (error) {
          setVariantLoadError(true);
          toast.error(
            "We couldn't load stock for this branch. Check your connection before saving.",
          );
          return;
        }
        setVariantInventory(
          (variants ?? [])
            .map((row: any) => `${row.size} | ${row.color} | ${row.quantity}`)
            .join("\n"),
        );
      } catch (error) {
        if (!cancelled) {
          setVariantLoadError(true);
          toast.error(errorMessage(error, "We couldn't load stock for this branch."));
        }
      } finally {
        if (!cancelled) setLoadingFashionVariants(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, product?.id, isFashion, branchId]);

  useEffect(() => {
    pendingImagesRef.current = pendingImages;
  }, [pendingImages]);

  useEffect(() => {
    if (!open) {
      pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
      pendingImagesRef.current = [];
    }
  }, [open]);

  useEffect(
    () => () => pendingImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview)),
    [],
  );

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
  function chooseImages(files: FileList | null) {
    if (!files || !canAddImages) return;
    const selected = Array.from(files).slice(0, 6 - imageCount);
    const invalid = selected.find(
      (file) => !file.type.startsWith("image/") || file.size > 5_000_000,
    );
    if (invalid) {
      toast.error("Images must be valid image files smaller than 5 MB each.");
      return;
    }
    setPendingImages((current) => [
      ...current,
      ...selected.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
  }
  function removePending(index: number) {
    setPendingImages((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.preview);
      return current.filter((_, i) => i !== index);
    });
  }
  async function saveImages(productId: string) {
    if (!pendingImages.length) return;
    const db = supabase as any;
    const rows: Array<{
      product_id: string;
      store_id: string;
      image_url: string;
      sort_order: number;
    }> = [];
    const startOrder = existingImages.length;
    for (let i = 0; i < pendingImages.length; i += 1) {
      const item = pendingImages[i];
      if (!item) continue;
      const extension = item.file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${storeId}/products/${productId}/${crypto.randomUUID()}.${extension}`;
      const upload = await supabase.storage
        .from("kudi-store-assets")
        .upload(path, item.file, { upsert: false, contentType: item.file.type });
      if (upload.error) throw new Error(upload.error.message);
      const imageUrl = supabase.storage.from("kudi-store-assets").getPublicUrl(path).data.publicUrl;
      rows.push({
        product_id: productId,
        store_id: storeId,
        image_url: imageUrl,
        sort_order: startOrder + i,
      });
    }
    const { error } = await db.from("product_images").insert(rows);
    if (error) throw new Error(error.message);
    if (!existingImages.length && rows[0]) {
      const { error: productError } = await db
        .from("products")
        .update({ image_url: rows[0].image_url })
        .eq("id", productId);
      if (productError) throw new Error(productError.message);
    }
  }

  function splitOptions(value: string) {
    return [
      ...new Set(
        value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ].slice(0, 30);
  }
  async function saveFashionDetails(productId: string) {
    if (!isFashion) return;
    const sizeOptions = splitOptions(sizes);
    const colorOptions = splitOptions(colors);
    const hasDetails =
      sizeOptions.length || colorOptions.length || material.trim() || styleNotes.trim();
    const db = supabase as any;
    if (!hasDetails) {
      const { error } = await db
        .from("product_fashion_details")
        .delete()
        .eq("product_id", productId);
      if (error) throw new Error(error.message);
      return;
    }
    const { error } = await db.from("product_fashion_details").upsert(
      {
        product_id: productId,
        store_id: storeId,
        size_options: sizeOptions,
        color_options: colorOptions,
        material: material.trim(),
        style_notes: styleNotes.trim(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "product_id" },
    );
    if (error) throw new Error(error.message);
  }

  async function saveFashionVariantStock(productId: string, fallbackQuantity: number) {
    if (!isFashion) return;
    const db = supabase as any;
    const existingResult = await db
      .from("fashion_variant_stock")
      .select("id,size,color")
      .eq("product_id", productId)
      .eq("branch_id", branchId);
    if (existingResult.error) throw new Error(existingResult.error.message);
    const existing = (existingResult.data ?? []) as Array<{
      id: string;
      size: string;
      color: string;
    }>;
    const lines = variantInventory
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) {
      if (existing.length) {
        const { error } = await db
          .from("fashion_variant_stock")
          .delete()
          .eq("product_id", productId)
          .eq("branch_id", branchId);
        if (error) throw new Error(error.message);
      }
      const { error } = await db.from("branch_stock").upsert(
        {
          branch_id: branchId,
          product_id: productId,
          store_id: storeId,
          quantity: fallbackQuantity,
        },
        { onConflict: "branch_id,product_id" },
      );
      if (error) throw new Error(error.message);
      return;
    }
    const parsed = lines.map((line, index) => {
      const parts = line.split("|").map((part) => part.trim());
      if (parts.length !== 3 || !parts[0] || !parts[1])
        throw new Error(`Variant line ${index + 1}: use Size | Colour | Quantity.`);
      const qty = Number(parts[2]);
      if (!Number.isInteger(qty) || qty < 0)
        throw new Error(
          `Variant line ${index + 1}: quantity must be a whole number of zero or more.`,
        );
      return {
        store_id: storeId,
        branch_id: branchId,
        product_id: productId,
        size: parts[0],
        color: parts[1],
        quantity: qty,
      };
    });
    const keys = parsed.map((row) => `${row.size.toLowerCase()}::${row.color.toLowerCase()}`);
    if (new Set(keys).size !== keys.length)
      throw new Error("Each size and colour combination can appear only once.");
    const { error: upsertError } = await db
      .from("fashion_variant_stock")
      .upsert(parsed, { onConflict: "branch_id,product_id,size,color" });
    if (upsertError) throw new Error(upsertError.message);
    const desired = new Set(keys);
    const stale = existing
      .filter((row) => !desired.has(`${row.size.toLowerCase()}::${row.color.toLowerCase()}`))
      .map((row) => row.id);
    if (stale.length) {
      const { error } = await db.from("fashion_variant_stock").delete().in("id", stale);
      if (error) throw new Error(error.message);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || loadingFashionVariants || productLoadError || variantLoadError) return;
    const parsed = schema.safeParse({
      name,
      sku,
      barcode,
      category,
      price: Number(price),
      cost: Number(cost),
      lowStockThreshold: Number(threshold),
      quantity: Number(quantity),
      unitsPerPack: packMode ? Number(unitsPerPack) : 1,
      packPrice: packMode ? Number(packPrice) : 0,
      piecePrice: packMode ? Number(piecePrice) : Number(price),
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
      const v = parsed.data;
      const normalizedPiecePrice = packMode ? v.piecePrice : v.price;
      const normalizedPackPrice = packMode ? v.packPrice : 0;
      const profileDetailFields = profileFields.filter(
        (field) => field.runtimeReady && ["product_mode_details.details", "online_products.description"].includes(field.source ?? ""),
      );
      const profileDetails = Object.fromEntries(profileDetailFields.map((field) => {
        const raw = profileValues[field.id] ?? "";
        const trimmed = raw.trim();
        if (field.required && !trimmed) throw new Error(`${field.label} is required.`);
        if (!trimmed) return [field.id, null];
        if (field.type === "boolean") return [field.id, raw === "true"];
        if (field.type === "integer" || field.type === "money") {
          const value = Number(trimmed);
          if (!Number.isFinite(value) || (field.type === "integer" && !Number.isInteger(value))) {
            throw new Error(`${field.label} must be a valid ${field.type === "integer" ? "whole number" : "amount"}.`);
          }
          return [field.id, value];
        }
        if (["tag-list", "modifier-list", "recipe-list", "variant-option"].includes(field.type)) {
          return [field.id, trimmed.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)];
        }
        return [field.id, trimmed];
      }));
      const payload = {
        store_id: storeId,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode,
        category: v.category,
        price: normalizedPiecePrice,
        cost: v.cost,
        low_stock_threshold: v.lowStockThreshold,
        shelf_id: shelfId === "none" ? null : shelfId,
        units_per_pack: packMode ? v.unitsPerPack : 1,
        pack_price: normalizedPackPrice,
        piece_price: normalizedPiecePrice,
      };
      const db = supabase as any;
      let productId = product?.id ?? null;
      if (productId) {
        const { error } = await db.from("products").update(payload).eq("id", productId);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await db.from("products").insert(payload).select("id").single();
        if (error) throw new Error(error.message);
        productId = data?.id;
      }
      if (!productId) throw new Error("The product was not saved. Please try again.");
      if (!isFashion) {
        const db = supabase as any;
        const { data: batchRows, error: batchError } = isGrocery
          ? await db
              .from("inventory_batches")
              .select("id")
              .eq("store_id", storeId)
              .eq("branch_id", branchId)
              .eq("product_id", productId)
              .limit(1)
          : { data: [], error: null };
        if (batchError) throw new Error(batchError.message);
        if (!(batchRows ?? []).length) {
          const { error: stockError } = await supabase.from("branch_stock").upsert(
            {
              branch_id: branchId,
              product_id: productId,
              store_id: storeId,
              quantity: v.quantity,
            },
            { onConflict: "branch_id,product_id" },
          );
          if (stockError) throw new Error(stockError.message);
        }
      }
      await saveImages(productId);
      await saveFashionDetails(productId);
      await saveFashionVariantStock(productId, v.quantity);
      const privateProfileDetails = Object.fromEntries(
        profileDetailFields
          .filter((field) => field.source === "product_mode_details.details")
          .map((field) => [field.id, profileDetails[field.id]]),
      );
      if (Object.keys(privateProfileDetails).length) {
        const { error: modeDetailsError } = await (supabase as any)
          .from("product_mode_details")
          .upsert({
            store_id: storeId,
            product_id: productId,
            mode_key: businessMode,
            details: privateProfileDetails,
            updated_at: new Date().toISOString(),
          }, { onConflict: "store_id,product_id,mode_key" });
        if (modeDetailsError) throw new Error(modeDetailsError.message);
      }
      const onlineDescriptionField = profileDetailFields.find((field) => field.source === "online_products.description");
      if (onlineDescriptionField) {
        const description = String(profileDetails[onlineDescriptionField.id] ?? "");
        const { data: existingOnlineProduct, error: onlineLookupError } = await onlineSupabase
          .from("online_products")
          .select("id")
          .eq("store_id", storeId)
          .eq("product_id", productId)
          .maybeSingle();
        if (onlineLookupError) throw new Error(onlineLookupError.message);
        const onlineSave = existingOnlineProduct
          ? await onlineSupabase.from("online_products").update({ description }).eq("id", existingOnlineProduct.id)
          : await onlineSupabase.from("online_products").insert({
              store_id: storeId,
              product_id: productId,
              slug: `${v.name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}-${productId.slice(0, 8)}`,
              description,
              enabled: false,
            });
        if (onlineSave.error) throw new Error(onlineSave.error.message);
      }
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
        <BottomSheetContent className="mx-auto flex h-[100dvh] max-h-[100dvh] w-full max-w-none flex-col overflow-y-auto rounded-none p-0">
          <BottomSheetHeader className="sticky top-0 z-10 border-b border-border bg-background px-4 py-3">
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-xl"
                onClick={() => onOpenChange(false)}
                aria-label="Back to products"
              >
                <ArrowLeft className="size-5" />
              </Button>
              <div className="min-w-0">
                <BottomSheetTitle>{product ? "Edit product" : "Add product"}</BottomSheetTitle>
                <BottomSheetDescription>
                  {isFashion
                    ? "Photograph each style, set the price, and track stock by exact size and colour."
                    : "Stock is stored as individual pieces so Strap can safely sell either a pack or individual pieces."}
                </BottomSheetDescription>
              </div>
            </div>
          </BottomSheetHeader>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 px-4 pb-[calc(24px+env(safe-area-inset-bottom))]"
          >
            <Field label="Name" error={errors.name}>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-12"
                maxLength={120}
                placeholder="Peak Milk 400g"
              />
            </Field>
            <Field label={isFashion ? "Clothing photos" : "Product images"}>
              <div className="grid grid-cols-3 gap-2">
                {existingImages.map((image) => (
                  <div
                    key={image.id}
                    className="aspect-square overflow-hidden rounded-xl border border-border bg-secondary"
                  >
                    <img src={image.image_url} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
                {pendingImages.map((image, index) => (
                  <div
                    key={image.preview}
                    className="relative aspect-square overflow-hidden rounded-xl border border-accent bg-secondary"
                  >
                    <img
                      src={image.preview}
                      alt="New product preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePending(index)}
                      className="absolute right-1 top-1 flex size-7 items-center justify-center rounded-full bg-foreground/80 text-background"
                      aria-label="Remove image"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
                {canAddImages && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-border bg-secondary/40 text-center hover:bg-secondary">
                    <ImagePlus className="size-6 text-muted-foreground" />
                    <span className="mt-1 text-[11px] font-semibold text-muted-foreground">
                      Add images
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => chooseImages(e.target.files)}
                    />
                  </label>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Up to 6 images. Each image must be under 5 MB.
              </p>
            </Field>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold">
              <input
                type="checkbox"
                checked={showExtraDetails}
                onChange={(event) => setShowExtraDetails(event.target.checked)}
                className="size-4 accent-[#C6F432]"
              />
              Add optional product details
              <span className="ml-auto text-xs font-normal text-muted-foreground">
                {showExtraDetails ? "Shown" : "Hidden"}
              </span>
            </label>
            {showExtraDetails && (
              <div className="space-y-4">
                {!isFashion && (
                  <Field label="Barcode" error={errors.barcode}>
                    <div className="flex gap-2">
                      <Input
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="h-12"
                        maxLength={60}
                        placeholder="Scan or type"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="h-12 shrink-0"
                        onClick={() => setScanning(true)}
                      >
                        <ScanLine className="size-4" /> Scan
                      </Button>
                    </div>
                  </Field>
                )}
                {!isFashion && (
                  <Field label="Selling format">
                    <button
                      type="button"
                      onClick={() => setPackMode((v) => !v)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left ${packMode ? "border-foreground bg-secondary" : "border-border"}`}
                    >
                      <span className="flex items-center gap-3">
                        <Package className="size-5" />
                        <span>
                          <span className="block font-semibold">Sell by pack and piece</span>
                          <span className="block text-xs text-muted-foreground">
                            Example: 12 pieces per pack, with separate prices.
                          </span>
                        </span>
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${packMode ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}
                      >
                        {packMode ? "On" : "Off"}
                      </span>
                    </button>
                  </Field>
                )}
                {packMode && !isFashion && (
                  <div className="rounded-2xl border border-border bg-secondary/50 p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Pieces per pack" error={errors.unitsPerPack}>
                        <Input
                          value={unitsPerPack}
                          onChange={(e) => setUnitsPerPack(e.target.value)}
                          className="h-11"
                          inputMode="numeric"
                          placeholder="12"
                        />
                      </Field>
                      <Field label="Price per pack" error={errors.packPrice}>
                        <Input
                          value={packPrice}
                          onChange={(e) => setPackPrice(e.target.value)}
                          className="h-11"
                          inputMode="decimal"
                          placeholder="5000"
                        />
                      </Field>
                      <Field label="Price per piece" error={errors.piecePrice}>
                        <Input
                          value={piecePrice}
                          onChange={(e) => setPiecePrice(e.target.value)}
                          className="h-11"
                          inputMode="decimal"
                          placeholder="500"
                        />
                      </Field>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Enter opening stock below as total pieces. Example: 10 packs × 12 pieces = 120
                      pieces. Strap will display it as 10 packs and 0 loose pieces.
                    </p>
                  </div>
                )}
                {!isFashion && (
                  <Field label="Shelf">
                    {addingShelf ? (
                      <div className="flex gap-2">
                        <Input
                          value={newShelf}
                          onChange={(e) => setNewShelf(e.target.value)}
                          className="h-12"
                          maxLength={60}
                          placeholder="e.g. Drinks"
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
                          <Plus className="size-4" /> New
                        </Button>
                      </div>
                    )}
                  </Field>
                )}
                {isFashion && (
                  <section className="space-y-3 rounded-2xl border border-border bg-secondary/35 p-4">
                    <div>
                      <p className="text-sm font-semibold">Style details</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Separate options with commas. Record one stock row per size and colour
                        below, using “Size | Colour | Quantity”.
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Available sizes">
                        <Input
                          value={sizes}
                          onChange={(e) => setSizes(e.target.value)}
                          className="h-12"
                          placeholder="XS, S, M, L, XL"
                        />
                      </Field>
                      <Field label="Available colours">
                        <Input
                          value={colors}
                          onChange={(e) => setColors(e.target.value)}
                          className="h-12"
                          placeholder="Black, Cream, Blue"
                        />
                      </Field>
                    </div>
                    <Field label="Material / fabric">
                      <Input
                        value={material}
                        onChange={(e) => setMaterial(e.target.value)}
                        className="h-12"
                        maxLength={120}
                        placeholder="e.g. Cotton, linen, denim"
                      />
                    </Field>
                    <Field label="Style notes">
                      <Input
                        value={styleNotes}
                        onChange={(e) => setStyleNotes(e.target.value)}
                        className="h-12"
                        maxLength={240}
                        placeholder="Fit, occasion, care instructions…"
                      />
                    </Field>
                    <Field label="Stock by size and colour">
                      <textarea
                        value={variantInventory}
                        onChange={(e) => setVariantInventory(e.target.value)}
                        rows={5}
                        className="field min-h-28 w-full resize-y rounded-xl px-3 py-2.5 text-sm"
                        placeholder={"S | Black | 3\nM | Black | 5\nS | Cream | 2"}
                      />
                      <p className="text-xs leading-5 text-muted-foreground">
                        One combination per line. Quantities are specific to this branch. If you
                        leave this blank, Strap uses the total stock field above.
                      </p>
                    </Field>
                  </section>
                )}
              </div>
            )}
            {profileFields.some((field) => field.runtimeReady && ["product_mode_details.details", "online_products.description"].includes(field.source ?? "")) && (
              <section className="space-y-3 rounded-2xl border border-border bg-secondary/30 p-4">
                <div>
                  <p className="text-sm font-semibold">Business-specific details</p>
                  <p className="mt-1 text-xs text-muted-foreground">Business-specific fields are saved to the private product profile. The online description is saved to the online catalogue and stays hidden until you publish that product.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {profileFields
                    .filter((field) => field.runtimeReady && ["product_mode_details.details", "online_products.description"].includes(field.source ?? ""))
                    .map((field) => (
                      <Field key={field.id} label={field.label}>
                        {field.type === "long-text" ? (
                          <textarea
                            value={profileValues[field.id] ?? ""}
                            onChange={(event) => setProfileValues((current) => ({ ...current, [field.id]: event.target.value }))}
                            className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                            maxLength={2000}
                            placeholder={field.label}
                          />
                        ) : field.type === "boolean" ? (
                          <label className="flex h-12 items-center gap-3 rounded-xl border border-input bg-background px-3 text-sm">
                            <input
                              type="checkbox"
                              checked={profileValues[field.id] === "true"}
                              onChange={(event) => setProfileValues((current) => ({ ...current, [field.id]: String(event.target.checked) }))}
                              className="size-4 accent-current"
                            />
                            Yes
                          </label>
                        ) : (
                          <Input
                            value={profileValues[field.id] ?? ""}
                            onChange={(event) => setProfileValues((current) => ({ ...current, [field.id]: event.target.value }))}
                            className="h-12"
                            type={field.type === "date" ? "date" : field.type === "integer" || field.type === "money" ? "number" : "text"}
                            inputMode={field.type === "integer" || field.type === "money" ? "decimal" : undefined}
                            min={field.type === "integer" || field.type === "money" ? 0 : undefined}
                            maxLength={field.type === "long-text" ? 2000 : 240}
                            placeholder={["tag-list", "modifier-list", "recipe-list", "variant-option"].includes(field.type) ? "Separate values with commas" : field.label}
                          />
                        )}
                      </Field>
                    ))}
                </div>
              </section>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={packMode ? "Opening stock (pieces)" : "Stock at this location"}
                error={errors.quantity}
              >
                <Input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="h-12"
                  inputMode="numeric"
                />
              </Field>
              {!isFashion && (
                <Field label="Low-stock alert at" error={errors.lowStockThreshold}>
                  <Input
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    className="h-12"
                    inputMode="numeric"
                  />
                </Field>
              )}
              <Field
                label={packMode ? "Default piece price" : "Selling price"}
                error={errors.price}
              >
                <Input
                  value={packMode ? piecePrice : price}
                  onChange={(e) => {
                    if (packMode) setPiecePrice(e.target.value);
                    else setPrice(e.target.value);
                  }}
                  className="h-12"
                  inputMode="decimal"
                />
              </Field>
              <Field label="Cost price" error={errors.cost}>
                <Input
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="h-12"
                  inputMode="decimal"
                />
              </Field>
              {!isFashion && (
                <Field label="SKU" error={errors.sku}>
                  <Input
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="h-12"
                    maxLength={60}
                  />
                </Field>
              )}
              <Field label="Category" error={errors.category}>
                <Input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-12"
                  maxLength={60}
                />
              </Field>
            </div>
            {(productLoadError || variantLoadError) && (
              <p role="alert" className="text-sm text-destructive">
                {variantLoadError
                  ? "Branch stock couldn't be loaded. Close this sheet and reopen the product to try again."
                  : "Saved product details couldn't be loaded. Close this sheet and reopen the product to try again."}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-12 flex-1"
                disabled={saving || loadingFashionVariants || productLoadError || variantLoadError}
              >
                {loadingFashionVariants
                  ? "Loading stock options…"
                  : saving
                    ? "Saving…"
                    : product
                      ? "Save changes"
                      : "Add product"}
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
  error?: string;
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
