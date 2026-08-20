import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Check, ChevronRight, Globe2, PackageCheck, Receipt, ScanLine, ShieldCheck, ShoppingBag, Sparkles, Store, Users, Wallet, Zap } from "lucide-react";
import { LandingMedia } from "@/components/site/LandingMedia";
import { LandingDetails } from "@/components/site/LandingDetails";
import { LandingUpgrades } from "@/components/site/LandingUpgrades";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

const SITE_URL = "https://storefront-flow.vercel.app";
const HERO_VIDEO = "https://pixabay.com/videos/download/x-23258_medium.mp4";

const ILLUSTRATIONS = {
  retail: "https://unpkg.com/undraw-svg@1.0.0/svgs/shopping-bags.svg",
  mobile: "https://unpkg.com/undraw-svg@1.0.0/svgs/mobile-site.svg",
  growth: "https://unpkg.com/undraw-svg@1.0.0/svgs/growth-analytics.svg",
  receipt: "https://unpkg.com/undraw-svg@1.0.0/svgs/printing-invoices.svg",
} as const;

const FEATURES = [
  [ScanLine, "Sell in seconds", "Build carts, scan products, take payments and keep the queue moving."],
  [PackageCheck, "Know your stock", "See available, low and out-of-stock products and keep inventory accurate."],
  [Wallet, "Track your money", "Keep sales, expenses and payment records together so the numbers tell one story."],
  [Globe2, "Sell beyond the counter", "Create a shareable storefront and let customers browse and order online."],
] as const;

const CAPABILITIES = [
  [ScanLine, "Barcode & QR scanning", "Use your camera or compatible USB/Bluetooth keyboard-wedge scanners."],
  [Receipt, "Receipts & printing", "Preview receipts, design your own layout and prepare compatible printer workflows."],
  [BarChart3, "Reports & insights", "Understand sales, expenses, stock value and the signals behind your business."],
  [Users, "Shop teams", "Keep day-to-day selling organised for the people working behind the counter."],
  [Store, "Store management", "Manage shop information, branches, preferences and operating details."],
  [ShoppingBag, "Online catalogue", "Publish products, organise the catalogue and manage online orders."],
  [ShieldCheck, "Protected workspace", "Keep business activity inside an authenticated workspace with controlled access."],
  [Zap, "Fast daily workflows", "Move from product to sale to stock update with fewer steps."],
] as const;

const STEPS = [
  ["01", "Bring your products in", "Add products manually, import a catalogue or build your inventory as you sell."],
  ["02", "Sell at the counter", "Search, scan, build a cart and complete a sale without slowing down the queue."],
  ["03", "Stay in control", "Kudi keeps sales, stock, expenses and orders connected as the day changes."],
  ["04", "Open your store", "Publish your catalogue, share your store and manage online orders from the same workspace."],
] as const;

