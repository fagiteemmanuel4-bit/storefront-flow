import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BadgeCheck,
  Bot,
  Building2,
  CreditCard,
  Download,
  FileBarChart,
  Lock,
  LogOut,
  Printer,
  Receipt,
  Settings,
  SlidersHorizontal,
  Store,
  Trash2,
  Users,
  WifiOff,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StoreSettingsDialog } from "@/components/shell/StoreSettingsDialog";
import { PreferencesDialog } from "@/components/shell/PreferencesDialog";
import { ExportDataDialog } from "@/components/shell/ExportDataDialog";
import { DeleteStoreDialog } from "@/components/shell/DeleteStoreDialog";
import { cn } from "@/lib/utils";
import type { StoreRow, StoreRole } from "@/lib/pos-types";

const COMING_SOON = [
  { label: "Multi-branch", icon: Building2, hint: "Run several locations" },
  { label: "Staff accounts", icon: Users, hint: "PIN logins for your team" },
  { label: "Credit tracking", icon: CreditCard, hint: "Who owes you what" },
  { label: "AI assistant", icon: Bot, hint: "Ask about your shop" },
  { label: "Receipt printing", icon: Printer, hint: "Bluetooth printers" },
  { label: "Customers", icon: BadgeCheck, hint: "Know your regulars" },
  { label: "Offline mode", icon: WifiOff, hint: "Sell without network" },
] as const;

function MenuRow({
  icon: Icon,
  label,
  hint,
  onClick,
  tone = "default",
}: {
  icon: typeof Store;
  label: string;
  hint?: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors",
        tone === "danger"
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-secondary",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full",
          tone === "danger" ? "bg-destructive/10" : "bg-accent-soft",
        )}
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block truncate text-xs text-muted-foreground">{hint}</span>}
      </span>
    </button>
  );
}

export function AppMenuSheet({
  open,
  onOpenChange,
  store,
  branchName,
  role,
  onSignOut,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store: StoreRow | null;
  branchName: string | null;
  role: StoreRole | null;
  onSignOut: () => void;
}) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = role === "owner";

  function openDialog(setter: (v: boolean) => void) {
    onOpenChange(false);
    setter(true);
  }

  const initials = (store?.name ?? "K").trim().slice(0, 2).toUpperCase();

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-border bg-surface px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 sm:max-w-lg sm:mx-auto"
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden />

          <SheetHeader className="space-y-0 p-0 text-left">
            <div className="flex items-center gap-3 rounded-2xl bg-secondary/60 p-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-accent font-display text-base font-bold text-foreground">
                {initials}
              </span>
              <div className="min-w-0">
                <SheetTitle className="truncate text-base">{store?.name ?? "Your shop"}</SheetTitle>
                <p className="truncate text-xs text-muted-foreground">
                  {branchName ? `${branchName} · ` : ""}
                  {role ? role[0]!.toUpperCase() + role.slice(1) : "Member"}
                </p>
              </div>
            </div>
          </SheetHeader>

          <div className="mt-3 space-y-0.5">
            <Link to="/reports" onClick={() => onOpenChange(false)} className="block">
              <div className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors text-foreground hover:bg-secondary">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                  <FileBarChart className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Reports</span>
                  <span className="block truncate text-xs text-muted-foreground">Deeper trading insight</span>
                </span>
              </div>
            </Link>
            <Link to="/expenses" onClick={() => onOpenChange(false)} className="block">
              <div className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors text-foreground hover:bg-secondary">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft">
                  <Receipt className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">Expenses</span>
                  <span className="block truncate text-xs text-muted-foreground">Track what you spend</span>
                </span>
              </div>
            </Link>
            <MenuRow
              icon={Store}
              label="Store profile"
              hint="Name, phone, address"
              onClick={() => openDialog(setProfileOpen)}
            />
            <MenuRow
              icon={Settings}
              label="Settings"
              hint="Currency, tax, low-stock"
              onClick={() => openDialog(setSettingsOpen)}
            />
            <MenuRow
              icon={SlidersHorizontal}
              label="Change preference"
              hint="Sound, vibration, layout"
              onClick={() => openDialog(setPrefsOpen)}
            />
            <MenuRow
              icon={Download}
              label="Download store data"
              hint="Excel workbook by date range"
              onClick={() => openDialog(setExportOpen)}
            />
            <MenuRow icon={LogOut} label="Logout" tone="danger" onClick={onSignOut} />
            {isOwner && (
              <MenuRow
                icon={Trash2}
                label="Delete store"
                hint="Permanent — cannot be undone"
                tone="danger"
                onClick={() => openDialog(setDeleteOpen)}
              />
            )}
          </div>

          <div className="mt-5">
            <p className="text-label-caps px-3 text-muted-foreground">Coming soon</p>
            <div className="mt-2 space-y-0.5">
              {COMING_SOON.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 opacity-60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Icon className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-muted-foreground">
                        {item.label}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.hint}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      <Lock className="size-3" aria-hidden />
                      Soon
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Button variant="outline" className="mt-4 w-full" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetContent>
      </Sheet>

      <StoreSettingsDialog
        store={store}
        mode="profile"
        canEdit={isOwner}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
      <StoreSettingsDialog
        store={store}
        mode="settings"
        canEdit={isOwner}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
      <PreferencesDialog open={prefsOpen} onOpenChange={setPrefsOpen} />
      <ExportDataDialog store={store} open={exportOpen} onOpenChange={setExportOpen} />
      <DeleteStoreDialog store={store} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}
