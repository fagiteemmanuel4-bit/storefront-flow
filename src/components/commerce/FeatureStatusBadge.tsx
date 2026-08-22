import { cn } from '@/lib/utils'
import { getCommerceFeature, type CommerceFeatureStatus } from '@/lib/commerceFeatureFlags'

type Props = {
  feature: string
  className?: string
}

const labels: Record<CommerceFeatureStatus, string> = {
  available: 'Available',
  'limited-free': 'Limited free',
  'coming-soon': 'Coming soon',
}

export function FeatureStatusBadge({ feature, className }: Props) {
  const item = getCommerceFeature(feature)
  if (!item || item.status === 'available') return null

  return (
    <span
      title={item.description}
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide',
        item.status === 'coming-soon'
          ? 'border-amber-200 bg-amber-50 text-amber-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700',
        className,
      )}
    >
      {labels[item.status]}
    </span>
  )
}
