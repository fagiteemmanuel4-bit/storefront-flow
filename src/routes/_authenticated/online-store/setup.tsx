import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Globe2, ImagePlus, Mail, Phone, ShieldCheck, Sparkles, Store } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { useStoreContext } from "@/components/shell/StoreProvider";

export const Route = createFileRoute("/_authenticated/online-store/setup")({ ssr: false, component: OnlineStoreSetupPage });

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "my-store";
}

const steps = ["Identity", "Contact", "Brand", "Review"] as const;

function OnlineStoreSetupPage() {
  const { store } = useStoreContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [form, setForm] = useState({ displayName: "", slug: "my-store", displayEmail: "", displayPhone: "", description: "", shippingNote: "", checkoutNote: "" });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const progress = useMemo(() => `${Math.round((step / 4) * 100)}%`, [step]);

  useEffect(() => {
    if (!store) return;
    setForm((current) => ({ ...current, displayName: current.displayName || store.name, slug: current.slug === "my-store" ? slugify(store.name) : current.slug }));
  }, [store]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3_000_000) {
      toast.error("Choose an image smaller than 3 MB.");
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  function next() {
    if (step === 1 && !form.displayName.trim()) { toast.error("Add a name for your storefront."); return; }
    if (step === 1 && !form.slug.trim()) { toast.error("Add a storefront link name."); return; }
    setStep((value) => Math.min(4, value + 1));
  }

  async function finishSetup() {
    if (!store) return;
    if (!acceptTerms || !acceptPrivacy) { toast.error("Please accept both documents to publish your storefront."); return; }
    setSaving(true);
    try {
      let logoUrl = "";
      if (logoFile) {
        const extension = logoFile.name.split(".").pop() || "png";
        const path = `${store.id}/storefront-logo-${Date.now()}.${extension}`;
        const upload = await onlineSupabase.storage.from("kudi-store-assets").upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (upload.error) throw new Error(upload.error.message);
        logoUrl = onlineSupabase.storage.from("kudi-store-assets").getPublicUrl(path).data.publicUrl;
      }

      const existing = await onlineSupabase.from("online_stores").select("id,logo_url").eq("store_id", store.id).maybeSingle();
      if (existing.error) throw new Error(existing.error.message);
      const slug = slugify(form.slug || form.displayName);
      const payload = {
        store_id: store.id,
        slug,
        display_name: form.displayName.trim(),
        logo_url: logoUrl || existing.data?.logo_url || "",
        display_email: form.displayEmail.trim(),
        display_phone: form.displayPhone.trim(),
        description: form.description.trim(),
        shipping_note: form.shippingNote.trim(),
        checkout_note: form.checkoutNote.trim(),
        is_published: true,
        setup_completed: true,
        terms_version: "2026-08-18",
        privacy_version: "2026-08-18",
        accepted_terms_at: new Date().toISOString(),
        accepted_privacy_at: new Date().toISOString(),
      };
      const result = existing.data ? await onlineSupabase.from("online_stores").update(payload).eq("store_id", store.id) : await onlineSupabase.from("online_stores").insert(payload);
      if (result.error) throw new Error(result.error.message);
      setSaving(false);
      setSetupComplete(true);
      window.opener?.postMessage({ type: "kudi-storefront-updated" }, window.location.origin);
      window.opener?.dispatchEvent(new Event("kudi-storefront-updated"));
    } catch (error) {
      setSaving(false);
      toast.error(error instanceof Error ? error.message : "Could not publish your storefront.");
    }
  }

  function returnToDashboard() {
    if (window.opener) { window.opener.focus(); window.close(); return; }
    window.location.href = "/dashboard";
  }

  if (saving) return <main className="flex min-h-screen items-center justify-center bg-background px-6"><div className="text-center"><span className="mx-auto block size-10 animate-spin rounded-full border-[4px] border-foreground border-t-transparent" /><p className="mt-6 font-display text-lg font-semibold">Publishing your storefront</p><p className="mt-2 text-sm text-muted-foreground">Just a moment while we prepare your public store.</p></div></main>;

  if (setupComplete) {
    const storefrontPath = `/store/${slugify(form.slug)}`;
    return <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12"><section className="w-full max-w-xl rounded-[2rem] border border-border bg-surface p-7 text-center shadow-float sm:p-10"><div className="mx-auto flex size-20 items-center justify-center rounded-full bg-foreground text-background"><Check className="size-9" /></div><p className="text-label-caps mt-7 text-accent-ink">Storefront ready</p><h1 className="text-display-md mt-3">Your virtual store is live.</h1><p className="mt-4 leading-7 text-muted-foreground">Your storefront is published and ready for customers. Share the link below or open it to preview the experience.</p><div className="mt-7 rounded-2xl border border-border bg-secondary/60 p-4 text-left"><p className="text-label-caps text-muted-foreground">Share link</p><a href={storefrontPath} target="_blank" rel="noreferrer" className="mt-2 block truncate font-semibold text-accent-ink underline-offset-4 hover:underline">{window.location.origin}{storefrontPath}</a></div><div className="mt-7 flex flex-col gap-3 sm:flex-row"><a href={storefrontPath} target="_blank" rel="noreferrer" className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background">Open store <ArrowRight className="size-4" /></a><button type="button" onClick={returnToDashboard} className="h-12 flex-1 rounded-xl border border-border px-5 text-sm font-semibold hover:bg-secondary">Back to Kudi</button></div></section></main>;
  }

  return <main className="min-h-screen bg-background px-4 py-5 sm:px-6 sm:py-8"><div className="mx-auto max-w-4xl"><header className="mb-7 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-accent"><Store className="size-5" /></span><div><p className="text-label-caps text-muted-foreground">Kudi Online</p><h1 className="font-display text-xl font-bold">Build your virtual store</h1></div></div><button type="button" onClick={returnToDashboard} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-secondary">Exit</button></header>

<section className="rounded-[2rem] border border-border bg-surface shadow-lift"><div className="border-b border-border p-5 sm:p-7"><div className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Step {step} of 4</p><p className="mt-1 text-xs text-muted-foreground">{steps[step - 1]}</p></div><span className="text-xs font-semibold text-muted-foreground">{progress}</span></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-foreground transition-all duration-300" style={{ width: progress }} /></div></div>

<div className="p-5 sm:p-8">
{step === 1 && <div className="animate-rise"><div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft"><Globe2 className="size-6" /></div><h2 className="text-display-md mt-5">Give your store a home.</h2><p className="mt-3 max-w-xl text-muted-foreground">Choose the name customers will see and the simple link they can remember.</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Store name</span><input className="field" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} placeholder="Emmanuel's Store" /></label><label className="space-y-2"><span className="text-sm font-semibold">Store link</span><div className="flex items-center overflow-hidden rounded-xl border border-border bg-surface"><span className="shrink-0 px-3 text-sm text-muted-foreground">/store/</span><input className="min-w-0 flex-1 border-0 bg-transparent px-1 py-3 text-sm outline-none" value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} /></div></label></div></div>}

{step === 2 && <div className="animate-rise"><div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft"><Phone className="size-6" /></div><h2 className="text-display-md mt-5">Let customers reach you.</h2><p className="mt-3 max-w-xl text-muted-foreground">These details are displayed publicly on your storefront. Leave a field empty if you don't want to show it.</p><div className="mt-8 grid gap-5 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Display email</span><div className="relative"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="field pl-10" type="email" value={form.displayEmail} onChange={(e) => update("displayEmail", e.target.value)} placeholder="hello@example.com" /></div></label><label className="space-y-2"><span className="text-sm font-semibold">Display phone</span><div className="relative"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="field pl-10" value={form.displayPhone} onChange={(e) => update("displayPhone", e.target.value)} placeholder="0800 000 0000" /></div></label><label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold">Store description</span><textarea className="field min-h-28 resize-none" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Tell customers what your store sells and why they should shop with you." /></label><label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold">Delivery note</span><textarea className="field min-h-24 resize-none" value={form.shippingNote} onChange={(e) => update("shippingNote", e.target.value)} placeholder="Delivery arrangements are confirmed after checkout." /></label></div></div>}

{step === 3 && <div className="animate-rise"><div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft"><Sparkles className="size-6" /></div><h2 className="text-display-md mt-5">Make it feel like yours.</h2><p className="mt-3 max-w-xl text-muted-foreground">Add a logo and a checkout note to give customers a little more confidence.</p><div className="mt-8 grid gap-6 sm:grid-cols-[180px_1fr] sm:items-start"><button type="button" onClick={() => fileRef.current?.click()} className="group flex aspect-square w-full max-w-[180px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-dashed border-border bg-secondary/50 transition hover:border-foreground hover:bg-secondary">{logoPreview ? <img src={logoPreview} alt="Store logo preview" className="h-full w-full object-cover" /> : <span className="text-center"><ImagePlus className="mx-auto size-7 text-muted-foreground" /><span className="mt-2 block text-xs font-semibold text-muted-foreground">Add logo</span></span>}</button><input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => chooseLogo(e.target.files?.[0])} /><div className="space-y-5"><div className="rounded-2xl border border-border bg-secondary/50 p-4"><p className="text-sm font-semibold">Logo</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Use a clear square image. Maximum 3 MB.</p></div><label className="space-y-2"><span className="text-sm font-semibold">Checkout note</span><textarea className="field min-h-28 resize-none" value={form.checkoutNote} onChange={(e) => update("checkoutNote", e.target.value)} placeholder="We'll contact you after your order to confirm delivery and payment." /></label></div></div></div>}

{step === 4 && <div className="animate-rise"><div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft"><ShieldCheck className="size-6" /></div><h2 className="text-display-md mt-5">One last check.</h2><p className="mt-3 max-w-xl text-muted-foreground">Review the basics, accept the storefront terms and publish when you're ready.</p><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border bg-secondary/50 p-4"><p className="text-xs text-muted-foreground">Store</p><p className="mt-1 font-semibold">{form.displayName || "Your store"}</p><p className="mt-1 text-xs text-muted-foreground">/store/{slugify(form.slug)}</p></div><div className="rounded-2xl border border-border bg-secondary/50 p-4"><p className="text-xs text-muted-foreground">Contact</p><p className="mt-1 font-semibold">{form.displayEmail || form.displayPhone || "Not shown"}</p></div></div><label className="mt-5 flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-sm"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 size-4 accent-current" /><span>I accept the <details className="inline"><summary className="inline cursor-pointer font-semibold underline underline-offset-4">Online Store Terms</summary><span className="mt-2 block text-xs leading-5 text-muted-foreground">You are responsible for accurate listings, lawful products, customer fulfilment, returns, delivery, payment instructions and the content you publish.</span></details>.</span></label><label className="mt-3 flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 text-sm"><input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} className="mt-1 size-4 accent-current" /><span>I understand the <details className="inline"><summary className="inline cursor-pointer font-semibold underline underline-offset-4">Online Store Privacy Notice</summary><span className="mt-2 block text-xs leading-5 text-muted-foreground">Published contact details and product information are public. Customer order information is used to fulfil orders and support the merchant's store.</span></details>.</span></label></div>}
</div>

<footer className="flex items-center justify-between gap-3 border-t border-border p-5 sm:p-7"><button type="button" disabled={step === 1} onClick={() => setStep((value) => Math.max(1, value - 1))} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold disabled:opacity-40"><ArrowLeft className="size-4" /> Back</button>{step < 4 ? <button type="button" onClick={next} className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background">Continue <ArrowRight className="size-4" /></button> : <button type="button" onClick={() => void finishSetup()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background">Publish store <Check className="size-4" /></button>}</footer></section></div></main>;
}
