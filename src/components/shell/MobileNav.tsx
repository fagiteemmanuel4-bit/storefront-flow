import { Link, useRouterState } from "@tanstack/react-router";
import { Grid2X2, Search, ShoppingCart, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
const PRIMARY = [
  { to: "/pos", label: "Sell", icon: ShoppingCart },
  { to: "/products", label: "Products", icon: Boxes },
] as const;
export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = [
    "/dashboard",
    "/pos",
    "/products",
    "/customers",
    "/insights",
    "/reports",
    "/expenses",
    "/branches",
    "/staff",
    "/hardware",
    "/settings",
    "/stock-sense",
    "/profile",
    "/notifications",
    "/help",
    "/feature-discovery",
    "/online-store",
    "/electronics-workspace",
    "/food-service",
    "/grocery-inventory",
  ].some((route) => pathname.startsWith(route));
  // Keep the dashboard intentionally distraction-free; navigation remains available on every other page.
  if (pathname === "/dashboard" || pathname.startsWith("/customers") || !visible || pathname.startsWith("/settings")) return null;
  const openSharedSearch = () => window.dispatchEvent(new Event("strap-open-quick-find"));
  const openSharedMenu = () => window.dispatchEvent(new Event("strap-open-mobile-menu"));
  return (
    <nav
      className="strap-mobile-nav-dock fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-3 right-3 z-40 mx-auto max-w-[430px] rounded-[26px] border border-white/80 bg-white px-2 py-2 shadow-[0_12px_36px_rgba(15,23,42,.16)] ring-1 ring-black/[.04] lg:hidden"
      aria-label="Primary mobile navigation"
    >
      <div className="mx-auto grid grid-cols-4 gap-1">
        {PRIMARY.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-11 min-h-11 items-center justify-center rounded-2xl p-2 transition duration-200 active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6f432]/50",
                active
                  ? "bg-[#c6f432] text-[#101010] shadow-sm"
                  : "text-[#20242b] hover:bg-[#f3f4f6]",
              )}
            >
              <Icon className="size-5" strokeWidth={2.15} aria-hidden="true" />
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="Search Strap"
          data-tour="quick-find"
          onClick={openSharedSearch}
          className="flex h-11 min-h-11 items-center justify-center rounded-2xl p-2 text-[#20242b] transition hover:bg-[#f3f4f6] active:scale-[.96]"
        >
          <Search className="size-5" strokeWidth={2.15} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Open Strap menu"
          data-tour="mobile-menu"
          onClick={openSharedMenu}
          className="flex h-11 min-h-11 items-center justify-center rounded-2xl p-2 text-[#20242b] transition hover:bg-[#f3f4f6] active:scale-[.96]"
        >
          <Grid2X2 className="size-5" strokeWidth={2.15} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
