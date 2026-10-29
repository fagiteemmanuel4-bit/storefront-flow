import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ImagePlus, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomSheet, BottomSheetContent, BottomSheetDescription, BottomSheetFooter, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { StoreRow } from "@/lib/pos-types";

type Mode = "profile" | "settings";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function getLogoUrl(store: StoreRow | null) {
  const settings = store?.storefront_settings;
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return "";
  return "logoUrl" in settings ? String((settings as Record<string, unknown>).logoUrl ?? "") : "";
}

export function StoreSettingsDialog({ store, mode, canEdit, open, onOpenChange }: { store: StoreRow | null; mode: Mode; canEdit: boolean; open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [taxRate, setTaxRate] = useState("0");
  const [lowStock, setLowStock] = useState("3");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoBusy, setLogoBusy] = useState(false);

  useEffect(() => { if (!store || !open) return; setName(store.name); setCurrency(store.currency); setTaxRate(String(store.tax_rate)); setLowStock(String(store.low_stock_threshold)); setLogoUrl(getLogoUrl(store)); }, [store, open]);

  const save = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("No shop selected");
      const tax = Number(taxRate); const low = Number(lowStock);
      if (!name.trim()) throw new Error("Shop name can't be empty");
      if (!Number.isFinite(tax) || tax < 0 || tax > 100) throw new Error("Tax must be 0–100%");
      if (!Number.isFinite(low) || low < 0) throw new Error("Low-stock alert must be 0 or more");
      const current = store.storefront_settings && typeof store.storefront_settings === "object" && !Array.isArray(store.storefront_settings) ? store.storefront_settings as Record<string, unknown> : {};
      const { error } = await supabase.from("stores").update({ name: name.trim(), currency, tax_rate: tax, low_stock_threshold: Math.round(low), storefront_settings: { ...current, logoUrl } }).eq("id", store.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => { toast.success("Saved"); await queryClient.invalidateQueries(); window.dispatchEvent(new Event("kudi-storefront-updated")); onOpenChange(false); },
    onError: (error: Error) => toast.error(error.message),
  });

  async function uploadLogo(file: File) {
    if (!store || !canEdit) return;
    if (!LOGO_TYPES.includes(file.type)) { toast.error("Use a PNG, JPG, WEBP, or SVG logo."); return; }
    if (file.size > MAX_LOGO_BYTES) { toast.error("Logo must be 2 MB or smaller."); return; }
    setLogoBusy(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const path = `${store.id}/brand/logo.${extension}`;
      const { error: uploadError } = await supabase.storage.from("kudi-store-assets").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw new Error(uploadError.message);
      const { data } = supabase.storage.from("kudi-store-assets").getPublicUrl(path);
      setLogoUrl(`${data.publicUrl}?v=${Date.now()}`);
      toast.success("Store logo uploaded. Save changes to keep it.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload the logo.");
    } finally { setLogoBusy(false); }
  }

  const isProfile = mode === "profile";
  return <BottomSheet open={open} onOpenChange={onOpenChange}><BottomSheetContent className="mx-auto w-full max-w-md"><BottomSheetHeader><BottomSheetTitle>{isProfile ? "Store profile" : "Settings"}</BottomSheetTitle><BottomSheetDescription>{isProfile ? "How your shop shows up on receipts and in the app." : "Selling rules that apply across the shop."}</BottomSheetDescription></BottomSheetHeader>
    <div className="space-y-4">
      {isProfile ? <><div className="space-y-2"><Label>Store logo</Label><div className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/40 p-3"><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-foreground text-background font-display text-sm font-bold">{logoUrl ? <img src={logoUrl} alt="Store logo preview" className="size-full object-cover" /> : <ImagePlus className="size-5 text-background/70" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{logoUrl ? "Logo ready" : "Add your store logo"}</p><p className="mt-0.5 text-xs leading-5 text-muted-foreground">PNG, JPG, WEBP or SVG · max 2 MB</p><div className="mt-2 flex gap-2"><input ref={fileRef} type="file" accept={LOGO_TYPES.join(",")} className="sr-only" disabled={!canEdit || logoBusy} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadLogo(file); e.currentTarget.value = ""; }} /><Button type="button" variant="outline" size="sm" disabled={!canEdit || logoBusy} onClick={() => fileRef.current?.click()}><Upload className="mr-1.5 size-3.5" />{logoBusy ? "Uploading…" : logoUrl ? "Replace" : "Upload"}</Button>{logoUrl && canEdit && <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl("")}><X className="mr-1.5 size-3.5" />Remove</Button>}</div></div></div></div><div className="space-y-1.5"><Label htmlFor="store-name">Shop name</Label><Input id="store-name" value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} /></div><div className="rounded-xl border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">Created {store ? new Date(store.created_at).toLocaleDateString() : "—"}</div>{canEdit && <button type="button" onClick={() => { onOpenChange(false); void navigate({ to: "/online-store/customize" as never }); }} className="flex h-12 w-full items-center justify-center rounded-xl border border-border bg-secondary/40 px-4 text-sm font-semibold transition hover:bg-secondary">Customize online storefront</button>}</> : <><div className="space-y-1.5"><Label htmlFor="store-currency">Currency</Label><Select value={currency} onValueChange={setCurrency} disabled={!canEdit}><SelectTrigger id="store-currency"><SelectValue /></SelectTrigger><SelectContent>{SUPPORTED_CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} · {c.label}</SelectItem>)}</SelectContent></Select></div><div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label htmlFor="store-tax">Tax rate (%)</Label><Input id="store-tax" inputMode="decimal" value={taxRate} disabled={!canEdit} onChange={(e) => setTaxRate(e.target.value)} /></div><div className="space-y-1.5"><Label htmlFor="store-low">Low stock at</Label><Input id="store-low" inputMode="numeric" value={lowStock} disabled={!canEdit} onChange={(e) => setLowStock(e.target.value)} /></div></div></>}
    </div>
    <BottomSheetFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>{canEdit && <Button onClick={() => save.mutate()} disabled={save.isPending || logoBusy}>{save.isPending ? "Saving…" : "Save changes"}</Button>}</BottomSheetFooter>
  </BottomSheetContent></BottomSheet>;
}
