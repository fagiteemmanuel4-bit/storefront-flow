import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, ChevronRight, CreditCard, Database, Globe2, Lock, Palette, Receipt, Settings2, Shield, Store, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({ component: SettingsPage });

const SETTINGS = [
  [Store, "Store profile", "Business name, address, contact details and public store identity."],
  [Palette, "Store appearance", "Branding, theme, colors, typography and storefront presentation."],
  [Users, "Staff & permissions", "Roles, access boundaries, staff management and account controls."],
  [Bell, "Notifications", "Order, inventory, customer and operational notification preferences."],
  [Receipt, "Receipts", "Receipt layout, business details, footer text and printing preferences."],
  [Globe2, "Online store", "Catalogue visibility, storefront behaviour and customer-facing options."],
  [Zap, "Checkout & sales", "POS behaviour, cart defaults, tax display and checkout preferences."],
  [Database, "Inventory", "Stock alerts, valuation preferences and inventory behaviour."],
  [Shield, "Security", "Sessions, access policies, activity history and security controls."],
  [CreditCard, "Payments", "Payment configuration is coming soon. Live payment integration is on hold."],
];

function SettingsPage() {
  return <div className="min-h-full bg-surface px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-label-caps text-accent-ink">Control centre</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Configure how Strap works for your business. Advanced controls are separated so everyday settings stay simple.</p></div><Link to="/settings/advanced" className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background hover:bg-accent hover:text-accent-foreground"><Settings2 className="size-4" />Advanced settings<ArrowRight className="size-4" /></Link></div>
    <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{SETTINGS.map(([Icon,title,body]) => <Link key={title as string} to="/settings/advanced" className="group rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"><div className="flex items-start justify-between gap-4"><span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5" /></span><ChevronRight className="mt-2 size-4 text-muted-foreground transition group-hover:translate-x-1" /></div><h2 className="mt-4 font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p></Link>)}</div>
    <div className="mt-8 rounded-2xl border border-dashed border-border bg-background p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Need more control?</p><p className="mt-1 text-sm text-muted-foreground">Open Advanced Settings for the complete Strap control surface.</p></div><Link to="/settings/advanced" className="inline-flex items-center gap-2 text-sm font-semibold text-accent-ink">Open advanced<ArrowRight className="size-4" /></Link></div></div>
  </div></div>;
}
