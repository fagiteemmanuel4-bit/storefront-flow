export type KudiTier = 'free' | 'business' | 'pro'

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

export const KUDI_TIERS: Record<KudiTier, Record<EntitlementKey, boolean | number>> = {
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
export function hasEntitlement(tier: KudiTier, key: EntitlementKey) {
  return KUDI_TIERS[tier][key] !== false
}

export function getLimit(tier: KudiTier, key: 'staff' | 'branches') {
  return KUDI_TIERS[tier][key] as number
}
