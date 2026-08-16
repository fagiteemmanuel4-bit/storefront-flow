import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Search,
  UserCheck,
  Phone,
  Mail,
  Pencil,
  Trash2,
  BadgeCheck,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { formatMoney } from "@/lib/currency";
import { errorMessage } from "@/lib/format";
import type { CustomerRow } from "@/lib/pos-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";

// @ts-ignore Route will be registered when routeTree is updated
export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: "Customers & Debt Tracking — Kudi" },
      { name: "description", content: "Manage customer profiles, contact info, and track who owes money." },
      { property: "og:title", content: "Customers & Debt Tracking — Kudi" },
      { property: "og:description", content: "Customer relationships and credit ledger." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const navigate = useNavigate();
  const { store } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id ?? null;
  const currency = store?.currency ?? "NGN";

  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CustomerRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [debtBalance, setDebtBalance] = useState("0");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const customersQuery = useQuery({
    queryKey: ["customers", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("store_id", storeId as string)
        .order("name");

      if (error) throw new Error(error.message);
      return (data as CustomerRow[]) ?? [];
    },
  });

  const rawCustomers = customersQuery.data ?? [];

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rawCustomers;
    return rawCustomers.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.phone.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term),
    );
  }, [rawCustomers, search]);

  const totalOutstandingDebt = useMemo(() => {
    return rawCustomers.reduce((sum, c) => sum + Number(c.debt_balance), 0);
  }, [rawCustomers]);

  function handleOpenCreate() {
    setEditingCustomer(null);
    setName("");
    setPhone("");
    setEmail("");
    setDebtBalance("0");
    setNotes("");
    setSheetOpen(true);
  }

  function handleOpenEdit(c: CustomerRow) {
    setEditingCustomer(c);
    setName(c.name);
    setPhone(c.phone);
    setEmail(c.email);
    setDebtBalance(c.debt_balance.toString());
    setNotes(c.notes);
    setSheetOpen(true);
  }

  async function handleSaveCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId || !name.trim()) return;

    setSaving(true);
    try {
      const parsedDebt = parseFloat(debtBalance) || 0;

      if (editingCustomer) {
        const { error } = await supabase
          .from("customers")
          .update({
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            debt_balance: parsedDebt,
            notes: notes.trim(),
          })
          .eq("id", editingCustomer.id);

        if (error) throw new Error(error.message);
        toast.success("Customer profile updated");
      } else {
        const { error } = await supabase.from("customers").insert({
          store_id: storeId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          debt_balance: parsedDebt,
          notes: notes.trim(),
        });

        if (error) throw new Error(error.message);
        toast.success("Customer created successfully");
      }

      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSheetOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, "Could not save customer details"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCustomer() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("customers").delete().eq("id", pendingDelete.id);
      if (error) throw new Error(error.message);
      toast.success(`${pendingDelete.name} removed`);
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      setPendingDelete(null);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to delete customer"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Fresh Screen Header with Back Button and Title */}
      <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void navigate({ to: "/pos" })}
              className="touch-target flex size-10 items-center justify-center rounded-full bg-secondary text-foreground transition-colors hover:bg-accent"
              aria-label="Back"
            >
              <ArrowLeft className="size-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight sm:text-xl">
                Customers
              </h1>
              <p className="text-xs text-muted-foreground">{store?.name ?? "Shop regulars & debt"}</p>
            </div>
          </div>

          <Button className="h-10 touch-target" onClick={handleOpenCreate}>
            <Plus className="size-4" /> <span className="hidden sm:inline">Add customer</span>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* KPI Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="surface-card p-5">
            <p className="text-label-caps flex items-center gap-1.5 text-muted-foreground">
              <BadgeCheck className="size-4" /> Total Regulars
            </p>
            {customersQuery.isLoading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="numeric mt-2 text-3xl font-bold">{rawCustomers.length}</p>
            )}
          </div>

          <div className="surface-card p-5">
            <p className="text-label-caps flex items-center gap-1.5 text-muted-foreground">
              <CreditCard className="size-4" /> Total Outstanding Debt
            </p>
            {customersQuery.isLoading ? (
              <Skeleton className="mt-2 h-8 w-28" />
            ) : (
              <p className="numeric mt-2 text-3xl font-bold text-destructive">
                {formatMoney(totalOutstandingDebt, currency)}
              </p>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 flex items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer by name, phone or email"
              className="h-12 pl-9"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="surface-card mt-5 overflow-hidden">
          {customersQuery.isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center">
              <p className="font-display text-lg font-semibold">
                {search ? "No customer found" : "No registered customers yet"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search
                  ? "Try searching by a different name or phone number."
                  : "Add regular customers to keep track of their details and store credit / debt."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filteredCustomers.map((customer) => {
                const hasDebt = Number(customer.debt_balance) > 0;
                return (
                  <li
                    key={customer.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{customer.name}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="size-3" /> {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="size-3" /> {customer.email}
                          </span>
                        )}
                      </div>
                      {customer.notes && (
                        <p className="mt-1 truncate text-xs italic text-muted-foreground">
                          "{customer.notes}"
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        Debt / Credit
                      </p>
                      <p
                        className={`numeric text-base font-bold ${
                          hasDebt ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {formatMoney(Number(customer.debt_balance), currency)}
                      </p>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="touch-target"
                        aria-label="Edit customer"
                        onClick={() => handleOpenEdit(customer)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="touch-target text-destructive"
                        aria-label="Delete customer"
                        onClick={() => setPendingDelete(customer)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      {/* Add / Edit Customer Sheet Popup */}
      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <BottomSheetContent className="mx-auto w-full max-w-lg">
          <BottomSheetHeader>
            <BottomSheetTitle>
              {editingCustomer ? "Edit Customer Profile" : "Add New Customer"}
            </BottomSheetTitle>
            <BottomSheetDescription>
              Record customer contact details and track unpaid balances or credit.
            </BottomSheetDescription>
          </BottomSheetHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-4 py-2">
            <div>
              <Label htmlFor="cust-name">Full Name *</Label>
              <Input
                id="cust-name"
                required
                placeholder="e.g. Adewale Ciroma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="cust-phone">Phone Number</Label>
                <Input
                  id="cust-phone"
                  placeholder="08012345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="cust-email">Email Address</Label>
                <Input
                  id="cust-email"
                  type="email"
                  placeholder="customer@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cust-debt">Current Debt / Unpaid Balance ({currency})</Label>
              <Input
                id="cust-debt"
                type="number"
                step="0.01"
                min="0"
                value={debtBalance}
                onChange={(e) => setDebtBalance(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="cust-notes">Notes / Special Instructions</Label>
              <Textarea
                id="cust-notes"
                placeholder="e.g. Regular wholesale customer, pays on Fridays"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>

            <BottomSheetFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingCustomer ? "Update Customer" : "Save Customer"}
              </Button>
            </BottomSheetFooter>
          </form>
        </BottomSheetContent>
      </BottomSheet>

      {/* Delete Confirmation Sheet */}
      <BottomSheet
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <BottomSheetContent className="mx-auto w-full max-w-md">
          <BottomSheetHeader>
            <BottomSheetTitle>Delete customer profile?</BottomSheetTitle>
            <BottomSheetDescription>
              {pendingDelete &&
                `Are you sure you want to remove ${pendingDelete.name}? This customer record will be permanently deleted.`}
            </BottomSheetDescription>
          </BottomSheetHeader>
          <BottomSheetFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDeleteCustomer()}
            >
              {deleting ? "Deleting…" : "Remove Customer"}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}
