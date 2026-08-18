import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Globe2, ImagePlus, Loader2, Mail, Phone, ShieldCheck, Sparkles, Store, X } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { useStoreContext } from "@/components/shell/StoreProvider";

export const Route = createFileRoute("/_authenticated/online-store/setup")({ ssr: false, component: OnlineStoreSetupPage });

const PRIVACY = `KUDI ONLINE STOREFRONT PRIVACY NOTICE\n\nLast updated: 18 August 2026\n\nThis notice explains how Kudi processes information when a merchant enables an online storefront and when a customer visits or places an order through that storefront. It is written to describe the actual product behaviour rather than to serve as generic boilerplate.\n\n1. INFORMATION MERCHANTS PROVIDE\nMerchants may provide a storefront name, logo, business description, display email address, display telephone number, delivery or shipping notes, checkout instructions and the products they choose to publish. Kudi stores these details so that the public storefront can display accurate business and product information.\n\n2. CUSTOMER ORDER INFORMATION\nWhen a customer submits an order, Kudi records the information necessary to fulfil that order, including the customer's name, telephone number, email address when provided, delivery address, order contents, selected payment method, notes, order status, order number and timestamps. A merchant can access these details through the authenticated Kudi dashboard because the merchant is responsible for fulfilling the customer's request.\n\n3. HOW INFORMATION IS USED\nStorefront information is used to operate and display the merchant's public shop. Customer order information is used to create and manage orders, communicate about fulfilment where the merchant chooses to do so, maintain order history, resolve disputes and improve the reliability of the service. Kudi does not use customer order details to make autonomous changes to a merchant's products or business records.\n\n4. PUBLIC INFORMATION\nInformation a merchant deliberately publishes, including storefront name, logo, description, published products, product images, prices and display contact information, may be visible to anyone with the storefront link. Merchants should not publish private information in storefront fields.\n\n5. DATA RETENTION\nKudi retains merchant and order records for as long as the merchant's account and operational requirements reasonably require, subject to applicable law and deletion requests. Deleting a store may permanently remove associated storefront and order records according to the product's deletion process.\n\n6. SECURITY\nKudi uses authenticated access controls and database policies to restrict merchant data to authorised store members. Public storefront visitors receive only information deliberately made available for the storefront. Kudi does not ask merchants to place passwords, secret API keys or other credentials in public storefront fields.\n\n7. THIRD-PARTY SERVICES\nKudi uses infrastructure providers, including Supabase and Vercel, to host application, authentication, database and delivery infrastructure. Information may be processed by those providers only as necessary to provide the service and under their applicable terms and privacy commitments.\n\n8. COOKIES AND LOCAL STORAGE\nKudi may use browser storage for authentication sessions, preferences and active-store context. Public storefront pages may use essential browser storage needed for cart behaviour.\n\n9. CHILDREN\nThe storefront is intended for ordinary retail commerce and is not designed to knowingly collect personal information from children. Merchants must comply with applicable age-related requirements for their products and business.\n\n10. MERCHANT RESPONSIBILITY\nThe merchant decides what products, prices, policies and contact information to publish and is responsible for complying with applicable consumer-protection, tax, advertising, product-safety and privacy requirements in the jurisdictions in which they sell.\n\n11. YOUR CHOICES\nCustomers may contact the merchant using the contact details displayed on the storefront about an order or personal information supplied during checkout. Merchants may update storefront information, unpublish products or disable their storefront from Kudi.\n\n12. CHANGES\nKudi may update this notice when the online storefront changes materially. The version accepted during setup is recorded with the merchant's storefront configuration so that the service can distinguish accepted terms from later revisions.\n\n13. CONTACT\nFor questions about the Kudi service, merchants can use the support area in Kudi. For a specific customer order, the merchant operating the storefront is the primary business contact.\n\nBy accepting this notice, the merchant confirms that they have reviewed how the online storefront handles merchant and customer information and agrees to operate the storefront responsibly.`;

