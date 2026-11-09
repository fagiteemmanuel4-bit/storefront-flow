import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  MapPin,
  Package,
  Sparkles,
  Store,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/connect-supplier-setup")({
  head: () => ({
    meta: [
      { title: "Become a supplier — STRAP Connect" },
      { name: "description", content: "Set up your supplier profile on STRAP Connect." },
    ],
  }),
  component: SupplierSetupPage,
});

const categories = [
  "Fashion",
  "Electronics",
  "Beauty",
  "Phones & accessories",
  "Home & living",
  "Food & groceries",
  "Shoes & bags",
  "General",
];
const states = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

type SupplierDraft = {
  business_name: string;
  category: string;
  description: string;
  state: string;
  city: string;
  whatsapp_number: string;
};
const db = supabase as any;
const emptyDraft: SupplierDraft = {
  business_name: "",
  category: "Fashion",
  description: "",
  state: "",
  city: "",
  whatsapp_number: "",
};
const steps = [
  {
    title: "What should we call your business?",
    hint: "Enter the name your customers and retailers know.",
    field: "business",
  },
  {
    title: "What do you supply?",
    hint: "Choose the category that best describes your products.",
    field: "category",
  },
  {
    title: "Where are you based?",
    hint: "This helps nearby retailers discover your business.",
    field: "location",
  },
  {
    title: "Where can buyers reach you?",
    hint: "Your WhatsApp number will be used for direct enquiries.",
    field: "whatsapp",
  },
  {
    title: "Ready to meet your next customer?",
    hint: "Take a final look at your supplier profile.",
    field: "review",
  },
];

function tapFeedback(kind: "light" | "selection" | "success" = "light") {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const pattern = kind === "success" ? [18, 35, 28] : kind === "selection" ? 12 : 7;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* Haptics are an optional device capability. */
  }
}

