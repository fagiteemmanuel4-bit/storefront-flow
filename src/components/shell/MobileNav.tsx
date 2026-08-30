import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Package, ReceiptText, ShoppingBag, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { activeStoreCache } from "@/lib/active-store";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/pos", label: "Sell", icon: ShoppingBag },
  { to: "/products", label: "Products", icon: Package },
  { to: "/online-store/orders", label: "Orders", icon: ReceiptText },
  { to: "/insights", label: "Insights", icon: BarChart3 },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [storeId, setStoreId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);
  useEffect(() => { setStoreId(activeStoreCache.getStoreId()); setBranchId(activeStoreCache.getBranchId()); }, [pathname]);

  const { data: unreadOrders = 0 } = useQuery({ queryKey: ["mobile-nav", "unread-orders", storeId], enabled: Boolean(storeId), staleTime: 30_000, queryFn: async () => { const { count, error } = await supabase.from("store_notifications").select("id", { count: "exact", head: true }).eq("store_id", storeId!).is("read_at", null); if (error) throw error; return count ?? 0; } });
  const { data: lowStock = 0 } = useQuery({ queryKey: ["mobile-nav", "low-stock", storeId, branchId], enabled: Boolean(storeId && branchId), staleTime: 30_000, queryFn: async () => { const { data, error } = await supabase.from("branch_stock").select("quantity, products!inner(id, low_stock_threshold)").eq("store_id", storeId!).eq("branch_id", branchId!); if (error) throw error; return (data ?? []).filter((row) => Number(row.quantity ?? 0) <= Number(row.products?.low_stock_threshold ?? 0)).length; } });

  const visible = ["/dashboard", "/pos", "/products", "/online-store", "/customers", "/insights", "/reports", "/expenses", "/branches", "/staff", "/hardware", "/settings", "/stock-sense", "/profile"].some((route) => pathname.startsWith(route));
  if (!visible) return null;
  const badges: Record<string, number> = { "/products": lowStock, "/online-store/orders": unreadOrders };

  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(0,0,0,.06)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
    <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
      {ITEMS.map(({ to, icon: Icon, label }) => { const active = pathname === to || pathname.startsWith(`${to}/`); const badge = badges[to] ?? 0; return <Link key={to} to={to} aria-label={label} aria-current={active ? "page" : undefined} className={cn("group relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-muted-foreground transition-[transform,background-color,color] duration-200 active:scale-[.94]", active && "bg-accent-soft text-accent-ink", !active && "hover:bg-secondary hover:text-foreground")}>
        <span className={cn("relative flex size-8 items-center justify-center rounded-xl transition-[transform,background-color,box-shadow] duration-300", active && "bg-background shadow-sm motion-safe:animate-[mobile-nav-pop_320ms_ease-out]")}>
          <Icon className={cn("size-[20px] transition-transform duration-200", active && "scale-110 stroke-[2.2]")} />
          {badge > 0 && <span aria-label={`${badge} updates`} className="absolute right-0.5 top-0.5 size-1.5 rounded-full border border-background bg-destructive shadow-sm" />}
        </span>
        <span className="text-[10px] font-semibold leading-none tracking-tight">{label}</span>
      </Link>; })}
      <Link to="/profile" aria-label="Profile" aria-current={pathname.startsWith("/profile") ? "page" : undefined} className={cn("group flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-2 text-muted-foreground transition-[transform,background-color,color] duration-200 active:scale-[.94]", pathname.startsWith("/profile") && "bg-accent-soft text-accent-ink", !pathname.startsWith("/profile") && "hover:bg-secondary hover:text-foreground")}>
        <span className="flex size-8 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"><UserRound className="size-[20px]" /></span>
        <span className="text-[10px] font-semibold leading-none tracking-tight">Profile</span>
      </Link>
    </div>
  </nav>;
}
