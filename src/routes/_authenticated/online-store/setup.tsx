import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Globe2, ImagePlus, Loader2, Mail, Phone, ShieldCheck, Sparkles, Store } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { useStoreContext } from "@/components/shell/StoreProvider";

export const Route = createFileRoute("/_authenticated/online-store/setup")({ ssr: false, component: OnlineStoreSetupPage });

const PRIVACY = `KUDI ONLINE STOREFRONT PRIVACY NOTICE

Last updated: 18 August 2026

This Online Storefront Privacy Notice explains how Kudi handles information used to create, publish and operate a merchant storefront. It is intended to be clear enough for a merchant to understand what is public, what is private and what happens when a customer places an order.

1. MERCHANT INFORMATION
A merchant may provide a storefront name, logo, description, display email address, display telephone number, delivery information and checkout instructions. These details are stored so Kudi can operate the storefront and display the information the merchant deliberately chooses to publish.

2. PUBLIC STOREFRONT INFORMATION
A published storefront may expose its name, logo, description, published products, product images, prices and any display contact information supplied by the merchant. Anything intentionally placed in a public storefront field should be treated as public information.

3. CUSTOMER ORDER INFORMATION
When a customer places an order, Kudi records information needed to fulfil that request, including name, phone number, email when supplied, delivery address, order contents, payment-method selection, customer notes, order number, status and timestamps.

4. WHY CUSTOMER INFORMATION IS USED
Customer information is used to create and manage the order, allow the merchant to review and fulfil it, support delivery communication, maintain order history, resolve disputes and improve service reliability. Kudi does not autonomously change a merchant's products or business records because a customer placed an order.

5. MERCHANT RESPONSIBILITY
The merchant is the business receiving the customer's order and is responsible for using customer information only for legitimate purposes connected with the order and applicable law. The merchant is responsible for its own privacy notices and legal obligations where required.

6. DATA RETENTION
Kudi may retain merchant and order records while the account and operational history require them, subject to applicable law and deletion processes. A merchant should not rely on Kudi as its only long-term business archive.

7. SECURITY
Kudi uses authentication, database access controls and row-level security to restrict merchant records to authorised store members. Public storefront visitors receive only information intentionally exposed through the storefront. Passwords, private API keys and other secrets must never be entered into storefront fields.

8. SERVICE PROVIDERS
Kudi uses infrastructure providers such as Supabase and Vercel for application hosting, authentication, database, storage and delivery infrastructure. Information may be processed by those providers only as necessary to operate the service and under their applicable terms.

9. STORAGE AND COOKIES
Kudi may use browser storage for authentication sessions, active-store context and preferences. The public storefront may use essential browser storage for cart behaviour. Merchants should not place sensitive information in browser-visible storefront content.

10. CHILDREN
The storefront is intended for ordinary retail commerce and is not designed to knowingly collect children's personal information. Merchants remain responsible for age restrictions and legal requirements applicable to their products.

11. DROPSHIPPING AND SUPPLIERS
Kudi may process order information even where a merchant uses a third-party supplier or dropshipping workflow. Kudi does not become the supplier. The merchant is responsible for deciding what customer information may lawfully be shared with a supplier and for ensuring fulfilment partners handle it appropriately.

12. CHANGES
Kudi may update this notice when the storefront product materially changes. The accepted privacy version and acceptance time are stored with the storefront configuration so the service can distinguish a previous acceptance from a later revision.

13. CONTACT
Questions about a specific order should normally be directed to the merchant operating the storefront. Questions about Kudi itself can be raised through the Kudi support area.

By accepting this notice, the merchant confirms that they understand the information Kudi processes for the online storefront and agrees to operate the storefront responsibly.`;

