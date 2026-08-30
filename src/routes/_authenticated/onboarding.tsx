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
  head: () => ({
    meta: [
      { title: "Set up your shop — Strap" },
      { name: "description", content: "Build your Strap workspace around the way your business actually operates." },
    ],
  }),
  component: OnboardingPage,
});

type Plan = "free" | "business" | "pro";
type Billing = "month" | "year";

const PLANS: Record<Plan, { name: string; monthly: number; yearly: number; description: string; features: string[] }> = {
  free: {
    name: "Free",
    monthly: 0,
    yearly: 0,
    description: "The essentials for a small physical shop.",
    features: ["Point of sale", "Product catalogue", "Basic inventory", "Customers", "Sales history"],
  },
  business: {
    name: "Business",
    monthly: 3000,
    yearly: 28800,
    description: "For shops ready to operate across more channels.",
    features: ["Everything in Free", "Online store", "Staff & permissions", "Multiple branches", "Data export"],
  },
  pro: {
    name: "Pro",
    monthly: 5000,
    yearly: 48000,
    description: "For growing businesses that need deeper control.",
    features: ["Everything in Business", "Advanced inventory", "Advanced reports", "Priority features", "More operational controls"],
  },
};

function StrapMark() {
  return (
    <span className="flex size-9 items-center justify-center rounded-[10px] bg-blue-600 shadow-[0_6px_18px_rgba(37,99,235,.18)]">
      <span className="size-3.5 rotate-45 rounded-[2px] bg-white" />
    </span>
  );
}

