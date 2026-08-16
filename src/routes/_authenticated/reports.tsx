import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Receipt,
  PieChart as PieChartIcon,
  ShoppingBag,
  ArrowUpRight,
  CreditCard,
  Building2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { formatMoney } from "@/lib/currency";
import { errorMessage, formatDate } from "@/lib/format";
import type { ExpenseRow, SaleItemRow, SaleRow } from "@/lib/pos-types";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// @ts-ignore Route will be registered when routeTree is updated
export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Trading Reports & Insights — Kudi" },
      {
        name: "description",
        content: "Deeper trading insights, revenue analysis, profit margins, and top performance metrics.",
      },
      { property: "og:title", content: "Trading Reports & Insights — Kudi" },
      { property: "og:description", content: "Comprehensive shop analytics and profit breakdown." },
    ],
  }),
  component: ReportsPage,
});

type TimeRangeOption = "today" | "7d" | "30d" | "all";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

function ReportsPage() {
  const { store, branch } = useStoreContext();
  const storeId = store?.id ?? null;
  const currency = store?.currency ?? "NGN";

  const [range, setRange] = useState<TimeRangeOption>("7d");

  // Fetch Sales
  const salesQuery = useQuery({
    queryKey: ["reports-sales", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("*")
        .eq("store_id", storeId as string)
        .order("created_at", { ascending: false });

      if (error) throw new Error(error.message);
      return (data as SaleRow[]) ?? [];
    },
  });

  // Fetch Sale Items with product costs
  const saleItemsQuery = useQuery({
    queryKey: ["reports-sale-items", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sale_items")
        .select("*, products(cost)")
        .eq("store_id", storeId as string);

      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  // Fetch Expenses
  const expensesQuery = useQuery({
    queryKey: ["reports-expenses", storeId],
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("store_id", storeId as string);

      if (error) throw new Error(error.message);
      return (data as ExpenseRow[]) ?? [];
    },
  });

  const isLoading = salesQuery.isLoading || saleItemsQuery.isLoading || expensesQuery.isLoading;

  // Filter Data by Date Range
  const { filteredSales, filteredExpenses, filteredSaleItems } = useMemo(() => {
    const rawSales = salesQuery.data ?? [];
    const rawExpenses = expensesQuery.data ?? [];
    const rawItems = saleItemsQuery.data ?? [];

    if (range === "all") {
      return {
        filteredSales: rawSales,
        filteredExpenses: rawExpenses,
        filteredSaleItems: rawItems,
      };
    }

    const now = new Date();
    const startDate = new Date();

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "7d") {
      startDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      startDate.setDate(now.getDate() - 30);
    }

    const sList = rawSales.filter((s) => new Date(s.created_at) >= startDate);
    const saleIds = new Set(sList.map((s) => s.id));
    const iList = rawItems.filter((i) => saleIds.has(i.sale_id));
    const eList = rawExpenses.filter((e) => new Date(e.expense_date) >= startDate);

    return {
      filteredSales: sList,
      filteredExpenses: eList,
      filteredSaleItems: iList,
    };
  }, [salesQuery.data, expensesQuery.data, saleItemsQuery.data, range]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalSalesCount = filteredSales.length;
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

    // Calculate COGS (Cost of Goods Sold)
    let totalCOGS = 0;
    filteredSaleItems.forEach((item) => {
      const unitCost = Number((item as any).products?.cost ?? 0);
      totalCOGS += unitCost * Number(item.quantity);
    });

    const grossProfit = totalRevenue - totalCOGS;
    const netProfit = grossProfit - totalExpenses;
    const averageOrderValue = totalSalesCount > 0 ? totalRevenue / totalSalesCount : 0;
    const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalSalesCount,
      totalExpenses,
      totalCOGS,
      grossProfit,
      netProfit,
      averageOrderValue,
      marginPercent,
    };
  }, [filteredSales, filteredExpenses, filteredSaleItems]);

  // Daily Chart Data
  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; revenue: number; expenses: number }>();

    filteredSales.forEach((s) => {
      const day = formatDate(s.created_at);
      const curr = map.get(day) || { date: day, revenue: 0, expenses: 0 };
      curr.revenue += Number(s.total);
      map.set(day, curr);
    });

    filteredExpenses.forEach((e) => {
      const day = formatDate(e.expense_date);
      const curr = map.get(day) || { date: day, revenue: 0, expenses: 0 };
      curr.expenses += Number(e.amount);
      map.set(day, curr);
    });

    return Array.from(map.values()).reverse();
  }, [filteredSales, filteredExpenses]);

  // Payment Method Breakdown
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredSales.forEach((s) => {
      const method = s.payment_method;
      map.set(method, (map.get(method) || 0) + Number(s.total));
    });

    return Array.from(map.entries()).map(([name, value]) => ({
      name: name[0]!.toUpperCase() + name.slice(1),
      value,
    }));
  }, [filteredSales]);

  // Top Selling Products
  const topProducts = useMemo(() => {
    const map = new Map<
      string,
      { name: string; quantity: number; revenue: number; cogs: number }
    >();

    filteredSaleItems.forEach((item) => {
      const key = item.product_name;
      const curr = map.get(key) || { name: key, quantity: 0, revenue: 0, cogs: 0 };
      const qty = Number(item.quantity);
      const rev = Number(item.line_total);
      const cost = Number((item as any).products?.cost ?? 0) * qty;

      curr.quantity += qty;
      curr.revenue += rev;
      curr.cogs += cost;
      map.set(key, curr);
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSaleItems]);

  return (
    <AppShell title="Reports & Insight">
      {/* Date Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">
          Showing data for: <span className="text-foreground font-semibold">{branch ? branch.name : "All Branches"}</span>
        </p>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-surface p-1">
          {(
            [
              { id: "today", label: "Today" },
              { id: "7d", label: "Last 7 Days" },
              { id: "30d", label: "Last 30 Days" },
              { id: "all", label: "All Time" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                range === item.id
                  ? "bg-accent text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<TrendingUp className="size-4" />}
          label="Total Revenue"
          value={isLoading ? null : formatMoney(metrics.totalRevenue, currency)}
          subtext={`${metrics.totalSalesCount} completed sales`}
        />
        <MetricCard
          icon={<DollarSign className="size-4" />}
          label="Gross Profit"
          value={isLoading ? null : formatMoney(metrics.grossProfit, currency)}
          subtext={`Margin: ${metrics.marginPercent.toFixed(1)}%`}
          tone="positive"
        />
        <MetricCard
          icon={<Receipt className="size-4" />}
          label="Operating Expenses"
          value={isLoading ? null : formatMoney(metrics.totalExpenses, currency)}
          tone="negative"
        />
        <MetricCard
          icon={<ArrowUpRight className="size-4" />}
          label="Net Profit"
          value={isLoading ? null : formatMoney(metrics.netProfit, currency)}
          subtext={`Avg. Basket: ${formatMoney(metrics.averageOrderValue, currency)}`}
          tone={metrics.netProfit >= 0 ? "positive" : "negative"}
        />
      </div>

      {/* Charts Section */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Daily Revenue & Expense Bar Chart */}
        <div className="surface-card p-5 lg:col-span-2">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h2 className="font-display text-base font-semibold">Trading Activity Trend</h2>
              <p className="text-xs text-muted-foreground">Revenue vs. Expenses over selected period</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-full bg-emerald-500" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="size-2.5 rounded-full bg-rose-500" /> Expenses
              </span>
            </div>
          </div>

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              No sales or expense activity recorded for this period.
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(val: number) => [formatMoney(val, currency), ""]}
                    contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Payment Methods Breakdown */}
        <div className="surface-card p-5">
          <h2 className="font-display text-base font-semibold">Payment Methods</h2>
          <p className="text-xs text-muted-foreground">Revenue share by payment channel</p>

          {isLoading ? (
            <Skeleton className="mt-4 h-52 w-full" />
          ) : paymentBreakdown.length === 0 ? (
            <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
              No sales recorded.
            </div>
          ) : (
            <div className="mt-2 h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatMoney(val, currency), "Total"]}
                    contentStyle={{ borderRadius: "12px", fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
                {paymentBreakdown.map((item, idx) => (
                  <span key={item.name} className="flex items-center gap-1 font-medium">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                    />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top Products Table */}
      <div className="surface-card mt-6 overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-semibold">Top Performing Products</h2>
          <p className="text-xs text-muted-foreground">Best sellers by revenue and profitability</p>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : topProducts.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No product sales recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/40 text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3 text-right">Units Sold</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                  <th className="px-5 py-3 text-right">Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {topProducts.map((p) => {
                  const profit = p.revenue - p.cogs;
                  return (
                    <tr key={p.name} className="hover:bg-secondary/20">
                      <td className="px-5 py-3.5 font-medium">{p.name}</td>
                      <td className="numeric px-5 py-3.5 text-right font-semibold">{p.quantity}</td>
                      <td className="numeric px-5 py-3.5 text-right font-semibold">
                        {formatMoney(p.revenue, currency)}
                      </td>
                      <td className="numeric px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatMoney(profit, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon,
  label,
  value,
  subtext,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null;
  subtext?: string;
  tone?: "default" | "positive" | "negative";
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
          className={`numeric mt-2 text-3xl font-bold ${
            tone === "positive"
              ? "text-emerald-600 dark:text-emerald-400"
              : tone === "negative"
                ? "text-destructive"
                : ""
          }`}
        >
          {value}
        </p>
      )}
      {subtext && <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>}
    </div>
  );
}
