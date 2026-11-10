import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/settings/SettingsPrimitives";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  business: "Business",
  pro: "Pro",
};

export function PaymentsSettingsPage() {
  const { store, role } = useStoreContext();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const canManage = role === "owner";

  const load = useCallback(async () => {
    if (!store?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("store_subscriptions")
      .select("plan_code,status,amount,currency,interval,current_period_end,expires_at")
      .eq("store_id", store.id)
      .maybeSingle();

    if (error) toast.error("Could not load subscription details.");
    setSubscription(data ?? null);
    setLoading(false);
  }, [store?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const planCode = String(subscription?.plan_code ?? "free").toLowerCase();
  const planLabel = PLAN_LABELS[planCode] ?? "Free";
  const status = String(subscription?.status ?? "free").replaceAll("_", " ");
  const periodEnd = subscription?.current_period_end ?? subscription?.expires_at;
  const amount = Number(subscription?.amount ?? 0);
  const currency = String(subscription?.currency ?? store?.currency ?? "NGN").toUpperCase();
  const formattedAmount = Number.isFinite(amount)
    ? new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount)
    : "—";

  if (loading) {
    return (
      <div className="rounded-2xl border border-border p-8 text-sm text-muted-foreground">
        Loading subscription details…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CardSection
        title="Current subscription"
        description="Your STRAP plan and access status are managed securely on the server."
      >
        <div className="rounded-2xl border border-border bg-secondary/40 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current plan
              </p>
              <p className="mt-1 text-xl font-semibold">{planLabel}</p>
              <p className="mt-1 text-sm capitalize text-muted-foreground">{status}</p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
              <ShieldCheck className="size-5" />
            </span>
          </div>
          {planCode !== "free" && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Recorded price</p>
                <p className="mt-1 font-semibold">{formattedAmount}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Billing interval</p>
                <p className="mt-1 font-semibold capitalize">{subscription?.interval ?? "—"}</p>
              </div>
              {periodEnd && (
                <div>
                  <p className="text-xs text-muted-foreground">Current period ends</p>
                  <p className="mt-1 font-semibold">
                    {new Date(periodEnd).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className="mr-2 size-4" />
            Refresh subscription
          </Button>
          {!canManage && (
            <p className="text-sm text-muted-foreground">
              Only the store owner can manage billing.
            </p>
          )}
        </div>
      </CardSection>

      <CardSection
        title="Secure subscription checkout"
        description="STRAP is preparing its Squad payment connection."
      >
        <div className="rounded-2xl border border-border bg-secondary/30 p-4 text-sm leading-6 text-muted-foreground">
          Premium checkout is temporarily unavailable while the Squad integration is prepared and
          security-tested. No payment will be initiated from this screen until the production
          connection is configured and verified. Your store data and current plan remain available.
        </div>
      </CardSection>
    </div>
  );
}
