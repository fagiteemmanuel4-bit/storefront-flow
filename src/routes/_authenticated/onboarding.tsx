import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { activeStoreCache } from "@/lib/active-store";
import { errorMessage } from "@/lib/format";
import "@/strap-auth.css";
import "@/strap-onboarding.css";
import "@/strap-reference.css";
import { BUSINESS_MODES, type BusinessModeKey } from "@/lib/business-modes";
import { getBusinessModeProfile } from "@/lib/business-mode-profiles";

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
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Egypt",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Senegal",
  "Côte d’Ivoire",
  "Cameroon",
  "United Kingdom",
  "United States",
  "Canada",
  "United Arab Emirates",
  "India",
  "Other",
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
  const [registrationStatus, setRegistrationStatus] = useState<
    "registered" | "not_registered" | "in_progress" | ""
  >("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [declaredBranchCount, setDeclaredBranchCount] = useState<"1" | "2-5" | "6-20" | "20+" | "">(
    "",
  );
  const [businessCountry, setBusinessCountry] = useState("");
  const [businessState, setBusinessState] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessStreet, setBusinessStreet] = useState("");
  const [businessLandmark, setBusinessLandmark] = useState("");
  const [businessPostcode, setBusinessPostcode] = useState("");
  const [businessPhoto, setBusinessPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);

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
    if (step === 1) return businessType.trim().length >= 2;
    if (step === 2) return Boolean(businessMode);
    if (step === 3) return Boolean(websiteStatus);
    if (step === 4) return /^https?:\\/\\//i.test(websiteUrl.trim());
    if (step === 5) {
      if (!dateOfBirth) return false;
      const born = new Date(dateOfBirth + "T00:00:00");
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      return Number.isFinite(born.getTime()) && born <= cutoff;
    }
    if (step === 6) return Boolean(personalCountry);
    if (step === 7) return Boolean(currency.trim());
    if (step === 8) return businessName.trim().length >= 2;
    if (step === 9) return Boolean(registrationStatus);
    if (step === 10) return true;
    if (step === 11) return Boolean(declaredBranchCount);
    if (step === 12) return Boolean(businessCountry);
    if (step === 13) return businessState.trim().length >= 2;
    if (step === 14) return businessCity.trim().length >= 2;
    if (step === 15) return businessStreet.trim().length >= 4;
    if (step >= 16 && step <= 18) return true;
    if (step === 19) return Boolean(teamSize);
    if (step === 20) return Boolean(goal);
    if (step === 21) return Boolean(plan);
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
      if (!registrationStatus || !declaredBranchCount)
        throw new Error("Complete the business registration and branch details before continuing.");
      if (
        !businessCountry ||
        !businessState.trim() ||
        !businessCity.trim() ||
        !businessStreet.trim()
      )
        throw new Error("Complete the full business address before continuing.");
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

      const { data: existingProfile, error: profileLookupError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .maybeSingle();
      if (profileLookupError) throw new Error(profileLookupError.message);
      const profileName =
        existingProfile?.full_name ||
        String(
          authResult.user.user_metadata?.full_name ?? authResult.user.user_metadata?.name ?? "",
        );
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: userId,
          email: existingProfile?.email || authResult.user.email || "",
          full_name: profileName,
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
      ]
        .filter(Boolean)
        .join(", ");

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
        const photoPath =
          storeId + "/" + userId + "/business-profile-" + Date.now() + "." + extension;
        const { error: uploadError } = await supabase.storage
          .from("kudi-store-assets")
          .upload(photoPath, businessPhoto, {
            upsert: true,
            contentType: businessPhoto.type || "image/jpeg",
            cacheControl: "3600",
          });
        if (uploadError) {
          toast.error(
            "Your workspace will be created, but the profile photo could not be uploaded. You can add it later.",
          );
        } else {
          businessPhotoUrl = supabase.storage.from("kudi-store-assets").getPublicUrl(photoPath)
            .data.publicUrl;
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
            slug:
              businessName
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
                .slice(0, 48) +
              "-" +
              String(storeId).slice(0, 6),
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

  const titles = [
    "How will you use Strap?",
    "What does your business sell?",
    "Choose your business mode",
    "Does your business have a website?",
    "What’s your website?",
    "When were you born?",
    "Which country are you in?",
    "Which currency do you sell in?",
    "What’s your business name?",
    "Is this a registered business?",
    "Business registration number",
    "How many branches do you run?",
    "Where is your business located?",
    "Which state or region?",
    "Which city or town?",
    "What’s the street address?",
    "Add a nearby landmark",
    "What’s the postal code?",
    "Set a business profile picture",
    "How large is your team?",
    "What matters most to your business?",
    "Choose your Strap plan",
    "You’re all set",
  ];
  const subtitles = [
    "Choose the setup that best reflects how your business operates.",
    "We’ll tailor Strap to the products or services you provide.",
    "This helps Strap configure the right tools for your business.",
    "Keep your existing website or start with Strap.",
    "You can update this later in your settings.",
    "You must be 18 or older to set up a business.",
    "Your country helps us set up your account correctly.",
    "Your prices and reports will use this currency.",
    "Use the name customers know your business by.",
    "This helps us keep your business information accurate.",
    "You can skip this and add it later.",
    "You can add or manage individual branches after setup.",
    "Tell us where your business operates.",
    "Add the state, province or region.",
    "Add the town or city.",
    "This is where customers and deliveries can find you.",
    "Optional — add a nearby landmark to make your shop easier to find.",
    "Optional.",
    "Add a logo or photo so customers can recognise your business.",
    "We’ll use this to suggest sensible workspace defaults.",
    "Choose the main outcome you want Strap to help with.",
    "You can change your plan or billing later.",
    "Review your setup and create your workspace.",
  ];
  const stepTitle = titles[step] ?? titles[titles.length - 1];
  const stepDescription = subtitles[step] ?? "";
  const nextStep = () => {
    if (step === 3 && websiteStatus !== "existing") return 5;
    if (step === 9 && registrationStatus !== "registered") return 11;
    return Math.min(step + 1, 22);
  };
  const backStep = () => {
    if (step === 5 && websiteStatus !== "existing") return 3;
    if (step === 11 && registrationStatus !== "registered") return 9;
    return Math.max(0, step - 1);
  };
  const advance = () => setStep(nextStep());
  const pick = <T,>(value: T, setter: React.Dispatch<React.SetStateAction<T>>) => {
    setter(value);
    window.setTimeout(() => advance(), 120);
  };
  return (
    <main className="ob-proto-flow">
      <form className="ob-proto-step" onSubmit={(event) => { event.preventDefault(); if (step === 22) void finish(); else advance(); }}>
        <header className="ob-proto-header">
          {step > 0 ? (
            <button type="button" className="ob-proto-back" aria-label="Go back" onClick={() => setStep(backStep())}>
              <span aria-hidden="true">←</span>
            </button>
          ) : <span className="ob-proto-back-spacer" />}
          <span className="ob-proto-count">{step + 1} / 23</span>
        </header>
        <div className="ob-proto-progress"><i style={{ width: `${((step + 1) / 23) * 100}%` }} /></div>
        <section className="ob-proto-body" key={step}>
          <h1 className="ob-proto-title">{stepTitle}</h1>
          <p className="ob-proto-sub">{stepDescription}</p>

          {step === 0 && (
            <div className="ob-proto-options">
              <button type="button" className={`ob-proto-option ${businessModel === "physical" ? "selected" : ""}`} onClick={() => pick("physical", setBusinessModel)}>Physical business</button>
              <button type="button" className={`ob-proto-option ${businessModel === "online" ? "selected" : ""}`} onClick={() => pick("online", setBusinessModel)}>Online business</button>
              <button type="button" className={`ob-proto-option ${businessModel === "both" ? "selected" : ""}`} onClick={() => pick("both", setBusinessModel)}>Physical + online</button>
            </div>
          )}
          {step === 1 && <input className="ob-proto-field" autoFocus value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="e.g. groceries, clothing, electronics" />}
          {step === 2 && (
            <select className="ob-proto-field ob-proto-select" autoFocus value={businessMode} onChange={(e) => setBusinessMode(e.target.value as BusinessModeKey)}>
              <option value="">Select business mode</option>
              {BUSINESS_MODES.map((mode) => <option key={mode.key} value={mode.key}>{mode.label}</option>)}
            </select>
          )}
          {step === 3 && (
            <div className="ob-proto-options">
              <button type="button" className={`ob-proto-option ${websiteStatus === "existing" ? "selected" : ""}`} onClick={() => pick("existing", setWebsiteStatus)}>Yes, I have a website</button>
              <button type="button" className={`ob-proto-option ${websiteStatus === "strap" ? "selected" : ""}`} onClick={() => { setWebsiteStatus("strap"); setOnlineStoreEnabled(true); window.setTimeout(advance,120); }}>I want Strap to set one up later</button>
              <button type="button" className={`ob-proto-option ${websiteStatus === "none" ? "selected" : ""}`} onClick={() => { setWebsiteStatus("none"); setOnlineStoreEnabled(false); window.setTimeout(advance,120); }}>No, not now</button>
            </div>
          )}
          {step === 4 && <input className="ob-proto-field" autoFocus inputMode="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="www.mybusiness.com" />}
          {step === 5 && <input className="ob-proto-field" autoFocus type="date" max={new Date().toISOString().slice(0,10)} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />}
          {step === 6 && (
            <select className="ob-proto-field ob-proto-select" autoFocus value={personalCountry} onChange={(e) => setPersonalCountry(e.target.value)}>
              <option value="">Select your country</option>{COUNTRY_OPTIONS.map((country) => <option key={country}>{country}</option>)}
            </select>
          )}
          {step === 7 && (
            <select className="ob-proto-field ob-proto-select" autoFocus value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="">Select currency</option>
              {[["NGN","Nigerian naira (NGN)"],["GHS","Ghanaian cedi (GHS)"],["KES","Kenyan shilling (KES)"],["ZAR","South African rand (ZAR)"],["EGP","Egyptian pound (EGP)"],["UGX","Ugandan shilling (UGX)"],["TZS","Tanzanian shilling (TZS)"],["RWF","Rwandan franc (RWF)"],["XOF","West African CFA franc (XOF)"],["XAF","Central African CFA franc (XAF)"],["GBP","British pound (GBP)"],["USD","US dollar (USD)"],["EUR","Euro (EUR)"],["CAD","Canadian dollar (CAD)"],["AED","UAE dirham (AED)"],["INR","Indian rupee (INR)"]].map(([code,label]) => <option key={code} value={code}>{label}</option>)}
            </select>
          )}
          {step === 8 && <input className="ob-proto-field" autoFocus value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Your business name" />}
          {step === 9 && (
            <div className="ob-proto-options">
              <button type="button" className={`ob-proto-option ${registrationStatus === "registered" ? "selected" : ""}`} onClick={() => pick("registered", setRegistrationStatus)}>Yes</button>
              <button type="button" className={`ob-proto-option ${registrationStatus === "not_registered" ? "selected" : ""}`} onClick={() => pick("not_registered", setRegistrationStatus)}>No</button>
              <button type="button" className={`ob-proto-option ${registrationStatus === "in_progress" ? "selected" : ""}`} onClick={() => pick("in_progress", setRegistrationStatus)}>In progress</button>
            </div>
          )}
          {step === 10 && <input className="ob-proto-field" autoFocus value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} placeholder="e.g. RC1234567" />}
          {step === 11 && (
            <div className="ob-proto-options">
              {(["1","2-5","6-20","20+"] as const).map((value) => <button key={value} type="button" className={`ob-proto-option ${declaredBranchCount === value ? "selected" : ""}`} onClick={() => pick(value, setDeclaredBranchCount)}>{value === "1" ? "1 (single shop)" : value === "20+" ? "More than 20" : value.replace("-", " to ")}</button>)}
            </div>
          )}
          {step === 12 && (
            <select className="ob-proto-field ob-proto-select" autoFocus value={businessCountry} onChange={(e) => setBusinessCountry(e.target.value)}>
              <option value="">Select country</option>{COUNTRY_OPTIONS.map((country) => <option key={country}>{country}</option>)}
            </select>
          )}
          {step === 13 && <input className="ob-proto-field" autoFocus value={businessState} onChange={(e) => setBusinessState(e.target.value)} placeholder="State or region" autoComplete="address-level1" />}
          {step === 14 && <input className="ob-proto-field" autoFocus value={businessCity} onChange={(e) => setBusinessCity(e.target.value)} placeholder="City or town" autoComplete="address-level2" />}
          {step === 15 && <input className="ob-proto-field" autoFocus value={businessStreet} onChange={(e) => setBusinessStreet(e.target.value)} placeholder="Street address" autoComplete="street-address" />}
          {step === 16 && <input className="ob-proto-field" autoFocus value={businessLandmark} onChange={(e) => setBusinessLandmark(e.target.value)} placeholder="Nearby landmark (optional)" />}
          {step === 17 && <input className="ob-proto-field" autoFocus value={businessPostcode} onChange={(e) => setBusinessPostcode(e.target.value)} placeholder="Postal code (optional)" autoComplete="postal-code" />}
          {step === 18 && (
            <div className="ob-proto-upload">
              <div className="ob-proto-avatar">{businessPhoto ? <span>✓</span> : <span>＋</span>}</div>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 5 * 1024 * 1024) { toast.error("Choose an image smaller than 5 MB."); return; } setBusinessPhoto(file); }} />
              <p>JPG, PNG or WebP · up to 5 MB</p>
            </div>
          )}
          {step === 19 && (
            <div className="ob-proto-options">
              {TEAM_OPTIONS.map((value) => <button key={value} type="button" className={`ob-proto-option ${teamSize === value ? "selected" : ""}`} onClick={() => pick(value, setTeamSize)}>{value}</button>)}
            </div>
          )}
          {step === 20 && (
            <div className="ob-proto-options">
              {GOAL_OPTIONS.map((value) => <button key={value} type="button" className={`ob-proto-option ${goal === value ? "selected" : ""}`} onClick={() => pick(value, setGoal)}>{value}</button>)}
            </div>
          )}
          {step === 21 && (
            <>
              <div className="ob-proto-billing">
                <button type="button" className={billing === "month" ? "active" : ""} onClick={() => setBilling("month")}>Monthly</button>
                <button type="button" className={billing === "year" ? "active" : ""} onClick={() => setBilling("year")}>Yearly · save 20%</button>
              </div>
              <div className="ob-proto-options">
                {(Object.keys(PLANS) as Plan[]).map((code) => {
                  const p = PLANS[code];
                  return <button type="button" key={code} className={`ob-proto-option ob-proto-plan ${plan === code ? "selected" : ""}`} onClick={() => setPlan(code)}>
                    <strong>{p.name}</strong><span>{p.description}</span><b>{p.monthly === 0 ? "Free" : `₦${(billing === "year" ? p.yearly : p.monthly).toLocaleString()}`}{p.monthly > 0 ? ` / ${billing === "year" ? "year" : "month"}` : ""}</b>
                  </button>;
                })}
              </div>
            </>
          )}
          {step === 22 && (
            <div className="ob-proto-review">
              <strong>{businessName || "Your business"}</strong>
              <p>{businessType} · {BUSINESS_MODES.find((mode) => mode.key === businessMode)?.label}</p>
              <p>{[businessStreet,businessLandmark,businessCity,businessState,businessCountry,businessPostcode].filter(Boolean).join(", ")}</p>
              <p>{registrationStatus === "registered" ? "Registered" : registrationStatus === "in_progress" ? "Registration in progress" : "Not registered"} · {declaredBranchCount} branches</p>
              <p>{selectedPlan?.name} · {priceLabel}</p>
            </div>
          )}
        </section>

        <footer className="ob-proto-footer">
          {step === 10 && <button type="button" className="ob-proto-skip" onClick={() => setStep(11)}>Skip for now</button>}
          {(step === 16 || step === 17 || step === 18) && <button type="button" className="ob-proto-skip" onClick={advance}>Not now</button>}
          {step < 22 ? (
            <button type="submit" className="ob-proto-continue" disabled={!canContinue() && step !== 10 && step !== 16 && step !== 17 && step !== 18}>
              Continue <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button type="submit" className="ob-proto-continue" disabled={submitting || !plan}>
              {submitting ? "Setting up…" : "Open my workspace"} <span aria-hidden="true">→</span>
            </button>
          )}
          <p className="ob-proto-powered">Powered by Strap</p>
        </footer>
      </form>
    </main>
  );
}
}
