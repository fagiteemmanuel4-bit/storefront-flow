import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  head: () => ({ meta: [
    { title: "Set up your shop — Strap" },
    { name: "description", content: "Build your Strap workspace around the way your business actually operates." },
  ] }),
  component: OnboardingPage,
});

type Plan = "free" | "business" | "pro";
type Billing = "month" | "year";
const PLANS: Record<Plan, { name: string; monthly: number; yearly: number; description: string; features: string[] }> = {
  free: { name: "Free", monthly: 0, yearly: 0, description: "The essentials for a small physical shop.", features: ["Point of sale", "Product catalogue", "Basic inventory", "Customers", "Basic sales history"] },
  business: { name: "Business", monthly: 3000, yearly: 28800, description: "For shops ready to operate across more channels.", features: ["Everything in Free", "Online store", "Staff & permissions", "Multiple branches", "Data export"] },
  pro: { name: "Pro", monthly: 5000, yearly: 48000, description: "For growing businesses that need deeper control.", features: ["Everything in Business", "Advanced inventory", "Advanced reports", "Priority features", "More operational controls"] },
};

function Choice({ selected, title, description, onClick, children }: { selected: boolean; title: string; description: string; onClick: () => void; children?: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn("w-full rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md", selected ? "border-foreground bg-foreground text-background shadow-lg" : "border-border bg-surface hover:border-foreground/20")}><div className="flex items-start gap-3"><span className={cn("mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl", selected ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground")}>{children}</span><span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className={cn("mt-1 block text-sm leading-5", selected ? "text-background/60" : "text-muted-foreground")}>{description}</span></span><span className={cn("mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-accent bg-accent text-accent-foreground" : "border-border")}>{selected && <Check className="size-3.5" />}</span></div></button>;
}

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberships, isLoading, error, refresh, setActiveStore } = useStoreContext();
  const [step, setStep] = useState(0);
  const [plan, setPlan] = useState<Plan | "">("");
  const [billing, setBilling] = useState<Billing>("month");
  const [businessModel, setBusinessModel] = useState<"physical" | "online" | "both" | "">("");
  const [websiteStatus, setWebsiteStatus] = useState<"existing" | "strap" | "none" | "">("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [onlineStoreEnabled, setOnlineStoreEnabled] = useState(false);
  const [businessType, setBusinessType] = useState("");
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
  const totalSteps = 7;

  useEffect(() => {
    if (!isLoading && !error && memberships.length > 0) void navigate({ to: "/pos", replace: true });
  }, [error, isLoading, memberships.length, navigate]);

  const selectedPlan = plan ? PLANS[plan] : null;
  const annualSaving = selectedPlan && selectedPlan.monthly > 0 ? selectedPlan.monthly * 12 - selectedPlan.yearly : 0;
  const priceLabel = selectedPlan ? selectedPlan.monthly === 0 ? "Free" : `₦${(billing === "year" ? selectedPlan.yearly : selectedPlan.monthly).toLocaleString()} / ${billing === "year" ? "year" : "month"}` : "";

  function canContinue() {
    if (step === 0) return Boolean(businessModel);
    if (step === 1) return businessType.trim().length >= 2;
    if (step === 2) return websiteStatus === "existing" ? /^https?:\/\//i.test(websiteUrl.trim()) : Boolean(websiteStatus);
    if (step === 3) return businessName.trim().length >= 2 && branchName.trim().length >= 1;
    if (step === 4) return Boolean(teamSize && goal && currency);
    if (step === 5) return Boolean(plan);
    return true;
  }

  async function retryStoreLookup() { setChecking(true); try { await refresh(); } finally { setChecking(false); } }

  async function finish() {
    if (!plan) { toast.error("Choose a Strap plan before continuing."); return; }
    setSubmitting(true);
    try {
      const { data: storeId, error: createError } = await supabase.rpc("create_store", { _name: businessName.trim(), _currency: currency, _branch_name: branchName.trim(), _tax_rate: Number(taxRate) || 0 });
      if (createError) throw new Error(createError.message);
      if (!storeId) throw new Error("Strap could not create your workspace.");

      const storefrontSettings = {
        onboarding: { version: 2, businessModel, businessType: businessType.trim(), websiteStatus, websiteUrl: websiteUrl.trim(), onlineStoreEnabled, teamSize, goal, address: address.trim(), phone: phone.trim() },
        onlineStoreEnabled,
        externalWebsite: websiteStatus === "existing" ? websiteUrl.trim() : "",
      };
      const { error: storeError } = await supabase.from("stores").update({ phone: phone.trim(), address: address.trim(), business_type: businessType.trim(), team_size: teamSize, business_goal: goal, storefront_settings: storefrontSettings }).eq("id", storeId);
      if (storeError) throw new Error(storeError.message);

      const amount = plan === "free" ? 0 : billing === "year" ? PLANS[plan].yearly : PLANS[plan].monthly;
      const { error: subscriptionError } = await supabase.from("store_subscriptions").upsert({ store_id: storeId, provider: "korapay", plan_code: plan, status: plan === "free" ? "active" : "pending", currency, amount, interval: billing, metadata: { selected_during_onboarding: true, billing, annual_saving: annualSaving }, updated_at: new Date().toISOString() }, { onConflict: "store_id" });
      if (subscriptionError) throw new Error(subscriptionError.message);

      if (onlineStoreEnabled && (plan === "business" || plan === "pro")) {
        const { error: onlineError } = await supabase.from("online_stores").upsert({ store_id: storeId, slug: `${businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}-${String(storeId).slice(0, 6)}`, display_name: businessName.trim(), logo_url: "", display_email: "", display_phone: phone.trim(), description: "", shipping_note: "", checkout_note: "", is_published: false, setup_completed: false, updated_at: new Date().toISOString() }, { onConflict: "store_id" });
        if (onlineError) throw new Error(onlineError.message);
      }

      activeStoreCache.setStoreId(storeId); activeStoreCache.setBranchId(null); setActiveStore(storeId);
      localStorage.setItem("strap-onboarding-complete", "1");
      localStorage.setItem("strap-welcome-tour-pending", "1");
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Your Strap workspace is ready.");
      void navigate({ to: "/dashboard", replace: true });
    } catch (createError) { toast.error(errorMessage(createError, "We couldn't finish your Strap setup.")); } finally { setSubmitting(false); }
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="text-center"><div className="mx-auto size-9 animate-spin rounded-full border-2 border-border border-t-foreground"/><p className="mt-4 text-sm text-muted-foreground">Preparing your workspace…</p></div></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="surface-card w-full max-w-lg p-7 text-center"><h1 className="font-display text-2xl font-bold">We couldn't check your workspace</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your account is safe. Strap could not load store access yet.</p><Button className="mt-6" disabled={checking} onClick={() => void retryStoreLookup()}>{checking ? "Checking…" : "Try again"}</Button></div></div>;

  const stepTitle = ["How will you use Strap?", "Tell us about the business", "How do you sell online?", "Give your workspace an identity", "How does the team operate?", "Choose your Strap plan", "Your setup is ready"][step];
  const stepDescription = ["We use this to shape your workspace, navigation and future recommendations.", "A little context lets Strap use better defaults for products, reports and workflows.", "Keep an existing website, build with Strap, or stay physical for now. You can change this later.", "These details become the foundation for your store profile and customer-facing identity.", "Tell Strap how the business works today so the workspace starts in the right shape.", "Choose one plan now. You can upgrade or change billing later from Settings.", "Review your choices before creating the workspace."][step];

  return <main className="min-h-screen bg-background text-foreground"><div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 sm:px-7 sm:py-8"><header className="flex items-center justify-between"><div className="flex items-center gap-2"><span className="flex size-9 items-center justify-center rounded-xl bg-foreground"><span className="size-3 rotate-45 rounded-[2px] bg-accent"/></span><span className="font-display text-lg font-bold">STRAP.</span></div><span className="text-xs font-semibold text-muted-foreground">Workspace setup</span></header><div className="mt-7 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-accent transition-all duration-500" style={{ width: `${((step + 1) / totalSteps) * 100}%` }}/></div><div className="grid flex-1 items-center py-10 lg:grid-cols-[.7fr_1.3fr] lg:gap-16"><aside className="hidden lg:block"><p className="text-label-caps text-accent-ink">Step {step + 1} of {totalSteps}</p><h1 className="mt-4 max-w-md font-display text-5xl font-bold leading-[.96] tracking-[-.05em]">{stepTitle}</h1><p className="mt-5 max-w-md text-base leading-7 text-muted-foreground">{stepDescription}</p><div className="mt-9 grid gap-2 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Check className="size-4 text-accent-ink"/>No code or technical setup</span><span className="flex items-center gap-2"><Check className="size-4 text-accent-ink"/>Change most choices later</span></div></aside><section className="mx-auto w-full max-w-2xl"><div className="mb-7 lg:hidden"><p className="text-label-caps text-accent-ink">Step {step + 1} of {totalSteps}</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight">{stepTitle}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{stepDescription}</p></div><div className="surface-card overflow-hidden"><div className="p-5 sm:p-7">
    {step === 0 && <div className="grid gap-3"><Choice selected={businessModel === "physical"} onClick={() => setBusinessModel("physical")} title="Physical business" description="I mainly sell from a shop, office, stall, studio or other physical location." ><Store className="size-5"/></Choice><Choice selected={businessModel === "online"} onClick={() => setBusinessModel("online")} title="Online business" description="Most of my sales happen online and I want Strap to support that workflow." ><Globe2 className="size-5"/></Choice><Choice selected={businessModel === "both"} onClick={() => setBusinessModel("both")} title="Physical + online" description="I sell in person and online and want one workspace for both." ><Building2 className="size-5"/></Choice></div>}
    {step === 1 && <div className="space-y-5"><div><Label htmlFor="business-type">What does the business sell or provide?</Label><Input id="business-type" className="mt-2 h-12" value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="Fashion, groceries, beauty, electronics, services…" autoFocus/></div><div><Label htmlFor="goal">What is the biggest reason you are using Strap?</Label><select id="goal" value={goal} onChange={e => setGoal(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Choose a primary goal</option>{["Sell faster", "Keep inventory accurate", "Understand revenue and expenses", "Manage staff", "Open an online channel", "Run multiple locations"].map(x=><option key={x}>{x}</option>)}</select></div><div><Label htmlFor="team">How large is the team today?</Label><select id="team" value={teamSize} onChange={e => setTeamSize(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm">{["Just me","2–5 people","6–20 people","21–50 people","51+ people"].map(x=><option key={x}>{x}</option>)}</select></div></div>}
    {step === 2 && <div className="space-y-3"><Choice selected={websiteStatus === "existing"} onClick={() => setWebsiteStatus("existing")} title="I already have a store website" description="Keep my existing website as the main customer-facing store."><Globe2 className="size-5"/></Choice>{websiteStatus === "existing" && <div className="rounded-2xl border border-border bg-secondary/40 p-4"><Label htmlFor="website">Existing store URL</Label><Input id="website" className="mt-2 h-12" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://myshop.com" inputMode="url"/></div>}<Choice selected={websiteStatus === "strap"} onClick={() => {setWebsiteStatus("strap");setOnlineStoreEnabled(true)}} title="I want to create my store with Strap" description="Use Strap's built-in online store when my plan supports it."><Store className="size-5"/></Choice><Choice selected={websiteStatus === "none"} onClick={() => {setWebsiteStatus("none");setOnlineStoreEnabled(false)}} title="Not yet" description="I am starting physical-first and may turn on online selling later."><MapPin className="size-5"/></Choice>{websiteStatus !== "existing" && <div className="mt-4 rounded-2xl border border-border bg-secondary/30 p-4"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Prepare Strap Online Store</p><p className="mt-1 text-xs leading-5 text-muted-foreground">You can keep this off and enable it later from Settings → Preferences → Strap Online Store.</p></div><Switch checked={onlineStoreEnabled} onCheckedChange={setOnlineStoreEnabled}/></div></div>}</div>}
    {step === 3 && <div className="space-y-5"><div><Label htmlFor="business-name">Business / store name</Label><Input id="business-name" className="mt-2 h-12" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your business name" autoFocus/></div><div><Label htmlFor="branch">First location name</Label><Input id="branch" className="mt-2 h-12" value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="Main branch"/></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="phone">Business phone</Label><Input id="phone" className="mt-2 h-12" value={phone} onChange={e => setPhone(e.target.value)} placeholder="080…" inputMode="tel"/></div><div><Label htmlFor="currency">Currency</Label><select id="currency" value={currency} onChange={e => setCurrency(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm">{SUPPORTED_CURRENCIES.map(c=><option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</option>)}</select></div></div><div><Label htmlFor="address">Business address</Label><Input id="address" className="mt-2 h-12" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area, city, state"/></div><div><Label htmlFor="tax">Default sales tax (%)</Label><Input id="tax" className="mt-2 h-12" value={taxRate} onChange={e => setTaxRate(e.target.value)} inputMode="decimal" placeholder="0"/></div></div>}
    {step === 4 && <div className="space-y-5"><div className="rounded-2xl border border-border bg-secondary/30 p-4"><div className="flex items-start gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Users className="size-5"/></span><div><p className="text-sm font-semibold">Operational profile</p><p className="mt-1 text-xs leading-5 text-muted-foreground">This helps Strap choose sensible defaults. You can refine the details later.</p></div></div></div><div><Label>How do you expect your team to work?</Label><div className="mt-2 grid gap-2 sm:grid-cols-2">{["Just me","2–5 people","6–20 people","21–50 people","51+ people"].map(x=><button key={x} type="button" onClick={()=>setTeamSize(x)} className={cn("rounded-xl border px-4 py-3 text-left text-sm font-semibold",teamSize===x?"border-foreground bg-foreground text-background":"border-border hover:bg-secondary")}>{x}</button>)}</div></div><div><Label htmlFor="goal2">Primary outcome</Label><select id="goal2" value={goal} onChange={e=>setGoal(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-sm"><option value="">Choose one</option>{["Sell faster","Keep inventory accurate","Understand revenue and expenses","Manage staff","Open an online channel","Run multiple locations"].map(x=><option key={x}>{x}</option>)}</select></div></div>}
    {step === 5 && <div><div className="mb-5 flex items-center justify-between rounded-2xl border border-border bg-secondary/40 p-2"><button type="button" onClick={()=>setBilling("month")} className={cn("flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold",billing === "month"?"bg-background shadow-sm":"text-muted-foreground")}>Monthly</button><button type="button" onClick={()=>setBilling("year")} className={cn("flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold",billing === "year"?"bg-background shadow-sm":"text-muted-foreground")}>Yearly <span className="ml-1 rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-accent-ink">Save 20%</span></button></div><div className="grid gap-3 lg:grid-cols-3">{(Object.keys(PLANS) as Plan[]).map(code=>{const p=PLANS[code];const yearlySave=p.monthly?Math.round((1-p.yearly/(p.monthly*12))*100):0;return <button type="button" key={code} onClick={()=>setPlan(code)} className={cn("rounded-2xl border p-4 text-left transition",plan===code?"border-foreground bg-foreground text-background shadow-lg":"border-border bg-surface hover:border-foreground/20")}>{code!=="free"&&<span className="inline-flex rounded-full bg-accent px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-accent-foreground">{code === "pro" ? "Most complete" : "For growing shops"}</span>}<p className="mt-3 font-display text-xl font-bold">{p.name}</p><p className="mt-2 min-h-10 text-xs leading-5 opacity-70">{p.description}</p><p className="mt-4 font-display text-2xl font-bold">{p.monthly===0?"Free":`₦${(billing === "year" ? p.yearly : p.monthly).toLocaleString()}`}<span className="text-xs font-medium opacity-60">/{billing === "year"?"year":"month"}</span></p><div className="mt-4 space-y-2">{p.features.map(f=><p key={f} className="flex gap-2 text-xs"><Check className="mt-0.5 size-3.5 shrink-0 text-accent"/>{f}</p>)}</div>{billing === "year"&&yearlySave>0&&<p className="mt-4 text-[11px] font-semibold text-accent">Save {yearlySave}% annually</p>}</button>})}</div><p className="mt-4 text-xs leading-5 text-muted-foreground">Paid plans are selected now and marked pending until the payment provider is connected. Strap never unlocks paid features from a pending payment.</p></div>}
    {step === 6 && <div className="space-y-4"><div className="rounded-2xl bg-foreground p-5 text-background"><p className="text-label-caps text-background/45">Ready to build</p><p className="mt-2 font-display text-2xl font-bold">{businessName || "Your business"}</p><p className="mt-1 text-sm text-background/55">{businessType || "Business"} · {businessModel === "both" ? "Physical + online" : businessModel === "online" ? "Online" : "Physical"}</p></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border p-4"><p className="text-xs text-muted-foreground">Plan</p><p className="mt-1 font-semibold">{selectedPlan?.name} · {priceLabel}</p></div><div className="rounded-2xl border border-border p-4"><p className="text-xs text-muted-foreground">Online store</p><p className="mt-1 font-semibold">{onlineStoreEnabled ? "Prepared" : "Off until you enable it"}</p></div></div><div className="rounded-2xl border border-border bg-accent-soft p-4 text-sm leading-6 text-accent-ink">After setup, Strap will take you into the workspace and give you a guided tour. You can revisit preferences and online-store controls any time.</div></div>}
  </div><div className="flex items-center justify-between border-t border-border bg-secondary/25 p-4 sm:px-7"><Button type="button" variant="ghost" disabled={step===0||submitting} onClick={()=>setStep(s=>Math.max(0,s-1))}><ArrowLeft className="size-4"/>Back</Button>{step<6?<Button type="button" disabled={!canContinue()} onClick={()=>setStep(s=>s+1)}>Continue<ArrowRight className="size-4"/></Button>:<Button type="button" disabled={submitting||!plan} onClick={()=>void finish()}>{submitting?"Creating workspace…":"Enter Strap"}<ArrowRight className="size-4"/></Button>}</div></div></section></div></div></main>;
}
