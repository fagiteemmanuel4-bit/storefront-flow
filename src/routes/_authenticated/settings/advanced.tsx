import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Clock3, ExternalLink, Lock, Save, Sparkles } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/settings/advanced")({ component: AdvancedSettingsPage });

type Setting = { title: string; description: string; kind: "toggle" | "select" | "action"; options?: string[]; comingSoon?: boolean };

const SETTINGS: Setting[] = [
  { title: "Low-stock alerts", description: "Notify the team when stock falls below configured thresholds.", kind: "toggle" },
  { title: "Out-of-stock alerts", description: "Create an immediate attention signal for unavailable products.", kind: "toggle" },
  { title: "Order notifications", description: "Notify authorised staff when an online order arrives or changes state.", kind: "toggle" },
  { title: "Customer notifications", description: "Control customer-facing order and account notifications.", kind: "toggle" },
  { title: "Activity logging", description: "Keep an auditable record of important merchant actions.", kind: "toggle" },
  { title: "Require confirmation for destructive actions", description: "Add a safety confirmation before deletes, cancellations and irreversible actions.", kind: "toggle" },
  { title: "Default currency", description: "Currency shown across sales, reports and storefront prices.", kind: "select", options: ["NGN", "USD", "GBP", "EUR"] },
  { title: "Default timezone", description: "Timezone used for daily reports, timestamps and operational cutoffs.", kind: "select", options: ["Africa/Lagos", "UTC", "Europe/London", "America/New_York"] },
  { title: "Date format", description: "Choose how dates appear throughout the workspace.", kind: "select", options: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] },
  { title: "Number format", description: "Choose how quantities and decimal values are displayed.", kind: "select", options: ["1,234.56", "1.234,56", "1 234.56"] },
  { title: "POS sound", description: "Play lightweight feedback sounds for successful scan and sale actions.", kind: "toggle" },
  { title: "Barcode auto-focus", description: "Keep the product search input ready for scanner keyboard input.", kind: "toggle" },
  { title: "Auto-open receipt preview", description: "Open the receipt preview after a successful sale.", kind: "toggle" },
  { title: "Inventory valuation method", description: "Choose the accounting basis used by future inventory analytics.", kind: "select", options: ["Weighted average", "FIFO"] },
  { title: "Negative stock protection", description: "Prevent sales from reducing available inventory below zero.", kind: "toggle" },
  { title: "Storefront draft mode", description: "Keep storefront edits private until explicitly published.", kind: "toggle" },
  { title: "Storefront customer accounts", description: "Allow customers to create temporary accounts for order tracking.", kind: "toggle" },
  { title: "14-day customer session", description: "Keep temporary customer order-tracking access active for fourteen days.", kind: "toggle" },
  { title: "Search suggestions", description: "Show recent and suggested products while searching the catalogue.", kind: "toggle" },
  { title: "Compact tables", description: "Use denser rows for large product, customer and order lists.", kind: "toggle" },
  { title: "Reduced motion", description: "Reduce interface animation for accessibility and lower-powered devices.", kind: "toggle" },
  { title: "Email verification", description: "Require verified email addresses for merchant authentication.", kind: "toggle" },
  { title: "Session timeout", description: "Choose the inactivity period before a merchant session requires re-authentication.", kind: "select", options: ["30 minutes", "2 hours", "8 hours", "24 hours"] },
  { title: "Staff PIN policy", description: "Control minimum length and validation rules for staff PINs.", kind: "select", options: ["4–6 digits", "6 digits"] },
  { title: "Default staff role", description: "Role selected by default when starting a new staff account.", kind: "select", options: ["Cashier", "Sales", "Inventory", "Manager"] },
  { title: "Export format", description: "Preferred format for supported reports and data exports.", kind: "select", options: ["CSV", "XLSX"] },
  { title: "API access", description: "Manage API credentials for future integrations and automation.", kind: "action" },
  { title: "Webhook delivery", description: "Manage webhook endpoints and delivery history.", kind: "action" },
  { title: "Online payments", description: "Live merchant payment integration is intentionally held until tomorrow.", kind: "action", comingSoon: true },
  { title: "Custom domains", description: "Domain verification and automated domain publishing are intentionally held until tomorrow.", kind: "action", comingSoon: true },
  { title: "AI automation", description: "Future AI-powered workflows for inventory, insights and operations.", kind: "action", comingSoon: true },
];

function AdvancedSettingsPage() {
  const [values, setValues] = useState<Record<number, boolean>>(() => Object.fromEntries(SETTINGS.map((_, i) => [i, i < 8])));
  const [saved, setSaved] = useState(false);
  const save = () => { setSaved(true); window.setTimeout(() => setSaved(false), 2200); };
  return <div className="min-h-full bg-surface px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between"><div><Link to="/settings" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Settings</Link><p className="mt-5 text-label-caps text-accent-ink">Advanced control</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Advanced Settings</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A deeper control surface for merchants who want Strap tuned to their operation.</p></div><button onClick={save} className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-accent hover:text-accent-foreground"><Save className="size-4" />{saved ? "Saved" : "Save preferences"}</button></div>
    <div className="mt-8 grid gap-3 md:grid-cols-2">{SETTINGS.map((setting, index) => <section key={setting.title} className="rounded-2xl border border-border bg-background p-5"><div className="flex items-start justify-between gap-5"><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="font-semibold">{setting.title}</h2>{setting.comingSoon && <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent-ink"><Clock3 className="size-3" />Coming soon</span>}</div><p className="mt-1.5 text-sm leading-6 text-muted-foreground">{setting.description}</p></div>{setting.kind === "toggle" && !setting.comingSoon ? <button type="button" aria-pressed={!!values[index]} onClick={() => setValues(v => ({ ...v, [index]: !v[index] }))} className={`relative mt-1 h-6 w-11 shrink-0 rounded-full transition ${values[index] ? "bg-accent" : "bg-muted"}`}><span className={`absolute top-1 size-4 rounded-full bg-white shadow-sm transition ${values[index] ? "left-6" : "left-1"}`} /></button> : null}</div>{setting.kind === "select" && <select className="mt-4 w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent">{setting.options?.map(option => <option key={option}>{option}</option>)}</select>}{setting.kind === "action" && <div className="mt-4 flex items-center justify-between rounded-xl bg-secondary/50 px-3 py-2.5 text-xs text-muted-foreground">{setting.comingSoon ? <span>Held for tomorrow</span> : <span>Open management</span>}{setting.comingSoon ? <Lock className="size-4" /> : <ExternalLink className="size-4" />}</div>}</section>)}</div>
    <div className="mt-8 rounded-2xl border border-accent/20 bg-accent-soft p-5"><div className="flex gap-3"><Sparkles className="mt-0.5 size-5 shrink-0 text-accent-ink" /><div><p className="font-semibold">Strap control philosophy</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Every setting should make an actual workflow clearer, safer or faster. Payment integration and custom domains are deliberately locked while their production rollout is being completed.</p></div></div></div>
  </div></div>;
}
