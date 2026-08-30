import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { activeStoreCache } from "@/lib/active-store";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Building2, Check, Globe2, MapPin, Store, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your shop — Strap" }, { name: "description", content: "Set up a clear Strap workspace for your business." }] }),
  component: OnboardingPage,
});

type Plan = "free" | "business" | "pro";
type Billing = "month" | "year";
const PLANS: Record<Plan, { name: string; monthly: number; yearly: number; description: string; features: string[] }> = {
  free: { name: "Free", monthly: 0, yearly: 0, description: "Core selling tools for getting started.", features: ["POS", "Products & inventory", "Customers", "Sales history"] },
  business: { name: "Business", monthly: 3000, yearly: 28800, description: "For shops ready to sell across channels.", features: ["Everything in Free", "Online store", "Staff & permissions", "Multiple branches"] },
  pro: { name: "Pro", monthly: 5000, yearly: 48000, description: "Deeper control for growing operations.", features: ["Everything in Business", "Advanced inventory", "Advanced reports", "Priority features"] },
};

function Choice({ selected, title, description, icon, onClick }: { selected: boolean; title: string; description: string; icon: ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={cn("w-full rounded-2xl border p-4 text-left transition hover:border-blue-300 hover:shadow-sm", selected ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500/20" : "border-border bg-white")}><span className="flex items-start gap-3"><span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", selected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-700")}>{icon}</span><span className="min-w-0 flex-1"><span className="block font-semibold text-slate-900">{title}</span><span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span></span><span className={cn("mt-1 flex size-5 items-center justify-center rounded-full border", selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300")}>{selected && <Check className="size-3"/>}</span></span></button>;
}

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberships, isLoading, error, refresh, setActiveStore } = useStoreContext();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<Plan>("free");
  const [billing, setBilling] = useState<Billing>("month");
  const [businessModel, setBusinessModel] = useState<"physical" | "online" | "both" | "">("");
  const [businessType, setBusinessType] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState<"existing" | "strap" | "none" | "">("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [onlineStoreEnabled, setOnlineStoreEnabled] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [branchName, setBranchName] = useState("Main branch");
  const [currency, setCurrency] = useState("NGN");
  const [taxRate, setTaxRate] = useState("0");
  const [teamSize, setTeamSize] = useState("Just me");
  const [goal, setGoal] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const totalSteps = 6;

  useEffect(() => { if (!isLoading && !error && memberships.length > 0) void navigate({ to: "/pos", replace: true }); }, [error, isLoading, memberships.length, navigate]);

  const titles = ["Choose your operating model", "Tell us what you sell", "Connect your online channel", "Create your business profile", "Set up the workspace", "Choose your plan"];
  const descriptions = ["Strap adapts the workspace around where your customers buy from you.", "This helps the product use sensible defaults for your catalogue and reports.", "Use an existing site, prepare Strap Online Store, or stay physical-first.", "These details become the foundation of your workspace.", "Set your team, business goal and register defaults.", "Start with the plan that fits today. You can change it later."];

  const canContinue = () => {
    if (step === 0) return Boolean(businessModel);
    if (step === 1) return businessType.trim().length >= 2;
    if (step === 2) return websiteStatus === "existing" ? /^https?:\/\//i.test(websiteUrl.trim()) : Boolean(websiteStatus);
    if (step === 3) return businessName.trim().length >= 2 && branchName.trim().length > 0;
    if (step === 4) return Boolean(teamSize && goal && currency);
    return true;
  };

  async function retry() { setChecking(true); try { await refresh(); } finally { setChecking(false); } }

  async function finish() {
    setSubmitting(true);
    try {
      const { data: storeId, error: createError } = await supabase.rpc("create_store", { _name: businessName.trim(), _currency: currency, _branch_name: branchName.trim(), _tax_rate: Number(taxRate) || 0 });
      if (createError) throw new Error(createError.message);
      if (!storeId) throw new Error("Strap could not create your workspace.");
      const settings = { onboarding: { version: 3, businessModel, businessType: businessType.trim(), websiteStatus, websiteUrl: websiteUrl.trim(), onlineStoreEnabled, teamSize, goal, address: address.trim(), phone: phone.trim() }, onlineStoreEnabled, externalWebsite: websiteStatus === "existing" ? websiteUrl.trim() : "" };
      const { error: storeError } = await supabase.from("stores").update({ phone: phone.trim(), address: address.trim(), business_type: businessType.trim(), team_size: teamSize, business_goal: goal, storefront_settings: settings }).eq("id", storeId);
      if (storeError) throw new Error(storeError.message);
      const amount = plan === "free" ? 0 : billing === "year" ? PLANS[plan].yearly : PLANS[plan].monthly;
      const { error: subscriptionError } = await supabase.from("store_subscriptions").upsert({ store_id: storeId, provider: "korapay", plan_code: plan, status: plan === "free" ? "active" : "pending", currency, amount, interval: billing, metadata: { selected_during_onboarding: true, billing }, updated_at: new Date().toISOString() }, { onConflict: "store_id" });
      if (subscriptionError) throw new Error(subscriptionError.message);
      if (onlineStoreEnabled && (plan === "business" || plan === "pro")) {
        const slug = `${businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}-${String(storeId).slice(0, 6)}`;
        const { error: onlineError } = await supabase.from("online_stores").upsert({ store_id: storeId, slug, display_name: businessName.trim(), logo_url: "", display_email: "", display_phone: phone.trim(), description: "", shipping_note: "", checkout_note: "", is_published: false, setup_completed: false, updated_at: new Date().toISOString() }, { onConflict: "store_id" });
        if (onlineError) throw new Error(onlineError.message);
      }
      activeStoreCache.setStoreId(storeId); activeStoreCache.setBranchId(null); setActiveStore(storeId);
      localStorage.setItem("strap-onboarding-complete", "1"); localStorage.setItem("strap-welcome-tour-pending", "1");
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Your Strap workspace is ready.");
      void navigate({ to: "/dashboard", replace: true });
    } catch (e) { toast.error(errorMessage(e, "We couldn't finish your setup.")); } finally { setSubmitting(false); }
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc]"><div className="text-center"><div className="mx-auto size-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600"/><p className="mt-4 text-sm text-slate-500">Preparing your workspace…</p></div></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center bg-[#f7f9fc] px-4"><div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm"><h1 className="text-2xl font-bold text-slate-900">We couldn't check your workspace</h1><p className="mt-3 text-sm leading-6 text-slate-500">Your account is safe. Strap could not load store access yet.</p><Button className="mt-6" disabled={checking} onClick={() => void retry()}>{checking ? "Checking…" : "Try again"}</Button></div></div>;

  return <main className="min-h-screen bg-[#f7f9fc] text-slate-900"><div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-7 sm:py-8"><header className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-lg bg-blue-600 shadow-sm"><span className="size-3 rotate-45 rounded-[2px] bg-white"/></span><span className="font-display text-lg font-bold tracking-tight">STRAP.</span></div><span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">Workspace setup</span></header><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${((step + 1) / totalSteps) * 100}%` }}/></div><div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-16"><aside className="hidden lg:block"><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">Step {step + 1} of {totalSteps}</p><h1 className="mt-4 max-w-md font-display text-5xl font-bold leading-[.98] tracking-[-.04em] text-slate-950">{titles[step]}</h1><p className="mt-5 max-w-md text-base leading-7 text-slate-500">{descriptions[step]}</p><div className="mt-9 grid gap-3 text-sm text-slate-600"><span className="flex items-center gap-2"><Check className="size-4 text-blue-600"/>No technical setup</span><span className="flex items-center gap-2"><Check className="size-4 text-blue-600"/>Change settings later</span><span className="flex items-center gap-2"><Check className="size-4 text-blue-600"/>Your data stays in your workspace</span></div></aside><section className="mx-auto w-full max-w-2xl"><div className="mb-7 lg:hidden"><p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">Step {step + 1} of {totalSteps}</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-950">{titles[step]}</h1><p className="mt-2 text-sm leading-6 text-slate-500">{descriptions[step]}</p></div><div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,35,65,.07)]"><div className="p-5 sm:p-7">
{step === 0 && <div className="grid gap-3"><Choice selected={businessModel === "physical"} onClick={() => setBusinessModel("physical")} title="Physical business" description="Shop, office, stall, studio or another physical location." icon={<Store className="size-5"/>}/><Choice selected={businessModel === "online"} onClick={() => setBusinessModel("online")} title="Online business" description="Most customers buy from me online." icon={<Globe2 className="size-5"/>}/><Choice selected={businessModel === "both"} onClick={() => setBusinessModel("both")} title="Physical + online" description="I sell in person and online." icon={<Building2 className="size-5"/>}/></div>}
{step === 1 && <div className="space-y-5"><div><Label htmlFor="business-type">What does the business sell or provide?</Label><Input id="business-type" className="mt-2 h-12" value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="Fashion, groceries, beauty, electronics, services…" autoFocus/></div><div><Label htmlFor="goal">What should Strap help with first?</Label><select id="goal" value={goal} onChange={e => setGoal(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Choose a primary goal</option>{["Sell faster","Keep inventory accurate","Understand revenue and expenses","Manage staff","Open an online channel","Run multiple locations"].map(x => <option key={x}>{x}</option>)}</select></div><div><Label htmlFor="team">Team size</Label><select id="team" value={teamSize} onChange={e => setTeamSize(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{["Just me","2–5 people","6–20 people","21–50 people","51+ people"].map(x => <option key={x}>{x}</option>)}</select></div></div>}
{step === 2 && <div className="space-y-3"><Choice selected={websiteStatus === "existing"} onClick={() => setWebsiteStatus("existing")} title="I already have a website" description="Keep my existing customer-facing site." icon={<Globe2 className="size-5"/>}/>{websiteStatus === "existing" && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4"><Label htmlFor="website">Store URL</Label><Input id="website" className="mt-2 h-12" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://myshop.com" inputMode="url"/></div>}<Choice selected={websiteStatus === "strap"} onClick={() => { setWebsiteStatus("strap"); setOnlineStoreEnabled(true); }} title="Build with Strap" description="Prepare a shareable online store connected to your catalogue." icon={<Store className="size-5"/>}/><Choice selected={websiteStatus === "none"} onClick={() => { setWebsiteStatus("none"); setOnlineStoreEnabled(false); }} title="Not yet" description="Start physical-first and enable online selling later." icon={<MapPin className="size-5"/>}/>{websiteStatus !== "existing" && <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Prepare Strap Online Store</p><p className="mt-1 text-xs leading-5 text-slate-500">You can publish it later from Online Store.</p></div><Switch checked={onlineStoreEnabled} onCheckedChange={setOnlineStoreEnabled}/></div></div>}</div>}
{step === 3 && <div className="space-y-5"><div><Label htmlFor="business-name">Business / store name</Label><Input id="business-name" className="mt-2 h-12" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your business name" autoFocus/></div><div><Label htmlFor="branch">First location</Label><Input id="branch" className="mt-2 h-12" value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="Main branch"/></div><div><Label htmlFor="phone">Business phone</Label><Input id="phone" className="mt-2 h-12" value={phone} onChange={e => setPhone(e.target.value)} placeholder="080…" inputMode="tel"/></div><div><Label htmlFor="address">Business address</Label><Input id="address" className="mt-2 h-12" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area, city, state"/></div></div>}
{step === 4 && <div className="space-y-5"><div><Label>How does the team work?</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{["Just me","2–5 people","6–20 people","21–50 people","51+ people"].map(x => <button key={x} type="button" onClick={() => setTeamSize(x)} className={cn("rounded-xl border px-4 py-3 text-left text-sm font-semibold transition", teamSize === x ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 hover:bg-slate-50")}>{x}</button>)}</div></div><div><Label htmlFor="currency">Currency</Label><select id="currency" value={currency} onChange={e => setCurrency(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>)}</select></div><div><Label htmlFor="tax">Default sales tax (%)</Label><Input id="tax" className="mt-2 h-12" value={taxRate} onChange={e => setTaxRate(e.target.value)} inputMode="decimal" placeholder="0"/></div></div>}
{step === 5 && <div><div className="mb-5 grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1"><button type="button" onClick={() => setBilling("month")} className={cn("rounded-lg px-3 py-2.5 text-sm font-semibold", billing === "month" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Monthly</button><button type="button" onClick={() => setBilling("year")} className={cn("rounded-lg px-3 py-2.5 text-sm font-semibold", billing === "year" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Yearly · save 20%</button></div><div className="grid gap-3 lg:grid-cols-3">{(Object.keys(PLANS) as Plan[]).map(code => { const p = PLANS[code]; const price = billing === "year" ? p.yearly : p.monthly; return <button type="button" key={code} onClick={() => setPlan(code)} className={cn("rounded-2xl border p-4 text-left transition", plan === code ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/20" : "border-slate-200 hover:border-blue-200")}><p className="font-display text-xl font-bold text-slate-900">{p.name}</p><p className="mt-2 min-h-10 text-xs leading-5 text-slate-500">{p.description}</p><p className="mt-4 font-display text-2xl font-bold text-slate-950">{price === 0 ? "Free" : `₦${price.toLocaleString()}`}<span className="text-xs font-medium text-slate-500">/{billing === "year" ? "year" : "month"}</span></p><div className="mt-4 space-y-2">{p.features.map(f => <p key={f} className="flex gap-2 text-xs text-slate-600"><Check className="mt-0.5 size-3.5 shrink-0 text-blue-600"/>{f}</p>)}</div></button>; })}</div></div>}
</div><div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 p-4 sm:px-7"><Button type="button" variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep(s => Math.max(0, s - 1))}><ArrowLeft/>Back</Button>{step < totalSteps - 1 ? <Button type="button" disabled={!canContinue()} onClick={() => setStep(s => s + 1)}>Continue<ArrowRight/></Button> : <Button type="button" disabled={submitting} onClick={() => void finish()}>{submitting ? "Creating workspace…" : "Enter Strap"}<ArrowRight/></Button>}</div></div></section></div></div></main>;
}
