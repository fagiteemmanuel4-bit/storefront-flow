import { useEffect, useMemo, useState } from "react";
import { Printer, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ReceiptPrefs = {
  businessName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  taxId: string;
  header: string;
  thankYou: string;
  footer: string;
  prefix: string;
  paperSize: "58mm" | "80mm" | "A4";
  copies: number;
  alignment: "left" | "center";
  fontSize: "compact" | "normal" | "large";
  showLogo: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showEmail: boolean;
  showTaxId: boolean;
  showReference: boolean;
  showDate: boolean;
  showCustomer: boolean;
  showCashier: boolean;
  showBranch: boolean;
  showItemDetails: boolean;
  showSubtotal: boolean;
  showDiscount: boolean;
  showTax: boolean;
  showPaymentMethod: boolean;
  showFooter: boolean;
};
const defaults: ReceiptPrefs = {
  businessName: "",
  logoUrl: "",
  address: "",
  phone: "",
  email: "",
  taxId: "",
  header: "Thank you for your purchase",
  thankYou: "Thank you for shopping with us.",
  footer: "Powered by Strap",
  prefix: "STRAP",
  paperSize: "80mm",
  copies: 1,
  alignment: "center",
  fontSize: "normal",
  showLogo: true,
  showAddress: true,
  showPhone: true,
  showEmail: false,
  showTaxId: false,
  showReference: true,
  showDate: true,
  showCustomer: true,
  showCashier: false,
  showBranch: true,
  showItemDetails: true,
  showSubtotal: true,
  showDiscount: true,
  showTax: true,
  showPaymentMethod: true,
  showFooter: true,
};
const db = supabase as any;
function Toggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-3">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={value} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
export function ReceiptSettingsPanel() {
  const { store, role } = useStoreContext();
  const canManage = role === "owner" || role === "manager";
  const [form, setForm] = useState<ReceiptPrefs>(defaults);
  const [initial, setInitial] = useState<ReceiptPrefs>(defaults);
  const [advanced, setAdvanced] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    let live = true;
    (async () => {
      if (!store?.id) return;
      const { data, error } = await db
        .from("store_advanced_settings")
        .select("settings")
        .eq("store_id", store.id)
        .maybeSingle();
      if (error) {
        toast.error(error.message);
        if (live) setLoading(false);
        return;
      }
      const all = (data?.settings ?? {}) as Record<string, unknown>;
      const saved = {
        ...defaults,
        ...((all.receipts ?? {}) as Partial<ReceiptPrefs>),
        businessName: (all.receipts as any)?.businessName || store.name || "",
      };
      if (live) {
        setAdvanced(all);
        setForm(saved);
        setInitial(saved);
        setLoading(false);
      }
    })();
    return () => {
      live = false;
    };
  }, [store?.id, store?.name]);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = (k: keyof ReceiptPrefs, v: any) => setForm((x) => ({ ...x, [k]: v }));
  const save = async () => {
    if (!store?.id || !canManage) return;
    setSaving(true);
    try {
      const { error } = await db.from("store_advanced_settings").upsert(
        {
          store_id: store.id,
          settings: { ...advanced, receipts: form },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "store_id" },
      );
      if (error) throw new Error(error.message);
      setAdvanced((x) => ({ ...x, receipts: form }));
      setInitial(form);
      toast.success("Receipt preferences saved for this store.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save receipt settings.");
    } finally {
      setSaving(false);
    }
  };
  const reset = () => setForm({ ...defaults, businessName: store?.name ?? "" });
  const sample = useMemo(
    () => ({
      reference: "STRAP-000128",
      date: new Date().toLocaleString(),
      subtotal: 12500,
      tax: 0,
      total: 12500,
    }),
    [],
  );
  if (loading)
    return (
      <div className="rounded-2xl border border-border p-8 text-sm text-muted-foreground">
        Loading receipt preferences…
      </div>
    );
  const field = (label: keyof ReceiptPrefs, placeholder: string) => (
    <label className="block text-sm font-medium">
      {String(label)
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (s) => s.toUpperCase())}
      <Input
        className="mt-2"
        value={String(form[label] ?? "")}
        placeholder={placeholder}
        onChange={(e) => set(label, e.target.value)}
      />
    </label>
  );
  const flags: [keyof ReceiptPrefs, string, string][] = [
    ["showLogo", "Show logo", "Include your business mark at the top."],
    ["showAddress", "Show address", "Print your business address."],
    ["showPhone", "Show phone", "Print your contact number."],
    ["showEmail", "Show email", "Print your contact email."],
    ["showTaxId", "Show tax ID", "Include your tax identification number."],
    ["showReference", "Show receipt reference", "Make each transaction easy to identify."],
    ["showDate", "Show date and time", "Print the sale timestamp."],
    ["showCustomer", "Show customer", "Include the selected customer's name."],
    ["showCashier", "Show cashier", "Include the cashier name when available."],
    ["showBranch", "Show branch", "Identify the selling location."],
    ["showItemDetails", "Show item details", "Include item names and quantities."],
    ["showSubtotal", "Show subtotal", "Display the pre-tax subtotal."],
    ["showDiscount", "Show discount", "Display discounts when recorded."],
    ["showTax", "Show tax", "Display tax when charged."],
    ["showPaymentMethod", "Show payment method", "Identify how the customer paid."],
    ["showFooter", "Show footer", "Print the closing message and footer."],
  ];
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Build a consistent receipt for counter sales, returns and customer records. Preferences
          are saved per store.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>
          <Button disabled={!dirty || saving || !canManage} onClick={() => void save()}>
            <Save className="mr-2 size-4" />
            {saving ? "Saving…" : "Save preferences"}
          </Button>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="surface-card space-y-4 p-5">
            <h3 className="font-semibold">Business identity</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {field("businessName", "Business name")}
              {field("logoUrl", "https://…")}
              {field("address", "Street, city and state")}
              {field("phone", "+234…")}
              {field("email", "hello@example.com")}
              {field("taxId", "Tax identification number")}
            </div>
          </section>
          <section className="surface-card space-y-4 p-5">
            <h3 className="font-semibold">Receipt wording</h3>
            {field("header", "Thank you for your purchase")}
            <label className="block text-sm font-medium">
              Thank-you message
              <Textarea
                className="mt-2"
                value={form.thankYou}
                onChange={(e) => set("thankYou", e.target.value)}
                maxLength={240}
              />
            </label>
            <label className="block text-sm font-medium">
              Footer note
              <Textarea
                className="mt-2"
                value={form.footer}
                onChange={(e) => set("footer", e.target.value)}
                maxLength={240}
              />
            </label>
            {field("prefix", "STRAP")}
          </section>
          <section className="surface-card space-y-4 p-5">
            <h3 className="font-semibold">Layout and printing</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Paper size
                <Select value={form.paperSize} onValueChange={(v) => set("paperSize", v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="58mm">58 mm thermal</SelectItem>
                    <SelectItem value="80mm">80 mm thermal</SelectItem>
                    <SelectItem value="A4">A4 page</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="text-sm font-medium">
                Copies
                <Select value={String(form.copies)} onValueChange={(v) => set("copies", Number(v))}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? "copy" : "copies"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="text-sm font-medium">
                Text size
                <Select value={form.fontSize} onValueChange={(v) => set("fontSize", v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">Compact</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </label>
              <label className="text-sm font-medium">
                Header alignment
                <Select value={form.alignment} onValueChange={(v) => set("alignment", v)}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Centered</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>
          </section>
          <section className="surface-card space-y-3 p-5">
            <h3 className="font-semibold">Receipt content controls</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {flags.map(([key, label, description]) => (
                <Toggle
                  key={key}
                  label={label}
                  description={description}
                  value={Boolean(form[key])}
                  onChange={(v) => set(key, v)}
                />
              ))}
            </div>
          </section>
        </div>
        <aside className="space-y-4">
          <section className="surface-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">Live preview</h3>
              <span className="text-xs text-muted-foreground">{form.paperSize}</span>
            </div>
            <article
              className="mx-auto w-full max-w-[300px] bg-white p-5 font-mono text-[11px] leading-relaxed text-black shadow-lg"
              style={{ textAlign: form.alignment }}
            >
              {form.showLogo && form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt=""
                  className="mx-auto mb-3 max-h-12 max-w-28 object-contain"
                />
              )}
              <strong className="block text-base">
                {form.businessName || store?.name || "YOUR STORE"}
              </strong>
              {form.showAddress && form.address && <p>{form.address}</p>}
              {form.showPhone && form.phone && <p>{form.phone}</p>}
              {form.showEmail && form.email && <p>{form.email}</p>}
              {form.showTaxId && form.taxId && <p>Tax ID: {form.taxId}</p>}
              {form.header && <p className="mt-3">{form.header}</p>}
              <hr className="my-3 border-dashed border-black/40" />
              {form.showReference && (
                <p>
                  Receipt: {form.prefix}-{sample.reference}
                </p>
              )}
              {form.showDate && <p>{sample.date}</p>}
              {form.showCustomer && <p>Customer: Walk-in</p>}
              {form.showItemDetails && (
                <div className="my-3 text-left">
                  <div className="flex justify-between">
                    <span>Product A × 2</span>
                    <span>₦8,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Product B × 1</span>
                    <span>₦4,500</span>
                  </div>
                </div>
              )}
              <hr className="my-3 border-dashed border-black/40" />
              {form.showSubtotal && (
                <p className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦12,500</span>
                </p>
              )}
              {form.showTax && (
                <p className="flex justify-between">
                  <span>Tax</span>
                  <span>₦0</span>
                </p>
              )}
              <p className="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span>₦12,500</span>
              </p>
              {form.showPaymentMethod && <p className="mt-2">Payment: Cash</p>}
              {form.thankYou && <p className="mt-4">{form.thankYou}</p>}
              {form.showFooter && <p className="mt-2">{form.footer}</p>}
            </article>
            <Button variant="outline" className="mt-4 w-full" onClick={() => window.print()}>
              <Printer className="mr-2 size-4" />
              Print preview
            </Button>
          </section>
          <p className="rounded-xl border border-border bg-secondary/40 p-3 text-xs leading-5 text-muted-foreground">
            Direct Bluetooth printing depends on browser and printer support. Strap uses the browser
            print dialog as its dependable baseline.
          </p>
        </aside>
      </div>
      {!canManage && (
        <p className="rounded-xl border border-border p-4 text-sm text-muted-foreground">
          You can view receipt preferences, but only store owners and managers can save changes.
        </p>
      )}
    </div>
  );
}
