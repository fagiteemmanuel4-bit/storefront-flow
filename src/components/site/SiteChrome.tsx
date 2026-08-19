import { Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CircleHelp, Globe2, Mail, ShieldCheck, Store, Zap } from "lucide-react";

const PRODUCT_LINKS = [
  ["Point of sale", "#how-it-works"],
  ["Inventory & stock", "#features"],
  ["Online store", "#online-store"],
  ["Reports & insights", "#business-insights"],
  ["Barcode scanning", "#features"],
  ["Receipt tools", "#features"],
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-full bg-accent"><span className="size-3 rotate-45 rounded-[3px] bg-foreground" /></span><span className="font-display text-xl font-bold tracking-tight">KUDI.</span></Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex"><a href="#features" className="transition-colors hover:text-accent-ink">Features</a><a href="#how-it-works" className="transition-colors hover:text-accent-ink">How it works</a><a href="#online-store" className="transition-colors hover:text-accent-ink">Online store</a><Link to="/support" className="transition-colors hover:text-accent-ink">Help centre</Link></nav>
        <Link to="/auth" className="touch-target inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-accent-foreground">Open register</Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-background/10 bg-foreground px-4 pb-8 pt-14 text-background sm:px-6 sm:pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.35fr_2fr] lg:gap-20">
          <div className="max-w-md"><Link to="/" className="inline-flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-full bg-accent"><span className="size-3.5 rotate-45 rounded-[3px] bg-foreground" /></span><span className="font-display text-2xl font-bold tracking-tight">KUDI.</span></Link><p className="mt-5 text-base leading-7 text-background/60">A practical retail workspace for selling, managing stock, tracking money and taking your shop online. Kudi keeps everyday commerce in one clear place.</p><div className="mt-7 flex flex-wrap gap-2"><span className="rounded-full border border-background/10 bg-background/5 px-3 py-1.5 text-xs text-background/60">POS</span><span className="rounded-full border border-background/10 bg-background/5 px-3 py-1.5 text-xs text-background/60">Inventory</span><span className="rounded-full border border-background/10 bg-background/5 px-3 py-1.5 text-xs text-background/60">Online store</span><span className="rounded-full border border-background/10 bg-background/5 px-3 py-1.5 text-xs text-background/60">Reports</span></div><Link to="/auth" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-semibold text-accent-foreground transition-transform hover:-translate-y-0.5">Start selling free <ArrowRight className="size-4" /></Link></div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-4">
            <div><p className="text-label-caps text-background/40">Product</p><div className="mt-4 space-y-3">{PRODUCT_LINKS.map(([label, href]) => <a key={label} href={href} className="block text-sm text-background/65 transition-colors hover:text-accent">{label}</a>)}</div></div>
            <div><p className="text-label-caps text-background/40">For shops</p><div className="mt-4 space-y-3"><a href="#features" className="block text-sm text-background/65 hover:text-accent">Small retail</a><a href="#features" className="block text-sm text-background/65 hover:text-accent">Growing businesses</a><a href="#online-store" className="block text-sm text-background/65 hover:text-accent">Online selling</a><a href="#business-insights" className="block text-sm text-background/65 hover:text-accent">Multi-branch ready</a></div></div>
            <div><p className="text-label-caps text-background/40">Resources</p><div className="mt-4 space-y-3"><Link to="/support" className="flex items-center gap-2 text-sm text-background/65 hover:text-accent"><CircleHelp className="size-3.5" />Help centre</Link><Link to="/support" className="flex items-center gap-2 text-sm text-background/65 hover:text-accent"><BookOpen className="size-3.5" />Guides</Link><Link to="/support" className="flex items-center gap-2 text-sm text-background/65 hover:text-accent"><Zap className="size-3.5" />Getting started</Link><a href="mailto:support@kudi.app" className="flex items-center gap-2 text-sm text-background/65 hover:text-accent"><Mail className="size-3.5" />Contact support</a></div></div>
            <div><p className="text-label-caps text-background/40">Company</p><div className="mt-4 space-y-3"><Link to="/privacy" className="block text-sm text-background/65 hover:text-accent">Privacy</Link><Link to="/terms" className="block text-sm text-background/65 hover:text-accent">Terms</Link><Link to="/auth" className="block text-sm text-background/65 hover:text-accent">Sign in</Link><Link to="/auth" className="block text-sm text-background/65 hover:text-accent">Create account</Link></div></div>
          </div>
        </div>
        <div className="mt-14 rounded-2xl border border-background/10 bg-background/[.04] p-5 sm:p-6"><div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center"><div className="flex gap-4"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent"><ShieldCheck className="size-5" /></span><div><p className="text-sm font-semibold">Built around your business records</p><p className="mt-1 text-xs leading-5 text-background/50">Kudi gives your shop a structured workspace for sales, inventory, expenses and online orders, with protected account access.</p></div></div><Link to="/privacy" className="inline-flex items-center gap-2 text-sm font-semibold text-background/70 hover:text-accent">Read our privacy approach <ArrowRight className="size-4" /></Link></div></div>
        <div className="mt-10 flex flex-col gap-5 border-t border-background/10 pt-7 text-xs text-background/40 md:flex-row md:items-center md:justify-between"><p>© {year} Kudi. Built for modern shops and everyday retail.</p><div className="flex flex-wrap gap-x-5 gap-y-2"><span className="inline-flex items-center gap-1.5"><Store className="size-3.5" />Run your shop with clarity</span><span className="inline-flex items-center gap-1.5"><Globe2 className="size-3.5" />Sell online</span><Link to="/privacy" className="hover:text-background">Privacy</Link><Link to="/terms" className="hover:text-background">Terms</Link></div></div>
      </div>
    </footer>
  );
}
