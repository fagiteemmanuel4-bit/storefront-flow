import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
import "@/strap-reference.css";
import { BUSINESS_MODES, type BusinessModeKey } from "@/lib/business-modes";
import { getBusinessModeProfile } from "@/lib/business-mode-profiles";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CircleHelp,
  Globe2,
  MapPin,
  Store,
  Users,
} from "lucide-react";

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
    features: [
      "Point of sale",
      "Product catalogue",
      "Basic inventory",
      "Customers",
      "Basic sales history",
    ],
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
const COUNTRY_OPTIONS = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Uganda", "Tanzania",
  "Rwanda", "Senegal", "Côte d’Ivoire", "Cameroon", "United Kingdom",
  "United States", "Canada", "United Arab Emirates", "India", "Other",
];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberships, isLoading, error, refresh, setActiveStore, userId } = useStoreContext();
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
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [personalCountry, setPersonalCountry] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<"registered" | "not_registered" | "in_progress" | "">("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [declaredBranchCount, setDeclaredBranchCount] = useState<"1" | "2-5" | "6-20" | "20+" | "">("");
  const [businessCountry, setBusinessCountry] = useState("");
  const [businessState, setBusinessState] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessStreet, setBusinessStreet] = useState("");
  const [businessLandmark, setBusinessLandmark] = useState("");
  const [businessPostcode, setBusinessPostcode] = useState("");
  const [businessPhoto, setBusinessPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const totalSteps = 10;

  useEffect(() => {
    if (!isLoading && !error && memberships.length > 0)
      void navigate({ to: "/pos", replace: true });
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
      return websiteStatus === "existing"
        ? /^https?:\/\//i.test(websiteUrl.trim())
        : Boolean(websiteStatus);
    if (step === 3) {
      if (!dateOfBirth || !personalCountry) return false;
      const born = new Date(dateOfBirth + "T00:00:00");
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      return Number.isFinite(born.getTime()) && born <= cutoff;
    }
    if (step === 4) return businessName.trim().length >= 2 && branchName.trim().length >= 1;
    if (step === 5) return Boolean(registrationStatus && declaredBranchCount);
    if (step === 6) return Boolean(businessCountry && businessState.trim() && businessCity.trim() && businessStreet.trim());
    if (step === 7) return Boolean(teamSize && goal);
    if (step === 8) return Boolean(plan);
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
      if (!businessMode)
        throw new Error("Choose a valid business mode before creating your workspace.");
      if (!dateOfBirth || !personalCountry)
        throw new Error("Complete your personal details before continuing.");
      const profileResult = getBusinessModeProfile(businessMode);
      if (!profileResult.ok) {
        throw new Error(
          "The selected business profile is unavailable. Please choose another business mode.",
        );
      }
      const selectedProfile = profileResult.profile;
      const { data: authResult, error: authError } = await supabase.auth.getUser();
      if (authError || !authResult.user || authResult.user.id !== userId)
        throw new Error("Your session could not be verified. Please sign in again.");

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email: authResult.user.email ?? "",
          full_name: String(authResult.user.user_metadata?.full_name ?? ""),
          date_of_birth: dateOfBirth,
          country: personalCountry,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (profileError) throw new Error(profileError.message);

      const fullBusinessAddress = [
        businessStreet.trim(),
        businessLandmark.trim(),
        businessCity.trim(),
        businessState.trim(),
        businessCountry.trim(),
        businessPostcode.trim(),
      ].filter(Boolean).join(", ");

      const { data: storeId, error: createError } = await supabase.rpc("create_store", {
        _name: businessName.trim(),
        _currency: currency,
        _branch_name: branchName.trim(),
        _tax_rate: Number(taxRate) || 0,
      });
      if (createError) throw new Error(createError.message);
      if (!storeId) throw new Error("Strap could not create your workspace.");

      let businessPhotoUrl = "";
      if (businessPhoto) {
        const extension = businessPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
        const photoPath = storeId + "/" + userId + "/business-profile-" + Date.now() + "." + extension;
        const { error: uploadError } = await supabase.storage
          .from("kudi-store-assets")
          .upload(photoPath, businessPhoto, {
            upsert: true,
            contentType: businessPhoto.type || "image/jpeg",
            cacheControl: "3600",
          });
        if (uploadError) {
          toast.error("Your workspace will be created, but the profile photo could not be uploaded. You can add it later.");
        } else {
          businessPhotoUrl = supabase.storage.from("kudi-store-assets").getPublicUrl(photoPath).data.publicUrl;
        }
      }

      const storefrontSettings = {
        onboarding: {
          version: 3,
          businessModel,
          businessType: businessType.trim(),
          businessMode,
          websiteStatus,
          websiteUrl: websiteUrl.trim(),
          onlineStoreEnabled,
          teamSize,
          goal,
          address: fullBusinessAddress,
          phone: phone.trim(),
          declaredBranchCount,
          registrationStatus,
          businessCountry,
          businessState: businessState.trim(),
          businessCity: businessCity.trim(),
        },
        businessMode,
        businessModeProfile: {
          id: selectedProfile.id,
          version: selectedProfile.profileVersion,
          status: selectedProfile.status,
          runtimeReady: selectedProfile.runtimeReady,
        },
        onlineStoreEnabled,
        externalWebsite: websiteStatus === "existing" ? websiteUrl.trim() : "",
      };
      const { error: storeError } = await supabase
        .from("stores")
        .update({
          phone: phone.trim(),
          address: fullBusinessAddress,
          business_type: businessType.trim(),
          team_size: teamSize,
          business_goal: goal,
          ...(businessPhotoUrl ? { logo_url: businessPhotoUrl } : {}),
          storefront_settings: storefrontSettings,
        })
        .eq("id", storeId);
      if (storeError) throw new Error(storeError.message);

      const { error: branchAddressError } = await supabase
        .from("branches")
        .update({ address: fullBusinessAddress })
        .eq("store_id", storeId)
        .eq("is_default", true);
      if (branchAddressError) throw new Error(branchAddressError.message);

      const { error: complianceError } = await supabase.from("store_compliance_profiles").upsert(
        {
          store_id: storeId,
          owner_id: userId,
          registration_status: registrationStatus,
          registration_number: registrationNumber.trim() || null,
          declared_branch_count: declaredBranchCount,
          business_country: businessCountry,
          business_state: businessState.trim(),
          business_city: businessCity.trim(),
          business_street: businessStreet.trim(),
          business_landmark: businessLandmark.trim() || null,
          business_postcode: businessPostcode.trim() || null,
          website_status: websiteStatus || "none",
          website_url: websiteStatus === "existing" ? websiteUrl.trim() : null,
          wants_strap_website: onlineStoreEnabled,
          business_profile_photo_url: businessPhotoUrl || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" },
      );
      if (complianceError) throw new Error(complianceError.message);

      const { error: subscriptionError } = await supabase.rpc("initialize_store_subscription", {
        _store_id: storeId,
        _plan_code: plan,
        _currency: currency,
        _interval: billing,
        _metadata: { selected_during_onboarding: true, billing, annual_saving: annualSaving },
      });
      if (subscriptionError) throw new Error(subscriptionError.message);

      if (onlineStoreEnabled && (plan === "business" || plan === "pro")) {
        const { error: onlineError } = await supabase.from("online_stores").upsert(
          {
            store_id: storeId,
            slug: businessName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) + "-" + String(storeId).slice(0, 6),
            display_name: businessName.trim(),
            logo_url: businessPhotoUrl,
            display_email: authResult.user.email ?? "",
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
    "A little about you",
    "Give your business an identity",
    "Business registration details",
    "Where is your business located?",
    "How does the team operate?",
    "Choose your Strap plan",
    "Your setup is ready",
  ][step];
  const stepDescription = [
    "Choose the setup that best reflects how your business operates.",
    "Tell us what you sell so Strap can configure the right tools and workflows.",
    "Keep your current website or prepare a Strap storefront for later.",
    "Your date of birth and country help us maintain an accurate account profile.",
    "Add the business name, first location, contact details and brand image.",
    "Tell us the business registration status and how many locations you operate.",
    "Add the full physical business address, including the country and region.",
    "Help Strap choose sensible defaults for your team and business goals.",
    "Choose a plan now. You can upgrade or change billing later from Settings.",
    "Review your details before creating your workspace.",
  ][step];

  return (
    <main className="ref-screen ob-screen">
      <section className="ref-hero ob-hero">
        <svg className="ref-logo" viewBox="0 0 136 136" aria-label="Strap logo">
          <circle cx="68" cy="68" r="65" fill="none" stroke="#0a0a0a" strokeWidth="3" />
          <circle cx="68" cy="68" r="49" fill="#0a0a0a" />
          <circle cx="68" cy="68" r="19" fill="#e6f53a" />
        </svg>
        <h1>Strap</h1>
        <p className="ref-tagline">Run your business. Not around it.</p>
      </section>

      <section className="ref-sheet ob-sheet">
        <div className="ref-sheet-inner ob-sheet-inner">
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
                    Strap will tailor the workspace shortcuts and setup guidance to this type of
                    business.
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
                          You can keep this off and enable it later from Settings → Preferences →
                          Strap Online Store.
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
                  <label htmlFor="date-of-birth">Date of birth</label>
                  <input
                    id="date-of-birth"
                    className="sa-in"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    autoFocus
                  />
                  <p className="ob-hint">You must be at least 18 years old to create a Strap business account. This information is stored in your private account profile.</p>
                </div>
                <div className="sa-f">
                  <label htmlFor="personal-country">Country of residence</label>
                  <select
                    id="personal-country"
                    className="sa-in"
                    value={personalCountry}
                    onChange={(e) => setPersonalCountry(e.target.value)}
                  >
                    <option value="">Select your country</option>
                    {COUNTRY_OPTIONS.map((country) => <option key={country} value={country}>{country}</option>)}
                  </select>
                </div>
              </>
            )}

            {step === 4 && (
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
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="tax">Default sales tax (%)</label>
                    <Link
                      to="/tax-guide"
                      className="inline-flex min-h-8 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-primary hover:bg-accent-soft"
                      aria-label="Learn how to choose a tax percentage"
                      title="Learn about tax rates"
                    >
                      <CircleHelp className="size-4" />
                    </Link>
                  </div>
                  <input
                    id="tax"
                    className="sa-in"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    inputMode="decimal"
                    placeholder="0"
                  />
                </div>
                <div className="sa-f">
                  <label htmlFor="business-photo">Business profile picture <span className="ob-hint">(optional)</span></label>
                  <input
                    id="business-photo"
                    className="sa-in ob-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                        toast.error("Choose a PNG, JPG or WebP image.");
                        e.target.value = "";
                        setBusinessPhoto(null);
                        return;
                      }
                      if (file && file.size > 5 * 1024 * 1024) {
                        toast.error("Choose an image smaller than 5 MB.");
                        e.target.value = "";
                        setBusinessPhoto(null);
                        return;
                      }
                      setBusinessPhoto(file);
                    }}
                  />
                  <p className="ob-hint">{businessPhoto ? businessPhoto.name : "PNG, JPG or WebP. Maximum 5 MB."}</p>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <div className="sa-f">
                  <span className="sa-label">Is this a registered business?</span>
                  <div className="ob-g2">
                    {([
                      ["Registered", "registered"],
                      ["Not registered", "not_registered"],
                      ["Registration in progress", "in_progress"],
                    ] as const).map(([label, value]) => (
                      <button key={value} type="button" className="ob-opt pill" aria-pressed={registrationStatus === value} onClick={() => setRegistrationStatus(value)}>{label}</button>
                    ))}
                  </div>
                </div>
                <div className="sa-f">
                  <label htmlFor="registration-number">Business registration number <span className="ob-hint">(you can add this later)</span></label>
                  <input
                    id="registration-number"
                    className="sa-in"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g. RC1234567"
                    autoCapitalize="characters"
                  />
                </div>
                <div className="sa-f">
                  <label htmlFor="branch-count">How many branches do you operate?</label>
                  <select id="branch-count" className="sa-in" value={declaredBranchCount} onChange={(e) => setDeclaredBranchCount(e.target.value as typeof declaredBranchCount)}>
                    <option value="">Select branch count</option>
                    <option value="1">1 (single location)</option>
                    <option value="2-5">2 to 5</option>
                    <option value="6-20">6 to 20</option>
                    <option value="20+">More than 20</option>
                  </select>
                  <p className="ob-hint">This records your current business footprint. Additional branches can be configured in your workspace.</p>
                </div>
              </>
            )}

            {step === 6 && (
              <>
                <div className="sa-f">
                  <label htmlFor="business-country">Business country</label>
                  <select id="business-country" className="sa-in" value={businessCountry} onChange={(e) => setBusinessCountry(e.target.value)}>
                    <option value="">Select country</option>
                    {COUNTRY_OPTIONS.map((country) => <option key={country} value={country}>{country}</option>)}
                  </select>
                </div>
                <div className="ob-g2">
                  <div className="sa-f">
                    <label htmlFor="business-state">State / region</label>
                    <input id="business-state" className="sa-in" value={businessState} onChange={(e) => setBusinessState(e.target.value)} placeholder="State or region" autoComplete="address-level1" />
                  </div>
                  <div className="sa-f">
                    <label htmlFor="business-city">City / town</label>
                    <input id="business-city" className="sa-in" value={businessCity} onChange={(e) => setBusinessCity(e.target.value)} placeholder="City or town" autoComplete="address-level2" />
                  </div>
                </div>
                <div className="sa-f">
                  <label htmlFor="business-street">Street address</label>
                  <input id="business-street" className="sa-in" value={businessStreet} onChange={(e) => setBusinessStreet(e.target.value)} placeholder="House number, street and area" autoComplete="street-address" />
                </div>
                <div className="ob-g2">
                  <div className="sa-f">
                    <label htmlFor="business-landmark">Landmark <span className="ob-hint">(optional)</span></label>
                    <input id="business-landmark" className="sa-in" value={businessLandmark} onChange={(e) => setBusinessLandmark(e.target.value)} placeholder="Nearby landmark" />
                  </div>
                  <div className="sa-f">
                    <label htmlFor="business-postcode">Postal code <span className="ob-hint">(optional)</span></label>
                    <input id="business-postcode" className="sa-in" value={businessPostcode} onChange={(e) => setBusinessPostcode(e.target.value)} placeholder="Postal code" autoComplete="postal-code" />
                  </div>
                </div>
              </>
            )}

            {step === 7 && (
              <>
                <div className="ob-panel">
                  <div
                    className="ob-row"
                    style={{ justifyContent: "flex-start", alignItems: "flex-start" }}
                  >
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
                  <select
                    id="goal2"
                    className="sa-in"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option value="">Choose one</option>
                    {GOAL_OPTIONS.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {step === 8 && (
              <>
                <div className="ob-seg" role="group" aria-label="Billing period">
                  <button
                    type="button"
                    aria-pressed={billing === "month"}
                    onClick={() => setBilling("month")}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    aria-pressed={billing === "year"}
                    onClick={() => setBilling("year")}
                  >
                    Yearly<em>Save 20%</em>
                  </button>
                </div>
                <div className="ob-plans">
                  {(Object.keys(PLANS) as Plan[]).map((code) => {
                    const p = PLANS[code];
                    const yearlySave = p.monthly
                      ? Math.round((1 - p.yearly / (p.monthly * 12)) * 100)
                      : 0;
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
                  Paid plans are selected now and marked pending until the payment provider is
                  connected. Strap never unlocks paid features from a pending payment.
                </p>
              </>
            )}

            {step === 9 && (
              <>
                <div className="ob-sum">
                  <p className="k">Ready to build</p>
                  <h3>{businessName || "Your business"}</h3>
                  <p>
                    {businessType || "Business"} ·{" "}
                    {BUSINESS_MODES.find((mode) => mode.key === businessMode)?.label ??
                      "General retail"}{" "}
                    ·{" "}
                    {businessModel === "both"
                      ? "Physical + online"
                      : businessModel === "online"
                        ? "Online"
                        : "Physical"}
                  </p>
                </div>
                <div className="ob-st2">
                  <div className="ob-stat">
                    <small>Business profile</small>
                    <b>{BUSINESS_MODES.find((mode) => mode.key === businessMode)?.label ?? "Not selected"}</b>
                  </div>
                  <div className="ob-stat">
                    <small>Registration</small>
                    <b>{registrationStatus === "registered" ? "Registered" : registrationStatus === "in_progress" ? "In progress" : "Not registered"}{registrationNumber.trim() ? " · " + registrationNumber.trim() : ""}</b>
                  </div>
                  <div className="ob-stat">
                    <small>Locations</small>
                    <b>{declaredBranchCount === "1" ? "1 branch" : declaredBranchCount + " branches"}</b>
                  </div>
                  <div className="ob-stat">
                    <small>Business address</small>
                    <b>{[businessStreet, businessLandmark, businessCity, businessState, businessCountry, businessPostcode].filter(Boolean).join(", ")}</b>
                  </div>
                  <div className="ob-stat">
                    <small>Personal country</small>
                    <b>{personalCountry}</b>
                  </div>
                  <div className="ob-stat">
                    <small>Plan</small>
                    <b>{selectedPlan?.name} · {priceLabel}</b>
                  </div>
                  <div className="ob-stat">
                    <small>Online store</small>
                    <b>{onlineStoreEnabled ? "Prepared" : "Off until you enable it"}</b>
                  </div>
                </div>
                <div className="sa-notice">
                  After setup, Strap will take you into the workspace and give you a guided tour.
                  You can revisit preferences and online-store controls any time.
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
            {step < 9 ? (
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
