import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Calculator, CircleHelp, ExternalLink, Info, PlayCircle, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { formatMoney } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/tax-guide")({
  head: () => ({
    meta: [
      { title: "Tax guide & calculator — Strap" },
      { name: "description", content: "Learn tax basics and estimate tax on a sale." },
    ],
  }),
  component: TaxGuidePage,
});

function TaxGuidePage() {
  const { store } = useStoreContext();
  const currency = store?.currency ?? "NGN";
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState(String(store?.tax_rate ?? 0));
  const [mode, setMode] = useState<"exclusive" | "inclusive">("exclusive");
  const result = useMemo(() => {
    const value = Math.max(0, Number(amount) || 0);
    const percentage = Math.min(100, Math.max(0, Number(rate) || 0));
    if (mode === "inclusive") {
      const base = value / (1 + percentage / 100);
      return { base, tax: value - base, total: value };
    }
    const tax = value * percentage / 100;
    return { base: value, tax, total: value + tax };
  }, [amount, rate, mode]);

  return (
    <AppShell title="Tax guide">
      <main className="mx-auto w-full max-w-5xl space-y-6 pb-12">
        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="bg-[linear-gradient(135deg,var(--card),color-mix(in_oklch,var(--color-accent)_18%,var(--card)))] p-6 sm:p-9">
            <p className="text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Strap learning centre</p>
            <h1 className="mt-3 max-w-3xl text-3xl font-extrabold tracking-tight sm:text-4xl">Understand tax before you set your rate.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">A practical, country-neutral introduction to sales tax, VAT and percentage calculations for business owners. Use the calculator to understand the maths, then confirm the correct rate for your location and products.</p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary p-4"><Calculator className="size-5"/><p className="mt-3 font-semibold">Calculate</p><p className="mt-1 text-sm text-muted-foreground">See the tax amount and customer total.</p></div>
            <div className="rounded-2xl bg-secondary p-4"><CircleHelp className="size-5"/><p className="mt-3 font-semibold">Understand</p><p className="mt-1 text-sm text-muted-foreground">Learn rates, tax bases and exemptions.</p></div>
            <div className="rounded-2xl bg-secondary p-4"><ShieldCheck className="size-5"/><p className="mt-3 font-semibold">Stay accurate</p><p className="mt-1 text-sm text-muted-foreground">Know what to verify before charging tax.</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft"><Calculator className="size-5"/></span><div><h2 className="text-xl font-bold">Sales tax calculator</h2><p className="text-sm text-muted-foreground">Try an example using your store currency ({currency}).</p></div></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">Price {mode === "inclusive" ? "(tax already included)" : "(before tax)"}<input className="field h-12" type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} inputMode="decimal"/></label>
            <label className="space-y-2 text-sm font-medium">Tax rate (%)<input className="field h-12" type="number" min="0" max="100" step="0.01" value={rate} onChange={e=>setRate(e.target.value)} inputMode="decimal"/></label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={()=>setMode("exclusive")} aria-pressed={mode==="exclusive"} className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode==="exclusive"?"bg-foreground text-background":"bg-secondary text-foreground"}`}>Add tax to price</button>
            <button type="button" onClick={()=>setMode("inclusive")} aria-pressed={mode==="inclusive"} className={`rounded-xl px-4 py-2 text-sm font-semibold ${mode==="inclusive"?"bg-foreground text-background":"bg-secondary text-foreground"}`}>Tax included in price</button>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-secondary p-4"><p className="text-xs text-muted-foreground">Price before tax</p><p className="mt-2 text-xl font-bold tabular-nums">{formatMoney(result.base,currency)}</p></div>
            <div className="rounded-2xl bg-secondary p-4"><p className="text-xs text-muted-foreground">Tax amount</p><p className="mt-2 text-xl font-bold tabular-nums">{formatMoney(result.tax,currency)}</p></div>
            <div className="rounded-2xl bg-accent p-4"><p className="text-xs text-muted-foreground">Customer pays</p><p className="mt-2 text-xl font-bold tabular-nums">{formatMoney(result.total,currency)}</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Illustrative calculation only. It does not determine whether a product or transaction is taxable.</p>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <h2 className="text-xl font-bold">Tax basics, in plain language</h2>
          <div className="mt-5 space-y-5">
            <article><h3 className="font-semibold">1. What is a tax?</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">A tax is a compulsory contribution collected by a public authority to fund public services. Businesses may collect certain taxes from customers, pay taxes on their own income or profits, or pay taxes on assets and activities. The rules depend on the jurisdiction and the type of tax.</p></article>
            <article><h3 className="font-semibold">2. What does a tax percentage mean?</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">A rate is the percentage applied to a defined amount, called the tax base. For example, 5% of 20,000 is 1,000. The rate alone is not enough: first confirm which amount is taxable, which items qualify, and whether the displayed price already includes tax.</p></article>
            <article><h3 className="font-semibold">3. VAT, GST and sales tax</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">These are forms of consumption tax used in different places. VAT and GST are commonly collected at stages of a supply chain, while retail sales tax is often charged at the final sale. Names, registration thresholds, exemptions and filing rules vary.</p></article>
            <article><h3 className="font-semibold">4. Tax-exclusive vs tax-inclusive prices</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">If a price is tax-exclusive, tax is added to the listed price. If it is tax-inclusive, the tax is already inside the amount the customer pays. For an inclusive price, the tax portion is: total × rate ÷ (100 + rate). Do not add the tax again.</p></article>
            <article><h3 className="font-semibold">5. Output tax and input tax</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">In many VAT/GST systems, output tax is tax charged on eligible sales. Input tax is eligible tax paid on business purchases. A registered business may be able to offset eligible input tax against output tax, subject to local rules and valid records.</p></article>
            <article><h3 className="font-semibold">6. Exempt, zero-rated and non-taxable</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">These terms are not interchangeable. Zero-rated supplies may be taxable at 0%; exempt supplies may have different input-tax recovery treatment; and some transactions may be outside the scope of a tax. Check the official rules for your location and product category.</p></article>
            <article><h3 className="font-semibold">7. How to find the correct rate for your business</h3><ol className="mt-2 list-decimal space-y-2 pl-5 text-sm leading-7 text-muted-foreground"><li>Identify where your business is registered and where the sale is treated as taking place.</li><li>Identify the product or service category and whether it is taxable, exempt or zero-rated.</li><li>Check whether your business meets the registration or collection threshold.</li><li>Use your tax authority's current guidance or speak with a qualified tax professional.</li><li>Keep invoices, purchase records and evidence of tax paid or collected.</li><li>Review rates when laws change; do not assume one rate applies to every item.</li></ol></article>
          </div>
          <div className="mt-6 flex gap-3 rounded-2xl border border-border bg-secondary/60 p-4"><Info className="mt-0.5 size-5 shrink-0"/><p className="text-sm leading-6 text-muted-foreground">Strap's default sales-tax percentage is a calculation setting, not a tax filing or compliance determination. Confirm the legally applicable rate, registration status, exemptions and filing obligations before using it for real transactions.</p></div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 sm:p-7">
          <div className="flex items-center gap-3"><PlayCircle className="size-5"/><div><h2 className="text-xl font-bold">Watch and learn</h2><p className="text-sm text-muted-foreground">Videos are hidden until you choose to open this section.</p></div></div>
          <details className="mt-5 rounded-2xl border border-border p-4">
            <summary className="cursor-pointer font-semibold">Show the video lessons</summary>
            <div className="mt-4 space-y-5">
              <article><h3 className="font-semibold">VAT explained with a visual example</h3><p className="mb-3 mt-1 text-sm text-muted-foreground">A general explanation of VAT, the supply chain and how tax is calculated. Not tied to a specific country's tax rates.</p><div className="aspect-video overflow-hidden rounded-xl bg-black"><iframe className="size-full" src="https://www.youtube-nocookie.com/embed/a6RB4rIxWqI" title="VAT explained with a visual example" loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div></article>
              <a className="inline-flex items-center gap-2 text-sm font-semibold underline" href="https://taxfoundation.org/taxedu/videos/" target="_blank" rel="noreferrer">Explore animated TaxEDU explainers <ExternalLink className="size-4"/></a>
            </div>
          </details>
        </section>
      </main>
    </AppShell>
  );
}
