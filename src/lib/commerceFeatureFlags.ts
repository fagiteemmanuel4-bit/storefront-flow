export type CommerceFeatureStatus = 'available' | 'limited-free' | 'coming-soon'

export type CommerceFeature = {
  key: string
  label: string
  status: CommerceFeatureStatus
  description: string
}

/**
 * Single source of truth for staged commerce capabilities.
 * Premium capabilities are intentionally not activated yet; they remain
 * visible as coming soon without exposing unfinished payment or upgrade flows.
 */
export const COMMERCE_FEATURES: Record<string, CommerceFeature> = {
  merchantPayments: {
    key: 'merchantPayments',
    label: 'Online payments',
    status: 'coming-soon',
    description: 'Accept card and bank payments from customers through your Strap store.',
  },
  advancedAnalytics: {
    key: 'advancedAnalytics',
    label: 'Advanced analytics',
    status: 'coming-soon',
    description: 'Get deeper business insights while Strap expands the analytics suite.',
  },
  aiAssistant: {
    key: 'aiAssistant',
    label: 'Strap AI assistant',
    status: 'coming-soon',
    description: 'Ask Strap questions about sales, inventory and business performance.',
  },
  loyalty: {
    key: 'loyalty',
    label: 'Customer loyalty',
    status: 'coming-soon',
    description: 'Reward customers with points and build repeat purchases.',
  },
  discounts: {
    key: 'discounts',
    label: 'Discount codes',
    status: 'coming-soon',
    description: 'Create simple promotions and discount codes for your customers.',
  },
  purchaseOrders: {
    key: 'purchaseOrders',
    label: 'Purchase orders',
    status: 'coming-soon',
    description: 'Track supplier orders and receiving from inside Strap.',
  },
  stockTransfers: {
    key: 'stockTransfers',
    label: 'Branch stock transfers',
    status: 'coming-soon',
    description: 'Move inventory between branches with an auditable transfer workflow.',
  },
}

export function getCommerceFeature(key: string) {
  return COMMERCE_FEATURES[key]
}

export function isCommerceFeatureEnabled(key: string) {
  return COMMERCE_FEATURES[key]?.status !== 'coming-soon'
}
