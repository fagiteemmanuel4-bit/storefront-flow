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
    { title: "Set up your shop — Kudi" },
    { name: "description", content: "Name your shop, pick a currency, and start selling." },
    { property: "og:title", content: "Set up your shop — Kudi" },
    { property: "og:description", content: "Name your shop and pick a currency to start." },
  ] }),
  component: OnboardingPage,
});

const schema = z.object({
  name: z.string().trim().min(2, "Give the shop a name").max(80, "Keep the name under 80 characters"),
  branchName: z.string().trim().min(1, "Name this location").max(80),
  currency: z.string().refine((v) => SUPPORTED_CURRENCIES.some((c) => c.code === v), "Pick a currency"),
  taxRate: z.number({ invalid_type_error: "Enter a number" }).min(0, "Can't be negative").max(100, "Can't be over 100%"),
});

function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { memberships, isLoading, error, refresh, setActiveStore } = useStoreContext();
  const [name, setName] = useState("");
  const [branchName, setBranchName] = useState("Main branch");
  const [currency, setCurrency] = useState("NGN");
  const [taxRate, setTaxRate] = useState("0");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!isLoading && !error && memberships.length > 0) void navigate({ to: "/pos", replace: true });
  }, [error, isLoading, memberships.length, navigate]);

  async function retryStoreLookup() {
    setChecking(true);
    try {
      await refresh();
      toast.success("Store access checked again");
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = schema.safeParse({ name, branchName, currency, taxRate: Number(taxRate) });
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
      activeStoreCache.setStoreId(data);
      activeStoreCache.setBranchId(null);
      setActiveStore(data);
      await queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Shop created");
      void navigate({ to: "/products", replace: true });
    } catch (createError) {
      toast.error(errorMessage(createError, "We couldn't create the shop."));
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="text-center"><div className="mx-auto size-8 animate-spin rounded-full border-2 border-border border-t-foreground" /><p className="mt-4 text-sm text-muted-foreground">Checking your shop…</p></div></div>;
  }

  if (error) {
    return <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="surface-card w-full max-w-lg p-6 text-center sm:p-8"><h1 className="text-display-sm">We couldn't load your shop</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Kudi couldn't confirm your store access. Your shop and products have not been deleted. Please retry before creating anything new.</p><p className="mt-3 break-words rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{error.message}</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button className="flex-1" disabled={checking} onClick={() => void retryStoreLookup()}>{checking ? "Checking…" : "Retry store lookup"}</Button><Button variant="outline" className="flex-1" onClick={() => void navigate({ to: "/pos", replace: true })}>Back to register</Button></div></div></div>;
  }

  return <div className="min-h-screen bg-background px-4 py-10 sm:px-6"><div className="mx-auto max-w-lg"><p className="text-label-caps text-accent-ink">Step 1 of 1</p><h1 className="mt-2 text-display-md">Set up your shop</h1><p className="mt-3 text-base text-muted-foreground">You can add more locations later — they'll share this product catalogue and keep their own stock counts.</p>
    <form onSubmit={handleSubmit} className="surface-card mt-8 space-y-5 p-5 sm:p-6">
      <div className="space-y-2"><Label htmlFor="shop-name">Shop name</Label><Input id="shop-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mama Bisi Provisions" className="h-12" maxLength={80} autoComplete="organization" />{errors.name && <p className="text-sm text-destructive">{errors.name}</p>}</div>
      <div className="space-y-2"><Label htmlFor="branch-name">First location</Label><Input id="branch-name" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Main branch" className="h-12" maxLength={80} />{errors.branchName && <p className="text-sm text-destructive">{errors.branchName}</p>}</div>
      <div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="currency">Currency</Label><Select value={currency} onValueChange={setCurrency}><SelectTrigger id="currency" className="h-12"><SelectValue /></SelectTrigger><SelectContent>{SUPPORTED_CURRENCIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.label}</SelectItem>)}</SelectContent></Select>{errors.currency && <p className="text-sm text-destructive">{errors.currency}</p>}</div><div className="space-y-2"><Label htmlFor="tax">Sales tax %</Label><Input id="tax" inputMode="decimal" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} className="h-12" />{errors.taxRate && <p className="text-sm text-destructive">{errors.taxRate}</p>}</div></div>
      <Button type="submit" className="h-12 w-full" disabled={submitting}>{submitting ? "Creating shop…" : "Create shop"}</Button>
      <p className="text-xs text-muted-foreground">Currency can't be changed after your first sale, so pick the one you actually price in.</p>
    </form>
  </div></div>;
}
