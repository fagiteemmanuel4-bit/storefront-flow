import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { activeStoreCache } from "@/lib/active-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SecurityModal } from "@/components/security/SecurityModal";
import type { StoreRow } from "@/lib/pos-types";

export function DeleteStoreDialog({ store, open, onOpenChange }: { store: StoreRow | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  async function handleDelete() {
    if (!store) return;
    if (confirmText.trim() !== store.name) {
      toast.error("Type the shop name exactly to confirm.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.from("stores").delete().eq("id", store.id);
      if (error) throw new Error(error.message);
      activeStoreCache.clear();
      await queryClient.invalidateQueries();
      onOpenChange(false);
      setConfirmText("");
      toast.success("Shop deleted");
      void navigate({ to: "/onboarding", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete the shop");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SecurityModal
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        if (!next) setConfirmText("");
        onOpenChange(next);
      }}
      dismissible={!busy}
      tone="danger"
      title="Delete store permanently?"
      description={`This permanently removes ${store?.name ?? "this shop"}, its products, stock and sales history. This cannot be undone.`}
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Keep my store</Button>
          <Button variant="destructive" onClick={() => void handleDelete()} disabled={busy || confirmText.trim() !== store?.name}>
            <Trash2 className="mr-2 size-4" />{busy ? "Deleting…" : "Delete forever"}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm font-medium">Type <span className="font-bold">{store?.name}</span> exactly to confirm.</p>
        <Input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} placeholder={store?.name} autoComplete="off" />
        <p className="text-xs leading-5 text-muted-foreground">This confirmation is intentionally strict so an accidental click cannot remove the store.</p>
      </div>
    </SecurityModal>
  );
}
