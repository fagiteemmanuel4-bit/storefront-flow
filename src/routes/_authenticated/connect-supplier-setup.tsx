import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, MapPin, Package, Sparkles, Store } from "lucide-react";
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
  "Fashion", "Electronics", "Beauty", "Phones & accessories",
  "Home & living", "Food & groceries", "Shoes & bags", "General",
];
const states = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "FCT Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
  "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
  "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
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
  business_name: "", category: "Fashion", description: "",
  state: "", city: "", whatsapp_number: "",
};
const steps = [
  { title: "What should we call your business?", hint: "Enter the name your customers and retailers know.", field: "business" },
  { title: "What do you supply?", hint: "Choose the category that best describes your products.", field: "category" },
  { title: "Where are you based?", hint: "This helps nearby retailers discover your business.", field: "location" },
  { title: "Where can buyers reach you?", hint: "Your WhatsApp number will be used for direct enquiries.", field: "whatsapp" },
  { title: "Ready to meet your next customer?", hint: "Take a final look at your supplier profile.", field: "review" },
];

function tapFeedback(kind: "light" | "selection" | "success" = "light") {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  const pattern = kind === "success" ? [18, 35, 28] : kind === "selection" ? 12 : 7;
  try { navigator.vibrate(pattern); } catch { /* Haptics are an optional device capability. */ }
}