const TERMS = `KUDI ONLINE STOREFRONT TERMS OF USE

Effective: 18 August 2026

These Online Storefront Terms govern use of Kudi's tools for publishing products, receiving customer orders and operating a public ecommerce storefront.

1. ELIGIBILITY
The merchant must have an active Kudi account and authority to operate the connected store. The merchant is responsible for account credentials and activity performed through the account.

2. STOREFRONT SETUP
A merchant may create an online storefront for a Kudi store. The merchant must provide accurate business, contact, product and delivery information. Optional fields may be left blank.

3. PRODUCT LISTINGS
Only products deliberately enabled for online sale are displayed publicly. The merchant is responsible for product names, descriptions, images, prices, availability claims and any other listing information. The merchant must have the right to sell the listed goods and must not use Kudi for unlawful goods or services.

4. CUSTOMER ORDERS
A submitted order creates an order record visible to authorised members of the merchant's store. An order is a customer request; it does not by itself guarantee payment, stock availability, acceptance or delivery. The merchant must review and fulfil accepted orders.

5. PAYMENTS
The current storefront records the payment method selected by the customer. Unless a separate payment gateway is explicitly enabled, selecting bank transfer or another method does not mean Kudi has collected or verified payment. Merchants must provide clear payment instructions.

6. DELIVERY
The merchant is responsible for delivery areas, shipping charges, couriers, fulfilment timelines, tracking and communication. Kudi does not guarantee a courier, delivery time or delivery outcome.

7. RETURNS AND REFUNDS
The merchant must maintain and follow return, refund, cancellation and warranty practices required by applicable law and appropriate to the products sold. Nothing in these terms removes rights that cannot legally be excluded.

8. DROPSHIPPING AND THIRD-PARTY FULFILMENT
Kudi may be used with lawful dropshipping or supplier fulfilment workflows. The merchant remains responsible for supplier selection, product quality, fulfilment, delivery promises, customs or import obligations, intellectual-property rights and customer support. Kudi is not the merchant's supplier and does not guarantee supplier performance.

9. PROHIBITED USE
A storefront must not be used for fraud, deceptive advertising, impersonation, unlawful financial activity, prohibited goods, malicious content, intellectual-property infringement, unrelated data collection or other unlawful activity.

10. CONTENT AND BRAND ASSETS
The merchant must have the necessary rights to upload logos, photographs, product descriptions and other content. The merchant grants Kudi the limited technical permission necessary to host and display that content as part of the storefront.

11. SECURITY
The merchant must not share credentials improperly, bypass access controls or use another merchant's account. Kudi may restrict access where reasonably necessary to protect the service, users or legal compliance.

12. AVAILABILITY
Kudi aims to provide a reliable service but cannot guarantee uninterrupted availability. Network failures, hosting incidents, maintenance, browser limitations and third-party services can temporarily affect a storefront. Merchants should retain appropriate operational records and fulfilment procedures.

13. DATA
The Online Storefront Privacy Notice describes handling of merchant and customer information. By enabling the storefront, the merchant agrees to use customer information only for legitimate business and fulfilment purposes and to comply with applicable privacy obligations.

14. SUSPENSION AND CLOSURE
Kudi may suspend or disable a storefront where reasonably necessary for security, abuse prevention, legal compliance or serious violation of these terms. A merchant may disable its storefront through available controls.

15. KUDI'S ROLE
Kudi provides software for online selling workflows. Kudi is not a party to the retail contract between merchant and customer and is not responsible for product quality, stock accuracy, shipping, refunds, taxes, supplier performance or customer disputes arising from the merchant's business.

16. CHANGES
Kudi may revise these terms as the storefront evolves. Material revisions will be identified through the service where appropriate and may require renewed acceptance.

17. COMPLIANCE
The merchant is responsible for laws applicable to its business, products, advertising, customers, taxation, privacy, delivery and fulfilment activities.

18. ACCEPTANCE
By accepting these terms and completing setup, the merchant confirms that it has authority to operate the store, that submitted information is accurate to the best of its knowledge and that it agrees to these Online Storefront Terms and the accompanying Privacy Notice.`;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "my-store";
}

const WAIT_MESSAGES = [
  "Checking your storefront details",
  "Preparing your public shop",
  "Connecting your product catalog",
  "Opening your storefront",
];

