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
    | "/grocery-inventory"
    | "/pharmacy"
    | "/beauty"
    | "/services";
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
      {
        title: "Fast checkout and barcode scanning",
        detail: "Find products quickly and scan supported barcodes at the counter.",
        status: "available",
      },
      {
        title: "Pack and piece selling",
        detail: "Use the existing pack/piece product workflow where it is configured.",
        status: "available",
      },
      {
        title: "Low-stock review",
        detail: "Spot items that need replenishing.",
        status: "available",
      },
      {
        title: "Expiry-date and batch tracking",
        detail: "Track lots by expiry and allocate eligible stock using first-expiry-first-out.",
        status: "available",
      },
      {
        title: "Supplier reorder suggestions",
        detail:
          "Suggest replenishment quantities from current stock, low-stock thresholds and recent sales velocity.",
        status: "available",
      },
      {
        title: "Waste and expired stock",
        detail: "Record batch waste and remove expired or held quantities from sellable stock.",
        status: "available",
      },
    ],
    quickActions: [
      { label: "Sell items", description: "Fast checkout", to: "/pos" },
      {
        label: "Batch & expiry",
        description: "Track lots and expiry dates",
        to: "/grocery-inventory",
      },
      {
        label: "Restock suggestions",
        description: "Review replenishment needs",
        to: "/grocery-inventory",
      },
    ],
  },
  {
    key: "fashion",
    label: "Fashion & boutiques",
    eyebrow: "Style and variants",
    description:
      "Build a photo-first clothing catalogue, list sizes and colours, and share styles with customers.",
    bestFor: "Clothing, footwear, bags, accessories and beauty boutiques",
    workflows: [
      {
        title: "Product catalogue and stock",
        detail: "Maintain the catalogue, prices and current stock.",
        status: "available",
      },
      {
        title: "Customer purchase history",
        detail: "Review customer records and support repeat visits.",
        status: "available",
      },
      {
        title: "Sizes and colours",
        detail: "Add available sizes, colours, fabric and style notes to each clothing item.",
        status: "available",
      },
      {
        title: "Stock by size and colour",
        detail:
          "Track exact quantities for each size-and-colour combination and decrement the selected variant at checkout.",
        status: "available",
      },
      {
        title: "WhatsApp product sharing",
        detail: "Share a product message with its price, sizes, colours and online-store link.",
        status: "available",
      },
      {
        title: "Exchanges and returns workflow",
        detail:
          "Record returns, prevent over-returning and restore the exact size/colour stock. Refund settlement and replacement sales remain separate workflows.",
        status: "available",
      },
    ],
    quickActions: [
      { label: "Manage collection", description: "Photos, sizes and prices", to: "/products" },
      {
        label: "Online storefront",
        description: "Publish and promote styles",
        to: "/online-store",
      },
      {
        label: "Customer orders",
        description: "Review incoming orders",
        to: "/online-store/orders",
      },
      {
        label: "Returns & exchanges",
        description: "Restock returned clothing",
        to: "/fashion-returns",
      },
    ],
  },
  {
    key: "electronics",
    label: "Electronics & phones",
    eyebrow: "Higher-value products",
    description:
      "Track each device by serial number or IMEI, manage warranty coverage, and keep repair jobs visible beside stock and sales.",
    bestFor: "Phone shops, electronics, accessories and computer stores",
    workflows: [
      {
        title: "Product catalogue and stock",
        detail: "Keep prices and available quantities visible.",
        status: "available",
      },
      {
        title: "Receipts and sales history",
        detail: "Find completed sales and their recorded details.",
        status: "available",
      },
      {
        title: "Serial number and IMEI records",
        detail:
          "Register each physical unit, link its identifier to checkout, and track available devices.",
        status: "available",
      },
      {
        title: "Warranty tracking",
        detail:
          "Start warranty coverage when a registered device is sold and keep the expiry visible.",
        status: "available",
      },
      {
        title: "Repair intake and status queue",
        detail:
          "Record customer devices, reported faults, warranty claims, estimates and repair progress.",
        status: "available",
      },
    ],
    quickActions: [
      { label: "Product catalogue", description: "Review stock", to: "/products" },
      { label: "Checkout", description: "Record a sale", to: "/pos" },
      {
        label: "Devices & warranty",
        description: "Serials, IMEIs and coverage",
        to: "/electronics-workspace",
      },
      {
        label: "Repair desk",
        description: "Register and track repairs",
        to: "/electronics-workspace",
      },
      { label: "Expenses", description: "Track shop costs", to: "/expenses" },
    ],
  },
  {
    key: "food-service",
    label: "Food & restaurants",
    eyebrow: "Orders and ingredients",
    description:
      "Run menu configuration, priced modifiers, kitchen tickets, recipe costing, ingredient stock and waste from one restaurant workspace.",
    bestFor: "Restaurants, cafés, bakeries, caterers and takeaway sellers",
    workflows: [
      {
        title: "Record sales and expenses",
        detail: "Use the existing checkout and expense records.",
        status: "available",
      },
      {
        title: "Menu modifiers and order notes",
        detail: "Capture priced options and preparation notes for each menu item at checkout.",
        status: "available",
      },
      {
        title: "Kitchen order screen",
        detail: "Create a kitchen ticket automatically for each confirmed food-service sale.",
        status: "available",
      },
      {
        title: "Recipe costing and ingredient deductions",
        detail: "Estimate ingredient cost and reduce recipe stock when menu items sell.",
        status: "available",
      },
      {
        title: "Waste and spoilage tracking",
        detail: "Record ingredient waste with a reason and deduct stock safely.",
        status: "available",
      },
    ],
    quickActions: [
      {
        label: "Kitchen & menu",
        description: "Tickets, recipes and modifiers",
        to: "/food-service",
      },
      { label: "Record a sale", description: "Sell menu items", to: "/pos" },
      { label: "Waste log", description: "Track ingredient loss", to: "/food-service" },
    ],
  },
  {
    key: "pharmacy",
    label: "Pharmacy & health products",
    eyebrow: "Traceability first",
    description:
      "Manage medicine profiles, batch traceability, expiry and recall quarantine, with prescription and controlled-product safeguards at checkout.",
    bestFor: "Licensed pharmacies and health-product retailers",
    workflows: [
      {
        title: "Product catalogue and stock alerts",
        detail: "Review available stock and low-stock items.",
        status: "available",
      },
      { title: "Sales records", detail: "Review recorded transactions.", status: "available" },
      {
        title: "Batch receiving and expiry traceability",
        detail: "Receive lots, track expiry and use eligible batches for in-person dispensing.",
        status: "available",
      },
      {
        title: "Prescription and controlled-product safeguards",
        detail: "Configure prescription requirements, patient-age checks and manager-authorised controlled-product dispensing. The POS still needs a dedicated prescription-entry experience before this workflow is fully customer-ready.",
        status: "planned",
      },
    ],
    quickActions: [
      { label: "Medicine controls", description: "Profiles, batches and recalls", to: "/pharmacy" },
      { label: "Review products", description: "Catalogue and stock", to: "/products" },
      { label: "Inventory settings", description: "Stock controls", to: "/settings/inventory" },
      { label: "Reports", description: "Review sales", to: "/reports" },
    ],
  },
  {
    key: "beauty-personal-care",
    label: "Beauty & personal care",
    eyebrow: "Products and repeat visits",
    description: "Manage beauty retail, a priced service menu, appointment scheduling and treatment consumables in one workspace.",
    bestFor: "Beauty supply shops, cosmetics, skincare and personal-care retailers",
    workflows: [
      {
        title: "Product catalogue and stock",
        detail: "Maintain product prices and quantities.",
        status: "available",
      },
      {
        title: "Customer records",
        detail: "Keep customer details available for repeat visits.",
        status: "available",
      },
      {
        title: "Appointments and service bookings",
        detail: "Schedule customer visits, prevent staff double-booking and track each booking through completion.",
        status: "available",
      },
      {
        title: "Appointment staff, deposits and payments",
        detail: "Assign staff, prevent overlapping bookings, collect deposits and record partial or full payments.",
        status: "available",
      },
      {
        title: "Consumable usage",
        detail: "Record treatment products against an appointment and deduct branch stock transactionally.",
        status: "available",
      },
    ],
    quickActions: [
      { label: "Services & bookings", description: "Manage the menu and calendar", to: "/beauty" },
      { label: "Products", description: "Manage retail items", to: "/products" },
      { label: "Customers", description: "Customer records", to: "/customers" },
      { label: "Sales report", description: "Review performance", to: "/reports" },
    ],
  },
  {
    key: "services",
    label: "Services & appointments",
    eyebrow: "People and jobs",
    description:
      "Manage a service catalogue, customer job cards, estimates, job status, due dates and partial payments.",
    bestFor: "Repair shops, studios, consultants and appointment-based businesses",
    workflows: [
      {
        title: "Customer records",
        detail: "Keep contact details and customer history together.",
        status: "available",
      },
      {
        title: "Sales receipts and expenses",
        detail: "Record income and operating costs.",
        status: "available",
      },
      {
        title: "Job cards and work tracking",
        detail: "Create customer job cards, add priced service line items, assign staff, set priorities and due dates, and track completion.",
        status: "available",
      },
      {
        title: "Quotes and partial payments",
        detail: "Edit final job amounts, record deposits and partial payments, and keep payment references in an append-only ledger.",
        status: "available",
      },
    ],
    quickActions: [
      { label: "Service jobs", description: "Catalogue, job cards and payments", to: "/services" },
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
