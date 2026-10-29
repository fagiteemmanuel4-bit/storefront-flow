export type BusinessModeKey =
  | "general-retail"
  | "grocery-provision"
  | "fashion"
  | "electronics"
  | "food-service"
  | "pharmacy"
  | "beauty-personal-care"
  | "services";

export type BusinessWorkflow = {
  title: string;
  detail: string;
  status: "available" | "planned" | "coming-soon";
};

export type BusinessQuickAction = {
  label: string;
  description: string;
  to:
    | "/pos"
    | "/products"
    | "/customers"
    | "/reports"
    | "/expenses"
    | "/settings/inventory"
    | "/online-store"
    | "/online-store/orders"
    | "/fashion-returns"
    | "/electronics-workspace"
    | "/food-service"
    | "/grocery-inventory";
};

export type BusinessMode = {
  key: BusinessModeKey;
  label: string;
  eyebrow: string;
  description: string;
  bestFor: string;
  isAvailable: boolean;
  workflows: BusinessWorkflow[];
  quickActions: BusinessQuickAction[];
};

const commonWorkflows: BusinessWorkflow[] = [
  {
    title: "Fast checkout",
    detail: "Sell from the current product catalogue and keep the sale history in one place.",
    status: "available",
  },
  {
    title: "Stock visibility",
    detail: "Review available quantities and low-stock alerts before replenishing.",
    status: "available",
  },
  {
    title: "Sales reporting",
    detail: "Review recorded sales and compare activity over time.",
    status: "available",
  },
];

