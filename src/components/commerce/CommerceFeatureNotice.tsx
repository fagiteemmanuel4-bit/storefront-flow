import { FeatureStatusBadge } from './FeatureStatusBadge'
import { getCommerceFeature } from '@/lib/commerceFeatureFlags'

type Props = {
  feature: string
}

export function CommerceFeatureNotice({ feature }: Props) {
  const item = getCommerceFeature(feature)
  if (!item || item.status === 'available') return null

  return (
    <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
      <div className="flex items-center gap-2">
        <span className="font-medium text-sm">{item.label}</span>
        <FeatureStatusBadge feature={feature} />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
    </div>
  )
}
