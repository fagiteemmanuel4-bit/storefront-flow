import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { activeStoreCache } from "@/lib/active-store";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { errorMessage } from "@/lib/format";
import { BUSINESS_MODES, type BusinessModeKey } from "@/lib/business-modes";
import { getBusinessModeProfile } from "@/lib/business-mode-profiles";
import {
  ArrowLeft, ArrowRight, Check, Globe2, MapPin,
  MonitorSmartphone, ShoppingBag, Store, Wallet, Building2,
} from "lucide-react";
import "@/strap-onboarding.css";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your business — Strap" },
      { name: "description", content: "Create a workspace shaped around your business." },
    ],
  }),
  component: OnboardingPage,
});

type Plan = "free" | "business" | "pro";
type Billing = "month" | "year";
const PLANS: Record<Plan, { name: string; monthly: number; yearly: number; description: string; features: string[] }> = {
  free: { name: "Free", monthly: 0, yearly: 0, description: "Everything you need to get started.", features: ["Point of sale", "Product catalogue", "Basic inventory", "Customers"] },
  business: { name: "Business", monthly: 3000, yearly: 28800, description: "For businesses ready to grow.", features: ["Everything in Free", "Online store", "Staff & permissions", "Multiple branches", "Data export"] },
  pro: { name: "Pro", monthly: 5000, yearly: 48000, description: "More control for ambitious teams.", features: ["Everything in Business", "Advanced inventory", "Advanced reports", "More operational controls"] },
};
const TEAM_OPTIONS = ["Just me", "2–5 people", "6–20 people", "21–50 people", "51+ people"];
const GOAL_OPTIONS = ["Sell faster", "Keep inventory accurate", "Understand revenue and expenses", "Manage staff", "Open an online channel", "Run multiple locations"];
const STEP_TITLES = ["How do you do business?", "What kind of business is it?", "Where do you sell?", "Let’s create your workspace", "Choose your plan", "You’re almost ready"];
const STEP_COPY = [
  "First, let’s make Strap feel right for the way you work.",
  "We’ll tailor your workspace to your products and daily operations.",
  "You can connect an existing website or build your online store with Strap.",
  "Add the details your team will see across your workspace.",
  "Start with the plan that fits. You can change it at any time.",
  "Take a quick look. You can update these details later.",
];

