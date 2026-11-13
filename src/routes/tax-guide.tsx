import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Calculator,
  CircleHelp,
  ExternalLink,
  FileText,
  Info,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/tax-guide")({
  head: () => ({
    meta: [
      { title: "Tax Guide for Small Businesses: Rates, VAT, GST & Calculator — Strap" },
      {
        name: "description",
        content:
          "A practical, country-neutral guide to tax rates, tax bases, VAT, GST, sales tax, inclusive pricing and calculating tax for a business.",
      },
      {
        name: "keywords",
        content:
          "tax guide, sales tax calculator, VAT, GST, tax rate, tax base, tax inclusive, tax exclusive, small business tax",
      },
    ],
    links: [{ rel: "canonical", href: "https://storefront-flow.vercel.app/tax-guide" }],
  }),
  component: PublicTaxGuidePage,
});

const faq = [
  {
    question: "How do I find the correct tax percentage for my business?",
    answer:
      "Identify the jurisdiction that governs the sale, your registration status, the product or service category, and any exemptions or special rates. Confirm the current rate and rules with the official tax authority or a qualified tax adviser. Do not copy a rate from another country or business.",
  },
  {
    question: "What is the difference between a tax rate and a tax base?",
    answer:
      "The tax rate is the percentage applied. The tax base is the amount, income, transaction or item to which the percentage applies. Both must be known to calculate a tax correctly.",
  },
  {
    question: "How do I calculate tax included in a price?",
    answer:
      "For a tax-inclusive total, the tax portion is total multiplied by the rate, divided by 100 plus the rate. The pre-tax amount is total divided by 1 plus the rate expressed as a decimal.",
  },
  {
    question: "Are payment processing fees the same as taxes?",
    answer:
      "No. Government taxes are imposed under tax law. Payment processing charges, marketplace commissions and software subscription fees are commercial charges. They may have tax consequences of their own, but they are not interchangeable.",
  },
];

