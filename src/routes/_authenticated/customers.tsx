import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Copy,
  Crown,
  Filter,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/customers")({
  ssr: false,
  component: CustomersPage,
});

type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  notes: string;
  total_spent: number;
  visit_count: number;
  last_visit_at: string | null;
};
type Segment = "New" | "Returning" | "VIP" | "At risk" | "Inactive";
const SEGMENTS: Segment[] = ["New", "Returning", "VIP", "At risk", "Inactive"];

function segment(customer: Customer): Segment {
  const last = customer.last_visit_at
    ? Date.now() - new Date(customer.last_visit_at).getTime()
    : Infinity;
  const days = last / 86400000;
  if (customer.visit_count >= 5 || Number(customer.total_spent) >= 100000) return "VIP";
  if (days > 90) return "Inactive";
  if (days > 45) return "At risk";
  if (customer.visit_count >= 2) return "Returning";
  return "New";
}

function CustomersPage() {
  const { store, role } = useStoreContext();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeSegment, setActiveSegment] = useState<Segment | "All">("All");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const canDelete = role === "owner" || role === "manager";

  const query = useQuery({
    queryKey: ["customers", store?.id],
    enabled: Boolean(store?.id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("customers")
        .select("id,name,phone,email,notes,total_spent,visit_count,last_visit_at")
        .eq("store_id", store!.id)
        .order("last_visit_at", { ascending: false, nullsFirst: false })
        .order("name");
      if (error) throw new Error(error.message);
      return (data ?? []) as Customer[];
    },
    retry: 2,
  });

  const allCustomers = query.data ?? [];
  const segmentCounts = useMemo(
    () =>
      allCustomers.reduce<Record<Segment, number>>(
        (counts, customer) => {
          counts[segment(customer)] += 1;
          return counts;
        },
        { New: 0, Returning: 0, VIP: 0, "At risk": 0, Inactive: 0 },
      ),
    [allCustomers],
  );
  const customers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allCustomers.filter((customer) => {
      const matchesSearch =
        !term ||
        [customer.name, customer.phone, customer.email, segment(customer)]
          .some((value) => String(value ?? "").toLowerCase().includes(term));
      return matchesSearch && (activeSegment === "All" || segment(customer) === activeSegment);
    });
  }, [allCustomers, search, activeSegment]);

  const totalSpent = allCustomers.reduce(
    (sum, customer) => sum + Number(customer.total_spent || 0),
    0,
  );
  const currency = store?.currency ?? "NGN";
  const money = (amount: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

  async function addCustomer() {
    if (!store?.id || !name.trim()) return toast.error("Enter a customer name.");
    setSaving(true);
    try {
      const { error } = await (supabase as any).from("customers").insert({
        store_id: store.id,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      if (error) throw new Error(error.message);
      setName("");
      setPhone("");
      setEmail("");
      setAddOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["customers", store.id] });
      toast.success("Customer added");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not add customer");
    } finally {
      setSaving(false);
    }
  }

  async function removeCustomer(id: string) {
    if (
      !canDelete ||
      !window.confirm("Remove this customer? Existing sales will stay in your records.")
    ) return;
    const { error } = await (supabase as any).from("customers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await queryClient.invalidateQueries({ queryKey: ["customers", store?.id] });
    toast.success("Customer removed");
  }

  async function copyValue(value: string, label: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Couldn't copy ${label.toLowerCase()}`);
    }
  }

  function clearFilters() {
    setSearch("");
    setActiveSegment("All");
  }

  return (
    <AppShell title="Customers">
      <div data-tour="customers" className="space-y-5 sm:space-y-6">
        <section className="relative overflow-hidden rounded-[28px] border border-border bg-gradient-to-br from-card via-card to-accent-soft/60 p-5 shadow-sm sm:p-7">
          <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 size-56 rounded-full border-[28px] border-accent/10" />
          <div className="relative flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <span className="size-2 rounded-full bg-accent" />
                Customer relationships
              </div>
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Your people. Your business.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                Keep every relationship close. Understand who comes back, who spends more and who needs a little attention.
              </p>
            </div>
            <Button
              onClick={() => setAddOpen(true)}
              className="h-11 shrink-0 rounded-xl bg-[#C6F432] px-4 font-semibold text-[#0E1116] shadow-sm hover:bg-[#b0dc20]"
            >
              <Plus className="mr-2 size-4" />
              Add customer
            </Button>
          </div>
          <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3.5 backdrop-blur-sm sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4" />
                <span className="text-xs font-medium">Customers</span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums sm:text-3xl">{allCustomers.length}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">In your directory</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/75 p-3.5 backdrop-blur-sm sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Crown className="size-4" />
                <span className="text-xs font-medium">VIP customers</span>
              </div>
              <p className="mt-2 font-display text-2xl font-bold tabular-nums sm:text-3xl">{segmentCounts.VIP}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Your top relationships</p>
            </div>
            <div className="col-span-2 rounded-2xl border border-border/70 bg-background/75 p-3.5 backdrop-blur-sm sm:col-span-1 sm:p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <BadgeCheck className="size-4" />
                <span className="text-xs font-medium">Lifetime spend</span>
              </div>
              <p className="mt-2 truncate font-display text-xl font-bold tabular-nums sm:text-2xl">{money(totalSpent)}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">Across saved customers</p>
            </div>
          </div>
        </section>

        <section className="flex min-w-0 flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, phone, email or segment"
              className="h-12 rounded-2xl border-border bg-background pl-10 pr-10 shadow-sm"
              aria-label="Search customers"
              type="search"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear customer search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              variant="outline"
              className="h-12 flex-1 rounded-2xl px-4 sm:flex-none"
              onClick={() => setFiltersOpen(true)}
            >
              <SlidersHorizontal className="mr-2 size-4" />
              Filters
              {activeSegment !== "All" && <span className="ml-1 size-2 rounded-full bg-accent" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-12 shrink-0 rounded-2xl" aria-label="Customer page options">
                  <MoreHorizontal className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuItem onSelect={() => void query.refetch()}>
                  <RefreshCw className="mr-2 size-4" /> Refresh customer list
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={clearFilters}>
                  <X className="mr-2 size-4" /> Clear search and filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold tracking-tight">Customer directory</h3>
            <p className="text-xs text-muted-foreground">
              {customers.length} {customers.length === 1 ? "customer" : "customers"} shown
              {activeSegment !== "All" ? ` · ${activeSegment}` : ""}
            </p>
          </div>
          {(search || activeSegment !== "All") && (
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-accent-ink hover:underline">
              Reset
            </button>
          )}
        </div>

        {query.isLoading ? (
          <div className="surface-card rounded-2xl p-10 text-center text-sm text-muted-foreground">Loading customers…</div>
        ) : query.error ? (
          <div className="surface-card rounded-2xl p-10 text-center">
            <UserRound className="mx-auto size-9 text-destructive" />
            <p className="mt-3 font-semibold">We couldn't load your customers</p>
            <p className="mt-1 text-sm text-muted-foreground">Your customer records are safe. Try again before making changes.</p>
            <Button className="mt-5 rounded-xl" onClick={() => void query.refetch()}>
              <RefreshCw className="mr-2 size-4" /> Try again
            </Button>
          </div>
        ) : customers.length === 0 ? (
          <div className="surface-card rounded-2xl p-10 text-center">
            <UserRound className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 font-semibold">{search || activeSegment !== "All" ? "No customers match these filters" : "No customers yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {search || activeSegment !== "All"
                ? "Try another search or reset your filters."
                : "Add your regulars here, then attach them to sales at checkout."}
            </p>
            {search || activeSegment !== "All" ? (
              <Button variant="outline" className="mt-5 rounded-xl" onClick={clearFilters}>Clear filters</Button>
            ) : (
              <Button className="mt-5 rounded-xl" onClick={() => setAddOpen(true)}>Add your first customer</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {customers.map((customer) => {
              const customerSegment = segment(customer);
              return (
                <article key={customer.id} className="group relative overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-md sm:p-5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft font-display text-lg font-bold text-accent-ink ring-1 ring-accent/10">
                      {customer.name.trim().slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <h4 className="min-w-0 truncate font-display font-bold">{customer.name}</h4>
                        <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{customerSegment}</span>
                      </div>
                      <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                        {customer.phone && <p className="flex min-w-0 items-center gap-2"><Phone className="size-3.5 shrink-0" /><span className="truncate">{customer.phone}</span></p>}
                        {customer.email && <p className="flex min-w-0 items-center gap-2"><Mail className="size-3.5 shrink-0" /><span className="truncate">{customer.email}</span></p>}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 -mt-1 size-9 shrink-0 rounded-xl text-muted-foreground" aria-label={`Actions for ${customer.name}`}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl">
                        {customer.phone && <DropdownMenuItem onSelect={() => void copyValue(customer.phone, "Phone number")}><Copy className="mr-2 size-4" />Copy phone</DropdownMenuItem>}
                        {customer.email && <DropdownMenuItem onSelect={() => void copyValue(customer.email, "Email address")}><Copy className="mr-2 size-4" />Copy email</DropdownMenuItem>}
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => void removeCustomer(customer.id)}>
                              <Trash2 className="mr-2 size-4" />Remove customer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-secondary/75 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Visits</p>
                      <p className="mt-1 font-display text-lg font-bold tabular-nums">{customer.visit_count}</p>
                    </div>
                    <div className="rounded-xl bg-secondary/75 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total spent</p>
                      <p className="mt-1 truncate font-display text-lg font-bold tabular-nums">{money(Number(customer.total_spent))}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {customer.last_visit_at ? `Last visit ${new Date(customer.last_visit_at).toLocaleDateString()}` : "No recorded visits yet"}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <BottomSheet open={addOpen} onOpenChange={setAddOpen}>
        <BottomSheetContent>
          <BottomSheetHeader className="mb-5">
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Plus className="size-5" /></div>
            <BottomSheetTitle>Add a customer</BottomSheetTitle>
            <BottomSheetDescription>Save their details so you can recognise them at checkout and build stronger relationships.</BottomSheetDescription>
          </BottomSheetHeader>
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              void addCustomer();
            }}
          >
            <label className="block space-y-1.5 text-sm font-medium">Customer name
              <Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Ada Okafor" required className="h-12 rounded-xl" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">Phone number
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone (optional)" className="h-12 rounded-xl" />
            </label>
            <label className="block space-y-1.5 text-sm font-medium">Email address
              <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email (optional)" type="email" className="h-12 rounded-xl" />
            </label>
            <div className="flex gap-2 pt-2">
              <BottomSheetClose asChild><Button type="button" variant="outline" className="h-12 flex-1 rounded-xl">Cancel</Button></BottomSheetClose>
              <Button type="submit" disabled={saving} className="h-12 flex-1 rounded-xl bg-[#C6F432] font-semibold text-[#0E1116] hover:bg-[#b0dc20]">
                {saving ? "Saving…" : "Save customer"}
              </Button>
            </div>
          </form>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <BottomSheetContent>
          <BottomSheetHeader className="mb-5">
            <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Filter className="size-5" /></div>
            <BottomSheetTitle>Filter customers</BottomSheetTitle>
            <BottomSheetDescription>Focus your directory on a customer group.</BottomSheetDescription>
          </BottomSheetHeader>
          <div className="space-y-2">
            <button type="button" onClick={() => setActiveSegment("All")} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-semibold transition ${activeSegment === "All" ? "border-accent bg-accent-soft" : "border-border bg-background hover:bg-secondary"}`}>
              All customers <span className="text-muted-foreground">{allCustomers.length}</span>
            </button>
            {SEGMENTS.map((item) => (
              <button key={item} type="button" onClick={() => setActiveSegment(item)} className={`flex w-full items-center justify-between rounded-xl border p-4 text-left text-sm font-semibold transition ${activeSegment === item ? "border-accent bg-accent-soft" : "border-border bg-background hover:bg-secondary"}`}>
                {item} <span className="text-muted-foreground">{segmentCounts[item]}</span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={clearFilters}>Reset</Button>
            <BottomSheetClose asChild><Button className="h-12 flex-1 rounded-xl bg-[#C6F432] font-semibold text-[#0E1116] hover:bg-[#b0dc20]">Show {customers.length} customers</Button></BottomSheetClose>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </AppShell>
  );
}
