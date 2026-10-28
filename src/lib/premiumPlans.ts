export type PremiumTier = 'free' | 'business' | 'pro'

export const PREMIUM_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Run your counter and learn your numbers.',
    onlineStore: false,
    highlight: 'Core selling',
  },
  business: {
    name: 'Business',
    price: 3000,
    description: 'Put your shop online and unlock the tools built for a growing team.',
    onlineStore: true,
    highlight: 'Best for growing shops',
  },
  pro: {
    name: 'Pro',
    price: 5000,
    description: 'The full Strap workspace for teams, branches and deeper control.',
    onlineStore: true,
    highlight: 'Most complete',
  },
} as const

export const PREMIUM_FEATURES = [
  'Online storefront and public catalog',
  'Storefront categories and product layouts',
  'Featured and pinned products',
  'Advanced stock tools',
  'Staff and team controls',
  'Multiple branches on eligible plans',
  'Advanced reports and insights',
  'Store data export',
  'Priority business workflows',
] as const

export function formatNaira(amount: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}
