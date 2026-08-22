/**
 * Kudi platform capability registry.
 *
 * Keep product availability and plan entitlements in one place. UI code should
 * consume these definitions rather than scattering plan/availability checks.
 * Payments intentionally remain Coming Soon until billing credentials are
 * configured and the provider integration is explicitly enabled.
 */

export type KudiAvailability = 'available' | 'limited-free' | 'coming-soon'
export type KudiPlan = 'free' | 'business' | 'pro'

export type KudiCapability = {
  id: string
  name: string
  description: string
  availability: KudiAvailability
  plans: KudiPlan[]
  category:
    | 'pos'
    | 'inventory'
    | 'commerce'
    | 'customers'
    | 'analytics'
    | 'automation'
    | 'platform'
    | 'payments'
}

export const KUDI_CAPABILITIES: KudiCapability[] = [
  { id: 'pos', name: 'POS', description: 'Fast in-store sales and receipts.', availability: 'available', plans: ['free', 'business', 'pro'], category: 'pos' },
  { id: 'inventory', name: 'Inventory', description: 'Products, stock and inventory records.', availability: 'available', plans: ['free', 'business', 'pro'], category: 'inventory' },
  { id: 'customers', name: 'Customers', description: 'Customer profiles and purchase history.', availability: 'available', plans: ['free', 'business', 'pro'], category: 'customers' },
  { id: 'online-store', name: 'Online store', description: 'Publish a storefront and sell online.', availability: 'available', plans: ['business', 'pro'], category: 'commerce' },
  { id: 'staff', name: 'Staff & permissions', description: 'Control staff access and responsibilities.', availability: 'available', plans: ['business', 'pro'], category: 'platform' },
  { id: 'branches', name: 'Multiple branches', description: 'Manage inventory and operations across locations.', availability: 'limited-free', plans: ['business', 'pro'], category: 'platform' },
  { id: 'advanced-analytics', name: 'Advanced analytics', description: 'Profit, margin and deeper business intelligence.', availability: 'limited-free', plans: ['business', 'pro'], category: 'analytics' },
  { id: 'loyalty', name: 'Customer loyalty', description: 'Reward customers and track loyalty points.', availability: 'limited-free', plans: ['business', 'pro'], category: 'customers' },
  { id: 'discounts', name: 'Discounts & coupons', description: 'Create controlled promotions and discount codes.', availability: 'available', plans: ['free', 'business', 'pro'], category: 'commerce' },
  { id: 'suppliers', name: 'Suppliers & purchasing', description: 'Manage suppliers and purchase orders.', availability: 'limited-free', plans: ['business', 'pro'], category: 'inventory' },
  { id: 'stock-transfers', name: 'Stock transfers', description: 'Move stock safely between branches.', availability: 'limited-free', plans: ['business', 'pro'], category: 'inventory' },
  { id: 'product-variants', name: 'Product variants', description: 'Sell products by size, colour and other variants.', availability: 'available', plans: ['business', 'pro'], category: 'inventory' },
  { id: 'bundles', name: 'Product bundles', description: 'Sell kits while tracking component inventory.', availability: 'limited-free', plans: ['business', 'pro'], category: 'inventory' },
  { id: 'custom-domains', name: 'Custom domains', description: 'Connect a merchant-owned domain to a storefront.', availability: 'coming-soon', plans: ['business', 'pro'], category: 'commerce' },
  { id: 'webhooks', name: 'Webhooks & integrations', description: 'Connect Kudi events to external systems.', availability: 'coming-soon', plans: ['pro'], category: 'platform' },
  { id: 'api', name: 'Kudi API', description: 'Build integrations on top of Kudi.', availability: 'coming-soon', plans: ['pro'], category: 'platform' },
  { id: 'whatsapp-commerce', name: 'WhatsApp commerce', description: 'Turn conversations into tracked commerce workflows.', availability: 'coming-soon', plans: ['business', 'pro'], category: 'commerce' },
  { id: 'ai-assistant', name: 'Kudi AI assistant', description: 'Ask questions and get actionable business insights.', availability: 'coming-soon', plans: ['pro'], category: 'automation' },
  { id: 'ai-product-content', name: 'AI product content', description: 'Generate product descriptions and SEO content.', availability: 'coming-soon', plans: ['business', 'pro'], category: 'automation' },
  { id: 'merchant-payments', name: 'Online payments', description: 'Accept customer payments through connected providers.', availability: 'coming-soon', plans: ['business', 'pro'], category: 'payments' },
]

export const KUDI_PLANS: Record<KudiPlan, {
  name: string
  description: string
  priceLabel: string
  productLimit: number | null
  staffLimit: number
  branchLimit: number
}> = {
  free: {
    name: 'Free',
    description: 'Core tools to start running a business with Kudi.',
    priceLabel: 'Free',
    productLimit: 100,
    staffLimit: 1,
    branchLimit: 1,
  },
  business: {
    name: 'Business',
    description: 'More control for growing stores and teams.',
    priceLabel: 'Coming soon',
    productLimit: null,
    staffLimit: 5,
    branchLimit: 3,
  },
  pro: {
    name: 'Pro',
    description: 'Advanced commerce, analytics and automation.',
    priceLabel: 'Coming soon',
    productLimit: null,
    staffLimit: 25,
    branchLimit: 10,
  },
}

export function getCapability(id: string) {
  return KUDI_CAPABILITIES.find((capability) => capability.id === id)
}

export function hasCapability(plan: KudiPlan, id: string) {
  const capability = getCapability(id)
  return Boolean(capability?.plans.includes(plan))
}

export function getCapabilityLabel(id: string) {
  const capability = getCapability(id)
  if (!capability) return undefined
  if (capability.availability === 'coming-soon') return 'Coming soon'
  if (capability.availability === 'limited-free') return 'Limited free'
  return 'Available'
}