function Illustration({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" width={640} height={520} className={`h-auto w-full object-contain ${className}`} />;
}

function Landing() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-foreground">
      <SiteHeader />
      <main>
        <section className="relative isolate min-h-[760px] overflow-hidden bg-foreground text-background sm:min-h-[820px]">
          <video className="absolute inset-0 h-full w-full object-cover opacity-55" src={HERO_VIDEO} autoPlay muted loop playsInline preload="auto" aria-hidden="true" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,.94)_0%,rgba(10,10,10,.78)_42%,rgba(10,10,10,.25)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,179,0,.24),transparent_30%)]" />
          <div className="relative mx-auto flex min-h-[760px] max-w-7xl items-end px-4 pb-20 pt-28 sm:min-h-[820px] sm:px-6 sm:pb-28 lg:items-center">
            <div className="max-w-3xl animate-[fade-in-up_.75s_ease-out_both]">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold backdrop-blur-md"><span className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground"><Sparkles className="size-3" /></span>Built for busy retail</div>
              <h1 className="mt-6 font-display text-5xl font-bold tracking-[-.05em] sm:text-[5.4rem] sm:leading-[.9]">Your shop moves fast. <span className="text-accent">Kudi keeps up.</span></h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">Sales, stock, expenses, payments, reports and your online store — brought into one clear workspace built around how real shops operate.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link to="/auth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-7 py-3.5 font-semibold text-accent-foreground shadow-float transition hover:-translate-y-0.5">Start selling free<ArrowRight className="size-4" /></Link><a href="#features" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 font-semibold backdrop-blur-md transition hover:bg-white/15">Explore Kudi<ChevronRight className="size-4" /></a></div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-white/65">{["Quick setup", "Built for everyday retail", "Your data, your shop"].map((item) => <span key={item} className="inline-flex items-center gap-2"><Check className="size-4 text-accent" />{item}</span>)}</div>
            </div>
          </div>
          <div className="absolute bottom-6 right-6 hidden max-w-xs rounded-2xl border border-white/15 bg-black/45 p-4 text-sm text-white/80 shadow-float backdrop-blur-md lg:block"><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">Kudi live</p><p className="mt-1 font-semibold text-white">One operation. Every important detail connected.</p></div>
        </section>

        <section className="border-b border-border px-4 py-10 sm:px-6 sm:py-14"><div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-[1fr_auto]"><div><p className="text-label-caps text-accent-ink">The Kudi idea</p><h2 className="text-display-sm mt-3">Run the shop. Don't run after the paperwork.</h2></div><Illustration src={ILLUSTRATIONS.retail} alt="Illustration of retail shopping bags and commerce" className="max-w-[18rem] justify-self-center md:max-w-[22rem]" /></div></section>

        <LandingMedia />

        <section id="features" className="overflow-hidden px-4 py-20 sm:px-6 sm:py-28"><div className="mx-auto max-w-7xl"><div className="grid items-end gap-10 lg:grid-cols-[1fr_.65fr]"><div><p className="text-label-caps text-accent-ink">One system. Less guesswork.</p><h2 className="text-display-md mt-4">Everything you need to keep the counter moving.</h2></div><p className="leading-7 text-muted-foreground">Kudi turns the everyday jobs of a shop into connected workflows, so you spend less time copying information between tools.</p></div><div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{FEATURES.map(([Icon, title, body], index) => <article key={title} className="group border-b border-border pb-7 transition hover:-translate-y-1"><div className="flex items-center justify-between"><span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Icon className="size-5" /></span><span className="font-display text-5xl font-bold text-border transition group-hover:text-accent/30">0{index + 1}</span></div><h3 className="mt-6 font-display text-xl font-bold">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</div></div></section>

        <section className="overflow-hidden border-y border-border bg-background px-4 py-20 sm:px-6 sm:py-28"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_.9fr]"><div><p className="text-label-caps text-accent-ink">Mobile + desktop</p><h2 className="text-display-md mt-4">Your business doesn't stay in one place. Kudi doesn't either.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Move between the counter, stockroom and phone without losing the context of what happened.</p><div className="mt-9 grid gap-4 sm:grid-cols-3"><div><p className="font-display text-xl font-bold">Counter</p><p className="mt-1 text-sm text-muted-foreground">Fast checkout and scanning.</p></div><div><p className="font-display text-xl font-bold">Stockroom</p><p className="mt-1 text-sm text-muted-foreground">Accurate inventory and alerts.</p></div><div><p className="font-display text-xl font-bold">Online</p><p className="mt-1 text-sm text-muted-foreground">Catalogue and customer orders.</p></div></div></div><Illustration src={ILLUSTRATIONS.mobile} alt="Illustration of a mobile retail website experience" className="mx-auto max-w-[34rem]" /></div></section>

        <section className="px-4 py-20 sm:px-6 sm:py-28"><div className="mx-auto max-w-7xl"><div className="grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]"><Illustration src={ILLUSTRATIONS.growth} alt="Illustration of business growth analytics" className="mx-auto max-w-[34rem]" /><div><p className="text-label-caps text-accent-ink">Business intelligence</p><h2 className="text-display-md mt-4">See what happened. Know what needs attention.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Reports should not just show numbers. They should help you decide what to restock, where sales are moving and what needs your attention today.</p><Link to="/auth" className="mt-8 inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline">Explore Kudi reports<ArrowRight className="size-4" /></Link></div></div></div></section>

        <section className="border-y border-border bg-foreground px-4 py-20 text-background sm:px-6 sm:py-28"><div className="mx-auto max-w-7xl"><div className="grid items-end gap-8 lg:grid-cols-[1fr_.7fr]"><div><p className="text-label-caps text-accent">The full toolkit</p><h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">More than a cash register.</h2></div><p className="max-w-xl leading-7 text-background/65">The same workspace that records a sale should help you understand stock, serve customers, manage orders and grow online.</p></div><div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">{CAPABILITIES.map(([Icon, title, body]) => <article key={title} className="border-t border-background/15 pt-5"><Icon className="size-5 text-accent" /><h3 className="mt-4 font-display text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-background/60">{body}</p></article>)}</div></div></section>

        <section id="how-it-works" className="overflow-hidden px-4 py-20 sm:px-6 sm:py-28"><div className="mx-auto grid max-w-7xl items-start gap-12 lg:grid-cols-[.7fr_1.3fr]"><div className="lg:sticky lg:top-28"><p className="text-label-caps text-accent-ink">How Kudi works</p><h2 className="text-display-md mt-4">Simple enough for today. Powerful enough for tomorrow.</h2><p className="mt-5 leading-7 text-muted-foreground">Start with the essentials and grow into the tools your shop actually needs.</p><Illustration src={ILLUSTRATIONS.receipt} alt="Illustration of receipts and invoice printing" className="mt-8 hidden max-w-[18rem] lg:block" /></div><div className="space-y-12">{STEPS.map(([number, title, body]) => <article key={number} className="grid gap-4 border-b border-border pb-10 sm:grid-cols-[80px_1fr]"><span className="font-display text-5xl font-bold text-accent/50">{number}</span><div><h3 className="font-display text-2xl font-bold">{title}</h3><p className="mt-3 max-w-xl leading-7 text-muted-foreground">{body}</p></div></article>)}</div></div></section>

        <LandingUpgrades />
        <LandingDetails />

        <section id="security" className="px-4 py-20 sm:px-6 sm:py-28"><div className="mx-auto max-w-5xl text-center"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><ShieldCheck className="size-7" /></div><h2 className="text-display-sm mt-6">Your business deserves a system you can trust.</h2><p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">Keep shop records organised, control access and build your operation on a system designed to grow with you.</p><div className="mt-10 grid gap-8 text-left sm:grid-cols-3">{[[ShieldCheck, "Protected workspace", "Authentication and controlled shop access are built into the experience."], [Zap, "Built for busy days", "Fast flows and clear information help you spend less time on admin."], [Globe2, "Ready to grow online", "Connect your physical operation with a simple shareable storefront."]].map(([Icon, title, body]) => <div key={title as string}><Icon className="size-5 text-accent-ink" /><h3 className="mt-4 font-display font-bold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p></div>)}</div></div></section>

        <section id="faq" className="px-4 py-20 sm:px-6 sm:py-28"><div className="mx-auto max-w-4xl"><div className="text-center"><p className="text-label-caps text-accent-ink">Questions</p><h2 className="text-display-md mt-4">A clearer answer before you start.</h2></div><div className="mt-10 grid gap-3">{[["Is Kudi built for mobile and desktop?", "Yes. The experience is responsive, with workflows designed for both counter computers and mobile devices."], ["Can I use external scanners and printers?", "Yes. Compatible camera, USB, Bluetooth and serial hardware workflows are supported where the browser and device allow them."], ["Can I sell online?", "Yes. You can publish products to an online catalogue and manage online orders from the same workspace."], ["Can my team use the store?", "Yes. Store roles help owners, managers and cashiers work with appropriate access."]].map(([question, answer]) => <details key={question} className="group border-b border-border py-5"><summary className="cursor-pointer list-none font-semibold">{question}<span className="float-right text-muted-foreground">+</span></summary><p className="max-w-2xl pt-3 text-sm leading-6 text-muted-foreground">{answer}</p></details>)}</div><div className="mt-8 flex justify-center"><Link to="/support" className="inline-flex items-center gap-2 font-semibold text-accent-ink hover:underline">Visit Help Centre<ArrowRight className="size-4" /></Link></div></div></section>

        <section className="px-4 pb-20 sm:px-6 sm:pb-28"><div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-accent p-8 text-accent-foreground shadow-float sm:p-12 lg:p-16"><div className="absolute -right-16 -top-16 size-64 rounded-full border-[30px] border-accent-foreground/10" /><div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]"><div className="max-w-2xl"><p className="text-label-caps opacity-70">Ready when you are</p><h2 className="text-display-md mt-4">Less counting. More knowing.</h2><p className="mt-4 max-w-xl text-base leading-7 opacity-75">Open your Kudi register and give your shop one clear place to sell, track, understand and grow.</p></div><Link to="/auth" className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-7 py-3.5 font-semibold text-background transition hover:-translate-y-0.5">Start with Kudi<ArrowRight className="size-4" /></Link></div></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kudi — Point of Sale, Inventory & Online Store for Nigerian Businesses" },
      { name: "description", content: "Kudi is a modern POS and retail management platform for Nigerian businesses. Sell faster, manage inventory, track expenses, publish an online catalogue and receive customer orders in one workspace." },
      { name: "keywords", content: "Kudi POS Nigeria, point of sale Nigeria, inventory management Nigeria, retail software Nigeria, stock management, online store Nigeria, catalogue management, barcode scanner POS, small business POS" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Kudi — Point of Sale, Inventory & Online Store" },
      { property: "og:description", content: "Sell, manage stock, track your business and take orders online from one practical retail workspace." },
      { property: "og:url", content: SITE_URL },
      { property: "og:locale", content: "en_NG" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Kudi — Point of Sale, Inventory & Online Store" },
      { name: "twitter:description", content: "A practical retail workspace for sales, inventory, customers and online selling." },
    ],
    links: [
      { rel: "canonical", href: SITE_URL },
      { rel: "preconnect", href: "https://pixabay.com" },
      { rel: "preconnect", href: "https://unpkg.com" },
      { rel: "preload", as: "video", href: HERO_VIDEO, crossOrigin: "anonymous" },
    ],
  }),
  component: Landing,
});
