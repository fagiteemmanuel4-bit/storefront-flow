import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, Grid2X2, LayoutDashboard, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { to: "/pos", label: "Sell", icon: ShoppingCart },
  { to: "/products", label: "Products", icon: Boxes },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = [
    "/dashboard", "/pos", "/products", "/online-store", "/customers", "/insights", "/reports",
    "/expenses", "/branches", "/staff", "/hardware", "/settings", "/stock-sense", "/profile",
    "/extensions", "/notifications", "/help", "/feature-discovery",
  ].some((route) => pathname.startsWith(route));
  if (!visible || pathname.startsWith("/settings")) return null;

  const openSharedMenu = () => window.dispatchEvent(new CustomEvent("strap:open-menu"));

  return (
    <nav className="strap-mobile-nav-dock fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-3 right-3 z-40 mx-auto max-w-[430px] rounded-[24px] border border-border/80 bg-background/95 px-2 py-2 shadow-[0_12px_40px_rgba(0,0,0,.18)] backdrop-blur-2xl lg:hidden" aria-label="Primary mobile navigation">
      <div className="mx-auto grid grid-cols-4 gap-1">
        {PRIMARY.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return <Link key={to} to={to} aria-label={label} aria-current={active ? "page" : undefined} className={cn("flex h-11 min-h-11 items-center justify-center rounded-2xl p-2 transition duration-200 active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40", active ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><Icon className="size-5" strokeWidth={2.15} aria-hidden="true" /></Link>;
        })}
        <Link to="/dashboard" aria-label="Dashboard" aria-current={pathname.startsWith("/dashboard") ? "page" : undefined} className={cn("flex h-11 min-h-11 items-center justify-center rounded-2xl p-2 transition duration-200 active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40", pathname.startsWith("/dashboard") ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><LayoutDashboard className="size-5" strokeWidth={2.15} aria-hidden="true" /></Link>
        <button type="button" aria-label="Open Strap menu" onClick={openSharedMenu} className="flex h-11 min-h-11 items-center justify-center rounded-2xl p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"><Grid2X2 className="size-5" strokeWidth={2.15} aria-hidden="true" /></button>
      </div>
    </nav>
  );
}