function Choice({
  selected,
  title,
  description,
  icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-sm",
        selected ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/15" : "border-slate-200 bg-white hover:border-blue-200",
      )}
    >
      <span className="flex items-start gap-3">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500")}>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-slate-950">{title}</span>
          <span className="mt-1 block text-sm leading-5 text-slate-500">{description}</span>
        </span>
        <span className={cn("mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border", selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300")}>{selected && <Check className="size-3" />}</span>
      </span>
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
  const titles = [
    "How will you use Strap?",
    "Tell us about the business",
    "How do you sell online?",
    "Create your business profile",
    "Set up your workspace",
    "Choose your plan",
  ];
  const descriptions = [
    "Strap adapts the workspace around where customers buy from you.",
    "A little context lets Strap choose better defaults for products and reports.",
    "Use an existing website, prepare Strap Online Store, or stay physical-first.",
    "These details become the foundation of your workspace.",
    "Tell Strap how your team works and what you need to achieve first.",
    "Start with the plan that fits today. You can change it later.",
  ];

  useEffect(() => {
    if (!isLoading && !error && memberships.length > 0) {
      void navigate({ to: "/pos", replace: true });
    }
  }, [error, isLoading, memberships.length, navigate]);

  const selectedPlan = plan ? PLANS[plan] : null;
  const annualSaving = selectedPlan && selectedPlan.monthly > 0 ? selectedPlan.monthly * 12 - selectedPlan.yearly : 0;

  const canContinue = () => {
    if (step === 0) return Boolean(businessModel);
    if (step === 1) return businessType.trim().length >= 2;
    if (step === 2) return websiteStatus === "existing" ? /^https?:\/\//i.test(websiteUrl.trim()) : Boolean(websiteStatus);
    if (step === 3) return businessName.trim().length >= 2 && branchName.trim().length >= 1;
    if (step === 4) return Boolean(teamSize && goal && currency);
    return Boolean(plan);
  };

  async function retryStoreLookup() {
    setChecking(true);
    try {
      await refresh();
    } finally {
      setChecking(false);
    }
  }

  async function finish() {
    if (!plan) {
      toast.error("Choose a Strap plan before continuing.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: storeId, error: createError } = await supabase.rpc("create_store", {
        _name: businessName.trim(),
        _currency: currency,
        _branch_name: branchName.trim(),
        _tax_rate: Number(taxRate) || 0,
      });
      if (createError) throw new Error(createError.message);
      if (!storeId) throw new Error("Strap could not create your workspace.");

      const storefrontSettings = {
        onboarding: {
          version: 4,
          businessModel,
          businessType: businessType.trim(),
          websiteStatus,
          websiteUrl: websiteUrl.trim(),
          onlineStoreEnabled,
          teamSize,
          goal,
          address: address.trim(),
          phone: phone.trim(),
        },
        onlineStoreEnabled,
        externalWebsite: websiteStatus === "existing" ? websiteUrl.trim() : "",
      };

      const { error: storeError } = await supabase
        .from("stores")
        .update({
          phone: phone.trim(),
          address: address.trim(),
          business_type: businessType.trim(),
          team_size: teamSize,
          business_goal: goal,
          storefront_settings: storefrontSettings,
        })
        .eq("id", storeId);
      if (storeError) throw new Error(storeError.message);

      const amount = plan === "free" ? 0 : billing === "year" ? PLANS[plan].yearly : PLANS[plan].monthly;
      const { error: subscriptionError } = await supabase.from("store_subscriptions").upsert(
        {
          store_id: storeId,
          provider: "korapay",
          plan_code: plan,
          status: plan === "free" ? "active" : "pending",
          currency,
          amount,
          interval: billing,
          metadata: { selected_during_onboarding: true, billing, annual_saving: annualSaving },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" },
      );
      if (subscriptionError) throw new Error(subscriptionError.message);

      if (onlineStoreEnabled && (plan === "business" || plan === "pro")) {
        const slug = `${businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}-${String(storeId).slice(0, 6)}`;
        const { error: onlineError } = await supabase.from("online_stores").upsert(
          {
            store_id: storeId,
            slug,
            display_name: businessName.trim(),
            logo_url: "",
            display_email: "",
            display_phone: phone.trim(),
            description: "",
            shipping_note: "",
            checkout_note: "",
            is_published: false,
            setup_completed: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "store_id" },
        );
        if (onlineError) throw new Error(onlineError.message);
      }

      activeStoreCache.setStoreId(storeId);
      activeStoreCache.setBranchId(null);
      setActiveStore(storeId);
      localStorage.setItem("strap-onboarding-complete", "1");
      localStorage.setItem("strap-welcome-tour-pending", "1");
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Your Strap workspace is ready.");
      await navigate({ to: "/dashboard", replace: true });
    } catch (createError) {
      toast.error(errorMessage(createError, "We couldn't finish your Strap setup."));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-5">
        <div className="text-center">
          <div className="mx-auto size-9 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">Preparing your workspace…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-5">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Workspace setup</p>
          <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-slate-950">We couldn't check your workspace</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">Your account is safe. Strap could not load store access yet.</p>
          <Button className="mt-6 h-11 rounded-xl bg-blue-600 hover:bg-blue-700" disabled={checking} onClick={() => void retryStoreLookup()}>
            {checking ? "Checking…" : "Try again"}
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[100dvh] bg-slate-50 text-slate-950">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-4 py-5 sm:px-7 sm:py-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <StrapMark />
            <span className="font-display text-lg font-bold tracking-[-0.04em]">STRAP.</span>
          </div>
          <span className="text-xs font-medium text-slate-400">Workspace setup</span>
        </header>

        <div className="mt-7 h-1 overflow-hidden rounded-full bg-slate-200" aria-label={`Step ${step + 1} of ${totalSteps}`}>
          <div className="h-full rounded-full bg-blue-600 transition-all duration-300" style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
        </div>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[minmax(280px,.72fr)_minmax(0,1.28fr)] lg:gap-16">
          <aside className="hidden lg:block">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Step {step + 1} of {totalSteps}</p>
            <h1 className="mt-4 max-w-md font-display text-5xl font-semibold leading-[0.98] tracking-[-0.05em] text-slate-950">{titles[step]}</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-slate-500">{descriptions[step]}</p>
            <div className="mt-9 grid gap-3 text-sm text-slate-600">
              <span className="flex items-center gap-2"><Check className="size-4 text-blue-600" />No technical setup</span>
              <span className="flex items-center gap-2"><Check className="size-4 text-blue-600" />Change settings later</span>
              <span className="flex items-center gap-2"><Check className="size-4 text-blue-600" />Built around your workflow</span>
            </div>
          </aside>

          <section className="mx-auto w-full max-w-2xl">
            <div className="mb-7 lg:hidden">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-600">Step {step + 1} of {totalSteps}</p>
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-[-0.04em] text-slate-950">{titles[step]}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">{descriptions[step]}</p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,35,65,.07)]">
              <div className="p-5 sm:p-7">
                {step === 0 && (
                  <div className="grid gap-3">
                    <Choice selected={businessModel === "physical"} onClick={() => setBusinessModel("physical")} title="Physical business" description="Shop, office, stall, studio or another physical location." icon={<Store className="size-5" />} />
                    <Choice selected={businessModel === "online"} onClick={() => setBusinessModel("online")} title="Online business" description="Most customers buy from me online." icon={<Globe2 className="size-5" />} />
                    <Choice selected={businessModel === "both"} onClick={() => setBusinessModel("both")} title="Physical + online" description="I sell in person and online." icon={<Building2 className="size-5" />} />
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="business-type">What does the business sell or provide?</Label>
                      <Input id="business-type" value={businessType} onChange={(event) => setBusinessType(event.target.value)} placeholder="Fashion, groceries, beauty, electronics, services…" className="h-12 rounded-xl border-slate-200" autoFocus />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="goal">What should Strap help with first?</Label>
                      <select id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10">
                        <option value="">Choose a primary goal</option>
                        {["Sell faster", "Keep inventory accurate", "Understand revenue and expenses", "Manage staff", "Open an online channel", "Run multiple locations"].map((value) => <option key={value}>{value}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="team-size">Team size</Label>
                      <select id="team-size" value={teamSize} onChange={(event) => setTeamSize(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10">
                        {["Just me", "2–5 people", "6–20 people", "21–50 people", "51+ people"].map((value) => <option key={value}>{value}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <Choice selected={websiteStatus === "existing"} onClick={() => setWebsiteStatus("existing")} title="I already have a website" description="Keep my existing customer-facing site." icon={<Globe2 className="size-5" />} />
                    {websiteStatus === "existing" && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <Label htmlFor="website">Store URL</Label>
                        <Input id="website" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://myshop.com" inputMode="url" className="mt-2 h-12 rounded-xl border-slate-200 bg-white" />
                      </div>
                    )}
                    <Choice selected={websiteStatus === "strap"} onClick={() => { setWebsiteStatus("strap"); setOnlineStoreEnabled(true); }} title="Build with Strap" description="Prepare a shareable online store connected to your catalogue." icon={<Store className="size-5" />} />
                    <Choice selected={websiteStatus === "none"} onClick={() => { setWebsiteStatus("none"); setOnlineStoreEnabled(false); }} title="Not yet" description="Start physical-first and enable online selling later." icon={<MapPin className="size-5" />} />
                    {websiteStatus !== "existing" && (
                      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">Prepare Strap Online Store</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">You can change this later in Settings.</p>
                          </div>
                          <Switch checked={onlineStoreEnabled} onCheckedChange={setOnlineStoreEnabled} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-5">
                    <div className="space-y-2"><Label htmlFor="business-name">Business / store name</Label><Input id="business-name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} placeholder="Your business name" className="h-12 rounded-xl border-slate-200" autoFocus /></div>
                    <div className="space-y-2"><Label htmlFor="branch-name">First location name</Label><Input id="branch-name" value={branchName} onChange={(event) => setBranchName(event.target.value)} placeholder="Main branch" className="h-12 rounded-xl border-slate-200" /></div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2"><Label htmlFor="phone">Business phone</Label><Input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="080…" inputMode="tel" className="h-12 rounded-xl border-slate-200" /></div>
                      <div className="space-y-2"><Label htmlFor="currency">Currency</Label><select id="currency" value={currency} onChange={(event) => setCurrency(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10">{SUPPORTED_CURRENCIES.map((value) => <option key={value.code} value={value.code}>{value.symbol} {value.code} — {value.label}</option>)}</select></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="address">Business address</Label><Input id="address" value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Street, area, city, state" className="h-12 rounded-xl border-slate-200" /></div>
                    <div className="space-y-2"><Label htmlFor="tax">Default sales tax (%)</Label><Input id="tax" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} inputMode="decimal" placeholder="0" className="h-12 rounded-xl border-slate-200" /></div>
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-5">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Users className="size-5" /></span>
                        <div><p className="text-sm font-semibold">Operational profile</p><p className="mt-1 text-xs leading-5 text-slate-500">This helps Strap choose sensible workspace defaults.</p></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>How does your team work?</Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {["Just me", "2–5 people", "6–20 people", "21–50 people", "51+ people"].map((value) => (
                          <button key={value} type="button" onClick={() => setTeamSize(value)} className={cn("rounded-xl border px-4 py-3 text-left text-sm font-semibold transition", teamSize === value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200")}>{value}</button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primary-outcome">Primary outcome</Label>
                      <select id="primary-outcome" value={goal} onChange={(event) => setGoal(event.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10">
                        <option value="">Choose one</option>
                        {["Sell faster", "Keep inventory accurate", "Understand revenue and expenses", "Manage staff", "Open an online channel", "Run multiple locations"].map((value) => <option key={value}>{value}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button type="button" onClick={() => setBilling("month")} className={cn("rounded-lg px-3 py-2.5 text-sm font-semibold", billing === "month" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}>Monthly</button>
                      <button type="button" onClick={() => setBilling("year")} className={cn("rounded-lg px-3 py-2.5 text-sm font-semibold", billing === "year" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500")}>Yearly <span className="ml-1 text-xs text-blue-600">Save 20%</span></button>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-3">
                      {(Object.keys(PLANS) as Plan[]).map((code) => {
                        const current = PLANS[code];
                        const yearlySave = current.monthly > 0 ? Math.round((1 - current.yearly / (current.monthly * 12)) * 100) : 0;
                        return (
                          <button key={code} type="button" onClick={() => setPlan(code)} className={cn("rounded-2xl border p-4 text-left transition", plan === code ? "border-blue-600 bg-blue-600 text-white shadow-sm" : "border-slate-200 bg-white hover:border-blue-200")}>
                            {code !== "free" && <span className={cn("inline-flex rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em]", plan === code ? "bg-white/15 text-white" : "bg-blue-50 text-blue-700")}>{code === "pro" ? "Most complete" : "For growing shops"}</span>}
                            <p className="mt-3 font-display text-xl font-semibold">{current.name}</p>
                            <p className={cn("mt-2 min-h-10 text-xs leading-5", plan === code ? "text-blue-50" : "text-slate-500")}>{current.description}</p>
                            <p className="mt-4 font-display text-2xl font-semibold">{current.monthly === 0 ? "Free" : `₦${(billing === "year" ? current.yearly : current.monthly).toLocaleString()}`}<span className={cn("text-xs font-medium", plan === code ? "text-blue-100" : "text-slate-400")}>/{billing === "year" ? "year" : "month"}</span></p>
                            <div className="mt-4 space-y-2">{current.features.map((feature) => <p key={feature} className={cn("flex gap-2 text-xs", plan === code ? "text-blue-50" : "text-slate-600")}><Check className={cn("mt-0.5 size-3.5 shrink-0", plan === code ? "text-white" : "text-blue-600")} />{feature}</p>)}</div>
                            {billing === "year" && yearlySave > 0 && <p className={cn("mt-4 text-[11px] font-semibold", plan === code ? "text-white" : "text-blue-600")}>Save {yearlySave}% annually</p>}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs leading-5 text-slate-500">Paid plans stay pending until payment is confirmed. Strap never unlocks paid features from a pending payment.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 p-4 sm:px-7">
                <Button type="button" variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep((value) => Math.max(0, value - 1))} className="rounded-xl text-slate-600">
                  <ArrowLeft className="size-4" />Back
                </Button>
                {step < totalSteps - 1 ? (
                  <Button type="button" disabled={!canContinue()} onClick={() => setStep((value) => value + 1)} className="rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700">
                    Continue<ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button type="button" disabled={submitting || !plan} onClick={() => void finish()} className="rounded-xl bg-blue-600 px-5 text-white hover:bg-blue-700">
                    {submitting ? "Creating workspace…" : "Enter Strap"}<ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
