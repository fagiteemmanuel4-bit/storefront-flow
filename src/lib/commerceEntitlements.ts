export type StrapTier = 'free' | 'business' | 'pro'

export type EntitlementKey =
  | 'onlineStore'
  | 'advancedInventory'
  | 'staff'
  | 'branches'
  | 'advancedAnalytics'
  | 'loyalty'
  | 'discounts'
  | 'purchaseOrders'
  | 'stockTransfers'
  | 'merchantPayments'
  | 'aiAssistant'

export const STRAP_TIERS: Record<StrapTier, Record<EntitlementKey, boolean | number>> = {
  free: {
    onlineStore: true,
    advancedInventory: true,
    staff: 1,
    branches: 1,
    advancedAnalytics: false,
    loyalty: true,
    discounts: true,
    purchaseOrders: true,
    stockTransfers: false,
    merchantPayments: false,
    aiAssistant: false,
  },
  business: {
    onlineStore: true,
    advancedInventory: true,
    staff: 5,
    branches: 3,
    advancedAnalytics: true,
    loyalty: true,
    discounts: true,
    purchaseOrders: true,
    stockTransfers: true,
    merchantPayments: false,
    aiAssistant: false,
  },
  pro: {
    onlineStore: true,
    advancedInventory: true,
    staff: -1,
    branches: -1,
    advancedAnalytics: true,
    loyalty: true,
    discounts: true,
    purchaseOrders: true,
    stockTransfers: true,
    merchantPayments: false,
    aiAssistant: false,
  },
}

/** -1 means unlimited. Payment and AI remain explicitly staged off until their integrations are ready. */
export function hasEntitlement(tier: StrapTier, key: EntitlementKey) {
  return STRAP_TIERS[tier][key] !== false
}

export function getLimit(tier: StrapTier, key: 'staff' | 'branches') {
  return STRAP_TIERS[tier][key] as number
}
