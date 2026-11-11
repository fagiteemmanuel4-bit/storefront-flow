import { supabase } from "@/integrations/supabase/client";

export const PLATFORM_UPGRADE_MODE = true;

export type PlanCode = "free" | "business" | "pro";
export type SubscriptionState = {
  plan: PlanCode;
  status: string;
  interval: "month" | "year";
  expiresAt?: string | null;
};

export const PAID_AREAS = new Set([
  "/online-store",
  "/online-store/orders",
  "/online-store/catalog",
  "/reports",
  "/staff",
  "/hardware",
]);

export async function getStoreSubscription(storeId: string): Promise<SubscriptionState> {
  if (PLATFORM_UPGRADE_MODE) {
    return { plan: "pro", status: "active", interval: "month" };
  }

  const { data, error } = await supabase
    .from("store_subscriptions")
    .select("plan_code,status,interval,trial_ends_at,expires_at,current_period_end")
    .eq("store_id", storeId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  const plan =
    data?.plan_code === "business" || data?.plan_code === "pro" ? data.plan_code : "free";
  const status = data?.status ?? "inactive";
  const expiresAt =
    status === "trialing"
      ? (data?.trial_ends_at ?? null)
      : (data?.expires_at ?? data?.current_period_end ?? null);

  return {
    plan,
    status,
    interval: data?.interval === "year" ? "year" : "month",
    expiresAt,
  };
}

export function hasEntitlement(subscription: SubscriptionState, required: "business" | "pro") {
  if (PLATFORM_UPGRADE_MODE) return true;
  if (subscription.status !== "active" && subscription.status !== "trialing") return false;

  // Paid access must always have a verified, future billing/trial expiry.
  if (!subscription.expiresAt) return false;
  const expiry = Date.parse(subscription.expiresAt);
  if (!Number.isFinite(expiry) || expiry <= Date.now()) return false;

  if (required === "business") {
    return subscription.plan === "business" || subscription.plan === "pro";
  }
  return subscription.plan === "pro";
}

export function isPaidArea(pathname: string) {
  if (PLATFORM_UPGRADE_MODE) return false;
  return [...PAID_AREAS].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
