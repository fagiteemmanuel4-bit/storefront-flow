import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { CardSection } from "@/components/settings/SettingsPrimitives";
import { PREMIUM_PLANS, formatNaira } from "@/lib/premiumPlans";

type SubscriptionSummary = {
  plan_code: string | null;
  status: string;
  interval: "month" | "year";
  expires_at: string | null;
  current_period_end: string | null;
};

export function PaymentsSettingsPage() {
  const { store, role } = useStoreContext();
  const [subscription, setSubscription] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const canManage = role === "owner";

  const load = useCallback(async () => {
    if (!store?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("store_subscriptions")
      .select("plan_code,status,interval,expires_at,current_period_end")
      .eq("store_id", store.id)
      .maybeSingle();

    if (error) {
      toast.error("Could not load subscription details.");
      setSubscription(null);
    } else {
      setSubscription(data as SubscriptionSummary | null);
    }
    setLoading(false);
  }, [store?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const currentPlan =
    subscription?.plan_code === "business" || subscription?.plan_code === "pro"
      ? subscription.plan_code
      : "free";
  const periodEnd = subscription?.expires_at ?? subscription?.current_period_end ?? null;

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border p-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading subscription details…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <CardSection
        title="Subscription status"
        description="Your plan and billing status are shown here. Subscription changes are verified and applied by STRAP's secure billing service."
      >
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
              <CreditCard className="size-5" />
            </span>
            <div>
              <p className="font-semibold">{PREMIUM_PLANS[currentPlan].name} plan</p>
              <p className="text-xs text-muted-foreground">
                {subscription?.interval === "year" ? "Annual billing" : "Monthly billing"}
              </p>
            </div>
          </div>
          <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold capitalize">
            {subscription?.status ?? "Free"}
          </span>
        </div>
        {periodEnd && (
          <p className="mt-3 text-xs text-muted-foreground">
            Current billing period ends{" "}
            {new Date(periodEnd).toLocaleDateString("en-NG", { dateStyle: "medium" })}.
          </p>
        )}
      </CardSection>

      <CardSection
        title="Secure checkout is being prepared"
        description="STRAP will use Squad for premium subscription payments after production credentials, webhook configuration and settlement details have been supplied and verified."
      >
        <div className="flex gap-3 rounded-2xl border border-border bg-secondary/40 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent-ink" />
          <div>
            <p className="text-sm font-semibold">No payment will be taken yet</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Checkout is intentionally disabled while the payment integration is being secured.
              Your existing store data and subscription records remain untouched.
            </p>
          </div>
        </div>
        {!canManage && (
          <p className="mt-3 text-sm text-muted-foreground">
            Only the store owner will be able to manage the subscription when checkout is enabled.
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void load()}>
            <RefreshCw className="mr-2 size-4" />
            Refresh subscription
          </Button>
        </div>
      </CardSection>

      <CardSection title="Available plans" description="The three STRAP plans and their current Nigerian prices.">
        <div className="grid gap-3 sm:grid-cols-2">
          {(["business", "pro"] as const).map((code) => {
            const plan = PREMIUM_PLANS[code];
            return (
              <div key={code} className="rounded-2xl border border-border p-4">
                <p className="font-semibold">{plan.name}</p>
                <p className="mt-2 text-2xl font-bold">{formatNaira(plan.price)}</p>
                <p className="text-xs text-muted-foreground">per month</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {formatNaira(plan.yearlyPrice)} billed yearly
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Business includes the Stripe connection feature for eligible merchant accounts. STRAP's
          own subscription checkout is a separate payment flow and will use Squad.
        </p>
      </CardSection>
    </div>
  );
}