export const BUSINESS_MODES: BusinessMode[] = [
  {
    key: "general-retail",
    label: "General retail",
    eyebrow: "A flexible starting point",
    description: "A balanced workspace for shops selling a mix of everyday products.",
    bestFor: "Mini-marts, general shops, kiosks and mixed catalogues",
    isAvailable: true,
    workflows: commonWorkflows,
    quickActions: [
      { label: "Open checkout", description: "Start a sale", to: "/pos" },
      { label: "Manage products", description: "Prices and stock", to: "/products" },
      { label: "View reports", description: "Review performance", to: "/reports" },
    ],
  },
  {
    key: "grocery-provision",
    label: "Groceries & provision",
    eyebrow: "Coming soon",
    description: "Prioritise fast checkout, low-stock visibility and pack-versus-piece selling.",
    bestFor: "Provision stores, supermarkets, wholesalers and foodstuff shops",
    isAvailable: false,
    workflows: [
      {
        title: "Fast checkout and barcode scanning",
        detail: "Find products quickly and scan supported barcodes at the counter.",
        status: "coming-soon",
      },
      {
        title: "Pack and piece selling",
        detail: "Use the existing pack/piece product workflow where it is configured.",
        status: "coming-soon",
      },
      {
        title: "Low-stock review",
        detail: "Spot items that need replenishing.",
        status: "coming-soon",
      },
    ],
    quickActions: [
      { label: "Sell items", description: "Fast checkout", to: "/pos" },
      {
        label: "Batch & expiry",
        description: "Track lots and expiry dates",
        to: "/grocery-inventory",
      },
    ],
  },
  {
    key: "fashion",
    label: "Fashion & boutiques",
    eyebrow: "Coming soon",
    description:
      "Build a photo-first clothing catalogue, list sizes and colours, and share styles with customers.",
    bestFor: "Clothing, footwear, bags, accessories and beauty boutiques",
    isAvailable: false,
    workflows: [
      {
        title: "Product catalogue and stock",
        detail: "Maintain the catalogue, prices and current stock.",
        status: "coming-soon",
      },
      {
        title: "Customer purchase history",
        detail: "Review customer records and support repeat visits.",
        status: "coming-soon",
      },
      {
        title: "Sizes and colours",
        detail: "Add available sizes, colours, fabric and style notes to each clothing item.",
        status: "coming-soon",
      },
    ],
    quickActions: [
      { label: "Manage collection", description: "Photos, sizes and prices", to: "/products" },
    ],
  },
  {
    key: "electronics",
    label: "Electronics & phones",
    eyebrow: "Coming soon",
    description:
      "Track each device by serial number or IMEI, manage warranty coverage, and keep repair jobs visible beside stock and sales.",
    bestFor: "Phone shops, electronics, accessories and computer stores",
    isAvailable: false,
    workflows: [
      {
        title: "Product catalogue and stock",
        detail: "Keep prices and available quantities visible.",
        status: "coming-soon",
      },
      {
        title: "Serial number and IMEI records",
        detail:
          "Register each physical unit, link its identifier to checkout, and track available devices.",
        status: "coming-soon",
      },
    ],
    quickActions: [{ label: "Product catalogue", description: "Review stock", to: "/products" }],
  },
  {
    key: "food-service",
    label: "Food & restaurants",
    eyebrow: "Coming soon",
    description:
      "Start with sales and cost visibility, with restaurant-specific workflows clearly mapped for later.",
    bestFor: "Restaurants, cafés, bakeries, caterers and takeaway sellers",
    isAvailable: false,
    workflows: [
      {
        title: "Record sales and expenses",
        detail: "Use the existing checkout and expense records.",
        status: "coming-soon",
      },
    ],
    quickActions: [{ label: "Record a sale", description: "Sell menu items", to: "/pos" }],
  },
  {
    key: "pharmacy",
    label: "Pharmacy & health products",
    eyebrow: "Coming soon",
    description:
      "Keep catalogue and stock visibility central while specialist controls are planned carefully.",
    bestFor: "Licensed pharmacies and health-product retailers",
    isAvailable: false,
    workflows: [
      {
        title: "Product catalogue and stock alerts",
        detail: "Review available stock and low-stock items.",
        status: "coming-soon",
      },
    ],
    quickActions: [
      { label: "Review products", description: "Catalogue and stock", to: "/products" },
    ],
  },
  {
    key: "beauty-personal-care",
    label: "Beauty & personal care",
    eyebrow: "Coming soon",
    description: "Make product stock and customer records easy to access for repeat business.",
    bestFor: "Beauty supply shops, cosmetics, skincare and personal-care retailers",
    isAvailable: false,
    workflows: [
      {
        title: "Product catalogue and stock",
        detail: "Maintain product prices and quantities.",
        status: "coming-soon",
      },
    ],
    quickActions: [{ label: "Products", description: "Manage retail items", to: "/products" }],
  },
  {
    key: "services",
    label: "Services & appointments",
    eyebrow: "Coming soon",
    description:
      "Use customer and financial records now, with service-specific scheduling mapped as a future workflow.",
    bestFor: "Repair shops, studios, consultants and appointment-based businesses",
    isAvailable: false,
    workflows: [
      {
        title: "Customer records",
        detail: "Keep contact details and customer history together.",
        status: "coming-soon",
      },
    ],
    quickActions: [{ label: "Customers", description: "Open customer records", to: "/customers" }],
  },
];

export function getBusinessMode(value: unknown): BusinessMode {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  const aliases: Record<string, BusinessModeKey> = {
    retail: "general-retail",
    "general retail": "general-retail",
    grocery: "grocery-provision",
    groceries: "grocery-provision",
    provision: "grocery-provision",
    "grocery & provision": "grocery-provision",
    "grocery and provision": "grocery-provision",
    boutique: "fashion",
    clothing: "fashion",
    "fashion retail": "fashion",
    electronics: "electronics",
    phones: "electronics",
    restaurant: "food-service",
    food: "food-service",
    bakery: "food-service",
    pharmacy: "pharmacy",
    cosmetics: "beauty-personal-care",
    beauty: "beauty-personal-care",
    services: "services",
  };
  const key = BUSINESS_MODES.some((mode) => mode.key === normalized)
    ? (normalized as BusinessModeKey)
    : aliases[normalized];
  return BUSINESS_MODES.find((mode) => mode.key === key) ?? BUSINESS_MODES[0]!;
}
