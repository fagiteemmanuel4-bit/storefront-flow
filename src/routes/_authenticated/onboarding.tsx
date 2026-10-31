import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { activeStoreCache } from "@/lib/active-store";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { errorMessage } from "@/lib/format";
import "@/strap-auth.css";
import "@/strap-onboarding.css";
import { BUSINESS_MODES, type BusinessModeKey } from "@/lib/business-modes";
import { ArrowLeft, ArrowRight, Building2, Check, Globe2, MapPin, Store, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your shop — Strap" },
      {
        name: "description",
        content: "Build your Strap workspace around the way your business actually operates.",
      },
    ],
  }),
  component: OnboardingPage,
});

type Plan = "free" | "business" | "pro";
type Billing = "month" | "year";
const PLANS: Record<
  Plan,
  { name: string; monthly: number; yearly: number; description: string; features: string[] }
> = {
  free: {
    name: "Free",
    monthly: 0,
    yearly: 0,
    description: "The essentials for a small physical shop.",
    features: ["Point of sale", "Product catalogue", "Basic inventory", "Customers", "Basic sales history"],
  },
  business: {
    name: "Business",
    monthly: 3000,
    yearly: 28800,
    description: "For shops ready to operate across more channels.",
    features: [
      "Everything in Free",
      "Online store",
      "Staff & permissions",
      "Multiple branches",
      "Data export",
    ],
  },
  pro: {
    name: "Pro",
    monthly: 5000,
    yearly: 48000,
    description: "For growing businesses that need deeper control.",
    features: [
      "Everything in Business",
      "Advanced inventory",
      "Advanced reports",
      "Priority features",
      "More operational controls",
    ],
  },
};

function Choice({
  selected,
  title,
  description,
  onClick,
  children,
}: {
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
  children?: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className="ob-opt">
      <span className="ob-chip">{children}</span>
      <span className="grow">
        <span className="t">{title}</span>
        <span className="d">{description}</span>
      </span>
      <span className="ob-tick">{selected && <Check className="size-3.5" />}</span>
    </button>
  );
}