const TERMS = `KUDI ONLINE STOREFRONT TERMS OF USE\n\nEffective: 18 August 2026\n\nThese Online Storefront Terms govern a merchant's use of Kudi's tools for publishing products, receiving customer orders and operating a public ecommerce storefront.\n\n1. ELIGIBILITY AND ACCOUNT\nYou must have an active Kudi account and authority to operate the store you connect to the storefront. You are responsible for protecting your login credentials and for all activity performed through your account.\n\n2. STOREFRONT SETUP\nYou may create one online storefront for a Kudi store. You are responsible for providing accurate storefront information, including business name, contact information, product descriptions, prices and delivery instructions. Optional fields may be left blank.\n\n3. PRODUCT LISTINGS\nOnly products deliberately enabled for online sale are displayed publicly. You are responsible for ensuring that product titles, descriptions, images, prices, availability claims and other listing information are accurate. You must not use Kudi to sell goods or services that are unlawful or prohibited by applicable law.\n\n4. CUSTOMER ORDERS\nA submitted order creates an order record in Kudi and makes the order visible to authorised members of the merchant's store. Creating an order does not by itself guarantee payment, delivery or acceptance by the merchant. The merchant remains responsible for reviewing orders, confirming availability and fulfilling accepted orders.\n\n5. PAYMENTS\nThe current storefront checkout supports order capture and payment-method selection. Unless a separate payment gateway is explicitly enabled, Kudi does not represent that an online card or bank payment has been collected merely because a customer selected a payment method. Merchants must clearly communicate payment instructions to customers.\n\n6. SHIPPING AND DELIVERY\nMerchants are responsible for delivery arrangements, delivery areas, shipping charges, fulfilment timelines, tracking and communication with customers. Kudi's storefront tools do not guarantee a courier, delivery time or delivery outcome.\n\n7. RETURNS, REFUNDS AND CONSUMER RIGHTS\nMerchants must maintain and follow return, refund, cancellation and warranty practices required by applicable law and appropriate to the products sold. Nothing in these terms removes rights that cannot lawfully be excluded.\n\n8. DROPSHIPPING AND THIRD-PARTY FULFILMENT\nKudi may be used to organise orders for products fulfilled by suppliers where such activity is lawful. The merchant remains responsible for supplier relationships, product quality, fulfilment, delivery promises, import or customs obligations, intellectual-property rights and customer support. Kudi is not the merchant's supplier and does not guarantee supplier performance.\n\n9. PROHIBITED USE\nYou may not use a storefront for fraud, deceptive advertising, impersonation, unlawful financial activity, distribution of prohibited goods, malicious content, infringement of intellectual-property rights, collection of information unrelated to an order, or any activity that violates applicable law.\n\n10. CONTENT AND BRAND ASSETS\nYou must have the rights necessary to upload logos, product images, descriptions and other content. You grant Kudi the limited technical permission necessary to host and display that content for the operation of your storefront.\n\n11. SECURITY AND ACCESS\nYou must not share staff or owner credentials improperly, attempt to bypass access controls, or use another merchant's account. Kudi may restrict access where necessary to protect the service or other users.\n\n12. AVAILABILITY\nKudi aims to provide a reliable service but does not guarantee uninterrupted availability. Network failures, hosting incidents, maintenance, browser limitations and third-party services may temporarily affect storefront availability. Merchants should retain appropriate business records and fulfilment processes outside the application when necessary.\n\n13. DATA\nThe handling of merchant and customer information is described in Kudi's Online Storefront Privacy Notice. By enabling the storefront, you agree to handle customer information only for legitimate business and fulfilment purposes.\n\n14. SUSPENSION AND CLOSURE\nKudi may suspend or disable a storefront where reasonably necessary for security, abuse prevention, legal compliance, or serious violation of these terms. A merchant may disable their storefront at any time from the available controls.\n\n15. LIMITATION OF RESPONSIBILITY\nKudi provides software tools for managing a merchant's online selling workflow. Kudi is not a party to the retail contract between merchant and customer and is not responsible for product quality, stock accuracy, shipping, refunds, taxes, supplier performance or customer disputes arising from the merchant's business.\n\n16. CHANGES TO THESE TERMS\nKudi may revise these terms as the storefront product evolves. Material revisions will be identified through the service where appropriate. Continued use after a new version becomes effective may require renewed acceptance.\n\n17. GOVERNING COMPLIANCE\nYou are responsible for understanding and complying with laws applicable to your business, products, customers, advertising, taxation, privacy and delivery activities.\n\n18. ACCEPTANCE\nBy selecting the acceptance checkboxes and completing storefront setup, you confirm that you have authority to operate the store, that the information supplied is accurate to the best of your knowledge, and that you agree to these Online Storefront Terms and the accompanying Privacy Notice.`;

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "my-store";
}

