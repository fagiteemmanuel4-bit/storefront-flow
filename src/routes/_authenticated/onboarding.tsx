import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  LogOut,
  MapPin,
  Percent,
  Sparkles,
  Store,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { activeStoreCache } from "@/lib/active-store";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [
    { title: "Set up your shop — Kudi" },
    { name: "description", content: "Set up your Kudi shop in a few quick steps." },
    { property: "og:title", content: "Set up your shop — Kudi" },
    { property: "og:description", content: "Set up your Kudi shop in a few quick steps." },
  ] }),
  component: OnboardingPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Give the shop a name").max(80, "Keep the name under 80 characters"),
  branchName: z.string().trim().min(1, "Name this location").max(80, "Keep the location under 80 characters"),
  currency: z.string().refine((v) => SUPPORTED_CURRENCIES.some((c) => c.code === v), "Pick a currency"),
  taxRate: z.number({ invalid_type_error: "Enter a number" }).min(0, "Can't be negative").max(100, "Can't be over 100%"),
});

const steps = [
  { title: "Your shop", description: "Give your business a name", icon: Store },
  { title: "Your location", description: "Tell us where you sell", icon: MapPin },
  { title: "Your pricing", description: "Choose your currency & tax", icon: Percent },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberships, isLoading, error, refresh, setActiveStore } = useStoreContext();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [branchName, setBranchName] = useState("Main branch");
  const [currency, setCurrency] = useState("NGN");
  const [taxRate, setTaxRate] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const selectedCurrency = useMemo(
    () => SUPPORTED_CURRENCIES.find((c) => c.code === currency),
    [currency],
  );

  useEffect(() => {
    if (!isLoading && !error && memberships.length > 0) void navigate({ to: "/pos", replace: true });
  }, [error, isLoading, memberships.length, navigate]);

  async function handleLogout() {
    setLoggingOut(true);
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      toast.error("Couldn't log you out. Please try again.");
      setLoggingOut(false);
      return;
    }
    activeStoreCache.setStoreId(null);
    activeStoreCache.setBranchId(null);
    queryClient.clear();
    toast.success("You've been logged out");
    await navigate({ to: "/auth", replace: true });
  }

  async function retryStoreLookup() {
    setChecking(true);
    try {
      await refresh();
      toast.success("Store access checked again");
    } finally {
      setChecking(false);
    }
  }

  function validateCurrentStep() {
    const next: Record<string, string> = {};
    if (step === 0) {
      const result = schema.shape.name.safeParse(name);
      if (!result.success) next.name = result.error.issues[0]?.message ?? "Enter a valid shop name";
    }
    if (step === 1) {
      const result = schema.shape.branchName.safeParse(branchName);
      if (!result.success) next.branchName = result.error.issues[0]?.message ?? "Enter a valid location";
    }
    if (step === 2) {
      const currencyResult = schema.shape.currency.safeParse(currency);
      const taxResult = schema.shape.taxRate.safeParse(Number(taxRate));
      if (!currencyResult.success) next.currency = currencyResult.error.issues[0]?.message ?? "Pick a currency";
      if (!taxResult.success) next.taxRate = taxResult.error.issues[0]?.message ?? "Enter a valid tax rate";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function previousStep() {
    setErrors({});
    setStep((current) => Math.max(current - 1, 0));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateCurrentStep()) return;

    const parsed = schema.safeParse({ name, branchName, currency, taxRate: Number(taxRate) });
    if (!parsed.success) return;

    setSubmitting(true);
    try {
      const { data, error: createError } = await supabase.rpc("create_store", {
        _name: parsed.data.name,
        _currency: parsed.data.currency,
        _branch_name: parsed.data.branchName,
        _tax_rate: parsed.data.taxRate,
      });
      if (createError) throw new Error(createError.message);
      if (!data) throw new Error("The shop could not be created. Please try again.");
      activeStoreCache.setStoreId(data);
      activeStoreCache.setBranchId(null);
      setActiveStore(data);
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Your Kudi shop is ready");
      void navigate({ to: "/products", replace: true });
    } catch (createError) {
      toast.error(errorMessage(createError, "We couldn't create the shop."));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="text-center"><div className="mx-auto size-8 animate-spin rounded-full border-2 border-border border-t-foreground" /><p className="mt-4 text-sm text-muted-foreground">Getting everything ready…</p></div></div>;
  }

  if (error) {
    return <div className="min-h-screen bg-background px-4 py-6 sm:px-6"><div className="mx-auto flex min-h-[90vh] max-w-lg items-center"><div className="surface-card w-full p-6 text-center sm:p-8"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-secondary"><CircleHelp className="size-7" /></div><h1 className="mt-5 text-display-sm">We couldn't load your shop</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Kudi couldn't confirm your store access. Your shop and products have not been deleted. Please retry before creating anything new.</p><p className="mt-3 break-words rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{error.message}</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button className="flex-1" disabled={checking} onClick={() => void retryStoreLookup()}>{checking ? "Checking…" : "Retry store lookup"}</Button><Button variant="outline" className="flex-1" onClick={() => void navigate({ to: "/pos", replace: true })}>Back to register</Button></div></div></div></div>;
  }

  const CurrentIcon = steps[step].icon;

  return (
    <div className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-foreground text-background shadow-sm"><Sparkles className="size-5" /></div>
            <div><p className="text-sm font-semibold tracking-tight">Kudi</p><p className="text-xs text-muted-foreground">Let's get your shop ready</p></div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => void handleLogout()} disabled={loggingOut} className="gap-2 text-muted-foreground hover:text-foreground">
            <LogOut className="size-4" />{loggingOut ? "Logging out…" : "Log out"}
          </Button>
        </header>

        <div className="grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
          <aside className="md:sticky md:top-8">
            <div className="mb-5 md:mb-8"><p className="text-label-caps text-accent-ink">Setup</p><h1 className="mt-2 text-display-sm">Your shop, your way.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">A few quick details and you'll be ready to start selling.</p></div>
            <div className="hidden space-y-2 md:block">
              {steps.map((item, index) => { const Icon = item.icon; const active = index === step; const complete = index < step; return <button key={item.title} type="button" onClick={() => index <= step && setStep(index)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${active ? "bg-secondary shadow-sm" : "hover:bg-secondary/70"} ${index > step ? "cursor-default opacity-45" : ""}`} disabled={index > step}><span className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${complete ? "border-foreground bg-foreground text-background" : active ? "border-foreground/20 bg-background" : "border-border bg-background"}`}>{complete ? <Check className="size-4" /> : <Icon className="size-4" />}</span><span className="min-w-0"><span className="block text-sm font-medium">{item.title}</span><span className="block truncate text-xs text-muted-foreground">{item.description}</span></span></button>; })}
            </div>
            <div className="mb-6 flex items-center gap-2 md:hidden"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-foreground transition-all duration-500" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div><span className="text-xs font-medium text-muted-foreground">{step + 1}/{steps.length}</span></div>
          </aside>

          <main className="surface-card overflow-hidden p-5 shadow-sm sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4"><div><div className="mb-3 flex size-11 items-center justify-center rounded-2xl bg-secondary"><CurrentIcon className="size-5" /></div><p className="text-label-caps text-accent-ink">Step {step + 1} of {steps.length}</p><h2 className="mt-1 text-title-lg">{steps[step].title}</h2><p className="mt-1 text-sm text-muted-foreground">{steps[step].description}.</p></div><div className="hidden text-right sm:block"><p className="text-xs font-medium text-muted-foreground">{Math.round(((step + 1) / steps.length) * 100)}% complete</p></div></div>

            <form onSubmit={handleSubmit}>
              {step === 0 && <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300"><div className="space-y-2"><Label htmlFor="shop-name">Shop name</Label><Input id="shop-name" value={name} onChange={(e) => { setName(e.target.value); setErrors((current) => ({ ...current, name: "" })); }} placeholder="Mama Bisi Provisions" className="h-13 text-base" maxLength={80} autoComplete="organization" autoFocus />{errors.name && <p className="text-sm text-destructive">{errors.name}</p>}<p className="text-xs text-muted-foreground">This is how your business will appear across Kudi.</p></div><div className="rounded-2xl bg-secondary/70 p-4"><p className="text-sm font-medium">Make it recognizable</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Use the name customers already know. You can customize your storefront, logo and banners later.</p></div></div>}

              {step === 1 && <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300"><div className="space-y-2"><Label htmlFor="branch-name">First location</Label><Input id="branch-name" value={branchName} onChange={(e) => { setBranchName(e.target.value); setErrors((current) => ({ ...current, branchName: "" })); }} placeholder="Main branch" className="h-13 text-base" maxLength={80} autoFocus />{errors.branchName && <p className="text-sm text-destructive">{errors.branchName}</p>}<p className="text-xs text-muted-foreground">For example: Main branch, Ikeja, Lekki outlet or Home office.</p></div><div className="rounded-2xl border border-border p-4"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-secondary"><MapPin className="size-4" /></div><div><p className="text-sm font-medium">Starting with one location</p><p className="text-xs text-muted-foreground">You can add more locations later and keep stock separate.</p></div></div></div></div>}

              {step === 2 && <div className="space-y-5 animate-in fade-in slide-in-from-right-2 duration-300"><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="currency">Currency</Label><Select value={currency} onValueChange={(value) => { setCurrency(value); setErrors((current) => ({ ...current, currency: "" })); }}><SelectTrigger id="currency" className="h-13"><SelectValue /></SelectTrigger><SelectContent>{SUPPORTED_CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</SelectItem>)}</SelectContent></Select>{errors.currency && <p className="text-sm text-destructive">{errors.currency}</p>}</div><div className="space-y-2"><Label htmlFor="tax">Sales tax %</Label><div className="relative"><Input id="tax" inputMode="decimal" value={taxRate} onChange={(e) => { setTaxRate(e.target.value); setErrors((current) => ({ ...current, taxRate: "" })); }} className="h-13 pr-10 text-base" placeholder="0" autoFocus /><Percent className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /></div>{errors.taxRate && <p className="text-sm text-destructive">{errors.taxRate}</p>}</div></div><div className="rounded-2xl bg-secondary/70 p-4"><p className="text-sm font-medium">Your setup at a glance</p><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><p className="text-xs text-muted-foreground">Shop</p><p className="mt-0.5 truncate font-medium">{name || "Your shop"}</p></div><div><p className="text-xs text-muted-foreground">Location</p><p className="mt-0.5 truncate font-medium">{branchName || "Main branch"}</p></div><div><p className="text-xs text-muted-foreground">Currency</p><p className="mt-0.5 font-medium">{selectedCurrency ? `${selectedCurrency.symbol} ${selectedCurrency.code}` : currency}</p></div><div><p className="text-xs text-muted-foreground">Tax</p><p className="mt-0.5 font-medium">{taxRate || "0"}%</p></div></div></div><p className="text-xs leading-5 text-muted-foreground">Currency can't be changed after your first sale, so pick the currency you actually price in.</p></div>}

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><Button type="button" variant="ghost" onClick={previousStep} disabled={step === 0 || submitting} className="gap-2"><ArrowLeft className="size-4" />Back</Button>{step < steps.length - 1 ? <Button type="button" onClick={nextStep} className="h-11 gap-2 sm:min-w-32">Continue<ArrowRight className="size-4" /></Button> : <Button type="submit" className="h-11 gap-2 sm:min-w-40" disabled={submitting}>{submitting ? "Creating your shop…" : "Create my shop"}<Check className="size-4" /></Button>}</div>
            </form>
          </main>
        </div>
      </div>
    </div>
  );
}