function SupplierSetupPage() {
  const { userId } = useStoreContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<SupplierDraft>(emptyDraft);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorSlug, setVendorSlug] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [lineDrawn, setLineDrawn] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setLineDrawn(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let saved: SupplierDraft | null = null;
    try {
      const raw = window.localStorage.getItem(`strap-connect-supplier-draft:${userId}`);
      if (raw) saved = JSON.parse(raw) as SupplierDraft;
    } catch {
      saved = null;
    }
    if (saved) setDraft({ ...emptyDraft, ...saved });
    void (async () => {
      const { data, error } = await db
        .from("connect_vendors")
        .select("id,slug,business_name,category,description,state,city,whatsapp_number")
        .eq("owner_id", userId)
        .maybeSingle();
      if (error) {
        toast.error("We couldn't load your saved supplier profile.");
        return;
      }
      if (!data) return;
      setVendorId(data.id);
      setVendorSlug(data.slug);
      if (!saved)
        setDraft({
          business_name: data.business_name ?? "",
          category: data.category ?? "Fashion",
          description: data.description ?? "",
          state: data.state ?? "",
          city: data.city ?? "",
          whatsapp_number: data.whatsapp_number ?? "",
        });
    })();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      window.localStorage.setItem(`strap-connect-supplier-draft:${userId}`, JSON.stringify(draft));
    } catch {
      /* The form remains usable if browser storage is unavailable. */
    }
  }, [draft, userId]);

  const filteredStates = useMemo(
    () => states.filter((name) => name.toLowerCase().includes(stateSearch.toLowerCase())),
    [stateSearch],
  );
  const valid = useMemo(() => {
    if (step === 0) return draft.business_name.trim().length >= 2;
    if (step === 1) return Boolean(draft.category);
    if (step === 2) return Boolean(draft.state && draft.city.trim().length > 1);
    if (step === 3) return draft.whatsapp_number.replace(/\D/g, "").length >= 8;
    return true;
  }, [draft, step]);

  function update<K extends keyof SupplierDraft>(key: K, value: SupplierDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function continueStep() {
    if (!valid || busy || leaving) {
      if (step === 0) toast.error("Enter your business name to continue.");
      if (step === 2) toast.error("Choose your state and enter your city.");
      if (step === 3) toast.error("Enter a valid WhatsApp number with country code.");
      return;
    }
    tapFeedback("selection");
    setSaved(true);
    setLeaving(true);
    window.setTimeout(() => {
      setStep((current) => Math.min(steps.length - 1, current + 1));
      setLeaving(false);
      setSaved(false);
      setLineDrawn(false);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setLineDrawn(true)));
    }, 520);
  }

  function goBack() {
    if (step === 0 || leaving) return;
    tapFeedback();
    setLeaving(true);
    window.setTimeout(() => {
      setStep((current) => Math.max(0, current - 1));
      setLeaving(false);
      setLineDrawn(false);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setLineDrawn(true)));
    }, 220);
  }

  async function publishSupplier() {
    if (!userId || busy) return;
    tapFeedback("success");
    setBusy(true);
    const phone = draft.whatsapp_number.replace(/\D/g, "");
    const businessName = draft.business_name.trim();
    const slug =
      vendorSlug ??
      `${businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}-${userId.slice(0, 6)}`;
    const payload = {
      owner_id: userId,
      business_name: businessName,
      slug,
      category: draft.category,
      description: draft.description.trim(),
      state: draft.state.trim(),
      city: draft.city.trim(),
      whatsapp_number: phone,
      country: "Nigeria",
      is_published: true,
    };
    const result = vendorId
      ? await db.from("connect_vendors").update(payload).eq("id", vendorId)
      : await db.from("connect_vendors").insert(payload);
    setBusy(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    try {
      window.localStorage.removeItem(`strap-connect-supplier-draft:${userId}`);
    } catch {
      /* Ignore unavailable local storage. */
    }
    toast.success("Your supplier profile is now live on STRAP Connect.");
    await navigate({ to: "/connect" });
  }

  const field = steps[step].field;

  return (
    <main className="supplier-setup-shell relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#F7F7F5] text-[#101114] [font-family:Inter,Arial,sans-serif]">
      <header className="relative z-10 mx-auto flex h-[76px] w-full max-w-[520px] shrink-0 items-center justify-between px-[clamp(20px,6vw,32px)] sm:mt-8 sm:rounded-t-[28px] sm:bg-white sm:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 text-[15px] font-bold tracking-[0.16em] [font-family:'Inter_Tight',Inter,sans-serif]">STRAP</span>
          <span className="h-5 w-px shrink-0 bg-[#E3E3DF]" />
          <span className="truncate text-[14px] font-medium text-[#6B6F76] max-[359px]:hidden">Supplier setup</span>
        </div>
        <div aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-full border border-[#E3E3DF] bg-white text-[#101114]">
          <Store className="size-[17px]" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-[520px] px-[clamp(20px,6vw,32px)] pb-5 sm:bg-white sm:px-8">
        <div className="grid grid-cols-5 gap-2" aria-label={`Step ${step + 1} of 5`}>
          {steps.map((_, index) => <span key={index} className={`h-[3px] rounded-full ${index <= step ? "bg-[#101114]" : "bg-[#E3E3DF]"}`} />)}
        </div>
        <p className="mt-3 text-[13px] font-medium text-[#6B6F76]">Step {step + 1} of 5</p>
      </div>

      <div className="supplier-setup-content mx-auto flex w-full max-w-[520px] flex-1 flex-col justify-center bg-transparent px-[clamp(20px,6vw,32px)] pb-36 pt-8 sm:bg-white sm:px-8 sm:pb-10 sm:pt-4">
        <div
          key={step}
          className={`w-full transition-all duration-250 ease-out ${leaving ? "translate-y-5 opacity-0" : "translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-3 duration-500"}`}
        >
          <div className="mb-7 flex items-center justify-between">
            <span className="text-[13px] font-medium text-[#6B6F76]">Step {step + 1} of {steps.length}</span>
            {step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B6F76] transition-colors hover:text-[#101114] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#101114] motion-reduce:transition-none"
              >
                <ArrowLeft className="size-3.5" /> Back
              </button>
            )}
          </div>

          <h1 className="max-w-[460px] text-[clamp(32px,6vw,44px)] font-semibold leading-[1.08] tracking-[-0.035em] [font-family:'Inter_Tight',Inter,sans-serif]">
            {steps[step].title}
          </h1>
          <p className="mt-3 max-w-xl text-[16px] leading-6 text-[#6B6F76]">
            {steps[step].hint}
          </p>

          <div className="mt-9 min-h-[150px]">
            {field === "business" && (
              <div className="max-w-xl">
                <label htmlFor="supplier-business-name" className="mb-2 block text-[14px] font-medium text-[#101114]">
                  Business name
                </label>
                <Input
                  id="supplier-business-name"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  autoFocus
                  value={draft.business_name}
                  onFocus={() => tapFeedback("light")}
                  onChange={(event) => update("business_name", event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter" && valid) continueStep(); }}
                  placeholder="Your business name"
                  maxLength={120}
                  className="h-[58px] rounded-[14px] border border-[#CFCFCA] bg-white px-4 text-[16px] text-[#101114] shadow-none placeholder:text-[#A3A7AD] transition-[border-color,box-shadow] duration-150 focus-visible:border-[#101114] focus-visible:ring-4 focus-visible:ring-[rgba(16,17,20,.07)] focus-visible:ring-offset-0 motion-reduce:transition-none"
                />
                <p className="mt-2.5 text-[13px] leading-5 text-[#6B6F76]">You can change this later in settings.</p>
                <section aria-live="polite" className="mt-7 rounded-[18px] border border-[#E3E3DF] bg-white p-5 shadow-[0_1px_2px_rgba(16,17,20,.025),0_8px_24px_rgba(16,17,20,.035)]">
                  <p className="text-[13px] font-medium text-[#6B6F76]">Preview</p>
                  <div className="mt-4 flex min-w-0 items-center gap-3.5">
                    <div className={`grid size-12 shrink-0 place-items-center rounded-[14px] bg-[#101114] text-[20px] font-semibold text-white [font-family:'Inter_Tight',Inter,sans-serif] ${draft.business_name.trim() ? "opacity-100" : "opacity-35"}`}>
                      {draft.business_name.trim().charAt(0).toUpperCase() || "S"}
                    </div>
                    <div className="min-w-0">
                      <p className={`truncate text-[18px] font-semibold tracking-[-0.025em] [font-family:'Inter_Tight',Inter,sans-serif] ${draft.business_name.trim() ? "text-[#101114]" : "text-[#A3A7AD]"}`}>
                        {draft.business_name.trim() || "Your business name"}
                      </p>
                      <p className="mt-1 text-[13px] text-[#6B6F76]">How retailers will see you</p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {field === "category" && (
              <div className="max-w-xl">
                <button
                  type="button"
                  onClick={() => {
                    tapFeedback();
                    setCategoryPickerOpen(true);
                  }}
                  className="flex min-h-[68px] w-full items-center justify-between border-b border-border text-left text-xl transition hover:border-foreground/60 sm:text-2xl"
                >
                  <span className="flex items-center gap-3">
                    <Package className="size-5 text-muted-foreground" />
                    {draft.category || "Choose a category"}
                  </span>
                  <ChevronDown className="size-5 text-muted-foreground" />
                </button>
                <p className="mt-4 text-xs text-muted-foreground">
                  Tap to open the category selector.
                </p>
                {categoryPickerOpen && (
                  <div
                    className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
                    role="presentation"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) setCategoryPickerOpen(false);
                    }}
                  >
                    <section
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="category-picker-title"
                      className="w-full max-w-xl rounded-t-[28px] border border-border bg-background p-5 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 sm:rounded-[28px] sm:p-7"
                    >
                      <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border sm:hidden" />
                      <h2
                        id="category-picker-title"
                        className="text-xl font-semibold tracking-tight"
                      >
                        Choose your category
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        What kind of products do you supply?
                      </p>
                      <div className="mt-6 grid grid-cols-2 gap-2">
                        {categories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => {
                              tapFeedback("selection");
                              update("category", category);
                              setCategoryPickerOpen(false);
                            }}
                            className={`flex min-h-[58px] items-center justify-between rounded-xl border px-3 text-left text-sm font-medium transition active:scale-[.98] ${draft.category === category ? "border-[#101114] bg-[#101114]/5" : "border-border bg-surface hover:bg-secondary"}`}
                          >
                            {category}
                            {draft.category === category && (
                              <Check className="size-4 text-[#101114]" />
                            )}
                          </button>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        className="mt-5 w-full"
                        onClick={() => setCategoryPickerOpen(false)}
                      >
                        Close
                      </Button>
                    </section>
                  </div>
                )}
                <div className="mt-8 max-w-xl">
                  <label
                    htmlFor="supplier-description"
                    className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground"
                  >
                    A LITTLE ABOUT YOUR PRODUCTS{" "}
                    <span className="font-normal normal-case tracking-normal">(optional)</span>
                  </label>
                  <textarea
                    id="supplier-description"
                    value={draft.description}
                    onFocus={() => tapFeedback()}
                    onChange={(event) => update("description", event.target.value)}
                    maxLength={1200}
                    rows={2}
                    placeholder="What do you sell?"
                    className="w-full resize-none border-0 border-b border-border bg-transparent px-0 py-3 text-base outline-none placeholder:text-muted-foreground/40 focus:border-foreground"
                  />
                </div>
              </div>
            )}

            {field === "location" && (
              <div className="max-w-xl space-y-8">
                <div>
                  <label className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">
                    STATE
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      tapFeedback();
                      setStatePickerOpen(true);
                    }}
                    className="flex min-h-[60px] w-full items-center justify-between border-b border-border text-left text-xl transition hover:border-foreground/60"
                  >
                    <span className={draft.state ? "text-foreground" : "text-muted-foreground/50"}>
                      {draft.state || "Select your state"}
                    </span>
                    <ChevronDown className="size-5 text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <label
                    htmlFor="supplier-city"
                    className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground"
                  >
                    CITY OR AREA
                  </label>
                  <Input
                    id="supplier-city"
                    value={draft.city}
                    onFocus={() => tapFeedback()}
                    onChange={(event) => update("city", event.target.value)}
                    placeholder="e.g. Wuse, Ikeja, Onitsha"
                    maxLength={80}
                    className="h-[60px] rounded-none border-0 border-b border-border bg-transparent px-0 text-xl shadow-none placeholder:text-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0"
                  />
                </div>
                {statePickerOpen && (
                  <div
                    className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5"
                    role="presentation"
                    onMouseDown={(event) => {
                      if (event.target === event.currentTarget) setStatePickerOpen(false);
                    }}
                  >
                    <section
                      role="dialog"
                      aria-modal="true"
                      aria-labelledby="state-picker-title"
                      className="flex max-h-[82dvh] w-full max-w-xl flex-col rounded-t-[28px] border border-border bg-background p-5 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 sm:rounded-[28px] sm:p-7"
                    >
                      <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border sm:hidden" />
                      <h2 id="state-picker-title" className="text-xl font-semibold">
                        Choose your state
                      </h2>
                      <Input
                        autoFocus
                        value={stateSearch}
                        onChange={(event) => setStateSearch(event.target.value)}
                        placeholder="Search states…"
                        className="mt-5 h-11 rounded-xl"
                      />
                      <div className="mt-3 overflow-y-auto">
                        {filteredStates.map((name) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => {
                              tapFeedback("selection");
                              update("state", name);
                              setStatePickerOpen(false);
                              setStateSearch("");
                            }}
                            className={`flex min-h-12 w-full items-center justify-between border-b border-border/70 px-2 text-left text-sm transition hover:bg-secondary ${draft.state === name ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                          >
                            {name}
                            {draft.state === name && <Check className="size-4 text-[#101114]" />}
                          </button>
                        ))}
                        {filteredStates.length === 0 && (
                          <p className="p-5 text-center text-sm text-muted-foreground">
                            No matching state found.
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        className="mt-4 w-full"
                        onClick={() => setStatePickerOpen(false)}
                      >
                        Close
                      </Button>
                    </section>
                  </div>
                )}
              </div>
            )}

            {field === "whatsapp" && (
              <div className="max-w-xl">
                <label
                  htmlFor="supplier-whatsapp"
                  className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground"
                >
                  WHATSAPP NUMBER · INCLUDE COUNTRY CODE
                </label>
                <Input
                  id="supplier-whatsapp"
                  autoFocus
                  inputMode="tel"
                  value={draft.whatsapp_number}
                  onFocus={() => tapFeedback()}
                  onChange={(event) => update("whatsapp_number", event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && valid) continueStep();
                  }}
                  placeholder="+234 801 234 5678"
                  maxLength={32}
                  className="h-[64px] rounded-none border-0 border-b border-border bg-transparent px-0 text-xl shadow-none placeholder:text-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0 sm:text-2xl"
                />
                <p className="mt-4 max-w-lg text-xs leading-5 text-muted-foreground">
                  Buyers will contact you directly on this number. Use a WhatsApp number you
                  control. Ownership verification is not yet available.
                </p>
              </div>
            )}

            {field === "review" && (
              <div className="max-w-xl divide-y divide-border border-y border-border">
                {[
                  ["Business", draft.business_name],
                  ["Category", draft.category],
                  ["About", draft.description || "Not added"],
                  ["Location", [draft.city, draft.state].filter(Boolean).join(", ")],
                  ["WhatsApp", draft.whatsapp_number],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-1 py-4 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                      {label}
                    </span>
                    <span className="text-sm font-medium sm:max-w-[65%] sm:text-right">
                      {value}
                    </span>
                  </div>
                ))}
                <p className="py-4 text-xs leading-5 text-muted-foreground">
                  Publishing makes your supplier profile visible to buyers on STRAP Connect. You can
                  update it later.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

            <div
        className="fixed inset-x-0 bottom-0 z-[70] mx-auto w-full max-w-[520px] bg-[#F7F7F5] px-[clamp(20px,6vw,32px)] pb-[max(16px,env(safe-area-inset-bottom))] pt-4 sm:rounded-b-[28px] sm:bg-white sm:pt-5"
      >
        {step === steps.length - 1 ? (
          <Button
            type="button"
            disabled={busy}
            onClick={() => void publishSupplier()}
            className="h-14 w-full rounded-[14px] bg-[#101114] text-[16px] font-semibold text-white shadow-none transition-transform duration-150 active:scale-[.985] hover:bg-[#101114] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#101114] disabled:opacity-25 motion-reduce:transition-none"
          >
            {busy ? "Publishing…" : "Publish supplier profile"} <Check className="ml-2 size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={continueStep}
            disabled={!valid || busy || leaving}
            className="h-14 w-full rounded-[14px] bg-[#101114] text-[16px] font-semibold text-white shadow-none transition-transform duration-150 active:scale-[.985] hover:bg-[#101114] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#101114] disabled:opacity-25 motion-reduce:transition-none"
          >
            {saved ? "Saved" : "Continue"} <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
      <style>{`@media (min-width:640px){.supplier-setup-shell{padding-bottom:24px}.supplier-setup-content{border-radius:0 0 28px 28px;box-shadow:0 18px 60px rgba(16,17,20,.07)}.supplier-setup-shell>header{box-shadow:0 -1px 0 #fff;background:#fff}}@media(prefers-reduced-motion:reduce){.supplier-setup-shell *{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}`}</style>
    </main>
  );
}
