import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { errorMessage } from "@/lib/format";
import "@/strap-auth.css";
import "@/strap-onboarding.css";
import "@/strap-reference.css";

type RegistrationStatus = "registered" | "not_registered" | "in_progress" | "";
type WebsiteStatus = "existing" | "strap" | "none" | "";
type BranchCount = "1" | "2-5" | "6-20" | "20+" | "";

const COUNTRY_OPTIONS = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Egypt", "Uganda", "Tanzania",
  "Rwanda", "Senegal", "Côte d’Ivoire", "Cameroon", "United Kingdom",
  "United States", "Canada", "United Arab Emirates", "India", "Other",
];

export const Route = createFileRoute("/_authenticated/compliance-setup")({
  head: () => ({
    meta: [
      { title: "Complete your business profile — Strap" },
      { name: "description", content: "Complete your personal and business compliance details." },
    ],
  }),
  component: ComplianceSetupPage,
});

function ComplianceSetupPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberships, isLoading, error, userId } = useStoreContext();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [storeId, setStoreId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [personalCountry, setPersonalCountry] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [branchCount, setBranchCount] = useState<BranchCount>("");
  const [businessCountry, setBusinessCountry] = useState("");
  const [businessState, setBusinessState] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessStreet, setBusinessStreet] = useState("");
  const [businessLandmark, setBusinessLandmark] = useState("");
  const [businessPostcode, setBusinessPostcode] = useState("");
  const [websiteStatus, setWebsiteStatus] = useState<WebsiteStatus>("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [wantsStrapWebsite, setWantsStrapWebsite] = useState(false);
  const [businessPhoto, setBusinessPhoto] = useState<File | null>(null);
  const [existingPhotoUrl, setExistingPhotoUrl] = useState("");

  const ownedMemberships = useMemo(
    () => memberships.filter((membership) => membership.store.owner_id === userId),
    [memberships, userId],
  );
  const selectedMembership = ownedMemberships.find((membership) => membership.store.id === storeId);

  useEffect(() => {
    if (isLoading || loading === false) return;
    if (error) {
      setLoadError(error.message);
      setLoading(false);
      return;
    }
    if (ownedMemberships.length === 0) {
      void navigate({ to: "/dashboard", replace: true });
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      const storeIds = ownedMemberships.map((membership) => membership.store.id);
      const [profileResult, complianceResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("date_of_birth, country")
          .eq("id", userId)
          .maybeSingle(),
        supabase
          .from("store_compliance_profiles")
          .select("*")
          .in("store_id", storeIds),
      ]);
      if (profileResult.error) throw new Error(profileResult.error.message);
      if (complianceResult.error) throw new Error(complianceResult.error.message);

      const completedStoreIds = new Set((complianceResult.data ?? []).map((row) => row.store_id));
      const target =
        ownedMemberships.find((membership) => !completedStoreIds.has(membership.store.id)) ??
        ownedMemberships[0]!;
      const store = target.store;
      const compliance = (complianceResult.data ?? []).find((row) => row.store_id === store.id) ?? null;
      const profile = profileResult.data;
      const settings = store.storefront_settings && typeof store.storefront_settings === "object"
        ? (store.storefront_settings as Record<string, unknown>)
        : {};
      const onboarding = settings.onboarding && typeof settings.onboarding === "object"
        ? (settings.onboarding as Record<string, unknown>)
        : {};
      const fallbackWebsiteStatus = onboarding.websiteStatus;
      const validWebsiteStatus =
        fallbackWebsiteStatus === "existing" || fallbackWebsiteStatus === "strap" || fallbackWebsiteStatus === "none"
          ? fallbackWebsiteStatus
          : "";

      if (cancelled) return;
      setStoreId(store.id);
      setStoreName(store.name);
      setDateOfBirth(profile?.date_of_birth ?? "");
      setPersonalCountry(profile?.country ?? "");
      setRegistrationStatus((compliance?.registration_status as RegistrationStatus) ?? "");
      setRegistrationNumber(compliance?.registration_number ?? "");
      setBranchCount((compliance?.declared_branch_count as BranchCount) ?? "");
      setBusinessCountry(compliance?.business_country ?? profile?.country ?? "");
      setBusinessState(compliance?.business_state ?? "");
      setBusinessCity(compliance?.business_city ?? "");
      setBusinessStreet(compliance?.business_street ?? store.address ?? "");
      setBusinessLandmark(compliance?.business_landmark ?? "");
      setBusinessPostcode(compliance?.business_postcode ?? "");
      setWebsiteStatus((compliance?.website_status as WebsiteStatus) ?? validWebsiteStatus);
      setWebsiteUrl(compliance?.website_url ?? String(onboarding.websiteUrl ?? ""));
      setWantsStrapWebsite(
        compliance?.wants_strap_website ?? Boolean(onboarding.onlineStoreEnabled ?? settings.onlineStoreEnabled),
      );
      setExistingPhotoUrl(compliance?.business_profile_photo_url ?? store.logo_url ?? "");
      setLoading(false);
    })().catch((loadFailure) => {
      if (cancelled) return;
      setLoadError(errorMessage(loadFailure, "We couldn't load your business details."));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [error, isLoading, loading, navigate, ownedMemberships, userId]);

  async function saveComplianceDetails() {
    const born = dateOfBirth ? new Date(dateOfBirth + "T00:00:00") : null;
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 18);
    if (!born || !Number.isFinite(born.getTime()) || born > cutoff) {
      toast.error("Enter a valid date of birth. You must be at least 18 years old.");
      return;
    }
    if (!personalCountry || !registrationStatus || !branchCount || !businessCountry ||
      !businessState.trim() || !businessCity.trim() || !businessStreet.trim() || !websiteStatus) {
      toast.error("Complete all required personal and business details.");
      return;
    }
    if (websiteStatus === "existing" && !/^https?:\/\//i.test(websiteUrl.trim())) {
      toast.error("Enter a valid website URL beginning with http:// or https://.");
      return;
    }
    if (!storeId || !selectedMembership) {
      toast.error("We couldn't identify the business profile to update.");
      return;
    }

    setSaving(true);
    try {
      const { data: authResult, error: authError } = await supabase.auth.getUser();
      if (authError || !authResult.user || authResult.user.id !== userId)
        throw new Error("Your session could not be verified. Please sign in again.");

      const { data: existingProfile, error: profileLookupError } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .maybeSingle();
      if (profileLookupError) throw new Error(profileLookupError.message);
      const profileName = existingProfile?.full_name ||
        String(authResult.user.user_metadata?.full_name ?? authResult.user.user_metadata?.name ?? "");
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

      const fullAddress = [
        businessStreet.trim(),
        businessLandmark.trim(),
        businessCity.trim(),
        businessState.trim(),
        businessCountry.trim(),
        businessPostcode.trim(),
      ].filter(Boolean).join(", ");

      let photoUrl = existingPhotoUrl;
      if (businessPhoto) {
        const extension = businessPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = storeId + "/" + userId + "/business-profile-" + Date.now() + "." + extension;
        const { error: uploadError } = await supabase.storage
          .from("kudi-store-assets")
          .upload(path, businessPhoto, {
            upsert: true,
            contentType: businessPhoto.type || "image/jpeg",
            cacheControl: "3600",
          });
        if (uploadError) {
          toast.error("Your details will be saved, but the profile photo could not be uploaded. You can add it later.");
        } else {
          photoUrl = supabase.storage.from("kudi-store-assets").getPublicUrl(path).data.publicUrl;
        }
      }

      const currentSettings = selectedMembership.store.storefront_settings &&
        typeof selectedMembership.store.storefront_settings === "object"
        ? (selectedMembership.store.storefront_settings as Record<string, unknown>)
        : {};
      const currentOnboarding = currentSettings.onboarding && typeof currentSettings.onboarding === "object"
        ? (currentSettings.onboarding as Record<string, unknown>)
        : {};
      const storefrontSettings = {
        ...currentSettings,
        onboarding: {
          ...currentOnboarding,
          version: 3,
          address: fullAddress,
          websiteStatus,
          websiteUrl: websiteStatus === "existing" ? websiteUrl.trim() : "",
          onlineStoreEnabled: wantsStrapWebsite,
          registrationStatus,
          declaredBranchCount: branchCount,
          businessCountry,
          businessState: businessState.trim(),
          businessCity: businessCity.trim(),
        },
        onlineStoreEnabled: wantsStrapWebsite,
        externalWebsite: websiteStatus === "existing" ? websiteUrl.trim() : "",
      };

      const { error: storeError } = await supabase
        .from("stores")
        .update({
          address: fullAddress,
          ...(photoUrl ? { logo_url: photoUrl } : {}),
          storefront_settings: storefrontSettings as Json,
        })
        .eq("id", storeId);
      if (storeError) throw new Error(storeError.message);

      const { error: branchError } = await supabase
        .from("branches")
        .update({ address: fullAddress })
        .eq("store_id", storeId)
        .eq("is_default", true);
      if (branchError) throw new Error(branchError.message);

      const { error: complianceError } = await supabase.from("store_compliance_profiles").upsert(
        {
          store_id: storeId,
          owner_id: userId,
          registration_status: registrationStatus,
          registration_number: registrationNumber.trim() || null,
          declared_branch_count: branchCount,
          business_country: businessCountry,
          business_state: businessState.trim(),
          business_city: businessCity.trim(),
          business_street: businessStreet.trim(),
          business_landmark: businessLandmark.trim() || null,
          business_postcode: businessPostcode.trim() || null,
          website_status: websiteStatus,
          website_url: websiteStatus === "existing" ? websiteUrl.trim() : null,
          wants_strap_website: wantsStrapWebsite,
          business_profile_photo_url: photoUrl || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" },
      );
      if (complianceError) throw new Error(complianceError.message);

      toast.success("Your business compliance details have been saved.");
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      void navigate({ to: "/dashboard", replace: true });
    } catch (saveError) {
      toast.error(errorMessage(saveError, "We couldn't save your compliance details."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
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
            <div className="sa-box ob-box">
              <p className="ob-kicker">Account update</p>
              <h1>Loading your business profile…</h1>
              <p className="sa-mut">Please wait while we securely retrieve your saved details.</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (loadError) {
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
            <div className="sa-box ob-box">
              <p className="ob-kicker">Account update</p>
              <h1>We couldn’t load your details</h1>
              <p className="sa-mut" role="alert">{loadError}</p>
              <button type="button" className="sa-b p" onClick={() => window.location.reload()}>
                Try again
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

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
          <div className="sa-box ob-box">
            <p className="ob-kicker">Required account update</p>
            <h1>Complete your business profile</h1>
            <p className="sa-mut">
              We need these details for your account and business compliance records. You can continue using your workspace once the required information is saved.
            </p>
            <p className="ob-hint">
              Updating: <strong>{storeName}</strong>. Your details are private to your account and platform compliance administrators; ordinary store staff cannot view them.
            </p>

            <form
              className="ob-body"
              onSubmit={(event) => {
                event.preventDefault();
                void saveComplianceDetails();
              }}
            >
              <div className="sa-f">
                <label htmlFor="compliance-dob">Date of birth</label>
                <input
                  id="compliance-dob"
                  className="sa-in"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={dateOfBirth}
                  onChange={(event) => setDateOfBirth(event.target.value)}
                  required
                />
                <p className="ob-hint">You must be at least 18 years old.</p>
              </div>

              <div className="sa-f">
                <label htmlFor="compliance-personal-country">Country of residence</label>
                <select
                  id="compliance-personal-country"
                  className="sa-in"
                  value={personalCountry}
                  onChange={(event) => setPersonalCountry(event.target.value)}
                  required
                >
                  <option value="">Select your country</option>
                  {COUNTRY_OPTIONS.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>

              <div className="sa-f">
                <label htmlFor="compliance-registration-status">Business registration status</label>
                <select
                  id="compliance-registration-status"
                  className="sa-in"
                  value={registrationStatus}
                  onChange={(event) => setRegistrationStatus(event.target.value as RegistrationStatus)}
                  required
                >
                  <option value="">Select status</option>
                  <option value="registered">Registered</option>
                  <option value="not_registered">Not registered</option>
                  <option value="in_progress">Registration in progress</option>
                </select>
              </div>

              <div className="sa-f">
                <label htmlFor="compliance-registration-number">Business registration number <span className="ob-hint">(optional if not available yet)</span></label>
                <input
                  id="compliance-registration-number"
                  className="sa-in"
                  value={registrationNumber}
                  onChange={(event) => setRegistrationNumber(event.target.value)}
                  placeholder="e.g. RC1234567"
                  autoCapitalize="characters"
                />
              </div>

              <div className="sa-f">
                <label htmlFor="compliance-branch-count">How many branches do you operate?</label>
                <select
                  id="compliance-branch-count"
                  className="sa-in"
                  value={branchCount}
                  onChange={(event) => setBranchCount(event.target.value as BranchCount)}
                  required
                >
                  <option value="">Select branch count</option>
                  <option value="1">1 (single location)</option>
                  <option value="2-5">2 to 5</option>
                  <option value="6-20">6 to 20</option>
                  <option value="20+">More than 20</option>
                </select>
              </div>

              <div className="sa-f">
                <label htmlFor="compliance-business-country">Business country</label>
                <select
                  id="compliance-business-country"
                  className="sa-in"
                  value={businessCountry}
                  onChange={(event) => setBusinessCountry(event.target.value)}
                  required
                >
                  <option value="">Select country</option>
                  {COUNTRY_OPTIONS.map((country) => <option key={country} value={country}>{country}</option>)}
                </select>
              </div>

              <div className="ob-g2">
                <div className="sa-f">
                  <label htmlFor="compliance-business-state">State / region</label>
                  <input
                    id="compliance-business-state"
                    className="sa-in"
                    value={businessState}
                    onChange={(event) => setBusinessState(event.target.value)}
                    placeholder="State or region"
                    autoComplete="address-level1"
                    required
                  />
                </div>
                <div className="sa-f">
                  <label htmlFor="compliance-business-city">City / town</label>
                  <input
                    id="compliance-business-city"
                    className="sa-in"
                    value={businessCity}
                    onChange={(event) => setBusinessCity(event.target.value)}
                    placeholder="City or town"
                    autoComplete="address-level2"
                    required
                  />
                </div>
              </div>

              <div className="sa-f">
                <label htmlFor="compliance-business-street">Street address</label>
                <input
                  id="compliance-business-street"
                  className="sa-in"
                  value={businessStreet}
                  onChange={(event) => setBusinessStreet(event.target.value)}
                  placeholder="House number, street and area"
                  autoComplete="street-address"
                  required
                />
                <p className="ob-hint">If your previous address is prefilled as one line, separate the street, city and region into their respective fields.</p>
              </div>

              <div className="ob-g2">
                <div className="sa-f">
                  <label htmlFor="compliance-business-landmark">Landmark <span className="ob-hint">(optional)</span></label>
                  <input
                    id="compliance-business-landmark"
                    className="sa-in"
                    value={businessLandmark}
                    onChange={(event) => setBusinessLandmark(event.target.value)}
                    placeholder="Nearby landmark"
                  />
                </div>
                <div className="sa-f">
                  <label htmlFor="compliance-business-postcode">Postal code <span className="ob-hint">(optional)</span></label>
                  <input
                    id="compliance-business-postcode"
                    className="sa-in"
                    value={businessPostcode}
                    onChange={(event) => setBusinessPostcode(event.target.value)}
                    placeholder="Postal code"
                    autoComplete="postal-code"
                  />
                </div>
              </div>

              <div className="sa-f">
                <label htmlFor="compliance-website-status">Website setup</label>
                <select
                  id="compliance-website-status"
                  className="sa-in"
                  value={websiteStatus}
                  onChange={(event) => {
                    const value = event.target.value as WebsiteStatus;
                    setWebsiteStatus(value);
                    setWantsStrapWebsite(value === "strap");
                  }}
                  required
                >
                  <option value="">Choose one</option>
                  <option value="existing">I already have a website</option>
                  <option value="strap">I want Strap to set up my website</option>
                  <option value="none">Not yet</option>
                </select>
              </div>

              {websiteStatus === "existing" && (
                <div className="sa-f">
                  <label htmlFor="compliance-website-url">Existing website URL</label>
                  <input
                    id="compliance-website-url"
                    className="sa-in"
                    type="url"
                    inputMode="url"
                    value={websiteUrl}
                    onChange={(event) => setWebsiteUrl(event.target.value)}
                    placeholder="https://yourbusiness.com"
                    required
                  />
                </div>
              )}

              {websiteStatus === "none" && (
                <label className="ob-row">
                  <span>
                    <strong>Would you like Strap to set up a website later?</strong>
                    <span className="ob-hint">You can change this preference at any time.</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={wantsStrapWebsite}
                    onChange={(event) => setWantsStrapWebsite(event.target.checked)}
                  />
                </label>
              )}

              <div className="sa-f">
                <label htmlFor="compliance-business-photo">Business profile picture <span className="ob-hint">(optional)</span></label>
                <input
                  id="compliance-business-photo"
                  className="sa-in ob-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    if (file && !["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
                      toast.error("Choose a PNG, JPG or WebP image.");
                      event.target.value = "";
                      setBusinessPhoto(null);
                      return;
                    }
                    if (file && file.size > 5 * 1024 * 1024) {
                      toast.error("Choose an image smaller than 5 MB.");
                      event.target.value = "";
                      setBusinessPhoto(null);
                      return;
                    }
                    setBusinessPhoto(file);
                  }}
                />
                <p className="ob-hint">{businessPhoto ? businessPhoto.name : existingPhotoUrl ? "A business profile picture is already saved. Choose a new one to replace it." : "PNG, JPG or WebP. Maximum 5 MB."}</p>
              </div>

              <div className="ob-nav">
                <button type="submit" className="sa-b p" disabled={saving}>
                  {saving ? "Saving your details…" : "Save and continue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
