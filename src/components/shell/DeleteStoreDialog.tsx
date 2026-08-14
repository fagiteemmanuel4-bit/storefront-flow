import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { activeStoreCache } from "@/lib/active-store";
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
import type { StoreRow } from "@/lib/pos-types";

export function DeleteStoreDialog({
  store,
  open,
  onOpenChange,
}: {
  store: StoreRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleDelete() {
    if (!store) return;
    if (confirmText.trim() !== store.name) {
      toast.error("Type the shop name exactly to confirm");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("stores").delete().eq("id", store.id);
      if (error) throw new Error(error.message);
      activeStoreCache.clear();
      await queryClient.invalidateQueries();
      toast.success("Shop deleted");
      onOpenChange(false);
      void navigate({ to: "/onboarding", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the shop");
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        if (!next) setConfirmText("");
        onOpenChange(next);
      }}
    >
      <BottomSheetContent className="max-w-md">
        <BottomSheetHeader>
          <BottomSheetTitle className="text-destructive">Delete store</BottomSheetTitle>
          <BottomSheetDescription>
            This permanently removes {store?.name ?? "this shop"}, its products, stock and sales
            history. It cannot be undone — download your data first.
          </BottomSheetDescription>
        </BottomSheetHeader>

        <div className="space-y-1.5">
          <Label htmlFor="delete-confirm">
            Type <span className="font-semibold text-foreground">{store?.name}</span> to confirm
          </Label>
          <Input
            id="delete-confirm"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={store?.name}
          />
        </div>

        <BottomSheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Keep my shop
          </Button>
          <Button variant="destructive" onClick={() => void handleDelete()} disabled={busy}>
            {busy ? "Deleting…" : "Delete forever"}
          </Button>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}
