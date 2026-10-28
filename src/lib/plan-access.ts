import { supabase } from "@/integrations/supabase/client";

export type PlanCode = "free" | "business" | "pro";
export type SubscriptionState = { plan: PlanCode; status: string; interval: "month" | "year" };

export const PAID_AREAS = new Set(["/online-store", "/online-store/orders", "/online-store/catalog", "/reports", "/staff", "/hardware"]);

export async function getStoreSubscription(storeId: string): Promise<SubscriptionState> {
  const { data, error } = await supabase.from("store_subscriptions").select("plan_code,status,interval").eq("store_id", storeId).maybeSingle();
  if (error) throw new Error(error.message);
  const plan = data?.plan_code === "business" || data?.plan_code === "pro" ? data.plan_code : "free";
  return { plan, status: data?.status ?? "active", interval: data?.interval === "year" ? "year" : "month" };
}

export function hasEntitlement(subscription: SubscriptionState, required: "business" | "pro") {
  if (subscription.status !== "active") return false;
  if (required === "business") return subscription.plan === "business" || subscription.plan === "pro";
  return subscription.plan === "pro";
}

export function isPaidArea(pathname: string) { return [...PAID_AREAS].some(path => pathname === path || pathname.startsWith(`${path}/`)); }