function OnlineStoreSetupPage() {
  const { store } = useStoreContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupMessage, setSetupMessage] = useState(0);
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

  useEffect(() => {
    if (!saving) return;
    const timer = window.setInterval(() => setSetupMessage((value) => (value + 1) % WAIT_MESSAGES.length), 900);
    return () => window.clearInterval(timer);
  }, [saving]);

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

  async function finishSetup() {
    if (!store) return;
    if (!form.displayName.trim()) { toast.error("Add a display name for your storefront."); setStep(1); return; }
    if (!acceptTerms || !acceptPrivacy) { toast.error("Please accept both documents to continue."); return; }

    setSaving(true);
    setSetupMessage(0);
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

      const result = existing.data
        ? await onlineSupabase.from("online_stores").update(payload).eq("store_id", store.id)
        : await onlineSupabase.from("online_stores").insert(payload);
      if (result.error) throw new Error(result.error.message);

      // Give the merchant a deliberate setup moment instead of flashing immediately to the success state.
      await new Promise((resolve) => window.setTimeout(resolve, 2200));
      setSaving(false);
      setSetupComplete(true);
      window.opener?.postMessage({ type: "kudi-storefront-updated" }, window.location.origin);
      window.opener?.dispatchEvent(new Event("kudi-storefront-updated"));
    } catch (error) {
      setSaving(false);
      toast.error(error instanceof Error ? error.message : "Could not finish storefront setup.");
    }
  }

  function returnToDashboard() {
    if (window.opener) {
      window.opener.focus();
      window.close();
      return;
    }
    window.location.href = "/dashboard";
  }

  if (saving) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6">
        <div className="relative w-full max-w-xl text-center">
          <div className="absolute left-1/2 top-1/2 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft blur-3xl" />
          <div className="relative mx-auto flex size-28 items-center justify-center rounded-[2rem] bg-accent shadow-float">
            <span className="size-10 animate-spin rounded-[10px] border-[5px] border-foreground border-t-transparent" />
            <span className="absolute size-5 rotate-45 rounded-[5px] bg-foreground" />
          </div>
          <p className="text-label-caps mt-10 text-accent-ink">KUDI ONLINE</p>
          <h1 className="text-display-md mt-3">Hold up. Setting things up.</h1>
          <p className="mt-4 text-muted-foreground">{WAIT_MESSAGES[setupMessage]}…</p>
          <div className="mx-auto mt-8 h-1.5 max-w-xs overflow-hidden rounded-full bg-secondary"><div className="h-full w-1/2 animate-pulse rounded-full bg-accent" /></div>
          <p className="mt-4 text-xs text-muted-foreground">Please keep this tab open while we finish.</p>
        </div>
      </main>
    );
  }

  if (setupComplete) {
    const storefrontPath = `/store/${slugify(form.slug)}`;
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6 py-12">
        <div className="relative w-full max-w-xl text-center">
          <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft blur-3xl" />
          <div className="relative mx-auto flex size-24 animate-[pulse_2s_ease-in-out_infinite] items-center justify-center rounded-[2rem] bg-accent shadow-float"><span className="size-9 rotate-45 rounded-lg bg-foreground" /></div>
          <p className="text-label-caps mt-10 text-accent-ink">Storefront ready</p>
          <h1 className="text-display-md mt-3">Your virtual store is live.</h1>
          <p className="mx-auto mt-5 max-w-lg text-muted-foreground">Customers can now browse your published products and place orders. Go back to Kudi to choose products and manage orders.</p>
          <div className="mt-8 border border-border bg-background p-4 text-left shadow-lift"><p className="text-label-caps text-muted-foreground">Share this storefront</p><a className="mt-2 block truncate font-display text-lg font-semibold text-accent-ink underline-offset-4 hover:underline" href={storefrontPath} target="_blank" rel="noreferrer">{window.location.origin}{storefrontPath}</a></div>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><a href={storefrontPath} target="_blank" rel="noreferrer" className="touch-target inline-flex items-center justify-center gap-2 border border-border bg-background px-6 py-3.5 text-sm font-semibold">View storefront <ArrowRight className="size-4" /></a><button type="button" onClick={returnToDashboard} className="touch-target inline-flex items-center justify-center gap-2 bg-foreground px-7 py-3.5 text-sm font-semibold text-background hover:bg-accent hover:text-accent-foreground">Back to Kudi <ArrowRight className="size-4" /></button></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4"><div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-accent"><span className="size-3 rotate-45 rounded-[3px] bg-foreground" /></span><span className="font-display text-lg font-bold">KUDI.</span></div><span className="text-sm text-muted-foreground">Online store setup · {progress}</span></div>
        <div className="h-1 bg-secondary"><div className="h-full bg-accent transition-all duration-500" style={{ width: progress }} /></div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[240px_1fr] lg:py-14">
        <aside className="hidden lg:block"><p className="text-label-caps text-muted-foreground">Setup</p><div className="mt-4 space-y-2">{["Store identity", "Customer contact", "Selling online", "Review & publish"].map((label, index) => { const n = index + 1; const active = n === step; const done = n < step; return <div key={label} className={`flex items-center gap-3 px-3 py-2.5 ${active ? "bg-accent-soft" : ""}`}><span className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-accent text-foreground" : active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>{done ? <Check className="size-3.5" /> : n}</span><span className="text-sm font-medium">{label}</span></div>; })}</div></aside>

        <section className="max-w-2xl">
          {step === 1 && <Step title="Let's build your storefront." description="Give customers a clear first impression. You can change these details later."><Field icon={<Store />} label="Store display name"><input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} className="field" placeholder={store?.name || "Your store name"} /></Field><Field icon={<Globe2 />} label="Store link"><div className="flex items-center border border-border bg-surface"><span className="px-3 text-sm text-muted-foreground">/store/</span><input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} className="min-w-0 flex-1 bg-transparent px-2 py-3 outline-none" placeholder="your-store" /></div><p className="mt-1 text-xs text-muted-foreground">Use a short, memorable link with letters, numbers and hyphens.</p></Field><Field icon={<ImagePlus />} label="Store logo" optional><div className="flex items-center gap-4"><button type="button" onClick={() => fileRef.current?.click()} className="flex size-20 items-center justify-center overflow-hidden border border-dashed border-border bg-secondary">{logoPreview ? <img src={logoPreview} className="h-full w-full object-cover" alt="Logo preview" /> : <ImagePlus className="size-6 text-muted-foreground" />}</button><div><p className="text-sm font-medium">Upload a square logo</p><p className="mt-1 text-xs text-muted-foreground">PNG, JPG or WEBP · max 3 MB</p></div><input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => chooseLogo(e.target.files?.[0])} /></div></Field><Field label="About your store" optional><textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="field min-h-28 resize-none" placeholder="Tell shoppers what you sell and what makes your store worth buying from." /></Field></Step>}

          {step === 2 && <Step title="How should customers reach you?" description="These details appear on your storefront and help customers trust the business behind it."><div className="grid gap-5 sm:grid-cols-2"><Field icon={<Mail />} label="Display email" optional><input type="email" value={form.displayEmail} onChange={(e) => update("displayEmail", e.target.value)} className="field" placeholder="hello@example.com" /></Field><Field icon={<Phone />} label="Display phone" optional><input value={form.displayPhone} onChange={(e) => update("displayPhone", e.target.value)} className="field" placeholder="0800 000 0000" /></Field></div><Field label="Delivery / shipping note" optional><textarea value={form.shippingNote} onChange={(e) => update("shippingNote", e.target.value)} className="field min-h-28 resize-none" placeholder="Example: Nationwide delivery. Same-day delivery within Lagos for orders before 2 PM." /></Field><Field label="Checkout instructions" optional><textarea value={form.checkoutNote} onChange={(e) => update("checkoutNote", e.target.value)} className="field min-h-28 resize-none" placeholder="Example: We will call you after your order to confirm delivery and payment details." /></Field></Step>}

          {step === 3 && <Step title="Set expectations before you sell." description="Kudi gives you a simple online selling workflow while keeping fulfilment under your control."><div className="grid gap-4 sm:grid-cols-3"><InfoCard title="Orders" body="Customers browse published products and submit orders directly from your storefront." /><InfoCard title="Dropshipping" body="Use Kudi as the order inbox while your supplier handles the fulfilment workflow." /><InfoCard title="Payments" body="Checkout records the selected payment method without falsely claiming a payment was collected." /></div><div className="mt-6 border border-border bg-secondary/50 p-5"><p className="font-display font-semibold">Before publishing</p><ul className="mt-3 space-y-2 text-sm text-muted-foreground"><li>• Publish only products you are authorised to sell.</li><li>• Keep prices, descriptions and delivery promises accurate.</li><li>• Never place passwords, API keys or private customer information in storefront fields.</li><li>• Review new orders promptly from the Orders screen.</li></ul></div></Step>}

          {step === 4 && <Step title="One last thing before we open the doors." description="Please read both documents. They explain how Kudi's online storefront works and what you are responsible for as the merchant."><div className="space-y-5"><Legal title="Privacy Notice" icon={<ShieldCheck />} text={PRIVACY} /><Legal title="Terms of Use" icon={<ShieldCheck />} text={TERMS} /></div><label className="mt-5 flex items-start gap-3 border border-border bg-surface p-4"><input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} className="mt-1 size-4 accent-[var(--color-accent)]" /><span className="text-sm">I have read and accept the Kudi Online Storefront Privacy Notice.</span></label><label className="mt-3 flex items-start gap-3 border border-border bg-surface p-4"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 size-4 accent-[var(--color-accent)]" /><span className="text-sm">I have read and accept the Kudi Online Storefront Terms of Use.</span></label></Step>}

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6"><button type="button" disabled={step === 1} onClick={() => setStep((s) => Math.max(1, s - 1))} className="touch-target inline-flex items-center gap-2 border border-border px-5 py-3 text-sm font-semibold disabled:opacity-40"><ArrowLeft className="size-4" /> Back</button>{step < 4 ? <button type="button" onClick={() => setStep((s) => Math.min(4, s + 1))} className="touch-target inline-flex items-center gap-2 bg-foreground px-6 py-3 text-sm font-semibold text-background">Continue <ArrowRight className="size-4" /></button> : <button type="button" disabled={saving} onClick={() => void finishSetup()} className="touch-target inline-flex items-center gap-2 bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-60">{saving ? <><Loader2 className="size-4 animate-spin" /> Setting up...</> : <><Sparkles className="size-4" /> Launch my storefront</>}</button>}</div>
        </section>
      </div>
    </main>
  );
}

