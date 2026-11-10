export type PremiumTier = "free" | "business" | "pro";

export const PREMIUM_PLANS = {
  free: {
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    description: "Run your counter and learn your numbers.",
    onlineStore: false,
    highlight: "Core selling",
    features: [
      "POS selling and digital receipts",
      "Product catalogue and stock basics",
      "Customer records and expenses",
      "Core sales and business overview",
    ],
  },
  business: {
    name: "Business",
    price: 3000,
    yearlyPrice: 28800,
    description: "Put your shop online and connect the tools your growing business needs.",
    onlineStore: true,
    highlight: "Best for growing shops",
    features: [
      "Everything in Free",
      "Online storefront and public catalog",
      "Storefront categories and product layouts",
      "Stripe connection for eligible merchant accounts",
      "Staff and team controls",
      "Advanced stock tools and data export",
    ],
  },
  pro: {
    name: "Pro",
    price: 5000,
    yearlyPrice: 48000,
    description: "More operational control for teams, branches and deeper business insights.",
    onlineStore: true,
    highlight: "Most complete",
    features: [
      "Everything in Business",
      "Multiple branches",
      "Advanced reports and insights",
      "Advanced inventory workflows",
      "Priority business workflows",
    ],
  },
} as const;

export const PREMIUM_FEATURES = [
  ...new Set([...PREMIUM_PLANS.business.features, ...PREMIUM_PLANS.pro.features]),
];

export function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}
