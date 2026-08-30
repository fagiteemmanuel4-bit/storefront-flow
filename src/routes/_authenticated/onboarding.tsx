import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
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
    { title: "Set up your shop — Strap" },
    { name: "description", content: "Tell Strap about your shop so your workspace can be personalised from day one." },
    { property: "og:title", content: "Set up your shop — Strap" },
    { property: "og:description", content: "Create your shop and personalise your Strap workspace." },
  ] }),
  component: OnboardingPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Give the shop a name").max(80, "Keep the name under 80 characters"),
  branchName: z.string().trim().min(1, "Name this location").max(80),
  currency: z.string().refine((v) => SUPPORTED_CURRENCIES.some((c) => c.code === v), "Pick a currency"),
  taxRate: z.number({ invalid_type_error: "Enter a number" }).min(0, "Can't be negative").max(100, "Can't be over 100%"),
  businessType: z.string().trim().min(2, "Tell us what kind of business you run").max(80),
  phone: z.string().trim().max(40),
  address: z.string().trim().max(180),
  teamSize: z.string().max(40),
  goal: z.string().max(120),
  logoUrl: z.union([z.literal(""), z.string().url("Enter a valid image URL")]),
});

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberships, isLoading, error, refresh, setActiveStore } = useStoreContext();
  const [name, setName] = useState("");
  const [branchName, setBranchName] = useState("Main branch");
  const [currency, setCurrency] = useState("NGN");
  const [taxRate, setTaxRate] = useState("0");
  const [businessType, setBusinessType] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [teamSize, setTeamSize] = useState("Just me");
  const [goal, setGoal] = useState("Sell faster");
  const [logoUrl, setLogoUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isLoading && !error && memberships.length > 0) void navigate({ to: "/pos", replace: true });
  }, [error, isLoading, memberships.length, navigate]);

  async function retryStoreLookup() {
    setChecking(true);
    try { await refresh(); toast.success("Store access checked again"); } finally { setChecking(false); }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ name, branchName, currency, taxRate: Number(taxRate), businessType, phone, address, teamSize, goal, logoUrl });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0])] = issue.message;
      setErrors(next);
      return;
    }
    setErrors({});
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

      const { error: profileError } = await supabase.from("stores").update({
        logo_url: parsed.data.logoUrl,
        phone: parsed.data.phone,
        address: parsed.data.address,
        business_type: parsed.data.businessType,
        team_size: parsed.data.teamSize,
        business_goal: parsed.data.goal,
      }).eq("id", data);
      if (profileError) throw new Error(profileError.message);

      activeStoreCache.setStoreId(data);
      activeStoreCache.setBranchId(null);
      setActiveStore(data);
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Shop created and personalised");
      void navigate({ to: "/products", replace: true });
    } catch (createError) {
      toast.error(errorMessage(createError, "We couldn't create the shop."));
    } finally { setSubmitting(false); }
  }

  if (isLoading) return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="text-center"><div className="mx-auto size-8 animate-spin rounded-full border-2 border-border border-t-foreground" /><p className="mt-4 text-sm text-muted-foreground">Checking your shop…</p></div></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="surface-card w-full max-w-lg p-6 text-center sm:p-8"><h1 className="text-display-sm">We couldn't load your shop</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Strap couldn't confirm your store access. Your shop and products have not been deleted. Please retry before creating anything new.</p><p className="mt-3 break-words rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{error.message}</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button className="flex-1" disabled={checking} onClick={() => void retryStoreLookup()}>{checking ? "Checking…" : "Retry store lookup"}</Button><Button variant="outline" className="flex-1" onClick={() => void navigate({ to: "/pos", replace: true })}>Back to register</Button></div></div></div>;

  return <div className="min-h-screen bg-background px-4 py-10 sm:px-6"><div className="mx-auto max-w-2xl">
    <p className="text-label-caps text-accent-ink">Personal setup</p><h1 className="mt-2 text-display-md">Let's set up your shop properly.</h1><p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">A few details now help Strap tailor your workspace, reports and store experience to the way you actually work.</p>
    <form onSubmit={handleSubmit} className="surface-card mt-8 space-y-6 p-5 sm:p-7">
      <div><p className="text-sm font-semibold">About your business</p><p className="mt-1 text-xs text-muted-foreground">These details can be changed later in Store settings.</p></div>
      <div className="space-y-2"><Label htmlFor="shop-name">Shop name</Label><Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mama Bisi Provisions" className="h-12" maxLength={80} autoComplete="organization" />{errors.name && <p className="text-sm text-destructive">{errors.name}</p>}</div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="business-type">What do you sell?</Label><Input id="business-type" value={businessType} onChange={(e) => setBusinessType(e.target.value)} placeholder="Groceries, fashion, electronics…" className="h-12" />{errors.businessType && <p className="text-sm text-destructive">{errors.businessType}</p>}</div>
        <div className="space-y-2"><Label htmlFor="team-size">Who runs the shop?</Label><Select value={teamSize} onValueChange={setTeamSize}><SelectTrigger id="team-size" className="h-12"><SelectValue /></SelectTrigger><SelectContent>{["Just me", "2–5 people", "6–20 people", "21+ people"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="phone">Business phone <span className="text-muted-foreground">(optional)</span></Label><Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="080…" className="h-12" inputMode="tel" /></div><div className="space-y-2"><Label htmlFor="logo">Store logo URL <span className="text-muted-foreground">(optional)</span></Label><Input id="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" className="h-12" inputMode="url" />{errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl}</p>}</div></div>
      <div className="space-y-2"><Label htmlFor="address">Business address <span className="text-muted-foreground">(optional)</span></Label><Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street, area, city" className="h-12" /></div>
      <div className="space-y-2"><Label htmlFor="goal">What matters most right now?</Label><Select value={goal} onValueChange={setGoal}><SelectTrigger id="goal" className="h-12"><SelectValue /></SelectTrigger><SelectContent>{["Sell faster", "Keep stock accurate", "Grow online", "Understand my numbers", "Manage my team"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
      <div className="border-t border-border pt-6"><p className="text-sm font-semibold">Register defaults</p><div className="mt-4 grid gap-5 sm:grid-cols-3"><div className="space-y-2"><Label htmlFor="branch-name">First location</Label><Input id="branch-name" value={branchName} onChange={(e) => setBranchName(e.target.value)} className="h-12" maxLength={80} />{errors.branchName && <p className="text-sm text-destructive">{errors.branchName}</p>}</div><div className="space-y-2"><Label htmlFor="currency">Currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger id="currency" className="h-12"><SelectValue /></SelectTrigger><SelectContent>{SUPPORTED_CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</SelectItem>)}</SelectContent></Select>{errors.currency && <p className="text-sm text-destructive">{errors.currency}</p>}</div><div className="space-y-2"><Label htmlFor="tax">Sales tax %</Label><Input id="tax" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="h-12" />{errors.taxRate && <p className="text-sm text-destructive">{errors.taxRate}</p>}</div></div></div>
      <Button type="submit" className="h-12 w-full" disabled={submitting}>{submitting ? "Creating your shop…" : "Create my shop"}</Button>
      <p className="text-xs leading-5 text-muted-foreground">Your answers personalise the workspace. You can update these details later. Currency can't be changed after your first sale.</p>
    </form>
  </div></div>;
}
