import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, Check, Globe2, HelpCircle, Laptop, PackageCheck, Printer, Receipt, ScanLine, Store, Users, Wallet, Zap } from "lucide-react";
import { PricingSection } from "./PricingSection";

const SHOP_TYPES = [
  [Store, "Mini marts & groceries", "Keep fast-moving products, prices and stock under control while the counter stays busy."],
  [PackageCheck, "Fashion & lifestyle", "Organise products, variants and sales without turning everyday retail into spreadsheet work."],
  [Wallet, "Beauty & personal care", "Track sales, expenses and stock in one place so you can see where the money is going."],
  [Boxes, "Electronics & accessories", "Use SKU and barcode workflows to find products quickly and keep inventory accurate."],
] as const;

const OPERATIONS = [
  [ScanLine, "Sell", "Search, scan, build carts, accept payments and complete sales without unnecessary steps."],
  [Boxes, "Stock", "Add products, adjust quantities, monitor low stock and understand inventory value."],
  [Wallet, "Money", "Record expenses and payments alongside sales so daily numbers stay connected."],
  [BarChart3, "Understand", "Review reports and trends that turn day-to-day activity into useful business decisions."],
  [Globe2, "Sell online", "Publish products to a shareable storefront and manage online orders from the same workspace."],
  [Users, "Work together", "Give the right people access to the shop while keeping important controls in one place."],
] as const;

const FAQS = [
  ["Can I use Strap on a phone and a computer?", "Yes. Strap is designed responsively so the important workflows remain usable on phones, tablets and desktop screens."],
  ["Can I scan products on a PC?", "Yes. A compatible USB or Bluetooth keyboard-wedge barcode/QR scanner can work like a keyboard, while camera scanning is available for supported devices."],
  ["Can I sell online with Strap?", "Yes. A public online storefront is available on paid Business and Pro plans, starting at ₦3,000/month."],
  ["What payment methods can I record?", "The register supports cash and other payment methods configured in the selling flow, with the payment method attached to the completed sale."],
  ["Can I print receipts?", "Strap includes receipt previews and a custom receipt designer, with compatible printer connections being developed for supported hardware."],
  ["Is Strap only for one kind of shop?", "No. The workflows are designed for everyday retail and can be adapted to different product categories, shop sizes and operating styles."],
] as const;

export function LandingDetails() {
  return (
    <>
      <section className="border-y border-border bg-secondary/45 px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-label-caps text-accent-ink">Built for real retail</p>
              <h2 className="text-display-md mt-4">Your shop is more than today's sales.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Strap connects the small actions that happen throughout the day — selling, restocking, paying bills, checking reports and taking orders — into one operating picture.</p>
              <Link to="/auth" className="mt-7 inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline">Set up your shop <ArrowRight className="size-4" /></Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {OPERATIONS.map(([Icon, title, body]) => <article key={title} className="rounded-3xl border border-border bg-background p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lift sm:p-7"><span className="flex size-11 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5" /></span><h3 className="mt-5 font-display text-xl font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}
            </div>
          </div>
        </div>
      </section>

      <PricingSection />

      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl"><p className="text-label-caps text-accent-ink">Made for your kind of shop</p><h2 className="text-display-md mt-4">Flexible enough for different retail businesses.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Whether you sell food, fashion, electronics or everyday essentials, the core workflows stay simple while your catalog can grow with you.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{SHOP_TYPES.map(([Icon, title, body]) => <article key={title} className="rounded-2xl border border-border bg-background p-6"><Icon className="size-5 text-accent-ink" /><h3 className="mt-5 font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</div>
        </div>
      </section>

      <section className="border-y border-border bg-background px-4 py-20 text-foreground sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_.85fr] lg:items-center">
            <div><p className="text-label-caps text-accent-ink">Hardware & checkout</p><h2 className="text-display-md mt-4 text-foreground">Designed to work with the way you already sell.</h2><p className="mt-5 max-w-2xl text-lg leading-8 text-foreground">Use the camera when you are on a phone. Use a compatible external barcode or QR scanner when you are at a desktop counter. Build a receipt design that fits your brand and prepare for compatible printer connections.</p><div className="mt-8 grid gap-3 sm:grid-cols-2">{[[ScanLine, "Camera scanning"], [Laptop, "USB / Bluetooth PC scanners"], [Printer, "Receipt printer workflows"], [Receipt, "Custom receipt designer"]].map(([Icon, label]) => <div key={label as string} className="flex items-center gap-3 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-foreground"><Icon className="size-4 text-accent-ink" />{label as string}</div>)}</div><Link to="/support" className="mt-8 inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline">Read hardware guides <ArrowRight className="size-4" /></Link></div>
            <div className="rounded-[2rem] border border-border bg-secondary p-6 shadow-sm sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-[.16em] text-muted-foreground">Counter setup</p><h3 className="mt-2 font-display text-2xl font-bold text-foreground">Ready for the rush</h3></div><span className="flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground"><Zap className="size-5" /></span></div><div className="mt-7 space-y-3">{["Scan product", "Add to current sale", "Take payment", "Update stock", "Print or share receipt"].map((item, index) => <div key={item} className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"><span className="flex size-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground">{index + 1}</span><span className="text-sm text-foreground">{item}</span><Check className="ml-auto size-4 text-accent-ink" /></div>)}</div></div>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-5xl"><div className="text-center"><p className="text-label-caps text-accent-ink">Questions, answered</p><h2 className="text-display-md mt-4">Everything you should know before you start.</h2><p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">Need more detail? The Strap Help Centre has step-by-step guides for setup, selling, stock, online stores, scanners, receipts and more.</p></div><div className="mt-12 grid gap-3">{FAQS.map(([question, answer]) => <details key={question} className="group rounded-2xl border border-border bg-background px-5 py-4 open:shadow-sm"><summary className="flex cursor-pointer list-none items-center gap-4 font-semibold"><HelpCircle className="size-5 shrink-0 text-accent-ink" /><span className="flex-1">{question}</span><span className="text-xl text-muted-foreground transition-transform group-open:rotate-45">+</span></summary><p className="pl-9 pr-6 pt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div><div className="mt-8 flex justify-center"><Link to="/support" className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 font-semibold hover:bg-secondary">Open Help Centre <ArrowRight className="size-4" /></Link></div></div>
      </section>

      <section className="px-4 pb-20 sm:px-6 sm:pb-28"><div className="mx-auto max-w-7xl rounded-[2rem] border border-border bg-secondary p-7 sm:p-10 lg:p-14"><div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center"><div><p className="text-label-caps text-accent-ink">Start with the essentials</p><h2 className="text-display-sm mt-4">Turn your daily retail work into one clear system.</h2><p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">Create your workspace, add your products and start learning your shop from the first sale onward.</p></div><Link to="/auth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-7 py-4 font-semibold text-accent-foreground shadow-lift transition-transform hover:-translate-y-0.5">Create your Strap account <ArrowRight className="size-4" /></Link></div></div></section>
    </>
  );
}
