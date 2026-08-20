import { Link, useRouterState } from "@tanstack/react-router";
import { UserRound } from "lucide-react";

export function StoreCustomerAccess() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!pathname.startsWith("/store/") || pathname === "/store") return null;
  const slug = pathname.split("/")[2] ?? "";
  if (!slug) return null;

  return <Link to="/customer-account" search={{ store: slug }} aria-label="Open your orders or create a temporary customer account" title="My orders · 14-day customer account" className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full border border-border/80 bg-surface/95 px-3 py-3 text-sm font-bold text-foreground shadow-float backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-accent/50 hover:bg-accent-soft hover:shadow-[0_12px_36px_rgba(0,0,0,0.14)] sm:px-4">
    <span className="flex size-8 items-center justify-center rounded-full bg-accent text-foreground shadow-sm"><UserRound className="size-4" /></span>
    <span className="hidden sm:inline">My orders</span>
  </Link>;
}
