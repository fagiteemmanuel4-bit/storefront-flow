export type StrapCapabilityStatus = "available" | "limited-free" | "coming-soon";
export type StrapPlan = "free" | "business" | "pro";

export type StrapCapability = {
  id: string;
  label: string;
  status: StrapCapabilityStatus;
  plans: readonly StrapPlan[];
  description: string;
};

/**
 * Single source of truth for product capability metadata.
 * Payment collection intentionally stays `coming-soon` until the provider integration is authorized.
 */
export const STRAP_CAPABILITIES = [
  { id: "pos", label: "POS & checkout", status: "available", plans: ["free", "business", "pro"], description: "Counter sales, carts, receipts and connected stock updates." },
  { id: "inventory", label: "Inventory management", status: "available", plans: ["free", "business", "pro"], description: "Products, stock levels, low-stock signals and inventory value." },
  { id: "online-store", label: "Online storefront", status: "limited-free", plans: ["free", "business", "pro"], description: "Publish a catalogue and accept online orders with current Strap capabilities." },
  { id: "staff", label: "Team access", status: "limited-free", plans: ["free", "business", "pro"], description: "Owner, manager and cashier workflows with protected management actions." },
  { id: "branches", label: "Multiple branches", status: "limited-free", plans: ["free", "business", "pro"], description: "Connect branch-level stock and operations under one store." },
  { id: "suppliers", label: "Suppliers & purchasing", status: "limited-free", plans: ["business", "pro"], description: "Supplier records, purchase orders and receiving foundations." },
  { id: "transfers", label: "Stock transfers", status: "limited-free", plans: ["business", "pro"], description: "Move stock between branches with an auditable transfer workflow." },
  { id: "variants", label: "Product variants", status: "limited-free", plans: ["business", "pro"], description: "Model size, colour and other product variations." },
  { id: "bundles", label: "Product bundles", status: "limited-free", plans: ["business", "pro"], description: "Sell grouped products while keeping component inventory connected." },
  { id: "discounts", label: "Discounts & coupons", status: "limited-free", plans: ["business", "pro"], description: "Create controlled promotional codes and discount rules." },
  { id: "loyalty", label: "Customer loyalty", status: "limited-free", plans: ["business", "pro"], description: "Track customer points and loyalty activity." },
  { id: "fulfillment", label: "Order fulfillment", status: "limited-free", plans: ["business", "pro"], description: "Track fulfillment state, shipping details and delivery progress." },
  { id: "custom-domains", label: "Custom domains", status: "coming-soon", plans: ["business", "pro"], description: "Connect a merchant-owned domain to a Strap storefront." },
  { id: "api", label: "Strap API", status: "coming-soon", plans: ["pro"], description: "Build integrations and custom applications on top of Strap." },
  { id: "webhooks", label: "Webhooks", status: "coming-soon", plans: ["pro"], description: "Deliver trusted Strap events to external systems." },
  { id: "whatsapp", label: "WhatsApp commerce", status: "coming-soon", plans: ["business", "pro"], description: "Connect product discovery and order flows to WhatsApp." },
  { id: "ai", label: "Strap AI assistant", status: "coming-soon", plans: ["pro"], description: "Ask questions about the business and automate merchant workflows." },
  { id: "online-payments", label: "Online payments", status: "coming-soon", plans: ["business", "pro"], description: "Merchant online payment collection and provider integrations." },
] as const satisfies readonly StrapCapability[];

export const getStrapCapability = (id: string) => STRAP_CAPABILITIES.find((capability) => capability.id === id);
export const isStrapCapabilityAvailable = (id: string) => getStrapCapability(id)?.status === "available" || getStrapCapability(id)?.status === "limited-free";
export const isStrapCapabilityComingSoon = (id: string) => getStrapCapability(id)?.status === "coming-soon";
