import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { BarChart3, Package, ScanLine, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { activeStoreCache } from "@/lib/active-store";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { AppMenuSheet } from "@/components/shell/AppMenuSheet";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/pos", label: "Sell", icon: ScanLine },
  { to: "/products", label: "Stock", icon: Package },
  { to: "/dashboard", label: "Today", icon: BarChart3 },
] as const;

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const { store, branch, branches, memberships, role, setActiveStore, setActiveBranch, isLoading } =
    useStoreContext();

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });


  // No store yet → the account isn't usable until one exists.
  useEffect(() => {
    if (!isLoading && memberships.length === 0) {
      void navigate({ to: "/onboarding", replace: true });
    }
  }, [isLoading, memberships.length, navigate]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    activeStoreCache.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <Link to="/pos" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-accent">
              <span className="size-3 rotate-45 rounded-[3px] bg-foreground" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">KUDI.</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {memberships.length > 1 && store && (
              <Select value={store.id} onValueChange={setActiveStore}>
                <SelectTrigger className="h-10 w-[9.5rem] rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {memberships.map((m) => (
                    <SelectItem key={m.store.id} value={m.store.id}>
                      {m.store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {branches.length > 1 && branch && (
              <Select value={branch.id} onValueChange={setActiveBranch}>
                <SelectTrigger className="h-10 w-[8.5rem] rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <nav className="hidden items-center gap-1 lg:flex">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    pathname === item.to
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="touch-target group flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-2 transition-all hover:bg-accent-soft active:scale-95"
            >
              <span className="flex flex-col items-center justify-center gap-[3px]">
                <span className="block h-[2px] w-4 rounded-full bg-foreground transition-transform group-hover:-translate-y-[1px]" />
                <span className="block h-[2px] w-4 rounded-full bg-foreground" />
                <span className="block h-[2px] w-4 rounded-full bg-foreground transition-transform group-hover:translate-y-[1px]" />
              </span>
              <span className="hidden text-sm font-semibold sm:inline">Menu</span>
            </button>

          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-label-caps flex items-center gap-1.5 text-muted-foreground">
              <Store className="size-3.5" aria-hidden />
              {store?.name ?? "Loading shop"}
              {branch ? ` · ${branch.name}` : ""}
            </p>
            <h1 className="mt-1 text-title-lg">{title}</h1>
          </div>
        </div>
        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur lg:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "touch-target flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-semibold",
                  active ? "text-accent-ink" : "text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                    active ? "bg-accent-soft" : "bg-transparent",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <AppMenuSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        store={store}
        branchName={branch?.name ?? null}
        role={role}
        onSignOut={() => {
          setMenuOpen(false);
          void handleSignOut();
        }}
      />
    </div>
  );
}

