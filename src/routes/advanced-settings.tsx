import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Search, Settings2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/advanced-settings")({ component: AdvancedSettingsPage });

type Setting = { id: string; name: string; description: string; category: string; kind: "toggle" | "select"; options?: string[]; defaultValue: boolean | string };

const SETTINGS: Setting[] = [
  { id: "low_stock_alerts", name: "Low-stock alerts", description: "Warn staff when inventory reaches a low threshold.", category: "Inventory", kind: "toggle", defaultValue: true },
  { id: "negative_stock", name: "Allow negative stock", description: "Allow sales to continue when available stock reaches zero.", category: "Inventory", kind: "toggle", defaultValue: false },
  { id: "stock_history", name: "Stock history", description: "Keep a detailed history of inventory adjustments.", category: "Inventory", kind: "toggle", defaultValue: true },
  { id: "branch_inventory", name: "Branch-aware inventory", description: "Keep stock quantities separated by business location.", category: "Inventory", kind: "toggle", defaultValue: true },
  { id: "inventory_valuation", name: "Inventory valuation", description: "Show valuation information where supported.", category: "Inventory", kind: "toggle", defaultValue: false },
  { id: "receipt_printing", name: "Receipt printing", description: "Enable receipt printing controls in POS workflows.", category: "POS & Sales", kind: "toggle", defaultValue: true },
  { id: "receipt_tax", name: "Show tax on receipts", description: "Display tax totals on customer receipts.", category: "POS & Sales", kind: "toggle", defaultValue: true },
  { id: "quick_sale", name: "Quick sale mode", description: "Optimise POS for fast repeat transactions.", category: "POS & Sales", kind: "toggle", defaultValue: false },
  { id: "discounts", name: "Discount controls", description: "Allow authorised staff to apply discounts.", category: "POS & Sales", kind: "toggle", defaultValue: true },
  { id: "customer_accounts", name: "Customer accounts", description: "Allow customers to maintain an account on supported storefronts.", category: "Customers", kind: "toggle", defaultValue: true },
  { id: "guest_checkout", name: "Guest checkout", description: "Let customers place orders without creating an account.", category: "Customers", kind: "toggle", defaultValue: true },
  { id: "order_notes", name: "Order notes", description: "Allow customers to attach notes to orders.", category: "Orders", kind: "toggle", defaultValue: true },
  { id: "order_status", name: "Customer order status", description: "Show order progress to customers where supported.", category: "Orders", kind: "toggle", defaultValue: true },
  { id: "staff_pins", name: "Staff PIN protection", description: "Require a staff PIN for sensitive POS actions.", category: "Security", kind: "toggle", defaultValue: false },
  { id: "session_timeout", name: "Automatic session timeout", description: "Protect unattended staff sessions.", category: "Security", kind: "select", options: ["15 minutes", "30 minutes", "1 hour", "4 hours", "Never"], defaultValue: "1 hour" },
  { id: "email_verification", name: "Require email verification", description: "Require verified email addresses for new accounts.", category: "Security", kind: "toggle", defaultValue: true },
  { id: "audit_log", name: "Activity audit log", description: "Record important account and staff actions.", category: "Security", kind: "toggle", defaultValue: true },
  { id: "storefront_drafts", name: "Storefront drafts", description: "Keep unpublished storefront changes separate from the live store.", category: "Storefront", kind: "toggle", defaultValue: true },
  { id: "store_search", name: "Store search", description: "Enable product search on the storefront.", category: "Storefront", kind: "toggle", defaultValue: true },
  { id: "store_reviews", name: "Product reviews", description: "Enable the review surface when the reviews system is available.", category: "Storefront", kind: "toggle", defaultValue: false },
  { id: "reduced_motion", name: "Reduced motion", description: "Prefer calmer storefront animations for visitors.", category: "Storefront", kind: "toggle", defaultValue: false },
  { id: "seo_indexing", name: "Search engine indexing", description: "Allow public storefront pages to be indexed where eligible.", category: "SEO & Growth", kind: "toggle", defaultValue: true },
  { id: "social_previews", name: "Social previews", description: "Use storefront metadata for link previews.", category: "SEO & Growth", kind: "toggle", defaultValue: true },
  { id: "newsletter", name: "Newsletter capture", description: "Show newsletter capture components when configured.", category: "SEO & Growth", kind: "toggle", defaultValue: false },
  { id: "analytics", name: "Analytics", description: "Enable supported storefront analytics hooks.", category: "SEO & Growth", kind: "toggle", defaultValue: false },
  { id: "csv_exports", name: "CSV exports", description: "Allow authorised users to export supported store data.", category: "Data & Integrations", kind: "toggle", defaultValue: true },
  { id: "api_access", name: "API access", description: "Developer API access is planned for a future release.", category: "Data & Integrations", kind: "toggle", defaultValue: false },
  { id: "webhooks", name: "Webhooks", description: "Event webhooks are planned for a future release.", category: "Data & Integrations", kind: "toggle", defaultValue: false },
  { id: "ai_automation", name: "AI automation", description: "Automation controls will become available in a future release.", category: "Automation", kind: "toggle", defaultValue: false },
  { id: "temporary_sessions", name: "Temporary 14-day sessions", description: "Allow temporary order-tracking accounts where the workflow supports them.", category: "Automation", kind: "toggle", defaultValue: false },
];