const STEP_LABELS = ["Usage", "Business", "Online", "Identity", "Team", "Plan", "Review"];
const TEAM_OPTIONS = ["Just me", "2–5 people", "6–20 people", "21–50 people", "51+ people"];
const GOAL_OPTIONS = [
  "Sell faster",
  "Keep inventory accurate",
  "Understand revenue and expenses",
  "Manage staff",
  "Open an online channel",
  "Run multiple locations",
];

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
  const totalSteps = 7;

  useEffect(() => {
    if (!isLoading && !error && memberships.length > 0) void navigate({ to: "/pos", replace: true });
  }, [error, isLoading, memberships.length, navigate]);

  const selectedPlan = plan ? PLANS[plan] : null;
  const annualSaving =
    selectedPlan && selectedPlan.monthly > 0 ? selectedPlan.monthly * 12 - selectedPlan.yearly : 0;
  const priceLabel = selectedPlan
    ? selectedPlan.monthly === 0
      ? "Free"
      : `₦${(billing === "year" ? selectedPlan.yearly : selectedPlan.monthly).toLocaleString()} / ${billing === "year" ? "year" : "month"}`
    : "";

  function canContinue() {
    if (step === 0) return Boolean(businessModel);
    if (step === 1) return businessType.trim().length >= 2 && Boolean(businessMode);
    if (step === 2)
      return websiteStatus === "existing" ? /^https?:\/\//i.test(websiteUrl.trim()) : Boolean(websiteStatus);
    if (step === 3) return businessName.trim().length >= 2 && branchName.trim().length >= 1;
    if (step === 4) return Boolean(teamSize && goal && currency);
    if (step === 5) return Boolean(plan);
    return true;
  }

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
          version: 2,
          businessModel,
          businessType: businessType.trim(),
          businessMode,
          websiteStatus,
          websiteUrl: websiteUrl.trim(),
          onlineStoreEnabled,
          teamSize,
          goal,
          address: address.trim(),
          phone: phone.trim(),
        },
        businessMode,
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
      const { error: subscriptionError } = await supabase
        .from("store_subscriptions")
        .upsert(
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
        const { error: onlineError } = await supabase.from("online_stores").upsert(
          {
            store_id: storeId,
            slug: `${businessName
              .trim()
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/^-|-$/g, "")
              .slice(0, 48)}-${String(storeId).slice(0, 6)}`,
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
      void navigate({ to: "/dashboard", replace: true });
    } catch (createError) {
      toast.error(errorMessage(createError, "We couldn't finish your Strap setup."));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading)
    return (
      <main className="sa ob ob-solo">
        <div className="sa-box" style={{ textAlign: "center" }}>
          <span className="ob-spin" />
          <p className="sa-mut" role="status">
            Preparing your workspace…
          </p>
        </div>
      </main>
    );
  if (error)
    return (
      <main className="sa ob ob-solo">
        <div className="sa-box" style={{ textAlign: "center" }}>
          <h1>We couldn’t check your workspace</h1>
          <p className="sa-mut" role="alert">
            Your account is safe. Strap could not load store access yet.
          </p>
          <div className="sa-fm">
            <button
              type="button"
              className="sa-b p"
              disabled={checking}
              onClick={() => void retryStoreLookup()}
            >
              {checking ? "Checking…" : "Try again"}
            </button>
          </div>
        </div>
      </main>
    );

  const stepTitle = [
    "How will you use Strap?",
    "Tell us about the business",
    "How do you sell online?",
    "Give your workspace an identity",
    "How does the team operate?",
    "Choose your Strap plan",
    "Your setup is ready",
  ][step];
  const stepDescription = [
    "We use this to shape your workspace, navigation and future recommendations.",
    "A little context lets Strap use better defaults for products, reports and workflows.",
    "Keep an existing website, build with Strap, or stay physical for now. You can change this later.",
    "These details become the foundation for your store profile and customer-facing identity.",
    "Tell Strap how the business works today so the workspace starts in the right shape.",
    "Choose one plan now. You can upgrade or change billing later from Settings.",
    "Review your choices before creating the workspace.",
  ][step];

  return (
    <main className="sa ob">
      <section className="sa-l">
        <svg
          className="sa-ring"
          aria-hidden="true"
          viewBox="0 0 700 700"
          fill="none"
          stroke="#C6F432"
          strokeWidth="2"
        >
          <circle cx="350" cy="350" r="60" />
          <circle cx="350" cy="350" r="120" strokeOpacity=".7" />
          <circle cx="350" cy="350" r="180" strokeOpacity=".5" />
          <circle cx="350" cy="350" r="240" strokeOpacity=".32" />
          <circle cx="350" cy="350" r="300" strokeOpacity=".18" />
          <circle cx="350" cy="110" r="9" fill="#C6F432" stroke="none" />
          <circle cx="562" cy="472" r="9" fill="#C6F432" stroke="none" />
        </svg>
        <div className="sa-logo">
          <span className="sa-dot" />
          Strap
        </div>
        <div>
          <p className="ob-kicker">Workspace setup</p>
          <h2>Set up your shop in a few minutes.</h2>
          <p className="sa-lead">No code or technical setup. You can change most choices later.</p>
          <ol className="ob-steps">
            {STEP_LABELS.map((label, i) => (
              <li
                key={label}
                className={i < step ? "done" : i === step ? "cur" : ""}
                aria-current={i === step ? "step" : undefined}
              >
                <b>{i < step ? "✓" : i + 1}</b>
                {label}
              </li>
            ))}
          </ol>
        </div>
        <small>© 2026 Strap by Kryonara</small>
      </section>

      <section className="sa-r">
        <div className="sa-box ob-box" key={step}>
          <div
            className="ob-prog"
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step + 1}
          >
            <i style={{ width: `${((step + 1) / totalSteps) * 100}%` }} />
          </div>
          <p className="ob-kicker">
            Step {step + 1} of {totalSteps}
          </p>
          <h1>{stepTitle}</h1>
          <p className="sa-mut">{stepDescription}</p>

          <div className="ob-body">
            {step === 0 && (
              <>
                <Choice
                  selected={businessModel === "physical"}
                  onClick={() => setBusinessModel("physical")}
                  title="Physical business"
                  description="I mainly sell from a shop, office, stall, studio or other physical location."
                >
                  <Store className="size-5" />
                </Choice>
                <Choice
                  selected={businessModel === "online"}
                  onClick={() => setBusinessModel("online")}
                  title="Online business"
                  description="Most of my sales happen online and I want Strap to support that workflow."
                >
                  <Globe2 className="size-5" />
                </Choice>
                <Choice
                  selected={businessModel === "both"}
                  onClick={() => setBusinessModel("both")}
                  title="Physical + online"
                  description="I sell in person and online and want one workspace for both."
                >
                  <Building2 className="size-5" />
                </Choice>
              </>
            )}

            {step === 1 && (
              <>
                <div className="sa-f">
                  <label htmlFor="business-type">What does the business sell or provide?</label>
                  <input
                    id="business-type"
                    className="sa-in"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="e.g. women’s clothing, groceries, phone accessories…"
                    autoFocus
                  />
                </div>
                <div className="sa-f">
                  <span className="sa-label">Choose a business mode</span>
                  <p className="ob-hint">
                    Strap will tailor the workspace shortcuts and setup guidance to this type of business.
                  </p>
                  <div className="ob-g2" style={{ marginTop: 8 }}>
                    {BUSINESS_MODES.map((mode) => (
                      <button
                        key={mode.key}
                        type="button"
                        onClick={() => setBusinessMode(mode.key)}
                        aria-pressed={businessMode === mode.key}
                        className="ob-opt sm"
                      >
                        <span className="ob-chip">
                          <Store className="size-4" />
                        </span>
                        <span className="grow">
                          <span className="t">{mode.label}</span>
                          <span className="d">{mode.description}</span>
                        </span>
                        <span className="ob-tick">
                          {businessMode === mode.key && <Check className="size-3.5" />}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sa-f">
                  <label htmlFor="goal">What is the biggest reason you are using Strap?</label>
                  <select id="goal" className="sa-in" value={goal} onChange={(e) => setGoal(e.target.value)}>
                    <option value="">Choose a primary goal</option>
                    {GOAL_OPTIONS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>
                <div className="sa-f">
                  <label htmlFor="team">How large is the team today?</label>
                  <select
                    id="team"
                    className="sa-in"
                    value={teamSize}
                    onChange={(e) => setTeamSize(e.target.value)}
                  >
                    {TEAM_OPTIONS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Choice
                  selected={websiteStatus === "existing"}
                  onClick={() => setWebsiteStatus("existing")}
                  title="I already have a store website"
                  description="Keep my existing website as the main customer-facing store."
                >
                  <Globe2 className="size-5" />
                </Choice>
                {websiteStatus === "existing" && (
                  <div className="ob-panel">
                    <div className="sa-f">
                      <label htmlFor="website">Existing store URL</label>
                      <input
                        id="website"
                        className="sa-in"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://myshop.com"
                        inputMode="url"
                      />
                    </div>
                  </div>
                )}
                <Choice
                  selected={websiteStatus === "strap"}
                  onClick={() => {
                    setWebsiteStatus("strap");
                    setOnlineStoreEnabled(true);
                  }}
                  title="I want to create my store with Strap"
                  description="Use Strap's built-in online store when my plan supports it."
                >
                  <Store className="size-5" />
                </Choice>
                <Choice
                  selected={websiteStatus === "none"}
                  onClick={() => {
                    setWebsiteStatus("none");
                    setOnlineStoreEnabled(false);
                  }}
                  title="Not yet"
                  description="I am starting physical-first and may turn on online selling later."
                >
                  <MapPin className="size-5" />
                </Choice>
                {websiteStatus !== "existing" && (
                  <div className="ob-panel">
                    <div className="ob-row">
                      <div>
                        <p className="t">Prepare Strap Online Store</p>
                        <p className="ob-hint">
                          You can keep this off and enable it later from Settings → Preferences → Strap Online
                          Store.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={onlineStoreEnabled}
                        aria-label="Prepare Strap Online Store"
                        className="ob-sw"
                        onClick={() => setOnlineStoreEnabled(!onlineStoreEnabled)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 3 && (
              <>
                <div className="sa-f">
                  <label htmlFor="business-name">Business / store name</label>
                  <input
                    id="business-name"
                    className="sa-in"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Your business name"
                    autoFocus
                  />
                </div>
                <div className="sa-f">
                  <label htmlFor="branch">First location name</label>
                  <input
                    id="branch"
                    className="sa-in"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Main branch"
                  />
                </div>
                <div className="ob-g2">
                  <div className="sa-f">
                    <label htmlFor="phone">Business phone</label>
                    <input
                      id="phone"
                      className="sa-in"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="080…"
                      inputMode="tel"
                    />
                  </div>
                  <div className="sa-f">
                    <label htmlFor="currency">Currency</label>
                    <select
                      id="currency"
                      className="sa-in"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                    >
                      {SUPPORTED_CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.symbol} {c.code} — {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="sa-f">
                  <label htmlFor="address">Business address</label>
                  <input
                    id="address"
                    className="sa-in"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, area, city, state"
                  />
                </div>
                <div className="sa-f">
                  <label htmlFor="tax">Default sales tax (%)</label>
                  <input
                    id="tax"
                    className="sa-in"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="ob-panel">
                  <div className="ob-row" style={{ justifyContent: "flex-start", alignItems: "flex-start" }}>
                    <span className="ob-chip">
                      <Users className="size-5" />
                    </span>
                    <div>
                      <p className="t">Operational profile</p>
                      <p className="ob-hint">
                        This helps Strap choose sensible defaults. You can refine the details later.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="sa-f">
                  <span className="sa-label">How do you expect your team to work?</span>
                  <div className="ob-g2" style={{ marginTop: 6 }}>
                    {TEAM_OPTIONS.map((x) => (
                      <button
                        key={x}
                        type="button"
                        aria-pressed={teamSize === x}
                        onClick={() => setTeamSize(x)}
                        className="ob-opt pill"
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sa-f">
                  <label htmlFor="goal2">Primary outcome</label>
                  <select id="goal2" className="sa-in" value={goal} onChange={(e) => setGoal(e.target.value)}>
                    <option value="">Choose one</option>
                    {GOAL_OPTIONS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div className="ob-seg" role="group" aria-label="Billing period">
                  <button
                    type="button"
                    aria-pressed={billing === "month"}
                    onClick={() => setBilling("month")}
                  >
                    Monthly
                  </button>
                  <button type="button" aria-pressed={billing === "year"} onClick={() => setBilling("year")}>
                    Yearly<em>Save 20%</em>
                  </button>
                </div>
                <div className="ob-plans">
                  {(Object.keys(PLANS) as Plan[]).map((code) => {
                    const p = PLANS[code];
                    const yearlySave = p.monthly ? Math.round((1 - p.yearly / (p.monthly * 12)) * 100) : 0;
                    return (
                      <button
                        type="button"
                        key={code}
                        onClick={() => setPlan(code)}
                        aria-pressed={plan === code}
                        className="ob-opt ob-plan"
                      >
                        {code !== "free" && (
                          <span className="ob-badge">
                            {code === "pro" ? "Most complete" : "For growing shops"}
                          </span>
                        )}
                        <span className="nm">{p.name}</span>
                        <span className="ds">{p.description}</span>
                        <span className="pr">
                          {p.monthly === 0
                            ? "Free"
                            : `₦${(billing === "year" ? p.yearly : p.monthly).toLocaleString()}`}
                          <small>/{billing === "year" ? "year" : "month"}</small>
                        </span>
                        <ul>
                          {p.features.map((f) => (
                            <li key={f}>
                              <Check className="size-3.5" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {billing === "year" && yearlySave > 0 && (
                          <span className="ob-save">Save {yearlySave}% annually</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="ob-hint">
                  Paid plans are selected now and marked pending until the payment provider is connected.
                  Strap never unlocks paid features from a pending payment.
                </p>
              </>
            )}

            {step === 6 && (
              <>
                <div className="ob-sum">
                  <p className="k">Ready to build</p>
                  <h3>{businessName || "Your business"}</h3>
                  <p>
                    {businessType || "Business"} ·{" "}
                    {BUSINESS_MODES.find((mode) => mode.key === businessMode)?.label ?? "General retail"} ·{" "}
                    {businessModel === "both"
                      ? "Physical + online"
                      : businessModel === "online"
                        ? "Online"
                        : "Physical"}
                  </p>
                </div>
                <div className="ob-st2">
                  <div className="ob-stat">
                    <small>Plan</small>
                    <b>
                      {selectedPlan?.name} · {priceLabel}
                    </b>
                  </div>
                  <div className="ob-stat">
                    <small>Online store</small>
                    <b>{onlineStoreEnabled ? "Prepared" : "Off until you enable it"}</b>
                  </div>
                </div>
                <div className="sa-notice">
                  After setup, Strap will take you into the workspace and give you a guided tour. You can
                  revisit preferences and online-store controls any time.
                </div>
              </>
            )}
          </div>

          <div className="ob-nav">
            <button
              type="button"
              className="sa-b"
              disabled={step === 0 || submitting}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            {step < 6 ? (
              <button
                type="button"
                className="sa-b p"
                disabled={!canContinue()}
                onClick={() => setStep((s) => s + 1)}
              >
                Continue
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                className="sa-b p"
                disabled={submitting || !plan}
                onClick={() => void finish()}
              >
                {submitting ? "Creating workspace…" : "Enter Strap"}
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}