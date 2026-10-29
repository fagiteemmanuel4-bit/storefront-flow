import { COMMERCE_FEATURES } from './commerceFeatureFlags'

export const COMMERCE_FEATURE_CATALOG = [
  COMMERCE_FEATURES.merchantPayments,
  COMMERCE_FEATURES.advancedAnalytics,
  COMMERCE_FEATURES.aiAssistant,
  COMMERCE_FEATURES.loyalty,
  COMMERCE_FEATURES.discounts,
  COMMERCE_FEATURES.purchaseOrders,
  COMMERCE_FEATURES.stockTransfers,
]

export const COMING_SOON_FEATURES = COMMERCE_FEATURE_CATALOG.filter(
  (feature) => feature.status === 'coming-soon',
)

export const LIMITED_FREE_FEATURES = COMMERCE_FEATURE_CATALOG.filter(
  (feature) => feature.status === 'limited-free',
)