function money(value: number) {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function PublicTaxGuidePage() {
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState("5");
  const [mode, setMode] = useState<"exclusive" | "inclusive">("exclusive");
  const result = useMemo(() => {
    const value = Math.max(0, Math.min(Number(amount) || 0, 1_000_000_000_000));
    const percentage = Math.max(0, Math.min(Number(rate) || 0, 100));
    if (mode === "inclusive") {
      const base = value / (1 + percentage / 100);
      return { base, tax: value - base, total: value };
    }
    const tax = (value * percentage) / 100;
    return { base: value, tax, total: value + tax };
  }, [amount, rate, mode]);

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: "Tax Guide for Small Businesses: Rates, VAT, GST and Sales Tax",
        description:
          "Country-neutral educational guidance for understanding tax rates, tax bases and consumption tax calculations.",
        mainEntityOfPage: "https://storefront-flow.vercel.app/tax-guide",
        author: { "@type": "Organization", name: "Strap by Kryonara" },
        publisher: { "@type": "Organization", name: "Strap by Kryonara" },
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border bg-foreground text-background">
          <div className="pointer-events-none absolute -right-24 -top-32 size-[34rem] rounded-full bg-accent/15 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-accent">
              Strap business learning centre
            </p>
            <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
              Tax, explained clearly. Make every percentage count.
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-background/70 sm:text-lg">
              Learn what tax percentages mean, how VAT, GST and sales tax work, how to calculate
              the tax in a price, and how to verify the rate that applies to your own business.
              This guide is educational and deliberately country-neutral.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#calculator"
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-6 font-semibold text-accent-foreground"
              >
                Try the calculator <ArrowRight className="size-4" />
              </a>
              <a
                href="#find-your-rate"
                className="inline-flex min-h-12 items-center rounded-full border border-background/25 px-6 font-semibold text-background hover:bg-background/10"
              >
                Find your tax rate
              </a>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:py-16">
          <div className="min-w-0 space-y-10">
            <section className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Calculator,
                  title: "Calculate",
                  body: "Estimate tax added to a price or included in the final amount.",
                },
                {
                  icon: FileText,
                  title: "Understand",
                  body: "Learn tax rates, tax bases, VAT, GST, exemptions and records.",
                },
                {
                  icon: ShieldCheck,
                  title: "Verify",
                  body: "Know what to check before applying a rate to real transactions.",
                },
              ].map(({ icon: Icon, title, body }) => (
                <article key={title} className="rounded-2xl border border-border bg-surface p-5">
                  <Icon className="size-5 text-accent-ink" />
                  <h2 className="mt-4 font-semibold">{title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                </article>
              ))}
            </section>

            <section id="calculator" className="scroll-mt-24 rounded-3xl border border-border bg-surface p-5 sm:p-8">
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
                  <Calculator className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
                    Interactive tool
                  </p>
                  <h2 className="mt-1 text-2xl font-bold">Sales tax calculator</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Enter any amount and a rate to see the calculation. The values use your
                    currency's units; the calculator does not select a legal tax rate for you.
                  </p>
                </div>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-semibold">
                  {mode === "inclusive" ? "Final price (tax included)" : "Price before tax"}
                  <input
                    className="field h-12"
                    type="number"
                    min="0"
                    max="1000000000000"
                    step="0.01"
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  Tax rate (%)
                  <input
                    className="field h-12"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    inputMode="decimal"
                    value={rate}
                    onChange={(event) => setRate(event.target.value)}
                  />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode("exclusive")}
                  aria-pressed={mode === "exclusive"}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${mode === "exclusive" ? "bg-foreground text-background" : "bg-secondary text-foreground"}`}
                >
                  Add tax to price
                </button>
                <button
                  type="button"
                  onClick={() => setMode("inclusive")}
                  aria-pressed={mode === "inclusive"}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${mode === "inclusive" ? "bg-foreground text-background" : "bg-secondary text-foreground"}`}
                >
                  Tax is already included
                </button>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground">Price before tax</p>
                  <p className="mt-2 text-xl font-bold tabular-nums">{money(result.base)}</p>
                </div>
                <div className="rounded-2xl bg-secondary p-4">
                  <p className="text-xs text-muted-foreground">Tax amount</p>
                  <p className="mt-2 text-xl font-bold tabular-nums">{money(result.tax)}</p>
                </div>
                <div className="rounded-2xl bg-accent p-4 text-accent-foreground">
                  <p className="text-xs opacity-75">Customer pays</p>
                  <p className="mt-2 text-xl font-bold tabular-nums">{money(result.total)}</p>
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Example only. The calculator performs arithmetic; it cannot decide whether a sale
                is taxable, whether you must register, or which jurisdiction's rules apply.
              </p>
            </section>

            <section className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
                  The fundamentals
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight">Understand the building blocks</h2>
              </div>
              <article className="space-y-2">
                <h3 className="text-xl font-bold">1. What is a tax?</h3>
                <p className="leading-7 text-muted-foreground">
                  A tax is a compulsory payment imposed by a government or public authority to fund
                  public services and other public responsibilities. Taxes can apply to what
                  people earn, buy, own, import, or do. A business may collect a consumption tax
                  from customers, pay taxes on its own profits or payroll, and incur other
                  obligations depending on local law.
                </p>
              </article>
              <article className="space-y-2">
                <h3 className="text-xl font-bold">2. Tax rate vs. tax base</h3>
                <p className="leading-7 text-muted-foreground">
                  The <strong>tax rate</strong> is the percentage used in a calculation. The
                  <strong> tax base</strong> is the amount or activity to which that percentage
                  applies. A 5% rate on a taxable base of 20,000 produces 1,000 in tax. If only
                  12,000 of the transaction is taxable, the same rate produces 600. Knowing the
                  rate without knowing the base can lead to the wrong result.
                </p>
              </article>
              <article className="space-y-2">
                <h3 className="text-xl font-bold">3. VAT, GST and sales tax</h3>
                <p className="leading-7 text-muted-foreground">
                  VAT (value-added tax) and GST (goods and services tax) are consumption-tax
                  systems commonly collected at multiple stages of a supply chain. Registered
                  businesses generally account for tax on eligible sales and may be able to recover
                  eligible tax paid on business purchases, subject to local rules. Retail sales tax
                  is often charged at the final retail sale. The names, scope, rates and reporting
                  rules vary across jurisdictions.
                </p>
              </article>
              <article className="space-y-2">
                <h3 className="text-xl font-bold">4. Tax-exclusive and tax-inclusive prices</h3>
                <p className="leading-7 text-muted-foreground">
                  A tax-exclusive price is shown before tax, so the applicable tax is added at
                  checkout. A tax-inclusive price already contains the tax, so adding tax again
                  would double-count it. For an inclusive total, the tax portion is:
                  <strong> total × rate ÷ (100 + rate)</strong>. For an exclusive amount, tax is:
                  <strong> price × rate ÷ 100</strong>.
                </p>
              </article>
              <article className="space-y-2">
                <h3 className="text-xl font-bold">5. Output tax and input tax</h3>
                <p className="leading-7 text-muted-foreground">
                  In many VAT/GST systems, output tax is the eligible tax a business charges on
                  sales. Input tax is eligible tax paid on business purchases. A registered
                  business may offset recoverable input tax against output tax and remit the
                  difference. Not every purchase qualifies, and documentation and timing rules
                  differ.
                </p>
              </article>
              <article className="space-y-2">
                <h3 className="text-xl font-bold">6. Exempt, zero-rated and out-of-scope sales</h3>
                <p className="leading-7 text-muted-foreground">
                  These labels are not interchangeable. A zero-rated supply is generally within a
                  tax system but charged at 0%; an exempt supply is treated differently and may
                  restrict input-tax recovery; an out-of-scope transaction falls outside the
                  relevant tax charge. The legal definitions and consequences must be checked
                  locally.
                </p>
              </article>
              <article className="space-y-2">
                <h3 className="text-xl font-bold">7. Tax is not the same as a business fee</h3>
                <p className="leading-7 text-muted-foreground">
                  Government taxes are created by law. Payment processor charges, card-network
                  fees, marketplace commissions, delivery charges and software subscriptions are
                  commercial fees. A fee may itself be subject to tax, but it is not automatically
                  the same thing as VAT, GST or sales tax. Keep these line items separate in your
                  pricing, receipts and bookkeeping.
                </p>
              </article>
            </section>

            <section id="find-your-rate" className="scroll-mt-24 rounded-3xl border border-border bg-surface p-5 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
                Practical checklist
              </p>
              <h2 className="mt-2 text-2xl font-bold">How to find the right percentage for your business</h2>
              <ol className="mt-6 space-y-4">
                {[
                  ["Identify the jurisdiction", "Confirm where the business is registered, where the customer is located, and where the law treats the supply as taking place. Cross-border sales can have special place-of-supply rules."],
                  ["Identify the tax type", "Work out whether you are dealing with VAT, GST, retail sales tax, excise, withholding, income tax or another obligation. The onboarding sales-tax field is not a setting for every type of business tax."],
                  ["Check your registration status", "Look up current registration thresholds, compulsory registration rules and any small-business schemes. A threshold may depend on turnover, transaction type or other conditions."],
                  ["Check the product or service category", "Some categories may be standard-rated, reduced-rated, zero-rated, exempt or outside the scope. Do not assume all products in a store have the same treatment."],
                  ["Confirm the current rate from an official source", "Use the relevant tax authority's official website, published legislation or written guidance. Check the effective date and whether the rate has changed."],
                  ["Keep evidence and review regularly", "Keep tax invoices, supplier records, sales reports and exemption evidence. Review the rate when you expand into another region, add product categories or tax rules change."],
                ].map(([title, body], index) => (
                  <li key={title} className="flex gap-4">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold">{title}</h3>
                      <p className="mt-1 text-sm leading-7 text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="rounded-3xl border border-border bg-secondary/60 p-5 sm:p-7">
              <div className="flex items-start gap-3">
                <Info className="mt-1 size-5 shrink-0" />
                <div>
                  <h2 className="font-bold">A note about tax accuracy</h2>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">
                    Strap's default sales-tax percentage is a calculation setting. It is not a
                    tax filing, registration check or legal determination. Do not use a guessed
                    rate. Confirm the correct treatment for your jurisdiction, business status,
                    product category and transaction before charging customers or filing returns.
                    Speak with a qualified tax professional if the rules are unclear.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-8">
              <div className="flex items-center gap-3">
                <PlayCircle className="size-5" />
                <div>
                  <h2 className="text-xl font-bold">Animated videos: learn visually</h2>
                  <p className="text-sm text-muted-foreground">
                    These videos are kept hidden until you open the lesson list.
                  </p>
                </div>
              </div>
              <details className="mt-5 rounded-2xl border border-border p-4">
                <summary className="cursor-pointer font-semibold">
                  Show animated tax lessons
                </summary>
                <div className="mt-5 space-y-6">
                  <article>
                    <h3 className="font-semibold">The Three Basic Tax Types — TaxEDU</h3>
                    <p className="mb-3 mt-1 text-sm leading-6 text-muted-foreground">
                      A short animated introduction to taxes on purchases, earnings and ownership.
                      The examples are illustrative; tax systems and rates differ by location.
                    </p>
                    <div className="aspect-video overflow-hidden rounded-xl bg-black">
                      <iframe
                        className="size-full"
                        src="https://www.youtube-nocookie.com/embed/sCdIII599iQ"
                        title="The Three Basic Tax Types — TaxEDU animated explainer"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </article>
                  <article>
                    <h3 className="font-semibold">VAT explained — The Finance Storyteller</h3>
                    <p className="mb-3 mt-1 text-sm leading-6 text-muted-foreground">
                      A general visual walkthrough of VAT, the supply chain, input tax and output
                      tax. Use it to understand the mechanism, not to copy a country's rate.
                    </p>
                    <div className="aspect-video overflow-hidden rounded-xl bg-black">
                      <iframe
                        className="size-full"
                        src="https://www.youtube-nocookie.com/embed/a6RB4rIxWqI"
                        title="VAT value added tax explained"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    </div>
                  </article>
                  <a
                    className="inline-flex items-center gap-2 text-sm font-semibold text-accent-ink underline"
                    href="https://taxfoundation.org/taxedu/videos/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore more animated TaxEDU lessons <ExternalLink className="size-4" />
                  </a>
                </div>
              </details>
            </section>

            <section className="rounded-3xl border border-border bg-surface p-5 sm:p-8">
              <h2 className="text-2xl font-bold">Frequently asked questions</h2>
              <div className="mt-5 divide-y divide-border">
                {faq.map((item) => (
                  <details key={item.question} className="py-4">
                    <summary className="cursor-pointer font-semibold">{item.question}</summary>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>

            <section className="rounded-3xl bg-foreground p-6 text-background sm:p-8">
              <div className="flex items-start gap-3">
                <CircleHelp className="mt-1 size-5 shrink-0 text-accent" />
                <div>
                  <h2 className="text-xl font-bold">A public reference for people and AI assistants</h2>
                  <p className="mt-2 text-sm leading-7 text-background/70">
                    This page is public and crawlable. AI assistants can cite the guide directly
                    or use its plain-text reference, which is linked from Strap's llms.txt and
                    llms-full.txt files. The guide is intentionally general and should not be
                    treated as a substitute for current local tax authority guidance.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold">
                    <a className="underline decoration-accent underline-offset-4" href="/tax-guide.md">
                      Read the machine-readable tax reference
                    </a>
                    <a className="underline decoration-accent underline-offset-4" href="/llms.txt">
                      Strap AI index
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-border bg-surface p-5">
              <p className="text-xs font-bold uppercase tracking-[.16em] text-muted-foreground">
                On this page
              </p>
              <nav className="mt-4 space-y-3 text-sm">
                <a className="block text-muted-foreground hover:text-foreground" href="#calculator">Tax calculator</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#find-your-rate">Find your rate</a>
                <a className="block text-muted-foreground hover:text-foreground" href="#videos">Video lessons</a>
              </nav>
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm font-semibold">Setting up your store?</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Enter only the verified sales-tax rate that applies to your taxable sales.
                </p>
                <Link to="/auth" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-ink">
                  Get started <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
