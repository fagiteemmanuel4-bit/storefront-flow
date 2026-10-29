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
  to: "/pos" | "/products" | "/customers" | "/reports" | "/expenses" | "/settings/inventory" | "/online-store" | "/online-store/orders" | "/fashion-returns" | "/electronics-workspace" | "/food-service" | "/grocery-inventory";
};

export type BusinessMode = {
  key: BusinessModeKey;
  availability: "available" | "coming-soon";
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
    availability: "available",
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
    availability: "coming-soon",
    label: "Groceries & provision",
    eyebrow: "High-turnover stock",
    description: "Prioritise fast checkout, low-stock visibility and pack-versus-piece selling.",
    bestFor: "Provision stores, supermarkets, wholesalers and foodstuff shops",
    workflows: [
      { title: "Fast checkout and barcode scanning", detail: "Find products quickly and scan supported barcodes at the counter.", status: "available" },
      { title: "Pack and piece selling", detail: "Use the existing pack/piece product workflow where it is configured.", status: "available" },
      { title: "Low-stock review", detail: "Spot items that need replenishing.", status: "available" },
      { title: "Expiry-date and batch tracking", detail: "Track lots by expiry and allocate eligible stock using first-expiry-first-out.", status: "available" },
      { title: "Supplier reorder suggestions", detail: "Suggest replenishment quantities from current stock, low-stock thresholds and recent sales velocity.", status: "available" },
      { title: "Waste and expired stock", detail: "Record batch waste and remove expired or held quantities from sellable stock.", status: "available" },
    ],
    quickActions: [
      { label: "Sell items", description: "Fast checkout", to: "/pos" },
      { label: "Batch & expiry", description: "Track lots and expiry dates", to: "/grocery-inventory" },
      { label: "Restock suggestions", description: "Review replenishment needs", to: "/grocery-inventory" },
    ],
  },
  {
    key: "fashion",
    availability: "coming-soon",
    label: "Fashion & boutiques",
    eyebrow: "Style and variants",
    description: "Build a photo-first catalogue for apparel, footwear, bags and accessories, track variants, and share products with customers.",
    bestFor: "Apparel, footwear, bags, jewellery and accessories boutiques",
    workflows: [
      { title: "Product catalogue and stock", detail: "Maintain the catalogue, prices and current stock.", status: "available" },
      { title: "Customer purchase history", detail: "Review customer records and support repeat visits.", status: "available" },
      { title: "Sizes and colours", detail: "Add available sizes, colours, material and style notes to each relevant product.", status: "available" },
      { title: "Stock by size and colour", detail: "Track exact quantities for each size-and-colour combination and decrement the selected variant at checkout.", status: "available" },
      { title: "WhatsApp product sharing", detail: "Share a product message with its price, sizes, colours and online-store link.", status: "available" },
      { title: "Exchanges and returns workflow", detail: "Record returns, prevent over-returning, restock the original size/colour, then record the replacement sale.", status: "available" },
    ],
    quickActions: [
      { label: "Manage products", description: "Photos, variants and prices", to: "/products" },
      { label: "Online storefront", description: "Publish and promote styles", to: "/online-store" },
      { label: "Customer orders", description: "Review incoming orders", to: "/online-store/orders" },
      { label: "Returns & exchanges", description: "Restock returned items", to: "/fashion-returns" },
    ],
  },
  {
    key: "electronics",
    availability: "coming-soon",
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
    availability: "coming-soon",
    label: "Food & restaurants",
    eyebrow: "Orders and ingredients",
    description: "Start with sales and cost visibility, with restaurant-specific workflows clearly mapped for later.",
    bestFor: "Restaurants, cafés, bakeries, caterers and takeaway sellers",
    workflows: [
      { title: "Record sales and expenses", detail: "Use the existing checkout and expense records.", status: "available" },
      { title: "Menu modifiers and order notes", detail: "Capture priced options and preparation notes for each menu item at checkout.", status: "available" },
      { title: "Kitchen order screen", detail: "Create a kitchen ticket automatically for each confirmed food-service sale.", status: "available" },
      { title: "Recipe costing and ingredient deductions", detail: "Estimate ingredient cost and reduce recipe stock when menu items sell.", status: "available" },
      { title: "Waste and spoilage tracking", detail: "Record ingredient waste with a reason and deduct stock safely.", status: "available" },
    ],
    quickActions: [
      { label: "Kitchen & menu", description: "Tickets, recipes and modifiers", to: "/food-service" },
      { label: "Record a sale", description: "Sell menu items", to: "/pos" },
      { label: "Waste log", description: "Track ingredient loss", to: "/food-service" },
    ],
  },
  {
    key: "pharmacy",
    availability: "coming-soon",
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
    availability: "coming-soon",
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
    availability: "coming-soon",
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
