import { useQuery } from "@tanstack/react-query";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCommerceFeature, type CommerceFeatureStatus } from "@/lib/commerceFeatureFlags";
import { getStoreSubscription, hasEntitlement } from "@/lib/plan-access";
import { useStoreContext } from "@/components/shell/StoreProvider";

type Props = { feature: string; className?: string };
const labels: Record<CommerceFeatureStatus, string> = { available: "Available", "limited-free": "Limited free", premium: "Premium", "coming-soon": "Coming soon" };
export function FeatureStatusBadge({ feature, className }: Props) {
  const item = getCommerceFeature(feature); const { store } = useStoreContext();
  const subscription = useQuery({ queryKey: ["feature-status-subscription", store?.id], enabled: Boolean(store?.id && item?.status === "premium"), staleTime: 60_000, queryFn: () => getStoreSubscription(store!.id) });
  if (!item || item.status === "available") return null;
  if (item.status === "premium" && subscription.data && hasEntitlement(subscription.data, "business")) return null;
  return <span title={item.description} className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide", item.status === "premium" ? "border-amber-200 bg-amber-50 text-amber-700" : item.status === "coming-soon" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700", className)}>{item.status === "premium" && <Crown className="size-3" aria-hidden="true"/>}{labels[item.status]}</span>;
}
