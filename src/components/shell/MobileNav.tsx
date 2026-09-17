import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Bell, CircleHelp, Menu, Package, Puzzle, ReceiptText, Settings, ShoppingBag, Store, UserRound, Users, WandSparkles } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { to: "/pos", label: "Sell", icon: ShoppingBag },
  { to: "/products", label: "Products", icon: Package },
] as const;

const MORE = [
  { to: "/online-store/orders", label: "Orders", icon: ReceiptText },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/online-store", label: "Online Store", icon: Store },
  { to: "/extensions", label: "Extensions", icon: Puzzle },
  { to: "/feature-discovery", label: "Feature tour", icon: WandSparkles },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/help", label: "Help", icon: CircleHelp },
  { to: "/profile", label: "Profile", icon: UserRound },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const visible = [
    "/dashboard", "/pos", "/products", "/online-store", "/customers", "/insights",
    "/reports", "/expenses", "/branches", "/staff", "/hardware", "/settings",
    "/stock-sense", "/profile", "/extensions", "/notifications", "/help", "/feature-discovery",
  ].some((route) => pathname.startsWith(route));

  if (!visible || pathname.startsWith("/settings")) return null;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/96 px-2 pb-[max(.4rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-6px_24px_rgba(16,24,40,.08)] backdrop-blur-xl lg:hidden"
        aria-label="Primary mobile navigation"
      >
        <div className="mx-auto grid max-w-sm grid-cols-3 gap-1.5">
          {PRIMARY.map(({ to, icon: Icon, label }) => {
            const active = pathname === to || pathname.startsWith(`${to}/`);
            return (
              <Link
                key={to}
                to={to}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 min-h-11 items-center justify-center rounded-xl transition active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
                  active
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <Icon className="size-[20px]" strokeWidth={1.9} aria-hidden="true" />
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open more navigation"
            aria-expanded={open}
            className="flex h-11 min-h-11 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground active:scale-[.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          >
            <Menu className="size-[20px]" strokeWidth={1.9} aria-hidden="true" />
          </button>
        </div>
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[78dvh] rounded-t-[24px] px-4 pb-[max(.9rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader className="pb-3 text-left">
            <SheetTitle className="font-display text-lg">Everything else</SheetTitle>
            <p className="text-xs leading-5 text-muted-foreground">
              Less-used destinations stay here so the primary navigation remains calm.
            </p>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 overflow-y-auto pb-1">
            {MORE.map(({ to, icon: Icon, label }) => {
              const active = pathname === to || pathname.startsWith(`${to}/`);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-xl border p-2.5 transition active:scale-[.98]",
                    active
                      ? "border-accent/30 bg-accent-soft text-accent-ink"
                      : "border-border bg-background hover:bg-secondary",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold">{label}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
