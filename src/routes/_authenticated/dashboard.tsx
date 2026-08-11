import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Receipt, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { formatMoney } from "@/lib/currency";
import { formatDateTime } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Today's trading — Kudi" },
      { name: "description", content: "Revenue, recent sales and low-stock alerts for your shop." },
      { property: "og:title", content: "Today's trading — Kudi" },
      { property: "og:description", content: "Revenue, recent sales and low-stock alerts." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { store, branch } = useStoreContext();
  const storeId = store?.id ?? null;
  const currency = store?.currency ?? "NGN";

  const salesQuery = useQuery({
    queryKey: ["sales", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, reference, total, payment_method, created_at, branch_id")
        .eq("store_id", storeId as string)
        .order("created_at", { ascending: false })
        .limit(25);
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  const lowStockQuery = useQuery({
    queryKey: ["low-stock", storeId, branch?.id],
    enabled: Boolean(storeId && branch?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("branch_stock")
        .select("quantity, products!inner(id, name, low_stock_threshold)")
        .eq("store_id", storeId as string)
        .eq("branch_id", branch!.id);
      if (error) throw new Error(error.message);
      return (data ?? [])
        .filter((row) => row.products && row.quantity <= row.products.low_stock_threshold)
        .sort((a, b) => a.quantity - b.quantity);
    },
  });

  const sales = salesQuery.data ?? [];
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todaySales = sales.filter((s) => new Date(s.created_at) >= startOfToday);
  const todayRevenue = todaySales.reduce((sum, s) => sum + Number(s.total), 0);

  return (
    <AppShell title="Today's trading">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<TrendingUp className="size-4" aria-hidden />}
          label="Revenue today"
          value={salesQuery.isLoading ? null : formatMoney(todayRevenue, currency)}
        />
        <StatCard
          icon={<Receipt className="size-4" aria-hidden />}
          label="Sales today"
          value={salesQuery.isLoading ? null : String(todaySales.length)}
        />
        <StatCard
          icon={<AlertTriangle className="size-4" aria-hidden />}
          label="Low on stock"
          value={lowStockQuery.isLoading ? null : String(lowStockQuery.data?.length ?? 0)}
          tone={lowStockQuery.data && lowStockQuery.data.length > 0 ? "warning" : "default"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="surface-card overflow-hidden">
          <h2 className="border-b border-border px-5 py-4 font-display text-base font-semibold">
            Recent sales
          </h2>
          {salesQuery.isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : sales.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              No sales recorded yet. Ring one up from the Sell screen.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {sales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="numeric text-sm font-semibold">{sale.reference}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTime(sale.created_at)} · {sale.payment_method}
                    </p>
                  </div>
                  <span className="numeric shrink-0 text-sm font-bold">
                    {formatMoney(Number(sale.total), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="surface-card overflow-hidden">
          <h2 className="border-b border-border px-5 py-4 font-display text-base font-semibold">
            Low stock {branch ? `· ${branch.name}` : ""}
          </h2>
          {lowStockQuery.isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (lowStockQuery.data?.length ?? 0) === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">
              Everything is above its low-stock threshold.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStockQuery.data?.map((row) => (
                <li
                  key={row.products!.id}
                  className="flex items-center justify-between gap-3 px-5 py-3"
                >
                  <span className="truncate text-sm">{row.products!.name}</span>
                  <span className="numeric rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-bold text-accent-ink">
                    {row.quantity} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  tone?: "default" | "warning";
}) {
  return (
    <div className="surface-card p-5">
      <p className="text-label-caps flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </p>
      {value === null ? (
        <Skeleton className="mt-3 h-8 w-28" />
      ) : (
        <p
          className={`numeric mt-2 text-3xl font-bold ${tone === "warning" ? "text-accent-ink" : ""}`}
        >
          {value}
        </p>
      )}
    </div>
  );
}
