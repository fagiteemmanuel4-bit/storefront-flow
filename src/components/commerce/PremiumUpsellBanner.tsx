import { Crown, X } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

type PremiumUpsellBannerProps = {
  feature?: string;
  description?: string;
};

export function PremiumUpsellBanner({ feature = "Online Store", description = "Open your storefront, organise products, feature best sellers and accept orders online." }: PremiumUpsellBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <aside className="relative rounded-2xl border border-accent/25 bg-accent-soft/35 p-4" aria-label="Premium feature">
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss premium message" className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground hover:bg-background/70 hover:text-foreground">
        <X className="size-4" />
      </button>
      <div className="flex gap-3 pr-7">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Crown className="size-4" /></span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{feature} is part of Premium</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
          <Link to="/auth" className="mt-3 inline-flex rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground">View plans</Link>
        </div>
      </div>
    </aside>
  );
}
