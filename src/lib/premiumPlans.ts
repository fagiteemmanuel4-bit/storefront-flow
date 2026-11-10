export type PremiumTier = "free" | "business" | "pro";

export const PREMIUM_PLANS = {
  free: {
    name: "Free",
    price: 0,
    yearlyPrice: 0,
    description: "The essential tools to run a single shop and record everyday sales.",
    onlineStore: false,
    highlight: "Start with the essentials",
    features: [
      "Point of sale, cart and digital receipts",
      "Product catalogue and stock quantities",
      "Customer records and purchase history",
      "Expense tracking and sales overview",
      "1 staff account and 1 branch",
    ],
  },
  business: {
    name: "Business",
    price: 3000,
    yearlyPrice: 28800,
    description: "Bring your shop online and unlock more control as your operation grows.",
    onlineStore: true,
    highlight: "For growing businesses",
    features: [
      "Everything in Free",
      "Online storefront, public catalogue and online orders",
      "Storefront categories, featured products and layouts",
      "Advanced inventory tools and stock insights",
      "Sales, expense and product performance reports",
      "Store data export",
      "Up to 5 staff accounts and 3 branches",
      "Stripe merchant connection (coming soon)",
    ],
  },
  pro: {
    name: "Pro",
    price: 5000,
    yearlyPrice: 48000,
    description: "Business features with room for larger teams and multi-branch operations.",
    onlineStore: true,
    highlight: "For expanding operations",
    features: [
      "Everything in Business",
      "Unlimited staff accounts",
      "Unlimited branches",
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