function OnboardingIllustration({ step }: { step: number }) {
  const Icon = [Store, ShoppingBag, Globe2, Building2, Wallet, Check][step] ?? Store;
  return (
    <div className="ob-illustration" aria-hidden="true">
      <div className="ob-orbit ob-orbit-one" />
      <div className="ob-orbit ob-orbit-two" />
      <div className="ob-illustration-card">
        <span className="ob-illustration-icon"><Icon size={34} strokeWidth={1.7} /></span>
        <span className="ob-illustration-line ob-illustration-line-long" />
        <span className="ob-illustration-line ob-illustration-line-short" />
        <span className="ob-illustration-pill"><Check size={13} /> Built around you</span>
      </div>
      <span className="ob-float ob-float-a"><ShoppingBag size={18} /></span>
      <span className="ob-float ob-float-b"><Check size={18} /></span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="ob-field"><span>{label}</span>{children}</label>;
}

function Option({ selected, title, description, icon: Icon, onClick }: {
  selected: boolean; title: string; description: string; icon: typeof Store; onClick: () => void;
}) {
  return (
    <button type="button" className="ob-option" aria-pressed={selected} onClick={onClick}>
      <span className="ob-option-icon"><Icon size={21} /></span>
      <span className="ob-option-copy"><strong>{title}</strong><small>{description}</small></span>
      <span className="ob-option-check">{selected && <Check size={15} />}</span>
    </button>
  );
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
  const [businessMode, setBusinessMode] = useState<BusinessModeKey | "">("");
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
  const totalSteps = STEP_TITLES.length;

  useEffect(() => {
    if (!isLoading && !error && memberships.length > 0) void navigate({ to: "/pos", replace: true });
  }, [error, isLoading, memberships.length, navigate]);

  const selectedPlan = plan ? PLANS[plan] : null;
  const annualSaving = selectedPlan && selectedPlan.monthly > 0 ? selectedPlan.monthly * 12 - selectedPlan.yearly : 0;
  const priceLabel = selectedPlan
    ? selectedPlan.monthly === 0 ? "Free" : `₦${(billing === "year" ? selectedPlan.yearly : selectedPlan.monthly).toLocaleString()} / ${billing === "year" ? "year" : "month"}`
    : "";
  const canContinue = () => {
    if (step === 0) return Boolean(businessModel);
    if (step === 1) return businessType.trim().length >= 2 && Boolean(businessMode) && Boolean(goal);
    if (step === 2) return websiteStatus === "existing" ? /^https?:\/\//i.test(websiteUrl.trim()) : Boolean(websiteStatus);
    if (step === 3) return businessName.trim().length >= 2 && branchName.trim().length >= 1;
    if (step === 4) return Boolean(plan);
    return true;
  };

  async function finish() {
    if (!plan || !businessMode) return;
    setSubmitting(true);
    try {
      const profileResult = getBusinessModeProfile(businessMode);
      if (!profileResult.ok) throw new Error("The selected business profile is unavailable. Please choose another.");
      const selectedProfile = profileResult.profile;
      const { data: storeId, error: createError } = await supabase.rpc("create_store", {
        _name: businessName.trim(), _currency: currency, _branch_name: branchName.trim(), _tax_rate: Number(taxRate) || 0,
      });
      if (createError) throw new Error(createError.message);
      if (!storeId) throw new Error("Strap could not create your workspace.");
      const storefrontSettings = {
        onboarding: { version: 3, businessModel, businessType: businessType.trim(), businessMode, websiteStatus, websiteUrl: websiteUrl.trim(), onlineStoreEnabled, teamSize, goal, address: address.trim(), phone: phone.trim() },
        businessMode,
        businessModeProfile: { id: selectedProfile.id, version: selectedProfile.profileVersion, status: selectedProfile.status, runtimeReady: selectedProfile.runtimeReady },
        onlineStoreEnabled,
        externalWebsite: websiteStatus === "existing" ? websiteUrl.trim() : "",
      };
      const { error: storeError } = await supabase.from("stores").update({
        phone: phone.trim(), address: address.trim(), business_type: businessType.trim(), team_size: teamSize, business_goal: goal, storefront_settings: storefrontSettings,
      }).eq("id", storeId);
      if (storeError) throw new Error(storeError.message);
      const { error: subscriptionError } = await supabase.rpc("initialize_store_subscription", {
        _store_id: storeId, _plan_code: plan, _currency: currency, _interval: billing,
        _metadata: { selected_during_onboarding: true, billing, annual_saving: annualSaving },
      });
      if (subscriptionError) throw new Error(subscriptionError.message);
      if (onlineStoreEnabled && (plan === "business" || plan === "pro")) {
        const { error: onlineError } = await supabase.from("online_stores").upsert({
          store_id: storeId,
          slug: `${businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}-${String(storeId).slice(0, 6)}`,
          display_name: businessName.trim(), logo_url: "", display_email: "", display_phone: phone.trim(),
          description: "", shipping_note: "", checkout_note: "", is_published: false, setup_completed: false, updated_at: new Date().toISOString(),
        }, { onConflict: "store_id" });
        if (onlineError) throw new Error(onlineError.message);
      }
      activeStoreCache.setStoreId(storeId);
      activeStoreCache.setBranchId(null);
      setActiveStore(storeId);
      localStorage.setItem("strap-onboarding-complete", "1");
      localStorage.setItem("strap-welcome-tour-pending", "1");
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Your Strap workspace is ready.");
      void navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(errorMessage(err, "We couldn't finish your Strap setup."));
    } finally {
      setSubmitting(false);
    }
  }

  async function retryStoreLookup() {
    setChecking(true);
    try { await refresh(); } finally { setChecking(false); }
  }

  if (isLoading || error) return (
    <main className="strap-onboarding">
      <div className="ob-state">
        <span className={isLoading ? "ob-spinner" : "ob-state-icon"}>{!isLoading && "!"}</span>
        <h1>{isLoading ? "Getting things ready" : "We couldn’t check your workspace"}</h1>
        <p>{isLoading ? "Preparing a fresh space for your business…" : "Your account is safe. Strap could not load store access yet."}</p>
        {error && <button className="ob-primary" disabled={checking} onClick={() => void retryStoreLookup()}>{checking ? "Checking…" : "Try again"}</button>}
      </div>
    </main>
  );

  return (
    <main className="strap-onboarding">
      <div className="ob-shell">
        <header className="ob-topbar">
          <Link to="/" className="ob-brand" aria-label="Strap home"><span className="ob-brand-mark">s</span><span>strap</span></Link>
          <div className="ob-progress-wrap" aria-label={`Step ${step + 1} of ${totalSteps}`}>
            <span>{step + 1} <i>/ {totalSteps}</i></span>
            <div className="ob-progress"><i style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>
          </div>
          <span className="ob-top-note">BUSINESS SETUP</span>
        </header>

        <div className="ob-content">
          <section className="ob-story">
            <p className="ob-eyebrow">YOUR BUSINESS, YOUR WAY</p>
            <h1>{STEP_TITLES[step]}</h1>
            <p className="ob-intro">{STEP_COPY[step]}</p>
            <OnboardingIllustration step={step} />
            <div className="ob-story-foot"><span className="ob-live-dot" /> A simpler way to run your business</div>
          </section>

          <section className="ob-form-panel" aria-live="polite">
            <div className="ob-form-head">
              <span className="ob-step-count">STEP {String(step + 1).padStart(2, "0")}</span>
              <h2>{STEP_TITLES[step]}</h2>
              <p>{STEP_COPY[step]}</p>
            </div>

            <div className="ob-fields" key={step}>
              {step === 0 && (
                <div className="ob-options">
                  <Option selected={businessModel === "physical"} onClick={() => setBusinessModel("physical")} icon={Store} title="Physical business" description="A shop, office, studio, stall or local store." />
                  <Option selected={businessModel === "online"} onClick={() => setBusinessModel("online")} icon={MonitorSmartphone} title="Online business" description="Most of your sales happen on the internet." />
                  <Option selected={businessModel === "both"} onClick={() => setBusinessModel("both")} icon={Building2} title="Both physical and online" description="Manage every sales channel in one place." />
                </div>
              )}

              {step === 1 && (
                <>
                  <Field label="What does your business sell or provide?">
                    <input className="ob-input" value={businessType} onChange={e => setBusinessType(e.target.value)} placeholder="e.g. Fashion, groceries, electronics…" autoFocus />
                  </Field>
                  <Field label="Choose your business category">
                    <div className="ob-mode-grid">
                      {BUSINESS_MODES.map(mode => (
                        <button key={mode.key} type="button" className="ob-mode" aria-pressed={businessMode === mode.key} onClick={() => setBusinessMode(mode.key)}>
                          <span>{mode.label}</span><small>{mode.description}</small>{businessMode === mode.key && <Check size={16} />}
                        </button>
                      ))}
                    </div>
                  </Field>
                  <Field label="What matters most right now?">
                    <select className="ob-input" value={goal} onChange={e => setGoal(e.target.value)}>
                      <option value="">Choose your main goal</option>{GOAL_OPTIONS.map(x => <option key={x}>{x}</option>)}
                    </select>
                  </Field>
                  <Field label="How big is your team?">
                    <div className="ob-chip-list">{TEAM_OPTIONS.map(x => <button key={x} type="button" aria-pressed={teamSize === x} onClick={() => setTeamSize(x)}>{x}</button>)}</div>
                  </Field>
                </>
              )}

              {step === 2 && (
                <div className="ob-options">
                  <Option selected={websiteStatus === "existing"} onClick={() => { setWebsiteStatus("existing"); setOnlineStoreEnabled(false); }} icon={Globe2} title="I already have a website" description="Keep using your existing online store." />
                  {websiteStatus === "existing" && <Field label="Website address"><input className="ob-input" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://yourstore.com" inputMode="url" /></Field>}
                  <Option selected={websiteStatus === "strap"} onClick={() => { setWebsiteStatus("strap"); setOnlineStoreEnabled(true); }} icon={ShoppingBag} title="Build my store with Strap" description="Create an online storefront when your plan supports it." />
                  <Option selected={websiteStatus === "none"} onClick={() => { setWebsiteStatus("none"); setOnlineStoreEnabled(false); }} icon={MapPin} title="Not right now" description="I’ll focus on in-person sales for now." />
                  {websiteStatus !== "existing" && websiteStatus !== "" && (
                    <div className="ob-inline-toggle"><div><strong>Prepare my Strap online store</strong><small>You can finish publishing it later.</small></div><button type="button" role="switch" aria-checked={onlineStoreEnabled} onClick={() => setOnlineStoreEnabled(v => !v)} className="ob-switch" /></div>
                  )}
                </div>
              )}

              {step === 3 && (
                <>
                  <Field label="Business or store name"><input className="ob-input" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Your business name" autoFocus /></Field>
                  <Field label="First location name"><input className="ob-input" value={branchName} onChange={e => setBranchName(e.target.value)} placeholder="Main branch" /></Field>
                  <div className="ob-two-col">
                    <Field label="Business phone"><input className="ob-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="080…" inputMode="tel" /></Field>
                    <Field label="Currency"><select className="ob-input" value={currency} onChange={e => setCurrency(e.target.value)}>{SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>)}</select></Field>
                  </div>
                  <Field label="Business address (optional)"><input className="ob-input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area, city" /></Field>
                  <Field label="Default sales tax (%)"><input className="ob-input" type="number" min="0" max="100" step="0.01" value={taxRate} onChange={e => setTaxRate(e.target.value)} /></Field>
                </>
              )}

              {step === 4 && (
                <>
                  <div className="ob-billing" role="group" aria-label="Billing period">
                    <button type="button" aria-pressed={billing === "month"} onClick={() => setBilling("month")}>Monthly</button>
                    <button type="button" aria-pressed={billing === "year"} onClick={() => setBilling("year")}>Yearly <em>Save 20%</em></button>
                  </div>
                  <div className="ob-plan-list">
                    {(Object.keys(PLANS) as Plan[]).map(code => {
                      const p = PLANS[code];
                      const amount = billing === "year" ? p.yearly : p.monthly;
                      const saving = p.monthly ? Math.round((1 - p.yearly / (p.monthly * 12)) * 100) : 0;
                      return <button type="button" key={code} className="ob-plan-card" aria-pressed={plan === code} onClick={() => setPlan(code)}>
                        <span className="ob-plan-top"><strong>{p.name}</strong>{code === "business" && <em>POPULAR</em>}<span className="ob-plan-check">{plan === code && <Check size={15} />}</span></span>
                        <span className="ob-plan-price">{p.monthly === 0 ? "Free" : `₦${amount.toLocaleString()}`}<small>{p.monthly ? ` / ${billing === "year" ? "year" : "month"}` : " forever"}</small></span>
                        <span className="ob-plan-desc">{p.description}</span>
                        <span className="ob-plan-features">{p.features.map(f => <span key={f}><Check size={13} />{f}</span>)}</span>
                        {billing === "year" && saving > 0 && <small className="ob-saving">Save {saving}% annually</small>}
                      </button>;
                    })}
                  </div>
                  <p className="ob-footnote">Paid plans remain pending until payment is completed. Strap will never unlock paid features from an unpaid selection.</p>
                </>
              )}

              {step === 5 && (
                <>
                  <div className="ob-finish-card"><span className="ob-finish-icon"><Check size={28} /></span><p>YOUR WORKSPACE</p><h3>{businessName || "Your business"}</h3><span>{businessType} · {BUSINESS_MODES.find(m => m.key === businessMode)?.label}</span></div>
                  <div className="ob-review">
                    <div><small>Business model</small><strong>{businessModel === "both" ? "Physical + online" : businessModel === "online" ? "Online" : "Physical"}</strong></div>
                    <div><small>Online store</small><strong>{onlineStoreEnabled ? "Prepared" : websiteStatus === "existing" ? "Existing website" : "Not enabled"}</strong></div>
                    <div><small>Team size</small><strong>{teamSize}</strong></div>
                    <div><small>Selected plan</small><strong>{selectedPlan?.name} · {priceLabel}</strong></div>
                  </div>
                  <p className="ob-footnote">Your workspace will be created with these preferences. You can update most details later in Settings.</p>
                </>
              )}
            </div>

            <footer className="ob-actions">
              <button type="button" className="ob-back" disabled={step === 0 || submitting} onClick={() => setStep(s => Math.max(0, s - 1))}><ArrowLeft size={17} /> Back</button>
              {step < totalSteps - 1
                ? <button type="button" className="ob-primary" disabled={!canContinue()} onClick={() => setStep(s => s + 1)}>Continue <ArrowRight size={17} /></button>
                : <button type="button" className="ob-primary" disabled={!plan || submitting} onClick={() => void finish()}>{submitting ? "Creating workspace…" : "Create my workspace"} <ArrowRight size={17} /></button>}
            </footer>
            <p className="ob-privacy">Your business details stay private and secure.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
