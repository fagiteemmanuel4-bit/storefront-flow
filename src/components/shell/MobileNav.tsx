import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Package, Search, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { to: "/pos", label: "Sell", icon: ShoppingBag },
  { to: "/products", label: "Products", icon: Package },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const visible = [
    "/dashboard", "/pos", "/products", "/online-store", "/customers", "/insights", "/reports",
    "/expenses", "/branches", "/staff", "/hardware", "/settings", "/stock-sense", "/profile",
    "/extensions", "/notifications", "/help", "/feature-discovery",
  ].some((route) => pathname.startsWith(route));
  if (!visible || pathname.startsWith("/settings")) return null;

  const openSharedSearch = () => {
    const trigger = document.querySelector<HTMLButtonElement>('.kudi-app-shell header button[aria-label="Search"]');
    trigger?.click();
  };
  const openSharedMenu = () => {
    const trigger = document.querySelector<HTMLButtonElement>('.kudi-app-shell header button[aria-label="Open Strap menu"]');
    trigger?.click();
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/96 px-2 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(0,0,0,.06)] backdrop-blur-xl lg:hidden" aria-label="Primary mobile navigation">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {PRIMARY.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || pathname.startsWith(`${to}/`);
          return <Link key={to} to={to} aria-label={label} aria-current={active ? "page" : undefined} className={cn("flex h-10 min-h-10 items-center justify-center rounded-lg p-2 transition active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40", active ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><Icon className="size-[16px]" strokeWidth={1.9} aria-hidden="true" /></Link>;
        })}
        <button type="button" aria-label="Search Strap" onClick={openSharedSearch} className="flex h-10 min-h-10 items-center justify-center rounded-lg p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"><Search className="size-[16px]" strokeWidth={1.9} aria-hidden="true" /></button>
        <button type="button" aria-label="Open Strap menu" onClick={openSharedMenu} className="flex h-10 min-h-10 items-center justify-center rounded-lg border border-border bg-background p-2 text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-[.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"><Menu className="size-[16px]" strokeWidth={1.9} aria-hidden="true" /></button>
      </div>
    </nav>
  );
}
