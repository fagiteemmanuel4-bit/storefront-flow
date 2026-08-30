import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Menu, Package, ReceiptText, ScanLine, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/pos", label: "Sell", icon: ShoppingBag },
  { to: "/products", label: "Products", icon: Package },
  { to: "/online-store/orders", label: "Orders", icon: ReceiptText },
  { to: "/insights", label: "Insights", icon: BarChart3 },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { store, branch } = useStoreContext();
  const storeId = store?.id ?? null;
  const branchId = branch?.id ?? null;
  const visible = pathname.startsWith("/dashboard") || pathname.startsWith("/pos") || pathname.startsWith("/products") || pathname.startsWith("/online-store") || pathname.startsWith("/customers") || pathname.startsWith("/insights") || pathname.startsWith("/reports") || pathname.startsWith("/expenses") || pathname.startsWith("/branches") || pathname.startsWith("/staff") || pathname.startsWith("/hardware") || pathname.startsWith("/settings") || pathname.startsWith("/stock-sense");

  const { data: unreadOrders = 0 } = useQuery({
    queryKey: ["mobile-nav", "unread-orders", storeId],
    enabled: Boolean(storeId),
    staleTime: 30_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("store_id", storeId!)
        .is("read_at", null);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: lowStock = 0 } = useQuery({
    queryKey: ["mobile-nav", "low-stock", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    staleTime: 30_000,
    queryFn: async () => {
      const [{ data: products, error: productsError }, { data: stock, error: stockError }] = await Promise.all([
        supabase.from("products").select("id,low_stock_threshold").eq("store_id", storeId!).eq("is_active", true),
        supabase.from("branch_stock").select("product_id,quantity").eq("branch_id", branchId!),
      ]);
      if (productsError) throw productsError;
      if (stockError) throw stockError;
      const stockMap = new Map((stock ?? []).map((row) => [row.product_id, Number(row.quantity ?? 0)]));
      return (products ?? []).filter((product) => {
        const quantity = stockMap.get(product.id) ?? 0;
        return quantity <= Number(product.low_stock_threshold ?? 0);
      }).length;
    },
  });

  if (!visible) return null;

  const badges: Record<string, number> = {
    "/products": lowStock,
    "/online-store/orders": unreadOrders,
  };

  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(0,0,0,.06)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
    <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
      {ITEMS.map(({ to, label, icon: Icon }) => {
        const active = pathname === to || pathname.startsWith(`${to}/`);
        const badge = badges[to] ?? 0;
        return <Link key={to} to={to} className={cn("group relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-semibold transition-[transform,background-color,color] duration-200 active:scale-[.94]", active ? "bg-accent-soft text-accent-ink" : "text-muted-foreground hover:bg-secondary hover:text-foreground")} aria-current={active ? "page" : undefined}>
          <span className={cn("relative flex size-8 items-center justify-center rounded-xl transition-[transform,background-color,box-shadow] duration-300", active && "bg-background shadow-sm group-hover:scale-105 motion-safe:animate-[mobile-nav-pop_320ms_ease-out]")}>
            <Icon className={cn("size-[19px] transition-transform duration-200", active && "scale-110 stroke-[2.2]")} />
            {badge > 0 && <span aria-label={`${badge} updates`} className="absolute -right-1 -top-1 flex min-w-[15px] items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[8px] font-bold leading-[13px] text-destructive-foreground shadow-sm">{badge > 9 ? "9+" : badge}</span>}
          </span>
          <span className={cn("transition-transform duration-200", active && "translate-y-[-1px]")}>{label}</span>
        </Link>;
      })}
      <button type="button" aria-label="Open menu" className="group flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-semibold text-muted-foreground transition-[transform,background-color,color] duration-200 hover:bg-secondary hover:text-foreground active:scale-[.94]" onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="Open Strap menu"]')?.click()}>
        <span className="flex size-8 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 group-active:rotate-[-3deg]"><Menu className="size-[19px] transition-transform duration-300 group-hover:rotate-90" /></span>
        <span>Menu</span>
      </button>
    </div>
  </nav>;
}
