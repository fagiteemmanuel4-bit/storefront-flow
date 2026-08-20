import { Link, useRouterState } from "@tanstack/react-router";
import { Clock3, UserRound } from "lucide-react";

export function StoreCustomerAccess() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  if (!pathname.startsWith("/store/") || pathname === "/store") return null;
  const slug = pathname.split("/")[2] ?? "";
  if (!slug) return null;

  return (
    <Link
      to="/customer-account"
      search={{ store: slug }}
      aria-label="Open your orders or create a temporary customer account"
      title="My orders · 14-day customer account"
      className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-2xl border border-border/80 bg-surface/95 px-2.5 py-2.5 text-foreground shadow-float backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-accent/50 hover:bg-accent-soft hover:shadow-[0_12px_36px_rgba(0,0,0,0.14)] sm:bottom-6 sm:right-6 sm:gap-3 sm:px-3 sm:py-3"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-foreground shadow-sm">
        <UserRound className="size-4" />
      </span>
      <span className="pr-1 text-left">
        <span className="block text-xs font-bold leading-4 sm:text-sm">My orders</span>
        <span className="mt-0.5 hidden items-center gap-1 text-[10px] font-medium text-muted-foreground sm:flex">
          <Clock3 className="size-3" /> 14-day account
        </span>
      </span>
    </Link>
  );
}
