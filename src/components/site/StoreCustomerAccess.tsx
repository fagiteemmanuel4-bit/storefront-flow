import { Link, useRouterState } from "@tanstack/react-router";
import { UserRound } from "lucide-react";

export function StoreCustomerAccess() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!pathname.startsWith("/store/") || pathname === "/store") return null;
  const slug = pathname.split("/")[2] ?? "";
  if (!slug) return null;
  return <Link to="/customer-account" search={{ store: slug }} className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full border border-border bg-surface/95 px-4 py-3 text-sm font-bold text-foreground shadow-float backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-accent/50 hover:bg-accent-soft"><span className="flex size-7 items-center justify-center rounded-full bg-accent"><UserRound className="size-4" /></span><span className="hidden sm:inline">My orders</span></Link>;
}