function Step({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <div><p className="text-label-caps text-accent-ink">KUDI ONLINE</p><h1 className="text-display-md mt-3">{title}</h1><p className="mt-4 max-w-2xl text-muted-foreground">{description}</p><div className="mt-9 space-y-6">{children}</div></div>; }
function Field({ label, optional, icon, children }: { label: string; optional?: boolean; icon?: ReactNode; children: ReactNode }) { return <div><label className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon && <span className="text-accent-ink">{icon}</span>}{label}{optional && <span className="font-normal text-muted-foreground">Optional</span>}</label>{children}</div>; }
function InfoCard({ title, body }: { title: string; body: string }) { return <div className="border border-border bg-surface p-5"><p className="font-display font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>; }
function Legal({ title, icon, text }: { title: string; icon: ReactNode; text: string }) { return <details className="group border border-border bg-surface"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display font-semibold"><span className="flex items-center gap-2">{icon}<span>{title}</span></span><span className="text-xs text-muted-foreground group-open:hidden">Read document</span><span className="hidden text-xs text-accent-ink group-open:inline">Close</span></summary><div className="max-h-80 overflow-y-auto border-t border-border bg-background px-5 py-5"><pre className="whitespace-pre-wrap font-sans text-xs leading-6 text-muted-foreground">{text}</pre></div></details>; }
