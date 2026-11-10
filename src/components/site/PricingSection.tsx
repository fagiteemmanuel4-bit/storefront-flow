import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Crown } from "lucide-react";
import { PREMIUM_PLANS, formatNaira } from "@/lib/premiumPlans";
import { STRAP_TIERS } from "@/lib/commerceEntitlements";

const plans = [
  {
    key: "free" as const,
    name: PREMIUM_PLANS.free.name,
    price: PREMIUM_PLANS.free.price,
    description: "The essentials for getting a shop running.",
    features: [
      "Point of sale and sales records",
      "Product catalogue and inventory basics",
      "Customer records and expenses",
      `${STRAP_TIERS.free.staff} staff seat`,
      `${STRAP_TIERS.free.branches} branch`,
    ],
  },
  {
    key: "business" as const,
    name: PREMIUM_PLANS.business.name,
    price: PREMIUM_PLANS.business.price,
    description: "Online selling and more room for a growing operation.",
    features: [
      "Everything in Free",
      "Online storefront and order management",
      `Up to ${STRAP_TIERS.business.staff} staff members`,
      `Up to ${STRAP_TIERS.business.branches} branches`,
      "Advanced inventory and business insights",
      "Stock transfers and data export",
    ],
  },
  {
    key: "pro" as const,
    name: PREMIUM_PLANS.pro.name,
    price: PREMIUM_PLANS.pro.price,
    description: "Expanded capacity for larger teams and multi-location shops.",
    features: [
      "Everything in Business",
      "Unlimited staff members",
      "Unlimited branches",
      "Expanded operational capacity for larger teams",
    ],
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="marketing-pricing">
      <div className="marketing-pricing__inner">
        <div className="marketing-section-heading marketing-section-heading--center">
          <p className="marketing-eyebrow">Straightforward plans</p>
          <h2>Start with what your shop needs today.</h2>
          <p>Choose a plan for your current operation. You can move to a larger plan as your business grows.</p>
        </div>

        <div className="marketing-pricing__grid">
          {plans.map((plan) => {
            const featured = plan.key === "business";
            return (
              <article key={plan.key} className={`marketing-plan ${featured ? "marketing-plan--featured" : ""}`}>
                {featured && <span className="marketing-plan__badge"><Crown size={13} /> Growing shops</span>}
                <p className="marketing-plan__name">{plan.name}</p>
                <p className="marketing-plan__description">{plan.description}</p>
                <div className="marketing-plan__price">
                  <strong>{formatNaira(plan.price)}</strong>
                  <span>{plan.price === 0 ? "no monthly fee" : "per month"}</span>
                </div>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}><Check size={16} /> {feature}</li>
                  ))}
                </ul>
                <Link to="/auth" className={featured ? "marketing-button" : "marketing-button marketing-button--outline"}>
                  {plan.key === "free" ? "Start free" : "Choose this plan"} <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
        </div>
        <p className="marketing-pricing__note">Prices are shown in Nigerian naira. Subscription plan access is managed within Strap. Payment-provider features are not advertised as available until enabled for production.</p>
      </div>
    </section>
  );
}
