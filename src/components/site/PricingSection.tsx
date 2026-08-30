import { Link } from '@tanstack/react-router'
import { Check, Crown, Lock } from 'lucide-react'
import { formatNaira, PREMIUM_FEATURES, PREMIUM_PLANS } from '@/lib/premiumPlans'

export function PricingSection() {
  return (
    <section id="pricing" className="border-y border-border bg-secondary/35 px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-label-caps text-accent-ink">Simple pricing for growing shops</p>
          <h2 className="text-display-md mt-4">Start selling free. Put your store online when you're ready.</h2>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Strap's core counter stays accessible on Free. A public online store is a premium capability, starting at ₦3,000/month.
          </p>
        </div>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {(Object.entries(PREMIUM_PLANS) as [keyof typeof PREMIUM_PLANS, (typeof PREMIUM_PLANS)[keyof typeof PREMIUM_PLANS]][]).map(([key, plan]) => (
            <article key={key} className={`relative rounded-3xl border bg-background p-6 sm:p-7 ${key === 'business' ? 'border-foreground shadow-lift' : 'border-border'}`}>
              {key === 'business' && <div className="absolute right-5 top-5 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold">Recommended</div>}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">{plan.highlight}</p>
                  <h3 className="mt-2 font-display text-2xl font-bold">{plan.name}</h3>
                </div>
                {key !== 'free' && <Crown className="mt-1 size-5" aria-hidden="true" />}
              </div>
              <div className="mt-7 flex items-end gap-1">
                <span className="font-display text-4xl font-bold">{formatNaira(plan.price)}</span>
                {key !== 'free' && <span className="pb-1 text-sm text-muted-foreground">/month</span>}
              </div>
              <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{plan.description}</p>
              <Link to="/auth" className={`mt-6 flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold transition-colors ${key === 'free' ? 'border border-border hover:bg-secondary' : 'bg-foreground text-background hover:opacity-90'}`}>
                {key === 'free' ? 'Start free' : 'Choose ' + plan.name}
              </Link>
              <div className="mt-7 border-t border-border pt-6">
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-muted-foreground">Included</p>
                <ul className="mt-4 space-y-3">
                  {(key === 'free' ? ['POS selling and receipts', 'Products and stock basics', 'Customers and expenses'] : PREMIUM_FEATURES).map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm leading-5">
                      <Check className="mt-0.5 size-4 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                  {key === 'free' && <li className="flex gap-3 text-sm leading-5 text-muted-foreground"><Lock className="mt-0.5 size-4 shrink-0" /><span>Online storefront — premium</span></li>}
                </ul>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Prices shown in Nigerian naira. Online payment processing and other staged integrations remain marked as coming soon until their production integration is ready.</p>
      </div>
    </section>
  )
}
