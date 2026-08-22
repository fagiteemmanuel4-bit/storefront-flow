import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Receipt, Search, Trash2, Pencil, Calendar, DollarSign, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { formatMoney } from "@/lib/currency";
import { errorMessage, formatDate } from "@/lib/format";
import type { ExpenseRow } from "@/lib/pos-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";

// @ts-ignore Route will be registered when routeTree is updated
export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expenses — Strap" },
      { name: "description", content: "Track shop operating costs, rent, utilities, and daily expenses." },
      { property: "og:title", content: "Expenses — Strap" },
      { property: "og:description", content: "Track what you spend to manage your shop's cash flow." },
    ],
  }),
  component: ExpensesPage,
});

const EXPENSE_CATEGORIES = [
  "Rent & Utilities",
  "Salaries & Wages",
  "Transport & Logistics",
  "Supplies & Packaging",
  "Equipment & Repairs",
  "Marketing & Ads",
  "Licensing & Taxes",
  "General & Other",
] as const;

function ExpensesPage() {
  const { store, branch, role } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id ?? null;
  const currency = store?.currency ?? "NGN";

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ExpenseRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form State
  const [formAmount, setFormAmount] = useState("");
  const [formCategory, setFormCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [formDescription, setFormDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const expensesQuery = useQuery({
    queryKey: ["expenses", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("store_id", storeId as string)
        .order("expense_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data as ExpenseRow[]) ?? [];
    },
  });

  const rawExpenses = expensesQuery.data ?? [];

  const filteredExpenses = useMemo(() => {
    let list = rawExpenses;
    if (selectedCategory !== "all") {
      list = list.filter((e) => e.category === selectedCategory);
    }
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter(
        (e) =>
          e.category.toLowerCase().includes(term) ||
          e.description.toLowerCase().includes(term) ||
          e.amount.toString().includes(term),
      );
    }
    return list;
  }, [rawExpenses, selectedCategory, search]);

  const totalExpenseAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }, [filteredExpenses]);

  function handleOpenCreate() {
    setEditingExpense(null);
    setFormAmount("");
    setFormCategory(EXPENSE_CATEGORIES[0]);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormDescription("");
    setDialogOpen(true);
  }

  function handleOpenEdit(expense: ExpenseRow) {
    setEditingExpense(expense);
    setFormAmount(expense.amount.toString());
    setFormCategory(expense.category);
    setFormDate(expense.expense_date);
    setFormDescription(expense.description);
    setDialogOpen(true);
  }

  async function handleSaveExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!storeId) return;

    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount greater than 0");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const resolvedDate = (formDate && formDate.trim().length > 0)
        ? formDate
        : new Date().toISOString().split("T")[0]!;

      if (editingExpense) {
        const { error } = await supabase
          .from("expenses")
          .update({
            amount: parsedAmount,
            category: formCategory,
            expense_date: resolvedDate,
            description: formDescription,
            branch_id: branch?.id ?? null,
          })
          .eq("id", editingExpense.id);

        if (error) throw new Error(error.message);
        toast.success("Expense updated");
      } else {
        const { error } = await supabase.from("expenses").insert({
          store_id: storeId,
          branch_id: branch?.id ?? null,
          created_by: userId,
          amount: parsedAmount,
          category: formCategory,
          expense_date: resolvedDate,
          description: formDescription,
        });

        if (error) throw new Error(error.message);
        toast.success("Expense added");
      }

      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setDialogOpen(false);
    } catch (err) {
      toast.error(errorMessage(err, "Failed to save expense"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("expenses").delete().eq("id", pendingDelete.id);
      if (error) throw new Error(error.message);
      toast.success("Expense deleted");
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setPendingDelete(null);
    } catch (err) {
      toast.error(errorMessage(err, "Could not delete expense"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell title="Expenses & Outgoings">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface-card p-5">
          <p className="text-label-caps flex items-center gap-1.5 text-muted-foreground">
            <DollarSign className="size-4" aria-hidden /> Total Expenses
          </p>
          {expensesQuery.isLoading ? (
            <Skeleton className="mt-3 h-8 w-28" />
          ) : (
            <p className="numeric mt-2 text-3xl font-bold text-destructive">
              {formatMoney(totalExpenseAmount, currency)}
            </p>
          )}
        </div>

        <div className="surface-card p-5">
          <p className="text-label-caps flex items-center gap-1.5 text-muted-foreground">
            <Receipt className="size-4" aria-hidden /> Expense Count
          </p>
          {expensesQuery.isLoading ? (
            <Skeleton className="mt-3 h-8 w-28" />
          ) : (
            <p className="numeric mt-2 text-3xl font-bold">
              {filteredExpenses.length} records
            </p>
          )}
        </div>

        <div className="surface-card p-5">
          <p className="text-label-caps flex items-center gap-1.5 text-muted-foreground">
            <Tag className="size-4" aria-hidden /> Active Filter
          </p>
          <p className="mt-2 text-lg font-semibold truncate">
            {selectedCategory === "all" ? "All categories" : selectedCategory}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expense note, category or amount"
            className="h-12 pl-9"
            aria-label="Search expenses"
          />
        </div>

        <Button className="h-12 touch-target" onClick={handleOpenCreate}>
          <Plus className="size-4" aria-hidden /> Record Expense
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
            selectedCategory === "all"
              ? "border-transparent bg-accent text-foreground"
              : "border-border bg-surface text-muted-foreground hover:text-foreground"
          }`}
        >
          All Categories
        </button>
        {EXPENSE_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              selectedCategory === cat
                ? "border-transparent bg-accent text-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="surface-card mt-5 overflow-hidden">
        {expensesQuery.isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : expensesQuery.error ? (
          <p className="p-5 text-sm text-destructive">
            {errorMessage(expensesQuery.error, "Expenses could not be loaded.")}
          </p>
        ) : filteredExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-display text-lg font-semibold">No expenses found</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || selectedCategory !== "all"
                ? "Try clearing filters to see more results."
                : "Click 'Record Expense' to log your first business expense."}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filteredExpenses.map((expense) => (
              <li
                key={expense.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground">
                      {expense.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="size-3" aria-hidden />
                      {formatDate(expense.expense_date)}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="mt-1 truncate text-sm text-foreground">{expense.description}</p>
                  )}
                </div>

                <span className="numeric text-right text-base font-bold text-destructive">
                  -{formatMoney(Number(expense.amount), currency)}
                </span>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="touch-target"
                    aria-label="Edit expense"
                    onClick={() => handleOpenEdit(expense)}
                  >
                    <Pencil className="size-4" aria-hidden />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="touch-target text-destructive"
                    aria-label="Delete expense"
                    onClick={() => setPendingDelete(expense)}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Expense Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "Edit Expense" : "Record New Expense"}</DialogTitle>
            <DialogDescription>
              Log business expenses to maintain an accurate profit & loss view.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveExpense} className="space-y-4 py-2">
            <div>
              <Label htmlFor="amount">Amount ({currency})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="category" className="mt-1 w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="expense_date">Date</Label>
              <Input
                id="expense_date"
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Note / Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="e.g. Monthly shop rent, diesel for generator, nylon bags"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="mt-1"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : editingExpense ? "Update Expense" : "Add Expense"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Sheet */}
      <BottomSheet
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <BottomSheetContent className="mx-auto w-full max-w-md">
          <BottomSheetHeader>
            <BottomSheetTitle>Delete this expense record?</BottomSheetTitle>
            <BottomSheetDescription>
              {pendingDelete &&
                `Are you sure you want to delete ${pendingDelete.category} (${formatMoney(
                  Number(pendingDelete.amount),
                  currency,
                )})? This action cannot be undone.`}
            </BottomSheetDescription>
          </BottomSheetHeader>
          <BottomSheetFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDeleteExpense()}
            >
              {deleting ? "Deleting…" : "Delete Expense"}
            </Button>
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    </AppShell>
  );
}
