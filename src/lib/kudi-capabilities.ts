export type KudiCapabilityStatus = "available" | "limited-free" | "coming-soon";
export type KudiPlan = "free" | "business" | "pro";

export type KudiCapability = {
  id: string;
  label: string;
  status: KudiCapabilityStatus;
  plans: readonly KudiPlan[];
  description: string;
};

/**
 * Single source of truth for product capability metadata.
 * Payment collection intentionally stays `coming-soon` until the provider integration is authorized.
 */
export const KUDI_CAPABILITIES = [
  { id: "pos", label: "POS & checkout", status: "available", plans: ["free", "business", "pro"], description: "Counter sales, carts, receipts and connected stock updates." },
  { id: "inventory", label: "Inventory management", status: "available", plans: ["free", "business", "pro"], description: "Products, stock levels, low-stock signals and inventory value." },
  { id: "online-store", label: "Online storefront", status: "limited-free", plans: ["free", "business", "pro"], description: "Publish a catalogue and accept online orders with current Kudi capabilities." },
  { id: "staff", label: "Team access", status: "limited-free", plans: ["free", "business", "pro"], description: "Owner, manager and cashier workflows with protected management actions." },
  { id: "branches", label: "Multiple branches", status: "limited-free", plans: ["free", "business", "pro"], description: "Connect branch-level stock and operations under one store." },
  { id: "suppliers", label: "Suppliers & purchasing", status: "limited-free", plans: ["business", "pro"], description: "Supplier records, purchase orders and receiving foundations." },
  { id: "transfers", label: "Stock transfers", status: "limited-free", plans: ["business", "pro"], description: "Move stock between branches with an auditable transfer workflow." },
  { id: "variants", label: "Product variants", status: "limited-free", plans: ["business", "pro"], description: "Model size, colour and other product variations." },
  { id: "bundles", label: "Product bundles", status: "limited-free", plans: ["business", "pro"], description: "Sell grouped products while keeping component inventory connected." },
  { id: "discounts", label: "Discounts & coupons", status: "limited-free", plans: ["business", "pro"], description: "Create controlled promotional codes and discount rules." },
  { id: "loyalty", label: "Customer loyalty", status: "limited-free", plans: ["business", "pro"], description: "Track customer points and loyalty activity." },
  { id: "fulfillment", label: "Order fulfillment", status: "limited-free", plans: ["business", "pro"], description: "Track fulfillment state, shipping details and delivery progress." },
  { id: "custom-domains", label: "Custom domains", status: "coming-soon", plans: ["business", "pro"], description: "Connect a merchant-owned domain to a Kudi storefront." },
  { id: "api", label: "Kudi API", status: "coming-soon", plans: ["pro"], description: "Build integrations and custom applications on top of Kudi." },
  { id: "webhooks", label: "Webhooks", status: "coming-soon", plans: ["pro"], description: "Deliver trusted Kudi events to external systems." },
  { id: "whatsapp", label: "WhatsApp commerce", status: "coming-soon", plans: ["business", "pro"], description: "Connect product discovery and order flows to WhatsApp." },
  { id: "ai", label: "Kudi AI assistant", status: "coming-soon", plans: ["pro"], description: "Ask questions about the business and automate merchant workflows." },
  { id: "online-payments", label: "Online payments", status: "coming-soon", plans: ["business", "pro"], description: "Merchant online payment collection and provider integrations." },
] as const satisfies readonly KudiCapability[];

export const getKudiCapability = (id: string) => KUDI_CAPABILITIES.find((capability) => capability.id === id);
export const isKudiCapabilityAvailable = (id: string) => getKudiCapability(id)?.status === "available" || getKudiCapability(id)?.status === "limited-free";
export const isKudiCapabilityComingSoon = (id: string) => getKudiCapability(id)?.status === "coming-soon";
