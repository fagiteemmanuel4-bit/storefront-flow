import { Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, BookOpen, Boxes, CircleHelp, CreditCard, Globe2, HelpCircle, Mail, PackageCheck, Receipt, ScanLine, Settings2, ShieldCheck, ShoppingCart, Smartphone, Store, Users, Wallet, Zap } from "lucide-react";

const PRODUCT_LINKS = [
  ["Point of sale", "#pos"],
  ["Inventory & stock", "#inventory"],
  ["Online store", "#online-store"],
  ["Reports & insights", "#business-insights"],
  ["Barcode scanning", "#scanning"],
  ["Receipt tools", "#receipts"],
] as const;

const FEATURE_LINKS = [
  ["Sales & checkout", ShoppingCart],
  ["Stock management", Boxes],
  ["Expenses & money tracking", Wallet],
  ["Online catalog & orders", Globe2],
  ["Barcode & QR scanning", ScanLine],
  ["Receipts & printing", Receipt],
  ["Reports", BarChart3],
  ["Store settings", Settings2],
] as const;

const RESOURCE_LINKS = [
  ["Help centre", "/support", CircleHelp],
  ["Guides & documentation", "/support", BookOpen],
  ["Getting started", "/support", Zap],
  ["Scanner setup", "/support", ScanLine],
  ["Receipt printing help", "/support", Receipt],
  ["Contact support", "mailto:support@kudi.app", Mail],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-accent"><span className="size-3 rotate-45 rounded-[3px] bg-foreground" /></span><span className="font-display text-xl font-bold tracking-tight">KUDI.</span></Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex"><a href="#features" className="transition-colors hover:text-accent-ink">Features</a><a href="#how-it-works" className="transition-colors hover:text-accent-ink">How it works</a><a href="#online-store" className="transition-colors hover:text-accent-ink">Online store</a><a href="#business-insights" className="transition-colors hover:text-accent-ink">Insights</a><Link to="/support" className="transition-colors hover:text-accent-ink">Help</Link></nav>
        <div className="flex items-center gap-2"><Link to="/support" className="hidden rounded-full px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary sm:inline-flex">Help</Link><Link to="/auth" className="touch-target inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-accent-foreground">Open register</Link></div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-background/10 bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 sm:pt-20">
        <div className="grid gap-12 border-b border-background/10 pb-14 lg:grid-cols-[1.1fr_2fr] lg:gap-20">
          <div className="max-w-md">
            <Link to="/" className="inline-flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-full bg-accent"><span className="size-3.5 rotate-45 rounded-[3px] bg-foreground" /></span><span className="font-display text-2xl font-bold tracking-tight">KUDI.</span></Link>
            <p className="mt-5 text-base leading-7 text-background/60">Kudi is a practical retail operating system for shops that want one clear place to sell, manage stock, track money, understand performance and build an online storefront.</p>
            <div className="mt-6 grid gap-2 text-xs text-background/50 sm:grid-cols-2"><span className="inline-flex items-center gap-2"><Store className="size-3.5 text-accent" />Built for everyday retail</span><span className="inline-flex items-center gap-2"><Smartphone className="size-3.5 text-accent" />Desktop & mobile</span><span className="inline-flex items-center gap-2"><ShieldCheck className="size-3.5 text-accent" />Protected workspace</span><span className="inline-flex items-center gap-2"><Users className="size-3.5 text-accent" />Built for shop teams</span></div>
            <Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5">Start selling free <ArrowRight className="size-4" /></Link>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            <div><p className="text-label-caps text-background/40">Product</p><div className="mt-4 space-y-3">{PRODUCT_LINKS.map(([label, href]) => <a key={label} href={href} className="block text-sm text-background/65 transition-colors hover:text-accent">{label}</a>)}</div></div>
            <div><p className="text-label-caps text-background/40">Features</p><div className="mt-4 space-y-3">{FEATURE_LINKS.slice(0, 4).map(([label, Icon]) => <a key={label} href="#features" className="flex items-center gap-2 text-sm text-background/65 transition-colors hover:text-accent"><Icon className="size-3.5 shrink-0" />{label}</a>)}</div></div>
            <div><p className="text-label-caps text-background/40">More tools</p><div className="mt-4 space-y-3">{FEATURE_LINKS.slice(4).map(([label, Icon]) => <a key={label} href="#features" className="flex items-center gap-2 text-sm text-background/65 transition-colors hover:text-accent"><Icon className="size-3.5 shrink-0" />{label}</a>)}</div></div>
            <div><p className="text-label-caps text-background/40">Resources</p><div className="mt-4 space-y-3">{RESOURCE_LINKS.map(([label, href, Icon]) => href.startsWith("/") ? <Link key={label} to={href as "/support"} className="flex items-center gap-2 text-sm text-background/65 transition-colors hover:text-accent"><Icon className="size-3.5 shrink-0" />{label}</Link> : <a key={label} href={href} className="flex items-center gap-2 text-sm text-background/65 transition-colors hover:text-accent"><Icon className="size-3.5 shrink-0" />{label}</a>)}</div></div>
          </div>
        </div>

        <div className="grid gap-8 border-b border-background/10 py-12 md:grid-cols-3">
          <div><p className="text-label-caps text-background/40">For your shop</p><h3 className="mt-3 font-display text-lg font-bold">Run the whole day from one workspace.</h3><p className="mt-2 text-sm leading-6 text-background/50">Open the register, keep inventory accurate, record expenses, review performance and manage online orders without jumping between tools.</p></div>
          <div><p className="text-label-caps text-background/40">For your customers</p><h3 className="mt-3 font-display text-lg font-bold">Give shoppers a better way to buy.</h3><p className="mt-2 text-sm leading-6 text-background/50">Publish products to your online catalog, share your storefront and keep orders connected to the same business records.</p></div>
          <div><p className="text-label-caps text-background/40">For your team</p><h3 className="mt-3 font-display text-lg font-bold">Make the important actions obvious.</h3><p className="mt-2 text-sm leading-6 text-background/50">Kudi is designed around fast checkout, clear stock information, straightforward reports and practical workflows.</p></div>
        </div>

        <div className="mt-10 rounded-2xl border border-background/10 bg-background/[.04] p-5 sm:p-6"><div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center"><div className="flex gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"><ShieldCheck className="size-5" /></span><div><p className="text-sm font-semibold">Your shop records stay at the centre.</p><p className="mt-1 text-xs leading-5 text-background/50">Kudi connects sales, stock, expenses and online activity so your business information is easier to understand and manage.</p></div></div><Link to="/privacy" className="inline-flex items-center gap-2 text-sm font-semibold text-background/70 hover:text-accent">Read our privacy approach <ArrowRight className="size-4" /></Link></div></div>

        <div className="mt-10 grid gap-8 border-b border-background/10 pb-8 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-label-caps text-background/40">Explore</p><div className="mt-4 space-y-3"><a href="#features" className="block text-sm text-background/60 hover:text-accent">All features</a><a href="#how-it-works" className="block text-sm text-background/60 hover:text-accent">How Kudi works</a><a href="#online-store" className="block text-sm text-background/60 hover:text-accent">Online selling</a><a href="#business-insights" className="block text-sm text-background/60 hover:text-accent">Business insights</a></div></div>
          <div><p className="text-label-caps text-background/40">Account</p><div className="mt-4 space-y-3"><Link to="/auth" className="block text-sm text-background/60 hover:text-accent">Sign in</Link><Link to="/auth" className="block text-sm text-background/60 hover:text-accent">Create account</Link><Link to="/support" className="block text-sm text-background/60 hover:text-accent">Get help</Link></div></div>
          <div><p className="text-label-caps text-background/40">Legal</p><div className="mt-4 space-y-3"><Link to="/privacy" className="block text-sm text-background/60 hover:text-accent">Privacy policy</Link><Link to="/terms" className="block text-sm text-background/60 hover:text-accent">Terms of service</Link></div></div>
          <div><p className="text-label-caps text-background/40">Need help?</p><p className="mt-4 text-sm leading-6 text-background/55">Find setup guides, scanner instructions, receipt help and answers in the Kudi Help Centre.</p><Link to="/support" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-accent">Visit Help Centre <ArrowRight className="size-4" /></Link></div>
        </div>

        <div className="mt-7 flex flex-col gap-5 text-xs text-background/40 md:flex-row md:items-center md:justify-between"><p>© {year} Kudi. Built for modern shops and everyday retail.</p><div className="flex flex-wrap gap-x-5 gap-y-2"><span className="inline-flex items-center gap-1.5"><Store className="size-3.5" />Run your shop with clarity</span><span className="inline-flex items-center gap-1.5"><Globe2 className="size-3.5" />Sell online</span><Link to="/privacy" className="hover:text-background">Privacy</Link><Link to="/terms" className="hover:text-background">Terms</Link></div></div>
      </div>
    </footer>
  );
}
