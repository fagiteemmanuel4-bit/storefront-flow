import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, Package, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type SupplierDraft = {
  business_name: string;
  category: string;
  description: string;
  state: string;
  city: string;
  whatsapp_number: string;
};

const emptyDraft: SupplierDraft = {
  business_name: "",
  category: "Fashion",
  description: "",
  state: "",
  city: "",
  whatsapp_number: "",
};

const steps = [
  { title: "Your business", subtitle: "First, tell buyers who you are.", icon: Store },
  { title: "What you supply", subtitle: "Help the right buyers find you.", icon: Package },
  { title: "Your location", subtitle: "Let nearby retailers discover you.", icon: MapPin },
  { title: "How buyers reach you", subtitle: "Enquiries go directly to your WhatsApp.", icon: Sparkles },
  { title: "Review and publish", subtitle: "Make sure everything is correct.", icon: Check },
];

function SupplierSetupPage() {
  const { userId } = useStoreContext();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<SupplierDraft>(emptyDraft);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorSlug, setVendorSlug] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      const { data, error } = await supabase
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
      if (!saved) {
        setDraft({
          business_name: data.business_name ?? "",
          category: data.category ?? "Fashion",
          description: data.description ?? "",
          state: data.state ?? "",
          city: data.city ?? "",
          whatsapp_number: data.whatsapp_number ?? "",
        });
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      window.localStorage.setItem(`strap-connect-supplier-draft:${userId}`, JSON.stringify(draft));
    } catch {
      // The form remains usable if browser storage is unavailable.
    }
  }, [draft, userId]);

  const completion = useMemo(() => {
    const checks = [
      draft.business_name.trim().length >= 2,
      Boolean(draft.category),
      draft.state.trim().length > 1 && draft.city.trim().length > 1,
      draft.whatsapp_number.replace(/\D/g, "").length >= 8,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [draft]);

  function update<K extends keyof SupplierDraft>(key: K, value: SupplierDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function canContinue() {
    if (step === 0 && draft.business_name.trim().length < 2) {
      toast.error("Add your business name to continue.");
      return false;
    }
    if (step === 2 && (!draft.state.trim() || !draft.city.trim())) {
      toast.error("Add your state and city to continue.");
      return false;
    }
    if (step === 3 && draft.whatsapp_number.replace(/\D/g, "").length < 8) {
      toast.error("Enter a valid WhatsApp number with country code.");
      return false;
    }
    return true;
  }

  async function publishSupplier() {
    if (!userId || !canContinue()) return;
    setBusy(true);
    const phone = draft.whatsapp_number.replace(/\D/g, "");
    const businessName = draft.business_name.trim();
    const slug = vendorSlug ?? `${businessName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${userId.slice(0, 6)}`;
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
      ? await supabase.from("connect_vendors").update(payload).eq("id", vendorId)
      : await supabase.from("connect_vendors").insert(payload);
    setBusy(false);
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    try {
      window.localStorage.removeItem(`strap-connect-supplier-draft:${userId}`);
    } catch {
      // Ignore unavailable local storage.
    }
    toast.success("Your supplier profile is now live on STRAP Connect.");
    await navigate({ to: "/connect" });
  }

  const ActiveIcon = steps[step].icon;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-5 sm:px-8 sm:py-8">
        <header className="flex items-center justify-between gap-4">
          <Link to="/connect" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to Connect
          </Link>
          <div className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#c6f432] text-[#10140a]"><Store className="size-4" /></span>
            STRAP <span className="text-muted-foreground">CONNECT</span>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center py-10">
          <div className="mb-8">
            <div className="mb-3 flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span>SUPPLIER SETUP</span>
              <span>STEP {step + 1} OF {steps.length}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-[#c6f432] transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
          </div>

          <section key={step} className="animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-[#c6f432]/15 text-[#789b00]">
              <ActiveIcon className="size-6" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Let's set up your supplier profile</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{steps[step].title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{steps[step].subtitle}</p>

            <div className="mt-8 min-h-[230px] space-y-5">
              {step === 0 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="supplier-business-name">Business name</Label>
                    <Input id="supplier-business-name" autoFocus value={draft.business_name} onChange={(event) => update("business_name", event.target.value)} placeholder="e.g. Amina Wholesale Hub" maxLength={120} className="h-12 rounded-xl" />
                  </div>
                  <p className="text-xs text-muted-foreground">Use the name customers and retailers know your business by.</p>
                </>
              )}
              {step === 1 && (
                <>
                  <div className="space-y-2">
                    <Label>Main product category</Label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {categories.map((category) => (
                        <button key={category} type="button" onClick={() => update("category", category)} className={`min-h-12 rounded-xl border px-3 text-left text-sm font-medium transition ${draft.category === category ? "border-[#c6f432] bg-[#c6f432]/15 text-foreground" : "border-border bg-surface hover:bg-secondary"}`}>
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier-description">A short introduction (optional)</Label>
                    <textarea id="supplier-description" value={draft.description} onChange={(event) => update("description", event.target.value)} maxLength={1200} rows={4} placeholder="Tell buyers what you supply and what makes your business useful to them." className="w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-[#c6f432]" />
                  </div>
                </>
              )}
              {step === 2 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplier-state">State</Label>
                    <Input id="supplier-state" autoFocus value={draft.state} onChange={(event) => update("state", event.target.value)} placeholder="e.g. Abuja FCT" className="h-12 rounded-xl" maxLength={80} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="supplier-city">City / area</Label>
                    <Input id="supplier-city" value={draft.city} onChange={(event) => update("city", event.target.value)} placeholder="e.g. Wuse" className="h-12 rounded-xl" maxLength={80} />
                  </div>
                </div>
              )}
              {step === 3 && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="supplier-whatsapp">WhatsApp number (include country code)</Label>
                    <Input id="supplier-whatsapp" autoFocus inputMode="tel" value={draft.whatsapp_number} onChange={(event) => update("whatsapp_number", event.target.value)} placeholder="234 801 234 5678" className="h-12 rounded-xl" maxLength={32} />
                  </div>
                  <p className="rounded-xl bg-secondary p-3 text-xs leading-5 text-muted-foreground">Buyers will use this number to contact you directly. STRAP does not currently verify WhatsApp ownership, so only publish a number you control.</p>
                </>
              )}
              {step === 4 && (
                <div className="space-y-3 rounded-2xl border border-border bg-surface p-5">
                  {[
                    ["Business", draft.business_name],
                    ["Category", draft.category],
                    ["About", draft.description || "Not added"],
                    ["Location", [draft.city, draft.state].filter(Boolean).join(", ")],
                    ["WhatsApp", draft.whatsapp_number],
                  ].map(([label, value]) => (
                    <div key={label} className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
                      <span className="text-sm font-medium sm:max-w-[70%] sm:text-right">{value}</span>
                    </div>
                  ))}
                  <p className="pt-2 text-xs leading-5 text-muted-foreground">Publishing makes your supplier profile discoverable to STRAP Connect buyers. You can unpublish it later.</p>
                </div>
              )}
            </div>

            <div className="mt-9 flex items-center justify-between gap-3 border-t border-border pt-5">
              <Button type="button" variant="ghost" disabled={step === 0 || busy} onClick={() => setStep((current) => Math.max(0, current - 1))}>
                <ArrowLeft className="mr-2 size-4" /> Back
              </Button>
              <Button type="button" disabled={busy} onClick={() => step === steps.length - 1 ? void publishSupplier() : canContinue() && setStep((current) => Math.min(steps.length - 1, current + 1))} className="min-h-11 rounded-xl px-5">
                {busy ? "Publishing…" : step === steps.length - 1 ? "Publish supplier profile" : "Continue"}
                {step === steps.length - 1 ? <Check className="ml-2 size-4" /> : <ArrowRight className="ml-2 size-4" />}
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Your progress is saved on this device.</span>
              <span>{completion}% profile details complete</span>
            </div>
          </section>
        </div>
        <footer className="pt-5 text-center text-[11px] text-muted-foreground">STRAP Connect · Built for better business connections</footer>
      </div>
    </main>
  );
}
