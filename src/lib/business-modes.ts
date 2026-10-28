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
  status: "available" | "planned";
};

export type BusinessQuickAction = {
  label: string;
  description: string;
  to: "/pos" | "/products" | "/customers" | "/reports" | "/expenses" | "/settings/inventory" | "/online-store" | "/online-store/orders" | "/fashion-returns" | "/electronics-workspace";
};

export type BusinessMode = {
  key: BusinessModeKey;
  label: string;
  eyebrow: string;
  description: string;
  bestFor: string;
  workflows: BusinessWorkflow[];
  quickActions: BusinessQuickAction[];
};

const commonWorkflows: BusinessWorkflow[] = [
  { title: "Fast checkout", detail: "Sell from the current product catalogue and keep the sale history in one place.", status: "available" },
  { title: "Stock visibility", detail: "Review available quantities and low-stock alerts before replenishing.", status: "available" },
  { title: "Sales reporting", detail: "Review recorded sales and compare activity over time.", status: "available" },
];

export const BUSINESS_MODES: BusinessMode[] = [
  {
    key: "general-retail",
    label: "General retail",
    eyebrow: "A flexible starting point",
    description: "A balanced workspace for shops selling a mix of everyday products.",
    bestFor: "Mini-marts, general shops, kiosks and mixed catalogues",
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
    eyebrow: "High-turnover stock",
    description: "Prioritise fast checkout, low-stock visibility and pack-versus-piece selling.",
    bestFor: "Provision stores, supermarkets, wholesalers and foodstuff shops",
    workflows: [
      { title: "Fast checkout and barcode scanning", detail: "Find products quickly and scan supported barcodes at the counter.", status: "available" },
      { title: "Pack and piece selling", detail: "Use the existing pack/piece product workflow where it is configured.", status: "available" },
      { title: "Low-stock review", detail: "Spot items that need replenishing.", status: "available" },
      { title: "Expiry-date and batch tracking", detail: "Track dated stock lots and prioritise items approaching expiry.", status: "planned" },
      { title: "Supplier reorder suggestions", detail: "Prepare a restock list from sales velocity and available stock.", status: "planned" },
    ],
    quickActions: [
      { label: "Sell items", description: "Fast checkout", to: "/pos" },
      { label: "Check low stock", description: "Review inventory", to: "/products" },
      { label: "Sales report", description: "See what moves", to: "/reports" },
    ],
  },
  {
    key: "fashion",
    label: "Fashion & boutiques",
    eyebrow: "Style and variants",
    description: "Build a photo-first clothing catalogue, list sizes and colours, and share styles with customers.",
    bestFor: "Clothing, footwear, bags, accessories and beauty boutiques",
    workflows: [
      { title: "Product catalogue and stock", detail: "Maintain the catalogue, prices and current stock.", status: "available" },
      { title: "Customer purchase history", detail: "Review customer records and support repeat visits.", status: "available" },
      { title: "Sizes and colours", detail: "Add available sizes, colours, fabric and style notes to each clothing item.", status: "available" },
      { title: "Stock by size and colour", detail: "Track exact quantities for each size-and-colour combination during checkout.", status: "planned" },
      { title: "WhatsApp product sharing", detail: "Share a product message with its price, sizes, colours and online-store link.", status: "available" },
      { title: "Exchanges and returns workflow", detail: "Record exchanges and return reasons with clear stock adjustments.", status: "planned" },
    ],
    quickActions: [
      { label: "Manage collection", description: "Photos, sizes and prices", to: "/products" },
      { label: "Online storefront", description: "Publish and promote styles", to: "/online-store" },
      { label: "Customer orders", description: "Review incoming orders", to: "/online-store/orders" },
      { label: "Returns & exchanges", description: "Restock returned clothing", to: "/fashion-returns" },
    ],
  },
  {
    key: "electronics",
    label: "Electronics & phones",
    eyebrow: "Higher-value products",
    description: "Track each device by serial number or IMEI, manage warranty coverage, and keep repair jobs visible beside stock and sales.",
    bestFor: "Phone shops, electronics, accessories and computer stores",
    workflows: [
      { title: "Product catalogue and stock", detail: "Keep prices and available quantities visible.", status: "available" },
      { title: "Receipts and sales history", detail: "Find completed sales and their recorded details.", status: "available" },
      { title: "Serial number and IMEI records", detail: "Register each physical unit, link its identifier to checkout, and track available devices.", status: "available" },
      { title: "Warranty tracking", detail: "Start warranty coverage when a registered device is sold and keep the expiry visible.", status: "available" },
      { title: "Repair intake and status queue", detail: "Record customer devices, reported faults, warranty claims, estimates and repair progress.", status: "available" },
    ],
    quickActions: [
      { label: "Product catalogue", description: "Review stock", to: "/products" },
      { label: "Checkout", description: "Record a sale", to: "/pos" },
      { label: "Devices & warranty", description: "Serials, IMEIs and coverage", to: "/electronics-workspace" },
      { label: "Repair desk", description: "Register and track repairs", to: "/electronics-workspace" },
      { label: "Expenses", description: "Track shop costs", to: "/expenses" },
    ],
  },
  {
    key: "food-service",
    label: "Food & restaurants",
    eyebrow: "Orders and ingredients",
    description: "Start with sales and cost visibility, with restaurant-specific workflows clearly mapped for later.",
    bestFor: "Restaurants, cafés, bakeries, caterers and takeaway sellers",
    workflows: [
      { title: "Record sales and expenses", detail: "Use the existing checkout and expense records.", status: "available" },
      { title: "Menu modifiers and order notes", detail: "Capture size, add-ons and preparation notes per order.", status: "planned" },
      { title: "Kitchen order screen", detail: "Send confirmed orders to a kitchen-facing queue.", status: "planned" },
      { title: "Recipe costing and ingredient deductions", detail: "Calculate food cost and reduce ingredient stock as meals sell.", status: "planned" },
      { title: "Waste and spoilage tracking", detail: "Record waste separately from customer sales.", status: "planned" },
    ],
    quickActions: [
      { label: "Record a sale", description: "Open checkout", to: "/pos" },
      { label: "Track expenses", description: "Review costs", to: "/expenses" },
      { label: "Sales report", description: "Review activity", to: "/reports" },
    ],
  },
  {
    key: "pharmacy",
    label: "Pharmacy & health products",
    eyebrow: "Traceability first",
    description: "Keep catalogue and stock visibility central while specialist controls are planned carefully.",
    bestFor: "Licensed pharmacies and health-product retailers",
    workflows: [
      { title: "Product catalogue and stock alerts", detail: "Review available stock and low-stock items.", status: "available" },
      { title: "Sales records", detail: "Review recorded transactions.", status: "available" },
      { title: "Batch, expiry and recall traceability", detail: "Track lots and identify affected stock quickly.", status: "planned" },
      { title: "Pharmacy-specific safeguards", detail: "Design compliant access, dispensing and audit workflows before enabling them.", status: "planned" },
    ],
    quickActions: [
      { label: "Review products", description: "Catalogue and stock", to: "/products" },
      { label: "Inventory settings", description: "Stock controls", to: "/settings/inventory" },
      { label: "Reports", description: "Review sales", to: "/reports" },
    ],
  },
  {
    key: "beauty-personal-care",
    label: "Beauty & personal care",
    eyebrow: "Products and repeat visits",
    description: "Make product stock and customer records easy to access for repeat business.",
    bestFor: "Beauty supply shops, cosmetics, skincare and personal-care retailers",
    workflows: [
      { title: "Product catalogue and stock", detail: "Maintain product prices and quantities.", status: "available" },
      { title: "Customer records", detail: "Keep customer details available for repeat visits.", status: "available" },
      { title: "Appointments and service bookings", detail: "Schedule services and track booking status.", status: "planned" },
      { title: "Consumable usage", detail: "Track products used during services separately from retail sales.", status: "planned" },
    ],
    quickActions: [
      { label: "Products", description: "Manage retail items", to: "/products" },
      { label: "Customers", description: "Customer records", to: "/customers" },
      { label: "Sales report", description: "Review performance", to: "/reports" },
    ],
  },
  {
    key: "services",
    label: "Services & appointments",
    eyebrow: "People and jobs",
    description: "Use customer and financial records now, with service-specific scheduling mapped as a future workflow.",
    bestFor: "Repair shops, studios, consultants and appointment-based businesses",
    workflows: [
      { title: "Customer records", detail: "Keep contact details and customer history together.", status: "available" },
      { title: "Sales receipts and expenses", detail: "Record income and operating costs.", status: "available" },
      { title: "Appointments and job cards", detail: "Schedule bookings and track work from intake to completion.", status: "planned" },
      { title: "Service packages and deposits", detail: "Track bundled services and partial payments.", status: "planned" },
    ],
    quickActions: [
      { label: "Customers", description: "Open customer records", to: "/customers" },
      { label: "Expenses", description: "Track operating costs", to: "/expenses" },
      { label: "Reports", description: "Review activity", to: "/reports" },
    ],
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
