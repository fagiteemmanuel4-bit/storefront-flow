import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Grid2X2, LayoutDashboard, Package, ReceiptText, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/online-store/orders", label: "Orders", icon: ReceiptText },
  { to: "/products", label: "Products", icon: Package },
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
    "/extensions",
    "/notifications",
    "/help",
    "/feature-discovery",
    "/online-store",
    "/electronics-workspace",
    "/food-service",
    "/grocery-inventory",
  ].some((route) => pathname.startsWith(route));
  if (!visible || pathname.startsWith("/settings")) return null;

  const openSharedSearch = () => window.dispatchEvent(new Event("strap-open-quick-find"));
  const openSharedMenu = () => window.dispatchEvent(new Event("strap-open-mobile-menu"));
  const active = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <nav
      className="strap-mobile-nav-dock fixed bottom-[calc(12px+env(safe-area-inset-bottom))] left-3 right-3 z-40 mx-auto flex max-w-[460px] items-center gap-2 rounded-[26px] border px-2 py-2 lg:hidden"
      aria-label="Primary mobile navigation"
    >
      <button
        type="button"
        aria-label="Search Strap"
        data-tour="quick-find"
        onClick={openSharedSearch}
        className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background text-foreground"
      >
        <Search className="size-5" aria-hidden="true" />
      </button>
      <div className="grid min-w-0 flex-1 grid-cols-4 gap-1">
        {PRIMARY.map(({ to, icon: Icon, label }) => {
          const selected = active(to);
          return (
            <Link
              key={to}
              to={to}
              aria-label={label}
              aria-current={selected ? "page" : undefined}
              className={cn(
                "flex h-11 min-w-0 items-center justify-center rounded-full",
                selected ? "bg-[#c6f432] text-[#101010]" : "text-foreground",
              )}
            >
              <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          aria-label="Open Strap menu"
          data-tour="mobile-menu"
          onClick={openSharedMenu}
          className="flex h-11 min-w-0 items-center justify-center rounded-full text-foreground"
        >
          <Grid2X2 className="size-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      <Link
        to="/notifications"
        aria-label="Notifications"
        aria-current={active("/notifications") ? "page" : undefined}
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full border border-border bg-background",
          active("/notifications") && "border-[#c6f432] text-[#526d0c] dark:text-[#c6f432]",
        )}
      >
        <Bell className="size-5" aria-hidden="true" />
      </Link>
    </nav>
  );
}
