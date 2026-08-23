import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, ChevronRight, CreditCard, Database, Globe2, Palette, Receipt, Shield, Settings2, Store, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

const SETTINGS = [
  [Store, "Store profile", "Business name, address, contact details and public store identity.", "/settings/advanced"],
  [Palette, "Store appearance", "Branding, theme, colors, typography and storefront presentation.", "/settings/advanced"],
  [Users, "Staff & permissions", "Roles, access boundaries, staff management and account controls.", "/settings/advanced"],
  [Bell, "Notifications", "Order, inventory, customer and operational notification preferences.", "/settings/advanced"],
  [Receipt, "Receipts", "Receipt layout, business details, footer text and printing preferences.", "/settings/advanced"],
  [Globe2, "Online store", "Catalogue visibility, storefront behaviour and customer-facing options.", "/settings/advanced"],
  [Zap, "Checkout & sales", "POS behaviour, cart defaults, tax display and checkout preferences.", "/settings/advanced"],
  [Database, "Inventory", "Stock alerts, valuation preferences and inventory behaviour.", "/settings/advanced"],
  [Shield, "Security", "Password, active sessions, IP history, API credentials and account security.", "/settings/security"],
  [CreditCard, "Payments", "Payment configuration is not enabled yet.", "/settings/advanced"],
] as const;

function SettingsPage() {
  return <div className="min-h-full bg-surface px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-label-caps text-accent-ink">Control centre</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Configure how Strap works for your business. Security has its own production-grade workspace so sensitive account controls stay isolated.</p></div><Link to="/settings/advanced" className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background hover:bg-accent hover:text-accent-foreground"><Settings2 className="size-4" />Advanced settings<ArrowRight className="size-4" /></Link></div>
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{SETTINGS.map(([Icon, title, body, target]) => <Link key={title} to={target} className="group rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"><div className="flex items-start justify-between gap-4"><span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5" /></span><ChevronRight className="mt-2 size-4 text-muted-foreground transition group-hover:translate-x-1" /></div><h2 className="mt-4 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></Link>)}</div>
  </div></div>;
}