function OnlineStoreSetupPage() {
  const { store } = useStoreContext();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [form, setForm] = useState(() => ({
    displayName: store?.name ?? "", slug: slugify(store?.name ?? ""), displayEmail: "", displayPhone: "",
    description: "", shippingNote: "", checkoutNote: "",
  }));
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);

  const progress = useMemo(() => `${Math.round((step / 4) * 100)}%`, [step]);

  function update(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 3_000_000) {
      toast.error("Choose an image smaller than 3 MB."); return;
    }
    setLogoFile(file); setLogoPreview(URL.createObjectURL(file));
  }

  async function finishSetup() {
    if (!store) return;
    if (!acceptTerms || !acceptPrivacy) { toast.error("Please accept both documents to continue."); return; }
    setSaving(true);
    try {
      let logoUrl = "";
      if (logoFile) {
        const path = `${store.id}/storefront-logo-${Date.now()}.${logoFile.name.split(".").pop() || "png"}`;
        const upload = await onlineSupabase.storage.from("kudi-store-assets").upload(path, logoFile, { upsert: true, contentType: logoFile.type });
        if (upload.error) throw new Error(upload.error.message);
        logoUrl = onlineSupabase.storage.from("kudi-store-assets").getPublicUrl(path).data.publicUrl;
      }
      const existing = await onlineSupabase.from("online_stores").select("id,logo_url").eq("store_id", store.id).maybeSingle();
      if (existing.error) throw new Error(existing.error.message);
      const payload = {
        store_id: store.id, slug: slugify(form.slug), display_name: form.displayName.trim() || store.name,
        logo_url: logoUrl || existing.data?.logo_url || "", display_email: form.displayEmail.trim(), display_phone: form.displayPhone.trim(),
        description: form.description.trim(), shipping_note: form.shippingNote.trim(), checkout_note: form.checkoutNote.trim(),
        is_published: true, setup_completed: true, accepted_terms_at: new Date().toISOString(), accepted_privacy_at: new Date().toISOString(),
      };
      const result = existing.data
        ? await onlineSupabase.from("online_stores").update(payload).eq("store_id", store.id)
        : await onlineSupabase.from("online_stores").insert(payload);
      if (result.error) throw new Error(result.error.message);
      setSaving(false); setReady(true);
    } catch (error) {
      setSaving(false); toast.error(error instanceof Error ? error.message : "Could not finish storefront setup.");
    }
  }

  function returnToDashboard() {
    if (window.opener) { window.opener.focus(); window.close(); return; }
    window.location.href = "/dashboard";
  }

  if (ready) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-surface px-6 py-12">
        <div className="relative w-full max-w-xl text-center">
          <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-soft blur-3xl" />
          <div className="relative mx-auto flex size-24 animate-pulse items-center justify-center rounded-[2rem] bg-accent shadow-float">
            <span className="size-9 rotate-45 rounded-lg bg-foreground" />
          </div>
          <p className="text-label-caps mt-10 text-accent-ink">Your storefront is live</p>
          <h1 className="text-display-md mt-3">{form.displayName || store?.name} is ready.</h1>
          <p className="mx-auto mt-5 max-w-lg text-muted-foreground">Your virtual shop is now available for customers. Publish products from Kudi and share the storefront link anywhere you sell.</p>
          <div className="mt-8 border border-border bg-background p-4 text-left shadow-lift">
            <p className="text-label-caps text-muted-foreground">Your storefront</p>
            <a className="mt-2 block truncate font-display text-lg font-semibold text-accent-ink underline-offset-4 hover:underline" href={`/store/${slugify(form.slug)}`} target="_blank" rel="noreferrer">
              {window.location.origin}/store/{slugify(form.slug)}
            </a>
          </div>
          <button type="button" onClick={returnToDashboard} className="touch-target mt-7 inline-flex items-center gap-2 bg-foreground px-7 py-3.5 font-semibold text-background hover:bg-accent hover:text-accent-foreground">
            Back to Kudi <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-2"><span className="flex size-8 items-center justify-center rounded-lg bg-accent"><span className="size-3 rotate-45 rounded-[3px] bg-foreground" /></span><span className="font-display text-lg font-bold">KUDI.</span></div>
          <span className="text-sm text-muted-foreground">Online store setup · {progress}</span>
        </div>
        <div className="h-1 bg-secondary"><div className="h-full bg-accent transition-all" style={{ width: progress }} /></div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-[240px_1fr] lg:py-14">
        <aside className="hidden lg:block">
          <p className="text-label-caps text-muted-foreground">Setup</p>
          <div className="mt-4 space-y-2">
            {["Store identity", "Customer contact", "Selling online", "Review & publish"].map((label, index) => {
              const n = index + 1; const active = n === step; const done = n < step;
              return <div key={label} className={`flex items-center gap-3 px-3 py-2.5 ${active ? "bg-accent-soft" : ""}`}><span className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-accent text-foreground" : active ? "bg-foreground text-background" : "bg-secondary text-muted-foreground"}`}>{done ? <Check className="size-3.5" /> : n}</span><span className="text-sm font-medium">{label}</span></div>;
            })}
          </div>
        </aside>

        <section className="max-w-2xl">
          {step === 1 && <Step title="Let's build your storefront." description="Give customers a clear first impression. You can change these details later.">
            <Field icon={<Store />} label="Store display name"><input value={form.displayName} onChange={(e) => update("displayName", e.target.value)} className="field" placeholder={store?.name || "Your store name"} /></Field>
            <Field icon={<Globe2 />} label="Store link"><div className="flex items-center border border-border bg-surface"><span className="px-3 text-sm text-muted-foreground">/store/</span><input value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} className="min-w-0 flex-1 bg-transparent px-2 py-3 outline-none" placeholder="your-store" /></div><p className="mt-1 text-xs text-muted-foreground">Use letters, numbers and hyphens. Keep it short enough to share.</p></Field>
            <Field icon={<ImagePlus />} label="Store logo" optional><div className="flex items-center gap-4"><button type="button" onClick={() => fileRef.current?.click()} className="flex size-20 items-center justify-center overflow-hidden border border-dashed border-border bg-secondary">{logoPreview ? <img src={logoPreview} className="h-full w-full object-cover" alt="Logo preview" /> : <ImagePlus className="size-6 text-muted-foreground" />}</button><div><p className="text-sm font-medium">Upload a square logo</p><p className="mt-1 text-xs text-muted-foreground">PNG, JPG or WEBP · max 3 MB</p></div><input ref={fileRef} hidden type="file" accept="image/*" onChange={(e) => chooseLogo(e.target.files?.[0])} /></div></Field>
            <Field label="About your store" optional><textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="field min-h-28 resize-none" placeholder="Tell shoppers what you sell and what makes your store worth buying from." /></Field>
          </Step>}

          {step === 2 && <Step title="How should customers reach you?" description="These details appear on your storefront and help customers trust the business behind it.">
            <div className="grid gap-5 sm:grid-cols-2"><Field icon={<Mail />} label="Display email" optional><input type="email" value={form.displayEmail} onChange={(e) => update("displayEmail", e.target.value)} className="field" placeholder="hello@example.com" /></Field><Field icon={<Phone />} label="Display phone" optional><input value={form.displayPhone} onChange={(e) => update("displayPhone", e.target.value)} className="field" placeholder="0800 000 0000" /></Field></div>
            <Field label="Delivery / shipping note" optional><textarea value={form.shippingNote} onChange={(e) => update("shippingNote", e.target.value)} className="field min-h-28 resize-none" placeholder="Example: Nationwide delivery. Same-day delivery within Lagos for orders before 2 PM." /></Field>
            <Field label="Checkout instructions" optional><textarea value={form.checkoutNote} onChange={(e) => update("checkoutNote", e.target.value)} className="field min-h-28 resize-none" placeholder="Example: We will call you after your order to confirm delivery and payment details." /></Field>
          </Step>}

          {step === 3 && <Step title="Set expectations before you sell." description="Kudi captures orders and keeps them in your dashboard. You stay in control of fulfilment, delivery and payment confirmation.">
            <div className="grid gap-4 sm:grid-cols-3"><InfoCard title="Orders" body="Customers can browse your published products and submit an order." /><InfoCard title="Payments" body="Checkout records the customer's selected payment method; it does not pretend a payment was collected." /><InfoCard title="Dropshipping" body="Use your Kudi catalog to receive orders while you fulfil through your own supplier workflow." /></div>
            <div className="mt-6 border border-border bg-secondary/50 p-5"><p className="font-display font-semibold">Before publishing</p><ul className="mt-3 space-y-2 text-sm text-muted-foreground"><li>• Publish only products you are authorised to sell.</li><li>• Keep prices, descriptions and delivery promises accurate.</li><li>• Never put passwords, API keys or private customer information in storefront fields.</li><li>• Review new orders promptly from the Orders screen.</li></ul></div>
          </Step>}

          {step === 4 && <Step title="One last thing before we open the doors." description="Please read both documents. They describe exactly how Kudi's online storefront works and what you are responsible for as the merchant.">
            <div className="space-y-5"><Legal title="Privacy Notice" icon={<ShieldCheck />} text={PRIVACY} /><Legal title="Terms of Use" icon={<ShieldCheck />} text={TERMS} /></div>
            <label className="mt-5 flex items-start gap-3 border border-border bg-surface p-4"><input type="checkbox" checked={acceptPrivacy} onChange={(e) => setAcceptPrivacy(e.target.checked)} className="mt-1 size-4 accent-[var(--color-accent)]" /><span className="text-sm">I have read and accept the Kudi Online Storefront Privacy Notice.</span></label>
            <label className="mt-3 flex items-start gap-3 border border-border bg-surface p-4"><input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className="mt-1 size-4 accent-[var(--color-accent)]" /><span className="text-sm">I have read and accept the Kudi Online Storefront Terms of Use.</span></label>
          </Step>}

          <div className="mt-10 flex items-center justify-between gap-3 border-t border-border pt-6"><button type="button" disabled={step===1 || saving} onClick={() => setStep((s) => Math.max(1,s-1))} className="touch-target inline-flex items-center gap-2 border border-border px-5 py-3 text-sm font-semibold disabled:opacity-40"><ArrowLeft className="size-4" /> Back</button>{step < 4 ? <button type="button" onClick={() => setStep((s) => Math.min(4,s+1))} className="touch-target inline-flex items-center gap-2 bg-foreground px-6 py-3 text-sm font-semibold text-background">Continue <ArrowRight className="size-4" /></button> : <button type="button" disabled={saving} onClick={finishSetup} className="touch-target inline-flex items-center gap-2 bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground disabled:opacity-60">{saving ? <><Loader2 className="size-4 animate-spin" /> Setting up...</> : <><Sparkles className="size-4" /> Launch my storefront</>}</button>}</div>
        </section>
      </div>
    </main>
  );
}

function Step({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div><p className="text-label-caps text-accent-ink">KUDI ONLINE</p><h1 className="text-display-md mt-3">{title}</h1><p className="mt-4 max-w-2xl text-muted-foreground">{description}</p><div className="mt-9 space-y-6">{children}</div></div>;
}
function Field({ label, optional, icon, children }: { label: string; optional?: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
  return <div><label className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon && <span className="text-accent-ink">{icon}</span>}{label}{optional && <span className="font-normal text-muted-foreground">Optional</span>}</label>{children}</div>;
}
function InfoCard({ title, body }: { title: string; body: string }) { return <div className="border border-border bg-surface p-5"><p className="font-display font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>; }
function Legal({ title, icon, text }: { title: string; icon: React.ReactNode; text: string }) {
  return <details className="group border border-border bg-surface"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-display font-semibold"><span className="flex items-center gap-2">{icon}<span>{title}</span></span><X className="size-4 rotate-45 transition-transform group-open:rotate-0" /></summary><div className="max-h-72 overflow-y-auto border-t border-border bg-background px-5 py-5"><pre className="whitespace-pre-wrap font-sans text-xs leading-6 text-muted-foreground">{text}</pre></div></details>;
}