function SupplierSetupPage() {
  const { userId } = useStoreContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<SupplierDraft>(emptyDraft);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorSlug, setVendorSlug] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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
    } catch { saved = null; }
    if (saved) setDraft({ ...emptyDraft, ...saved });
    void (async () => {
      const { data, error } = await db.from("connect_vendors")
        .select("id,slug,business_name,category,description,state,city,whatsapp_number")
        .eq("owner_id", userId).maybeSingle();
      if (error) { toast.error("We couldn't load your saved supplier profile."); return; }
      if (!data) return;
      setVendorId(data.id);
      setVendorSlug(data.slug);
      if (!saved) setDraft({
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
    try { window.localStorage.setItem(`strap-connect-supplier-draft:${userId}`, JSON.stringify(draft)); }
    catch { /* The form remains usable if browser storage is unavailable. */ }
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
    setLeaving(true);
    window.setTimeout(() => {
      setStep((current) => Math.min(steps.length - 1, current + 1));
      setLeaving(false);
      setLineDrawn(false);
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => setLineDrawn(true)));
    }, 260);
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
    const slug = vendorSlug ?? `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${userId.slice(0, 6)}`;
    const payload = {
      owner_id: userId, business_name: businessName, slug,
      category: draft.category, description: draft.description.trim(),
      state: draft.state.trim(), city: draft.city.trim(),
      whatsapp_number: phone, country: "Nigeria", is_published: true,
    };
    const result = vendorId
      ? await db.from("connect_vendors").update(payload).eq("id", vendorId)
      : await db.from("connect_vendors").insert(payload);
    setBusy(false);
    if (result.error) { toast.error(result.error.message); return; }
    try { window.localStorage.removeItem(`strap-connect-supplier-draft:${userId}`); }
    catch { /* Ignore unavailable local storage. */ }
    toast.success("Your supplier profile is now live on STRAP Connect.");
    await navigate({ to: "/connect" });
  }

  const field = steps[step].field;

  return (
    <main className="relative flex min-h-[100dvh] w-full flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-10 flex h-[76px] shrink-0 items-center justify-between px-5 sm:px-10 lg:px-16">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-bold tracking-[0.2em]">STRAP</span>
          <span className="h-4 w-px bg-border" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">Supplier setup</span>
        </div>
        <div className="grid size-9 place-items-center rounded-full border border-border/80 bg-surface">
          <Store className="size-4" />
        </div>
      </header>

      <div className="pointer-events-none absolute left-1/2 top-[75px] h-px w-[calc(100%-2.5rem)] max-w-[1200px] -translate-x-1/2 bg-border/70 sm:w-[calc(100%-5rem)] lg:w-[calc(100%-8rem)]">
        <div className={`h-full origin-center bg-foreground/70 transition-transform duration-700 ease-[cubic-bezier(.22,1,.36,1)] ${lineDrawn ? "scale-x-100" : "scale-x-0"}`} />
      </div>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pb-32 pt-12 sm:px-12">
        <div key={step} className={`w-full transition-all duration-250 ease-out ${leaving ? "translate-y-5 opacity-0" : "translate-y-0 opacity-100 animate-in fade-in slide-in-from-bottom-3 duration-500"}`}>
          <div className="mb-8 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">STEP 0{step + 1} <span className="mx-1.5 text-border">/</span> 0{steps.length}</span>
            {step > 0 && <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"><ArrowLeft className="size-3.5" /> Back</button>}
          </div>

          <h1 className="max-w-2xl font-display text-[clamp(2rem,5.5vw,3.75rem)] font-semibold leading-[1.08] tracking-[-0.045em]">{steps[step].title}</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">{steps[step].hint}</p>

          <div className="mt-12 min-h-[150px]">
            {field === "business" && (
              <div className="max-w-xl">
                <label htmlFor="supplier-business-name" className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">BUSINESS NAME</label>
                <Input id="supplier-business-name" autoFocus value={draft.business_name} onFocus={() => tapFeedback("light")} onChange={(event) => update("business_name", event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && valid) continueStep(); }} placeholder="Your business name" maxLength={120} className="h-[64px] rounded-none border-0 border-b border-border bg-transparent px-0 text-xl shadow-none placeholder:text-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0 sm:text-2xl" />
              </div>
            )}

            {field === "category" && (
              <div className="max-w-xl">
                <button type="button" onClick={() => { tapFeedback(); setCategoryPickerOpen(true); }} className="flex min-h-[68px] w-full items-center justify-between border-b border-border text-left text-xl transition hover:border-foreground/60 sm:text-2xl">
                  <span className="flex items-center gap-3"><Package className="size-5 text-muted-foreground" />{draft.category || "Choose a category"}</span>
                  <ChevronDown className="size-5 text-muted-foreground" />
                </button>
                <p className="mt-4 text-xs text-muted-foreground">Tap to open the category selector.</p>
                {categoryPickerOpen && (
                  <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setCategoryPickerOpen(false); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="category-picker-title" className="w-full max-w-xl rounded-t-[28px] border border-border bg-background p-5 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 sm:rounded-[28px] sm:p-7">
                      <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border sm:hidden" />
                      <h2 id="category-picker-title" className="text-xl font-semibold tracking-tight">Choose your category</h2>
                      <p className="mt-1 text-sm text-muted-foreground">What kind of products do you supply?</p>
                      <div className="mt-6 grid grid-cols-2 gap-2">
                        {categories.map((category) => <button key={category} type="button" onClick={() => { tapFeedback("selection"); update("category", category); setCategoryPickerOpen(false); }} className={`flex min-h-[58px] items-center justify-between rounded-xl border px-3 text-left text-sm font-medium transition active:scale-[.98] ${draft.category === category ? "border-[#c6f432] bg-[#c6f432]/10" : "border-border bg-surface hover:bg-secondary"}`}>{category}{draft.category === category && <Check className="size-4 text-[#789b00]" />}</button>)}
                      </div>
                      <Button variant="ghost" className="mt-5 w-full" onClick={() => setCategoryPickerOpen(false)}>Close</Button>
                    </section>
                  </div>
                )}
                <div className="mt-8 max-w-xl">
                  <label htmlFor="supplier-description" className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">A LITTLE ABOUT YOUR PRODUCTS <span className="font-normal normal-case tracking-normal">(optional)</span></label>
                  <textarea id="supplier-description" value={draft.description} onFocus={() => tapFeedback()} onChange={(event) => update("description", event.target.value)} maxLength={1200} rows={2} placeholder="What do you sell?" className="w-full resize-none border-0 border-b border-border bg-transparent px-0 py-3 text-base outline-none placeholder:text-muted-foreground/40 focus:border-foreground" />
                </div>
              </div>
            )}

            {field === "location" && (
              <div className="max-w-xl space-y-8">
                <div>
                  <label className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">STATE</label>
                  <button type="button" onClick={() => { tapFeedback(); setStatePickerOpen(true); }} className="flex min-h-[60px] w-full items-center justify-between border-b border-border text-left text-xl transition hover:border-foreground/60">
                    <span className={draft.state ? "text-foreground" : "text-muted-foreground/50"}>{draft.state || "Select your state"}</span><ChevronDown className="size-5 text-muted-foreground" />
                  </button>
                </div>
                <div>
                  <label htmlFor="supplier-city" className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">CITY OR AREA</label>
                  <Input id="supplier-city" value={draft.city} onFocus={() => tapFeedback()} onChange={(event) => update("city", event.target.value)} placeholder="e.g. Wuse, Ikeja, Onitsha" maxLength={80} className="h-[60px] rounded-none border-0 border-b border-border bg-transparent px-0 text-xl shadow-none placeholder:text-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0" />
                </div>
                {statePickerOpen && (
                  <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setStatePickerOpen(false); }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="state-picker-title" className="flex max-h-[82dvh] w-full max-w-xl flex-col rounded-t-[28px] border border-border bg-background p-5 shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-300 sm:rounded-[28px] sm:p-7">
                      <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border sm:hidden" />
                      <h2 id="state-picker-title" className="text-xl font-semibold">Choose your state</h2>
                      <Input autoFocus value={stateSearch} onChange={(event) => setStateSearch(event.target.value)} placeholder="Search states…" className="mt-5 h-11 rounded-xl" />
                      <div className="mt-3 overflow-y-auto">
                        {filteredStates.map((name) => <button key={name} type="button" onClick={() => { tapFeedback("selection"); update("state", name); setStatePickerOpen(false); setStateSearch(""); }} className={`flex min-h-12 w-full items-center justify-between border-b border-border/70 px-2 text-left text-sm transition hover:bg-secondary ${draft.state === name ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{name}{draft.state === name && <Check className="size-4 text-[#789b00]" />}</button>)}
                        {filteredStates.length === 0 && <p className="p-5 text-center text-sm text-muted-foreground">No matching state found.</p>}
                      </div>
                      <Button variant="ghost" className="mt-4 w-full" onClick={() => setStatePickerOpen(false)}>Close</Button>
                    </section>
                  </div>
                )}
              </div>
            )}

            {field === "whatsapp" && (
              <div className="max-w-xl">
                <label htmlFor="supplier-whatsapp" className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.17em] text-muted-foreground">WHATSAPP NUMBER · INCLUDE COUNTRY CODE</label>
                <Input id="supplier-whatsapp" autoFocus inputMode="tel" value={draft.whatsapp_number} onFocus={() => tapFeedback()} onChange={(event) => update("whatsapp_number", event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && valid) continueStep(); }} placeholder="+234 801 234 5678" maxLength={32} className="h-[64px] rounded-none border-0 border-b border-border bg-transparent px-0 text-xl shadow-none placeholder:text-muted-foreground/40 focus-visible:border-foreground focus-visible:ring-0 sm:text-2xl" />
                <p className="mt-4 max-w-lg text-xs leading-5 text-muted-foreground">Buyers will contact you directly on this number. Use a WhatsApp number you control. Ownership verification is not yet available.</p>
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
                ].map(([label, value]) => <div key={label} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-start sm:justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">{label}</span><span className="text-sm font-medium sm:max-w-[65%] sm:text-right">{value}</span></div>)}
                <p className="py-4 text-xs leading-5 text-muted-foreground">Publishing makes your supplier profile visible to buyers on STRAP Connect. You can update it later.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="pointer-events-none absolute bottom-6 left-0 right-0 flex items-center justify-center px-6 text-[10px] font-medium tracking-[0.12em] text-muted-foreground/70">
        POWERED BY <span className="ml-1.5 font-bold tracking-[0.2em] text-foreground/70">STRAP</span>
      </footer>

      <div className={`fixed bottom-[62px] left-1/2 z-[70] w-[min(360px,calc(100%-40px))] -translate-x-1/2 transition-all duration-250 ease-out ${valid && !leaving ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>
        {step === steps.length - 1 ? (
          <Button type="button" disabled={busy} onClick={() => void publishSupplier()} className="h-14 w-full rounded-full bg-[#c6f432] text-base font-semibold text-[#11150a] shadow-[0_12px_40px_rgba(0,0,0,.16)] hover:bg-[#d2ff43]">
            {busy ? "Publishing…" : "Publish supplier profile"} <Check className="ml-2 size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={continueStep} className="h-14 w-full rounded-full bg-[#c6f432] text-base font-semibold text-[#11150a] shadow-[0_12px_40px_rgba(0,0,0,.16)] hover:bg-[#d2ff43]">
            Continue <ArrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </main>
  );
}
