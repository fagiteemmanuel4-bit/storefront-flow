export type PremiumTier = "free" | "business" | "pro";

export const PREMIUM_PLANS = {
  free: {
    name: "Free",
    price: 0,
    description: "All supported STRAP features are unlocked during the platform upgrade.",
    onlineStore: false,
    highlight: "Temporarily unlocked",
  },
  business: {
    name: "Free during upgrade",
    price: 0,
    description: "All supported STRAP features are unlocked during the platform upgrade.",
    onlineStore: false,
    highlight: "Temporarily unlocked",
  },
  pro: {
    name: "Free during upgrade",
    price: 0,
    description: "All supported STRAP features are unlocked during the platform upgrade.",
    onlineStore: false,
    highlight: "Temporarily unlocked",
  },
} as const;

export const PREMIUM_FEATURES = [
  "Advanced stock tools",
  "Staff and team controls",
  "Multiple branches on eligible plans",
  "Advanced reports and insights",
  "Store data export",
  "Priority business workflows",
] as const;

export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
