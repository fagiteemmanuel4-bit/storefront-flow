import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { ProductImportDialog } from "@/components/pos/ProductImportDialog";
import { useStoreContext } from "@/components/shell/StoreProvider";

export const Route = createFileRoute("/_authenticated/product-import")({ component: ProductImportPage });

function ProductImportPage() {
  const { store, branch } = useStoreContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  if (!store?.id || !branch?.id) return <AppShell title="Import products"><div className="surface-card p-6 text-sm text-muted-foreground">Choose a store and branch before importing products.</div></AppShell>;
  return <AppShell title="Import products"><ProductImportDialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) void navigate({ to: "/products" }); }} storeId={store.id} branchId={branch.id} onImported={async () => {}} /></AppShell>;
}
