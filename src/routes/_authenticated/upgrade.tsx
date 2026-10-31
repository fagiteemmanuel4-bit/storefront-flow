import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Crown, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PREMIUM_FEATURES, formatNaira } from "@/lib/premiumPlans";

const plans = [
  {
    code: "free",
    name: "Free",
    monthly: 0,
    yearly: 0,
    description: "The essentials for getting a shop running.",
    features: ["POS selling", "Product catalogue", "Customer records", "Core trading workspace"],
  },
  {
    code: "business",
    name: "Business",
    monthly: 3000,
    yearly: 28800,
    description: "Online selling and tools for a growing shop.",
    features: [
      "Everything in Free",
      "Online store",
      "Staff & permissions",
      "Multiple branches",
      "Data export",
    ],
  },
  {
    code: "pro",
    name: "Pro",
    monthly: 5000,
    yearly: 48000,
    description: "Deeper control for teams and multi-location operations.",
    features: [
      "Everything in Business",
      "Advanced inventory",
      "Advanced reports",
      "More operational controls",
    ],
  },
];

export const Route = createFileRoute("/_authenticated/upgrade")({ component: UpgradePage });

function UpgradePage() {
  const [billing, setBilling] = useState<"month" | "year">("month");
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back to Strap
          </Link>
          <span className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground sm:inline-flex">
            <span className="size-2 rounded-full bg-success" /> Plans for your business
          </span>
        </div>

        <section className="mt-8 overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_22px_65px_-38px_rgba(28,25,20,.3)]">
          <div className="grid gap-8 border-b border-border bg-[radial-gradient(circle_at_90%_0%,color-mix(in_oklch,var(--color-accent)_18%,transparent),transparent_28rem)] px-6 py-8 sm:px-9 sm:py-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] text-muted-foreground">
                <Crown className="size-3.5 text-accent-ink" /> Strap plans
              </div>
              <h1 className="mt-5 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
                More room to run your business.
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                Choose the tools that match the way your shop works today. You can move to a bigger
                plan as your business grows.
              </p>
            </div>
            <div className="flex w-fit items-center gap-1 rounded-xl border border-[#0E1116] bg-[#0E1116] p-1">
              <button
                type="button"
                onClick={() => setBilling("month")}
                aria-pressed={billing === "month"}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${billing === "month" ? "bg-white text-[#0E1116] shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBilling("year")}
                aria-pressed={billing === "year"}
                className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${billing === "year" ? "bg-white text-[#0E1116] shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
              >
                Yearly <span className="ml-1 text-[10px] font-bold text-[#C6F432]">Save 20%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-5 sm:p-7 lg:grid-cols-3">
            {plans.map((plan) => {
              const featured = plan.code === "business";
              const price = billing === "year" ? plan.yearly : plan.monthly;
              return (
                <section
                  key={plan.code}
                  className={`relative flex min-w-0 flex-col rounded-[22px] border p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lift sm:p-6 ${featured ? "border-[#0E1116] bg-[#0E1116] text-white ring-2 ring-[#C6F432] ring-offset-2 ring-offset-background" : "border-border bg-background"}`}
                >
                  {featured && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#C6F432] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#0E1116]">
                      Popular
                    </span>
                  )}
                  <p
                    className={`text-xs font-bold uppercase tracking-[.16em] ${featured ? "text-[#C6F432]" : "text-muted-foreground"}`}
                  >
                    {plan.name}
                  </p>
                  <p
                    className={`mt-3 min-h-12 max-w-[17rem] text-sm leading-6 ${featured ? "text-white/70" : "text-muted-foreground"}`}
                  >
                    {plan.description}
                  </p>
                  <div className="mt-6 flex items-end gap-1.5">
                    <span
                      className={`font-display text-3xl font-bold tracking-tight ${featured ? "text-white" : "text-foreground"}`}
                    >
                      {formatNaira(price)}
                    </span>
                    <span
                      className={`pb-1 text-xs font-medium ${featured ? "text-white/60" : "text-muted-foreground"}`}
                    >
                      /{billing === "year" ? "year" : "month"}
                    </span>
                  </div>
                  {billing === "year" && plan.code !== "free" && (
                    <p
                      className={`mt-1 text-xs font-medium ${featured ? "text-[#C6F432]" : "text-success"}`}
                    >
                      Billed yearly · save 20%
                    </p>
                  )}
                  <div className={`my-6 h-px ${featured ? "bg-white/15" : "bg-border"}`} />
                  <p
                    className={`text-xs font-bold uppercase tracking-[.12em] ${featured ? "text-white/60" : "text-muted-foreground"}`}
                  >
                    Included features
                  </p>
                  <ul className="mt-4 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm leading-5">
                        <span
                          className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${featured ? "bg-accent text-black" : "bg-secondary text-foreground"}`}
                        >
                          <Check className="size-3" />
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-7">
                    {plan.code === "free" ? (
                      <Button variant="outline" className="h-12 w-full rounded-xl" disabled>
                        Current starting plan
                      </Button>
                    ) : (
                      <Link
                        to="/settings/payments"
                        className={`inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold transition hover:-translate-y-0.5 ${featured ? "bg-[#C6F432] text-[#0E1116] shadow-sm hover:bg-[#b0dc20] hover:shadow-md" : "bg-foreground text-background hover:bg-accent hover:text-black"}`}
                      >
                        Upgrade
                      </Link>
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[24px] border border-border bg-surface shadow-sm">
          <div className="border-b border-border px-5 py-4 sm:px-6">
            <h2 className="font-display text-lg font-semibold">Premium features</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              A closer look at the tools available across paid plans.
            </p>
          </div>
          <div className="grid gap-x-8 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 sm:px-2">
            {PREMIUM_FEATURES.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-3 px-5 py-3.5 text-sm sm:px-4 sm:[&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-border"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent-ink">
                  <Crown className="size-3.5" />
                </span>
                {feature}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-secondary/50 p-4 text-xs leading-5 text-muted-foreground">
          <LockKeyhole className="mt-0.5 size-4 shrink-0" />
          <p>
            Paid features stay locked until payment is confirmed. Payment provider setup is pending;
            once connected, this same flow can activate paid entitlements after confirmation.
          </p>
        </div>
      </div>
    </main>
  );
}
