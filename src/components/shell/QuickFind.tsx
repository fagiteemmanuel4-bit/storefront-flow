import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Command } from "cmdk";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Package,
  Plus,
  Puzzle,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  X,
  Users,
} from "lucide-react";

type QuickFindProps = { open: boolean; onOpenChange: (open: boolean) => void };
type QuickAction = {
  label: string;
  hint: string;
  to: string;
  icon: typeof Search;
  keywords: string;
};
const RECENT_KEY = "strap:quick-find:recent";
const MAX_RECENT = 5;
const ACTIONS: QuickAction[] = [
  {
    label: "New sale",
    hint: "Open the fastest checkout workspace",
    to: "/pos",
    icon: Plus,
    keywords: "sell checkout sale pos charge",
  },
  {
    label: "Products",
    hint: "Find products, stock and catalogue",
    to: "/products",
    icon: Package,
    keywords: "product inventory stock catalogue",
  },
  {
    label: "Orders",
    hint: "Review orders and their status",
    to: "/online-store/orders",
    icon: ShoppingBag,
    keywords: "orders sales pending completed",
  },
  {
    label: "Customers",
    hint: "Find customers and purchase history",
    to: "/customers",
    icon: Users,
    keywords: "customer crm buyers clients",
  },
  {
    label: "Analytics",
    hint: "See business performance and reports",
    to: "/reports",
    icon: BarChart3,
    keywords: "analytics reports revenue insights",
  },
  {
    label: "Add expense",
    hint: "Record money leaving the business",
    to: "/expenses",
    icon: ReceiptText,
    keywords: "expense spending costs",
  },
  {
    label: "Online store",
    hint: "Manage your public storefront",
    to: "/online-store",
    icon: Store,
    keywords: "storefront website ecommerce online",
  },
  {
    label: "Feature tour",
    hint: "Discover Strap's workspace features",
    to: "/feature-discovery",
    icon: Sparkles,
    keywords: "tour discover onboarding learn features",
  },
  {
    label: "Settings",
    hint: "Store, account and security settings",
    to: "/settings",
    icon: Settings,
    keywords: "settings preferences account security",
  },
  {
    label: "Store profile",
    hint: "Store identity and theme & display",
    to: "/settings/store-profile",
    icon: Store,
    keywords: "settings store profile theme display appearance currency timezone",
  },
  {
    label: "Commerce settings",
    hint: "Receipts, checkout, inventory and payments",
    to: "/settings/receipts",
    icon: ReceiptText,
    keywords: "settings commerce receipts checkout sales inventory payments tax stock",
  },
  {
    label: "Staff & notifications",
    hint: "Team permissions and alerts",
    to: "/settings/staff",
    icon: Users,
    keywords: "settings staff permissions team notifications alerts",
  },
  {
    label: "Integrations",
    hint: "Connected applications and access",
    to: "/settings/ai-agents",
    icon: Puzzle,
    keywords: "settings integrations connected apps oauth mcp access",
  },
  {
    label: "Security",
    hint: "Account protection and security alerts",
    to: "/settings/security",
    icon: Settings,
    keywords: "settings security account protection alerts",
  },
  {
    label: "Password & sessions",
    hint: "Change password and manage devices",
    to: "/settings/password",
    icon: Settings,
    keywords: "settings password active sessions devices logout",
  },
  {
    label: "Advanced settings",
    hint: "Advanced operational controls",
    to: "/settings/advanced",
    icon: Sparkles,
    keywords: "settings advanced developer api webhooks",
  },
  {
    label: "Help",
    hint: "Open guides and support",
    to: "/help",
    icon: FileText,
    keywords: "help docs support guide",
  },
];
function readRecent() {
  try {
    const value = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
export function QuickFind({ open, onOpenChange }: QuickFindProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    const onSearchClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('[aria-label="Search"]')) {
        event.preventDefault();
        onOpenChange(true);
      }
    };
    const onOpenQuickFind = () => onOpenChange(true);
    window.addEventListener("keydown", onGlobalKeyDown);
    window.addEventListener("strap-open-quick-find", onOpenQuickFind);
    document.addEventListener("click", onSearchClick, true);
    return () => {
      window.removeEventListener("keydown", onGlobalKeyDown);
      window.removeEventListener("strap-open-quick-find", onOpenQuickFind);
      document.removeEventListener("click", onSearchClick, true);
    };
  }, [onOpenChange]);
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setRecent(readRecent());
  }, [open]);
  const recentActions = useMemo(
    () =>
      recent
        .map((to) => ACTIONS.find((action) => action.to === to))
        .filter((action): action is QuickAction => Boolean(action)),
    [recent],
  );
  const remember = (to: string) => {
    const next = [to, ...recent.filter((item) => item !== to)].slice(0, MAX_RECENT);
    setRecent(next);
    try {
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {}
  };
  const go = (to: string) => {
    remember(to);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try { navigator.vibrate(10); } catch { /* haptics are optional */ }
    }
    onOpenChange(false);
    void navigate({ to: to as never });
  };
  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Find in Strap"
      shouldFilter
      loop
      overlayClassName="fixed inset-0 z-[120] bg-foreground/25 backdrop-blur-xl animate-in fade-in duration-200"
      contentClassName="fixed left-1/2 top-[max(12px,env(safe-area-inset-top))] z-[121] flex max-h-[min(78dvh,680px)] w-[calc(100vw-24px)] max-w-2xl -translate-x-1/2 flex-col overflow-hidden rounded-[26px] border border-white/50 bg-background/75 shadow-[0_28px_100px_rgba(0,0,0,.22)] ring-1 ring-foreground/[0.05] backdrop-blur-2xl animate-in fade-in slide-in-from-top-3 duration-200 sm:w-[calc(100vw-48px)] sm:rounded-[30px]"
    >
      <div className="h-1 shrink-0 bg-gradient-to-r from-[#c6f432] via-[#d9ff68] to-transparent" />
      <div className="flex min-h-16 items-center gap-3 border-b border-border/60 bg-background/35 px-4 sm:min-h-[72px] sm:px-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground">
          <Search className="size-[18px]" aria-hidden="true" />
        </span>
        <Command.Input
          value={query}
          onValueChange={setQuery}
          placeholder="Search anything in Strap…"
          className="h-14 min-w-0 flex-1 bg-transparent text-[15px] leading-none outline-none placeholder:text-muted-foreground sm:text-base"
          autoFocus
        />
        <kbd className="hidden rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-semibold text-muted-foreground shadow-sm sm:block">
          ESC
        </kbd>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          aria-label="Close quick find"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <Command.List className="min-h-0 max-h-[min(58dvh,520px)] flex-1 overflow-y-auto px-3 py-2 outline-none sm:px-4">
        <Command.Empty className="px-4 py-9 text-center animate-in fade-in duration-200">
          <p className="text-sm font-semibold">No matching Strap destination</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Try a product, order, customer, report, extension, or action.
          </p>
        </Command.Empty>
        {!query.trim() && recentActions.length > 0 ? (
          <Command.Group
            heading="Recent"
            className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-muted-foreground"
          >
            {recentActions.map((action) => (
              <ActionItem key={`recent-${action.to}`} action={action} onSelect={go} />
            ))}
          </Command.Group>
        ) : null}
        <Command.Group
          heading={recentActions.length && !query.trim() ? "All workspaces" : "Jump to"}
          className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.16em] [&_[cmdk-group-heading]]:text-muted-foreground"
        >
          {ACTIONS.map((action) => (
            <ActionItem key={action.to} action={action} onSelect={go} />
          ))}
        </Command.Group>
      </Command.List>
      <div className="flex items-center justify-between gap-3 border-t border-border/80 bg-secondary/30 px-4 py-3 text-[10px] text-muted-foreground sm:px-5 sm:text-[11px]">
        <span className="font-semibold tracking-wide">STRAP QUICK FIND</span>
        <span className="hidden sm:inline">
          ↑↓ Navigate <span className="mx-1 opacity-40">·</span> Enter Open{" "}
          <span className="mx-1 opacity-40">·</span> Esc Close
        </span>
        <span className="sm:hidden">Enter to open · Esc to close</span>
      </div>
    </Command.Dialog>
  );
}
function ActionItem({ action, onSelect }: { action: QuickAction; onSelect: (to: string) => void }) {
  const Icon = action.icon;
  return (
    <Command.Item
      value={`${action.label} ${action.hint} ${action.keywords}`}
      onSelect={() => onSelect(action.to)}
      className="group flex cursor-default items-center gap-3 rounded-xl border-b border-border/35 px-2.5 py-3 text-left outline-none transition-all duration-150 data-[selected=true]:translate-x-1 data-[selected=true]:bg-foreground/[0.045] sm:px-3"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary/70 text-muted-foreground transition-colors group-data-[selected=true]:bg-[#c6f432] group-data-[selected=true]:text-[#111713]">
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{action.label}</span>
        <span className="block truncate text-xs text-muted-foreground">{action.hint}</span>
      </span>
      <ArrowRight className="size-4 text-muted-foreground/50 transition-transform group-data-[selected=true]:translate-x-1 group-data-[selected=true]:text-foreground" aria-hidden="true" />
    </Command.Item>
  );
}
export function QuickFindHost() {
  const [open, setOpen] = useState(false);
  return <QuickFind open={open} onOpenChange={setOpen} />;
}
