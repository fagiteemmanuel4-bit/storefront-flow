import { createFileRoute, redirect } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Activity, BadgeDollarSign, Check, Globe2, Inbox, LoaderCircle, Megaphone, MessageSquare, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { PlatformAnnouncementsPanel } from "@/components/admin/PlatformAnnouncementsPanel";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const { data: allowed, error: adminError } = await (supabase as any).rpc("is_platform_admin");
    if (adminError || allowed !== true) throw redirect({ to: "/dashboard" });
  },
  component: PlatformAdminPage,
});

type Tab = "overview" | "users" | "subscriptions" | "feedback" | "support" | "pricing" | "announcements";
type AnyRow = Record<string, any>;
const money = (amount: number, currency = "NGN") => {
  try { return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(amount || 0)); }
  catch { return `${currency} ${Number(amount || 0).toLocaleString()}`; }
};
const date = (value?: string | null) => value ? new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "—";
const statusClass = (value: string) => value === "active" || value === "resolved" || value === "paid" ? "bg-emerald-50 text-emerald-700" : value === "new" || value === "past_due" || value === "failed" ? "bg-amber-50 text-amber-800" : "bg-secondary text-muted-foreground";

function PlatformAdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [data, setData] = useState<AnyRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [newCountry, setNewCountry] = useState({ country_code: "", country_name: "", currency: "", business_month: "", business_year: "", pro_month: "", pro_year: "" });

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    const { data: result, error } = await (supabase as any).rpc("platform_admin_dashboard");
    if (error) toast.error(error.message || "Could not load admin data.");
    else setData(result as AnyRow);
    setLoading(false); setRefreshing(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const stats = data?.stats ?? {};
  const filteredUsers = useMemo(() => (data?.users ?? []).filter((u: AnyRow) => `${u.email ?? ""} ${u.country ?? ""}`.toLowerCase().includes(search.toLowerCase())), [data?.users, search]);
  const filteredSubs = useMemo(() => (data?.subscriptions ?? []).filter((s: AnyRow) => `${s.store_name ?? ""} ${s.plan_code ?? ""} ${s.status ?? ""}`.toLowerCase().includes(search.toLowerCase())), [data?.subscriptions, search]);

  async function updateStatus(kind: "feedback" | "ticket", id: string, status: string) {
    setSaving(id);
    const fn = kind === "feedback" ? "platform_admin_update_feedback" : "platform_admin_update_ticket";
    const args = kind === "feedback" ? { _id: id, _status: status } : { _id: id, _status: status };
    const { error } = await (supabase as any).rpc(fn, args);
    if (error) toast.error(error.message || "Could not update status.");
    else { toast.success("Status updated."); await load(true); }
    setSaving(null);
  }

  async function savePrice(row: AnyRow) {
    const key = row.id;
    const amount = Number(priceDrafts[key] ?? row.amount);
    if (!Number.isFinite(amount) || amount < 0) { toast.error("Enter a valid non-negative price."); return; }
    setSaving(key);
    const { error } = await (supabase as any).rpc("platform_admin_upsert_price", {
      _country_code: row.country_code, _country_name: row.country_name, _currency: row.currency,
      _plan_code: row.plan_code, _billing_interval: row.billing_interval, _amount: amount, _is_active: row.is_active,
    });
    if (error) toast.error(error.message || "Could not save price.");
    else { toast.success("Price saved."); setPriceDrafts(current => { const next = { ...current }; delete next[key]; return next; }); await load(true); }
    setSaving(null);
  }

  async function addCountryPrices(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = newCountry.country_code.trim().toUpperCase();
    const currency = newCountry.currency.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(code) || !/^[A-Z]{3}$/.test(currency) || !newCountry.country_name.trim()) { toast.error("Enter a valid two-letter country code, country name and three-letter currency."); return; }
    const values = [
      ["business","month",newCountry.business_month],["business","year",newCountry.business_year],
      ["pro","month",newCountry.pro_month],["pro","year",newCountry.pro_year],
    ] as const;
    for (const [plan, interval, raw] of values) {
      const amount = Number(raw);
      if (raw.trim() === "" || !Number.isFinite(amount) || amount < 0) { toast.error("Enter all four valid prices before saving."); return; }
      setSaving(code);
      const { error } = await (supabase as any).rpc("platform_admin_upsert_price", {
        _country_code: code, _country_name: newCountry.country_name.trim(), _currency: currency,
        _plan_code: plan, _billing_interval: interval, _amount: amount, _is_active: true,
      });
      if (error) { toast.error(error.message || "Could not save country pricing."); setSaving(null); return; }
    }
    toast.success("Country pricing saved.");
    setNewCountry({ country_code: "", country_name: "", currency: "", business_month: "", business_year: "", pro_month: "", pro_year: "" });
    setSaving(null); await load(true);
  }

  const nav: { id: Tab; label: string; icon: typeof Activity }[] = [
    { id: "overview", label: "Overview", icon: Activity }, { id: "users", label: "Users", icon: Users },
    { id: "subscriptions", label: "Subscriptions", icon: BadgeDollarSign }, { id: "feedback", label: "Feedback", icon: MessageSquare },
    { id: "support", label: "Support inbox", icon: Inbox }, { id: "pricing", label: "Global pricing", icon: Globe2 },
    { id: "announcements", label: "Announcements", icon: Megaphone },
  ];

  if (loading) return <main className="grid min-h-screen place-items-center bg-background"><div className="flex items-center gap-3 text-sm text-muted-foreground"><LoaderCircle className="size-5 animate-spin"/>Loading private admin workspace…</div></main>;

  return <main className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-foreground text-background"><ShieldCheck className="size-5"/></div>
        <div className="min-w-0 flex-1"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Private workspace</p><h1 className="text-lg font-bold tracking-tight sm:text-xl">Strap Admin</h1></div>
        <button onClick={() => void load(true)} disabled={refreshing} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-secondary disabled:opacity-60"><RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`}/><span className="hidden sm:inline">Refresh</span></button>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.assign("/auth"); }} className="h-10 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-secondary">Sign out</button>
      </div>
    </header>
    <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8 lg:py-8">
      <aside className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
        {nav.map(item => <button key={item.id} onClick={() => { setTab(item.id); setSearch(""); }} className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${tab === item.id ? "bg-accent-soft text-accent-ink" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><item.icon className="size-[18px]"/>{item.label}</button>)}
        <div className="mt-auto hidden rounded-2xl border border-border bg-secondary/40 p-4 text-xs leading-5 text-muted-foreground lg:block"><ShieldCheck className="mb-2 size-5"/>Only explicitly allowlisted platform administrators can view this data. Store owners cannot access this workspace by default.</div>
      </aside>
      <section className="min-w-0">
        {tab === "overview" && <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent-ink">Platform overview</p><h2 className="mt-1 text-2xl font-bold tracking-tight">The business at a glance</h2><p className="mt-1 text-sm text-muted-foreground">Live totals from Strap’s connected database.</p></div><span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">Updated {new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</span></div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Metric icon={Users} label="Registered users" value={stats.registered_users ?? 0} note="All registered accounts"/>
            <Metric icon={Activity} label="Active users" value={stats.active_users_30d ?? 0} note="Signed in within 30 days"/>
            <Metric icon={Globe2} label="Stores" value={stats.stores ?? 0} note="Created workspaces"/>
            <Metric icon={BadgeDollarSign} label="Paid subscriptions" value={stats.paid_subscriptions ?? 0} note="Active or trialing paid plans"/>
            <Metric icon={Inbox} label="Open support" value={stats.open_support ?? 0} note="New or in-progress tickets"/>
            <Metric icon={MessageSquare} label="New feedback" value={stats.new_feedback ?? 0} note="Ratings and reports awaiting review"/>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            <Panel title="Recorded payment revenue" subtitle="Successful payment transactions, grouped by currency"><div className="divide-y divide-border">{(data?.revenue_by_currency ?? []).length ? data.revenue_by_currency.map((r: AnyRow) => <div key={r.currency} className="flex items-center justify-between gap-3 py-4"><div><p className="font-semibold">{r.currency}</p><p className="text-xs text-muted-foreground">{r.payments} successful payments</p></div><p className="text-xl font-bold tabular-nums">{money(r.amount,r.currency)}</p></div>) : <Empty text="No successful payment transactions have been recorded yet."/>}</div></Panel>
            <Panel title="Recent subscriptions" subtitle="Latest subscription records"><div className="space-y-3">{(data?.subscriptions ?? []).slice(0,5).map((s: AnyRow) => <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border p-3"><div className="flex size-10 items-center justify-center rounded-xl bg-secondary"><BadgeDollarSign className="size-5"/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{s.store_name}</p><p className="text-xs text-muted-foreground">{s.plan_code ?? "No plan"} · {s.interval}</p></div><div className="text-right"><p className="text-sm font-bold">{money(s.amount,s.currency)}</p><Status value={s.status}/></div></div>)}{!(data?.subscriptions ?? []).length && <Empty text="No subscription records yet."/>}</div></Panel>
          </div>
        </div>}

        {tab === "users" && <div className="space-y-4"><PageTitle title="User management" subtitle="Recent registered accounts and their last activity."/><SearchBox value={search} onChange={setSearch} placeholder="Search email or country"/><Panel title={`${filteredUsers.length} accounts shown`} subtitle="Latest 100 accounts"><div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-3 pr-4">Email</th><th className="py-3 pr-4">Country</th><th className="py-3 pr-4">Stores</th><th className="py-3 pr-4">Registered</th><th className="py-3">Last active</th></tr></thead><tbody>{filteredUsers.map((u: AnyRow) => <tr key={u.id} className="border-b border-border/70"><td className="py-3 pr-4 font-medium">{u.email || "No email"}</td><td className="py-3 pr-4">{u.country || "—"}</td><td className="py-3 pr-4">{u.store_count}</td><td className="py-3 pr-4">{date(u.created_at)}</td><td className="py-3">{date(u.last_sign_in_at)}</td></tr>)}</tbody></table>{!filteredUsers.length && <Empty text="No matching users."/>}</div></Panel></div>}

        {tab === "subscriptions" && <div className="space-y-4"><PageTitle title="Subscriptions & billing" subtitle="Review plan, payment state, provider and renewal date."/><SearchBox value={search} onChange={setSearch} placeholder="Search store, plan or status"/><Panel title="Subscription records" subtitle="Latest 100 subscriptions"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-3 pr-4">Store</th><th className="py-3 pr-4">Plan</th><th className="py-3 pr-4">Amount</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Provider</th><th className="py-3">Renewal</th></tr></thead><tbody>{filteredSubs.map((s: AnyRow) => <tr key={s.id} className="border-b border-border/70"><td className="py-3 pr-4 font-semibold">{s.store_name}</td><td className="py-3 pr-4 capitalize">{s.plan_code ?? "—"} · {s.interval}</td><td className="py-3 pr-4">{money(s.amount,s.currency)}</td><td className="py-3 pr-4"><Status value={s.status}/></td><td className="py-3 pr-4">{s.provider}</td><td className="py-3">{date(s.current_period_end)}</td></tr>)}</tbody></table>{!filteredSubs.length && <Empty text="No matching subscriptions."/>}</div></Panel></div>}

        {tab === "feedback" && <div className="space-y-4"><PageTitle title="Customer feedback" subtitle="Store ratings and reports submitted from storefronts."/><Panel title="Feedback inbox" subtitle="Review reports and ratings without exposing them to store customers"><div className="space-y-3">{(data?.feedback ?? []).map((f: AnyRow) => <article key={f.id} className="rounded-2xl border border-border p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{f.store_name}</h3><Status value={f.admin_status}/><span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold uppercase">{f.feedback_type}{f.rating ? ` · ${f.rating}/5` : ""}</span></div><p className="mt-1 text-xs text-muted-foreground">{f.contact_email || "No contact email"} · {date(f.created_at)}{f.reason ? ` · ${f.reason}` : ""}</p></div><select aria-label="Update feedback status" value={f.admin_status} disabled={saving===f.id} onChange={e=>void updateStatus("feedback",f.id,e.target.value)} className="field h-9 w-auto min-w-32 text-xs"><option value="new">New</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option><option value="dismissed">Dismissed</option></select></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{f.message || "No written comment."}</p></article>)}{!(data?.feedback ?? []).length && <Empty text="No customer feedback has arrived yet."/>}</div></Panel></div>}

        {tab === "support" && <div className="space-y-4"><PageTitle title="Support inbox" subtitle="Track customer complaints, billing questions and feature requests."/><Panel title="Support requests" subtitle="New tickets appear here once submitted by signed-in customers"><div className="space-y-3">{(data?.tickets ?? []).map((t: AnyRow) => <article key={t.id} className="rounded-2xl border border-border p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{t.subject}</h3><Status value={t.status}/><span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold uppercase">{t.category.replace("_"," ")}</span></div><p className="mt-1 text-xs text-muted-foreground">{t.contact_email || "No email"} · {date(t.created_at)}</p></div><select aria-label="Update support ticket status" value={t.status} disabled={saving===t.id} onChange={e=>void updateStatus("ticket",t.id,e.target.value)} className="field h-9 w-auto min-w-36 text-xs"><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{t.message}</p></article>)}{!(data?.tickets ?? []).length && <Empty text="Your support inbox is ready. It will show requests once the customer submission form is connected."/>}</div></Panel></div>}

        {tab === "pricing" && <div className="space-y-4"><PageTitle title="Global plan pricing" subtitle="Set the currency and prices for each country. Nigeria's current prices are preserved."/><Panel title="Current country prices" subtitle="Changes save to the pricing table; checkout currency must be supported by the payment provider before charging it."><div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left text-sm"><thead><tr className="border-b border-border text-xs text-muted-foreground"><th className="py-3 pr-3">Country</th><th className="py-3 pr-3">Plan</th><th className="py-3 pr-3">Billing</th><th className="py-3 pr-3">Currency</th><th className="py-3 pr-3">Price</th><th className="py-3">Action</th></tr></thead><tbody>{(data?.pricing ?? []).map((p: AnyRow) => <tr key={p.id} className="border-b border-border/70"><td className="py-3 pr-3">{p.country_name} <span className="text-xs text-muted-foreground">({p.country_code})</span></td><td className="py-3 pr-3 capitalize">{p.plan_code}</td><td className="py-3 pr-3 capitalize">{p.billing_interval}</td><td className="py-3 pr-3">{p.currency}</td><td className="py-3 pr-3"><input aria-label={`${p.country_name} ${p.plan_code} ${p.billing_interval} price`} type="number" min="0" step="0.01" value={priceDrafts[p.id] ?? String(p.amount)} onChange={e=>setPriceDrafts(v=>({...v,[p.id]:e.target.value}))} className="field h-9 w-32"/></td><td className="py-3"><button disabled={saving===p.id || priceDrafts[p.id]===undefined} onClick={()=>void savePrice(p)} className="inline-flex h-9 items-center gap-2 rounded-lg bg-foreground px-3 text-xs font-semibold text-background disabled:opacity-40">{saving===p.id?<LoaderCircle className="size-3 animate-spin"/>:<Check className="size-3"/>}Save</button></td></tr>)}</tbody></table></div></Panel>
          <Panel title="Add a country" subtitle="Enter real local prices. No currency conversion or exchange rate is guessed."><form onSubmit={addCountryPrices} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Field label="Country name"><input required value={newCountry.country_name} onChange={e=>setNewCountry(v=>({...v,country_name:e.target.value}))} placeholder="e.g. United States" className="field h-10"/></Field><Field label="Country code"><input required maxLength={2} value={newCountry.country_code} onChange={e=>setNewCountry(v=>({...v,country_code:e.target.value.toUpperCase()}))} placeholder="US" className="field h-10"/></Field><Field label="Currency code"><input required maxLength={3} value={newCountry.currency} onChange={e=>setNewCountry(v=>({...v,currency:e.target.value.toUpperCase()}))} placeholder="USD" className="field h-10"/></Field><div className="hidden xl:block"/>{(["business_month","business_year","pro_month","pro_year"] as const).map(key=><Field key={key} label={key.replace("_"," · ").replace("_"," ")}><input required min="0" type="number" step="0.01" value={newCountry[key]} onChange={e=>setNewCountry(v=>({...v,[key]:e.target.value}))} placeholder="0.00" className="field h-10"/></Field>)}<div className="sm:col-span-2 xl:col-span-4"><button disabled={saving!==null} className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-50">{saving?<LoaderCircle className="size-4 animate-spin"/>:<Globe2 className="size-4"/>}Save country pricing</button></div></form></Panel>
        </div>}
        {tab === "announcements" && <PlatformAnnouncementsPanel />}
      </section>
    </div>
  </main>;
}

function Metric({ icon: Icon, label, value, note }: { icon: typeof Activity; label: string; value: number; note: string }) { return <div className="rounded-2xl border border-border bg-surface p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{label}</p><span className="flex size-9 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-[18px]"/></span></div><p className="mt-4 text-3xl font-bold tracking-tight tabular-nums">{Number(value).toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div>; }
function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) { return <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5"><div className="mb-4"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{subtitle}</p></div>{children}</div>; }
function PageTitle({ title, subtitle }: { title: string; subtitle: string }) { return <div><h2 className="text-2xl font-bold tracking-tight">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{subtitle}</p></div>; }
function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) { return <label className="relative block max-w-md"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="field h-11 pl-9"/></label>; }
function Status({ value }: { value: string }) { return <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(value)}`}>{value.replace("_"," ")}</span>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</div>; }
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">{label}</span>{children}</label>; }
