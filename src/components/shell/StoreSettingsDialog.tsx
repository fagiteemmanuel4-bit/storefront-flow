import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { StoreRow } from "@/lib/pos-types";

type Mode = "profile" | "settings";

/** Store profile (identity) and store settings (selling rules) share one saver. */
export function StoreSettingsDialog({
  store,
  mode,
  canEdit,
  open,
  onOpenChange,
}: {
  store: StoreRow | null;
  mode: Mode;
  canEdit: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const [taxRate, setTaxRate] = useState("0");
  const [lowStock, setLowStock] = useState("3");

  useEffect(() => {
    if (!store || !open) return;
    setName(store.name);
    setCurrency(store.currency);
    setTaxRate(String(store.tax_rate));
    setLowStock(String(store.low_stock_threshold));
  }, [store, open]);

  const save = useMutation({
    mutationFn: async () => {
      if (!store) throw new Error("No shop selected");
      const tax = Number(taxRate);
      const low = Number(lowStock);
      if (!name.trim()) throw new Error("Shop name can't be empty");
      if (!Number.isFinite(tax) || tax < 0 || tax > 100) throw new Error("Tax must be 0–100%");
      if (!Number.isFinite(low) || low < 0) throw new Error("Low-stock alert must be 0 or more");
      const { error } = await supabase
        .from("stores")
        .update({
          name: name.trim(),
          currency,
          tax_rate: tax,
          low_stock_threshold: Math.round(low),
        })
        .eq("id", store.id);
      if (error) throw new Error(error.message);
    },
    onSuccess: async () => {
      toast.success("Saved");
      await queryClient.invalidateQueries();
      onOpenChange(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const isProfile = mode === "profile";

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="mx-auto w-full max-w-md">
        <BottomSheetHeader>
          <BottomSheetTitle>{isProfile ? "Store profile" : "Settings"}</BottomSheetTitle>
          <BottomSheetDescription>
            {isProfile
              ? "How your shop shows up on receipts and in the app."
              : "Selling rules that apply across the shop."}
          </BottomSheetDescription>
        </BottomSheetHeader>

        <div className="space-y-4">
          {isProfile ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="store-name">Shop name</Label>
                <Input
                  id="store-name"
                  value={name}
                  disabled={!canEdit}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="rounded-xl border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
                Created {store ? new Date(store.created_at).toLocaleDateString() : "—"}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="store-currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency} disabled={!canEdit}>
                  <SelectTrigger id="store-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} · {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="store-tax">Tax rate (%)</Label>
                  <Input
                    id="store-tax"
                    inputMode="decimal"
                    value={taxRate}
                    disabled={!canEdit}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="store-low">Low stock at</Label>
                  <Input
                    id="store-low"
                    inputMode="numeric"
                    value={lowStock}
                    disabled={!canEdit}
                    onChange={(e) => setLowStock(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <BottomSheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {canEdit && (
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          )}
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}
