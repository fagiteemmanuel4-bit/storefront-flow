import { ShieldAlert, AlertTriangle, LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export type AccountStatus = "active" | "suspended" | "banned";

interface AccountStatusBannerProps {
  status: AccountStatus;
  reason?: string;
  onLogout?: () => void;
}

export function AccountStatusModal({ status, reason, onLogout }: AccountStatusBannerProps) {
  if (status === "active") return null;

  const isBanned = status === "banned";

  const handleSignOut = async () => {
    if (onLogout) {
      onLogout();
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="account-status-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
    >
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface p-6 sm:p-8 text-foreground shadow-2xl space-y-6">
        <div className="flex items-center gap-4">
          <div
            className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
              isBanned ? "bg-destructive/20 text-destructive" : "bg-amber-500/20 text-amber-500"
            }`}
          >
            {isBanned ? <ShieldAlert className="size-6" /> : <AlertTriangle className="size-6" />}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Security & Compliance
            </span>
            <h2
              id="account-status-title"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              {isBanned ? "Account Terminated (Banned)" : "Account Suspended"}
            </h2>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-background/50 p-4 text-sm leading-relaxed text-muted-foreground space-y-2">
          <p>
            {isBanned
              ? "Access to this workspace has been permanently revoked due to policy violations, fraudulent activity, or administrative ban enforcement."
              : "Your Strap workspace has been temporarily suspended pending account review, security verification, or payment reconciliation."}
          </p>
          {reason && (
            <p className="font-mono text-xs text-foreground bg-muted p-2 rounded-lg">
              <b>Notice:</b> {reason}
            </p>
          )}
        </div>

        <div className="space-y-3 pt-2">
          {!isBanned && (
            <a
              href="mailto:support@strap.ng?subject=Account%20Suspension%20Appeal"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-semibold text-accent-foreground transition hover:opacity-95"
            >
              <Mail className="size-4" /> Contact Compliance & Support
            </a>
          )}
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 font-medium hover:bg-secondary"
          >
            <LogOut className="size-4" /> Sign out of workspace
          </Button>
        </div>
      </div>
    </div>
  );
}