const STORAGE_KEY = "strap-advanced-settings-v1";

function AdvancedSettingsPage() {
  const defaults = useMemo(() => Object.fromEntries(SETTINGS.map((s) => [s.id, s.defaultValue])), []);
  const [values, setValues] = useState<Record<string, boolean | string>>(defaults);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setValues({ ...defaults, ...JSON.parse(raw) });
    } catch { /* keep defaults */ }
  }, [defaults]);

  const categories = ["All", ...Array.from(new Set(SETTINGS.map((s) => s.category)))];
  const visible = SETTINGS.filter((s) => (category === "All" || s.category === category) && `${s.name} ${s.description}`.toLowerCase().includes(query.toLowerCase()));

  function update(id: string, value: boolean | string) {
    setValues((current) => ({ ...current, [id]: value }));
    setSaved(false);
  }

  function save() {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
    setSaved(true);
    toast.success("Advanced settings saved");
  }

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4"><div className="flex items-center gap-3"><Link to="/settings" className="rounded-lg p-2 hover:bg-muted"><ArrowLeft className="size-4" /></Link><div><div className="flex items-center gap-2 font-semibold"><Settings2 className="size-4" /> Advanced settings</div><p className="text-xs text-muted-foreground">Fine-tune how your Strap workspace behaves.</p></div></div><Button onClick={save} className="rounded-xl">{saved ? <Check className="mr-2 size-4" /> : null}{saved ? "Saved" : "Save changes"}</Button></div></header>
    <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[240px_1fr]">
      <aside className="hidden lg:block"><div className="sticky top-24"><p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</p><div className="space-y-1">{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${category === item ? "bg-muted font-semibold" : "text-muted-foreground hover:bg-muted/60"}`}>{item}</button>)}</div></div></aside>
      <section className="min-w-0"><div className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"><div className="flex items-start gap-4"><div className="rounded-2xl bg-muted p-3"><Sparkles className="size-5" /></div><div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Strap workspace</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Advanced controls</h1><p className="mt-2 max-w-2xl leading-6 text-muted-foreground">30 controls for inventory, POS, customers, security, storefront behaviour, SEO, integrations and automation. Features marked as planned stay disabled until they are actually available.</p></div></div><div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm"><ShieldCheck className="size-4" /><span>Changes are stored for this browser in this release. Production account sync will be enabled when the settings schema is connected.</span></div></div>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search settings…" className="pl-9" /></div><select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm lg:hidden">{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="space-y-6">{categories.filter((c) => c !== "All" && visible.some((s) => s.category === c)).map((group) => <div key={group}><h2 className="mb-2 text-sm font-semibold text-muted-foreground">{group}</h2><div className="divide-y divide-border rounded-2xl border border-border bg-card">{visible.filter((s) => s.category === group).map((setting) => <div key={setting.id} className="flex items-center justify-between gap-5 p-5"><div className="min-w-0"><h3 className="font-semibold">{setting.name}{["api_access", "webhooks", "ai_automation"].includes(setting.id) ? <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Coming soon</span> : null}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{setting.description}</p></div>{setting.kind === "toggle" ? <button aria-label={setting.name} onClick={() => update(setting.id, !values[setting.id])} className={`relative h-6 w-11 shrink-0 rounded-full transition ${values[setting.id] ? "bg-foreground" : "bg-muted-foreground/30"}`}><span className={`absolute top-1 size-4 rounded-full bg-background transition ${values[setting.id] ? "left-6" : "left-1"}`} /></button> : <select value={String(values[setting.id])} onChange={(e) => update(setting.id, e.target.value)} className="h-10 shrink-0 rounded-lg border border-input bg-background px-3 text-sm">{setting.options?.map((option) => <option key={option}>{option}</option>)}</select>}</div>)}</div></div>)}</div>
        {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">No settings match your search.</div> : null}
      </section>
    </div>
  </main>;
}
