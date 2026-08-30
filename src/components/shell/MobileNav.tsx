import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, Menu, Package, ReceiptText, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/pos", label: "Sell", icon: ScanLine },
  { to: "/products", label: "Products", icon: Package },
  { to: "/online-store/orders", label: "Orders", icon: ReceiptText },
  { to: "/insights", label: "Insights", icon: BarChart3 },
] as const;

export function MobileNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const visible = pathname.startsWith("/dashboard") || pathname.startsWith("/pos") || pathname.startsWith("/products") || pathname.startsWith("/online-store") || pathname.startsWith("/customers") || pathname.startsWith("/insights") || pathname.startsWith("/reports") || pathname.startsWith("/expenses") || pathname.startsWith("/branches") || pathname.startsWith("/staff") || pathname.startsWith("/hardware") || pathname.startsWith("/settings") || pathname.startsWith("/stock-sense");
  if (!visible) return null;
  return <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-1.5 shadow-[0_-8px_30px_rgba(0,0,0,.06)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
    <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
      {ITEMS.map(({ to, label, icon: Icon }) => { const active = pathname === to || pathname.startsWith(`${to}/`); return <Link key={to} to={to} className={cn("flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-semibold transition-colors active:scale-[.98]", active ? "bg-accent-soft text-accent-ink" : "text-muted-foreground hover:bg-secondary hover:text-foreground")} aria-current={active ? "page" : undefined}><Icon className="size-[18px]" /><span>{label}</span></Link>; })}
      <button type="button" aria-label="Open menu" className="flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-2 text-[10px] font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground" onClick={() => document.querySelector<HTMLButtonElement>('[aria-label="Open Strap menu"]')?.click()}><Menu className="size-[18px]" /><span>Menu</span></button>
    </div>
  </nav>;
}
