import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Check, ChevronRight, CreditCard, ExternalLink, Globe2, KeyRound, Laptop, Lock, LogOut, Package, Palette, Receipt, Save, ShieldCheck, Store, Users, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

type Item = { id: string; title: string; description: string; icon: typeof Store };
const items: Item[] = [
  { id: "profile", title: "Store profile", description: "Business identity, contact details and location", icon: Store },
  { id: "appearance", title: "Store appearance", description: "Brand, colors, typography and storefront presentation", icon: Palette },
  { id: "staff", title: "Staff & permissions", description: "Team members, roles and access", icon: Users },
  { id: "notifications", title: "Notifications", description: "Orders, stock and customer alerts", icon: Bell },
  { id: "receipts", title: "Receipts", description: "Receipt identity, printing and footer details", icon: Receipt },
  { id: "online", title: "Online store", description: "Storefront, SEO, navigation and publishing", icon: Globe2 },
  { id: "checkout", title: "Checkout & sales", description: "Checkout behaviour, discounts and sales preferences", icon: CreditCard },
  { id: "inventory", title: "Inventory", description: "Stock rules, alerts, valuation and branches", icon: Package },
  { id: "security", title: "Security", description: "Account protection and session controls", icon: ShieldCheck },
  { id: "payments", title: "Payments", description: "Payment providers and subscription billing", icon: CreditCard },
  { id: "password", title: "Change password", description: "Securely change your account password", icon: KeyRound },
  { id: "sessions", title: "Active computers / sessions", description: "Review and revoke signed-in sessions", icon: Laptop },
  { id: "signout", title: "Sign out other devices", description: "Keep this device signed in and revoke others", icon: LogOut },
  { id: "advanced", title: "Advanced settings", description: "30+ operational controls for your store", icon: SlidersHorizontal },
];

const preferenceDefaults: Record<string, boolean> = {
  order_alerts: true, low_stock_alerts: true, out_of_stock_alerts: true, customer_alerts: true, staff_activity: false,
  receipt_logo: true, auto_print: false, customer_details: true, discount_codes: true, pos_sounds: true,
  stock_tracking: true, negative_stock: false, branch_stock: true,
};

function SettingsPage() {
  const { store, role } = useStoreContext();
  const [active, setActive] = useState("profile");
  const [prefs, setPrefs] = useState(preferenceDefaults);
  const [saved, setSaved] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const email = useQuery({ queryKey: ["settings-user-email"], queryFn: async () => (await supabase.auth.getUser()).data.user?.email ?? "" }).data ?? "";
  const selected = useMemo(() => items.find((x) => x.id === active) ?? items[0], [active]);

  useEffect(() => {
    const raw = window.localStorage.getItem("strap-settings-preferences");
    if (raw) setPrefs({ ...preferenceDefaults, ...JSON.parse(raw) });
  }, []);

  function toggle(key: string, value: boolean) { setPrefs((p) => ({ ...p, [key]: value })); setSaved(false); }
  function savePreferences() { window.localStorage.setItem("strap-settings-preferences", JSON.stringify(prefs)); setSaved(true); window.setTimeout(() => setSaved(false), 2200); }

  async function sendOtp() {
    if (!email) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setBusy(false);
    if (error) return setMessage(error.message);
    setOtpSent(true); setMessage("Verification code sent to your email.");
  }

  async function verifyAndChange() {
    if (!otp || newPassword.length < 8) return setMessage("Enter the code and a password of at least 8 characters.");
    setBusy(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    if (verifyError) { setBusy(false); return setMessage(verifyError.message); }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false); setMessage(error ? error.message : "Password changed successfully.");
    if (!error) { setOtp(""); setNewPassword(""); setOtpSent(false); }
  }

  async function signOutOthers() {
    setBusy(true); const { error } = await supabase.auth.signOut({ scope: "others" }); setBusy(false);
    setMessage(error ? error.message : "Other active sessions have been signed out.");
  }

  return <AppShell title="Settings">
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-border bg-surface p-2 lg:sticky lg:top-28">
        <div className="px-3 py-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Store & account</p><p className="mt-1 truncate text-sm font-medium">{store?.name ?? "Your store"}</p></div>
        {items.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => { setActive(item.id); setMessage(""); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active === item.id ? "bg-accent-soft text-accent-ink" : "hover:bg-secondary"}`}><Icon className="size-4 shrink-0"/><span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{item.title}</span><span className="hidden truncate text-xs text-muted-foreground sm:block">{item.description}</span></span><ChevronRight className="size-4 opacity-50"/></button>; })}
      </aside>

      <section className="min-w-0 rounded-2xl border border-border bg-surface p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-6"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Settings / {selected.title}</p><h2 className="mt-1 text-2xl font-bold tracking-tight">{selected.title}</h2><p className="mt-2 text-sm text-muted-foreground">{selected.description}</p></div>{active === "payments" && <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">Coming Soon</span>}</div>

        {active === "profile" && <ProfileSection store={store} role={role} />}
        {active === "appearance" && <AppearanceSection prefs={prefs} toggle={toggle} save={savePreferences} saved={saved} />}
        {active === "staff" && <StaffSection role={role} />}
        {active === "notifications" && <PreferenceSection title="Notification preferences" description="Choose which events should notify you and your team." prefs={prefs} toggle={toggle} save={savePreferences} saved={saved} rows={[["order_alerts","New orders","Notify when a new order is created."],["low_stock_alerts","Low-stock alerts","Notify when stock reaches the configured threshold."],["out_of_stock_alerts","Out-of-stock alerts","Notify when a product becomes unavailable."],["customer_alerts","Customer notifications","Allow customer-facing order notifications."],["staff_activity","Staff activity","Notify owners about important staff actions."]]}/>} 
        {active === "receipts" && <ReceiptSection prefs={prefs} toggle={toggle} save={savePreferences} saved={saved} />}
        {active === "online" && <OnlineStoreSection />}
        {active === "checkout" && <PreferenceSection title="Checkout & sales" description="Control how sales move through POS and online checkout." prefs={prefs} toggle={toggle} save={savePreferences} saved={saved} rows={[["customer_details","Require customer details","Collect customer information during checkout."],["discount_codes","Allow discount codes","Enable discounts where supported."],["pos_sounds","POS sounds","Play feedback sounds for POS actions."],["auto_print","Auto-print receipts","Automatically print receipts after eligible sales."],["negative_stock","Allow negative stock","Allow sales when inventory reaches zero."]]}/>} 
        {active === "inventory" && <PreferenceSection title="Inventory controls" description="Set the rules that protect your inventory data." prefs={prefs} toggle={toggle} save={savePreferences} saved={saved} rows={[["stock_tracking","Track stock","Keep inventory quantities updated as sales occur."],["low_stock_alerts","Low-stock protection","Use low-stock thresholds for alerts."],["negative_stock","Prevent negative stock","Block sales that would create negative inventory."],["branch_stock","Branch-aware inventory","Keep stock operations aware of store branches."]]}/>}
        {active === "security" && <SecuritySection onSignOutOthers={signOutOthers} busy={busy} />}
        {active === "payments" && <ComingSoon />}
        {active === "password" && <PasswordSection email={email} otpSent={otpSent} otp={otp} setOtp={setOtp} newPassword={newPassword} setNewPassword={setNewPassword} sendOtp={sendOtp} verifyAndChange={verifyAndChange} busy={busy} message={message} />}
        {active === "sessions" && <SessionsSection onSignOutOthers={signOutOthers} busy={busy} message={message} />}
        {active === "signout" && <SignOutSection onSignOutOthers={signOutOthers} busy={busy} message={message} />}
        {active === "advanced" && <AdvancedSection />}
      </section>
    </div>
  </AppShell>;
}

function ProfileSection({ store, role }: { store: any; role: any }) { return <div className="space-y-6 py-7"><div className="grid gap-5 sm:grid-cols-2"><Field label="Store name" value={store?.name ?? ""}/><Field label="Phone" value={store?.phone ?? ""}/><Field label="Address" value={store?.address ?? ""}/><Field label="Currency" value={store?.currency ?? "NGN"}/></div><div className="rounded-xl border border-border bg-secondary/40 p-5"><p className="font-semibold">Store ownership</p><p className="mt-1 text-sm text-muted-foreground">Current access: {role ?? "authorised store member"}. Profile changes affect the store identity shown throughout Strap.</p></div><SaveButton label="Save store profile" /></div> }
function Field({ label, value }: { label: string; value: string }) { return <div><Label>{label}</Label><Input className="mt-2" defaultValue={value}/></div> }
function AppearanceSection({ prefs, toggle, save, saved }: any) { return <div className="space-y-5 py-7"><div className="grid gap-4 sm:grid-cols-2"><ColorCard title="Primary brand"/><ColorCard title="Store background"/><ColorCard title="Text color"/><ColorCard title="Accent color"/></div><PreferenceRow label="Use store logo" description="Show your brand identity on the storefront." checked={prefs.receipt_logo} onChange={(v:boolean)=>toggle("receipt_logo",v)}/><PreferenceRow label="Show store name" description="Display your store name in storefront navigation." checked={true} onChange={()=>{}}/><Link to="/online-store" className="inline-flex items-center gap-2 font-semibold text-accent-ink">Open online store tools <ExternalLink className="size-4"/></Link><SaveButton label={saved ? "Saved" : "Save appearance"} onClick={save} icon={saved ? Check : Save}/></div> }
function ColorCard({ title }: { title: string }) { return <div className="rounded-xl border border-border p-4"><p className="text-sm font-semibold">{title}</p><div className="mt-3 flex items-center gap-3"><input type="color" defaultValue="#111111" className="h-10 w-14 cursor-pointer rounded-lg border-0 bg-transparent"/><span className="text-xs text-muted-foreground">Choose a custom color</span></div></div> }
function StaffSection({ role }: { role: any }) { return <div className="space-y-5 py-7"><div className="grid gap-4 sm:grid-cols-3"><Stat label="Your role" value={String(role ?? "Owner")}/><Stat label="Access model" value="Role based"/><Stat label="Staff security" value="PIN supported"/></div><div className="rounded-xl border border-border p-5"><h3 className="font-semibold">Manage staff</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Invite team members, assign roles, manage access and review staff activity from the staff workspace.</p><Link to="/staff" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold">Open staff management <ExternalLink className="size-4"/></Link></div></div> }
function Stat({ label, value }: { label:string; value:string }) { return <div className="rounded-xl border border-border p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold capitalize">{value}</p></div> }
function PreferenceSection({ title, description, rows, prefs, toggle, save, saved }: any) { return <div className="space-y-3 py-7"><p className="mb-5 text-sm text-muted-foreground">{description}</p>{rows.map(([key,label,desc]:string[]) => <PreferenceRow key={key} label={label} description={desc} checked={!!prefs[key]} onChange={(v:boolean)=>toggle(key,v)}/>)}<SaveButton label={saved ? "Saved" : "Save changes"} onClick={save} icon={saved ? Check : Save}/></div> }
function PreferenceRow({ label, description, checked, onChange }: { label:string; description:string; checked:boolean; onChange:(v:boolean)=>void }) { return <div className="flex items-center justify-between gap-5 rounded-xl border border-border p-4"><div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onChange}/></div> }
function SaveButton({ label, onClick, icon:Icon = Save }: { label:string; onClick?:()=>void; icon?:any }) { return <Button onClick={onClick}><Icon className="mr-2 size-4"/>{label}</Button> }
function ReceiptSection({ prefs, toggle, save, saved }: any) { return <div className="space-y-5 py-7"><div className="rounded-xl border border-border p-5"><h3 className="font-semibold">Receipt identity</h3><div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Receipt header" value="Thank you for your purchase"/><Field label="Footer message" value="Powered by Strap"/><Field label="Tax / business ID" value=""/><Field label="Receipt prefix" value="STRAP"/></div></div><PreferenceRow label="Show logo" description="Include your store logo on printed receipts." checked={prefs.receipt_logo} onChange={(v)=>toggle("receipt_logo",v)}/><PreferenceRow label="Auto-print" description="Print receipts automatically after supported sales." checked={prefs.auto_print} onChange={(v)=>toggle("auto_print",v)}/><SaveButton label={saved ? "Saved" : "Save receipt settings"} onClick={save} icon={saved ? Check : Save}/></div> }
function OnlineStoreSection() { return <div className="grid gap-4 py-7 sm:grid-cols-2"><LinkCard title="Storefront" body="Open the actual customer-facing storefront tools." to="/online-store"/><LinkCard title="Store customization" body="Manage available storefront presentation controls." to="/online-store"/><LinkCard title="Catalog" body="Manage products and collections shown online." to="/products"/><LinkCard title="SEO & sharing" body="Prepare your store title, description and social presentation." to="/advanced-settings"/></div> }
function LinkCard({ title, body, to }: { title:string; body:string; to:string }) { return <Link to={to as any} className="rounded-xl border border-border p-5 transition hover:border-accent"><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-ink">Open <ExternalLink className="size-4"/></span></Link> }
function SecuritySection({ onSignOutOthers, busy }: { onSignOutOthers:()=>void; busy:boolean }) { return <div className="space-y-4 py-7"><div className="rounded-xl border border-border p-5"><ShieldCheck className="size-6 text-accent-ink"/><h3 className="mt-4 font-semibold">Account protection</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Email verification, authentication and session controls are handled by Supabase Auth.</p></div><LinkCard title="Change password" body="Verify your email with an OTP before changing your password." to="/settings"/><div className="rounded-xl border border-border p-5"><p className="font-semibold">Revoke other sessions</p><p className="mt-1 text-sm text-muted-foreground">Keep this device signed in while invalidating other logins.</p><Button className="mt-4" variant="outline" onClick={onSignOutOthers} disabled={busy}>{busy ? "Working…" : "Sign out other devices"}</Button></div></div> }
function SessionsSection({ onSignOutOthers, busy, message }: any) { return <div className="space-y-4 py-7"><div className="rounded-xl border border-border p-5"><div className="flex gap-3"><Laptop className="mt-1 size-5 text-accent-ink"/><div><p className="font-semibold">Current session</p><p className="mt-1 text-sm text-muted-foreground">This browser is the session currently managing your Strap store.</p><span className="mt-3 inline-flex rounded-full bg-accent-soft px-2.5 py-1 text-xs font-semibold text-accent-ink">Active now</span></div></div></div><div className="rounded-xl border border-border p-5"><p className="font-semibold">Other sessions</p><p className="mt-1 text-sm leading-6 text-muted-foreground">Supabase Auth manages session revocation. Use the action below to invalidate all other active sessions.</p><Button className="mt-4" variant="outline" onClick={onSignOutOthers} disabled={busy}>{busy ? "Signing out…" : "Sign out other devices"}</Button>{message&&<p className="mt-3 text-sm text-muted-foreground">{message}</p>}</div></div> }
function SignOutSection({ onSignOutOthers, busy, message }: any) { return <div className="py-10"><div className="max-w-xl rounded-2xl border border-border bg-secondary/40 p-6"><LogOut className="size-7 text-accent-ink"/><h3 className="mt-4 text-xl font-bold">Sign out everywhere else</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Your current browser stays signed in. Every other active session is revoked by Supabase Auth.</p><Button className="mt-6" onClick={onSignOutOthers} disabled={busy}>{busy ? "Signing out…" : "Sign out other devices"}</Button>{message&&<p className="mt-4 text-sm">{message}</p>}</div></div> }
function PasswordSection({ email, otpSent, otp, setOtp, newPassword, setNewPassword, sendOtp, verifyAndChange, busy, message }: any) { return <div className="max-w-lg space-y-5 py-7"><div className="rounded-xl border border-border bg-secondary/40 p-4"><p className="text-sm font-semibold">Email OTP verification</p><p className="mt-1 text-xs leading-5 text-muted-foreground">We will send a verification code to {email || "your verified email"} before the password is changed.</p></div><div><Label>New password</Label><Input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} className="mt-2" minLength={8} placeholder="At least 8 characters"/></div>{otpSent&&<div><Label>Verification code</Label><Input inputMode="numeric" value={otp} onChange={(e)=>setOtp(e.target.value)} className="mt-2" placeholder="Enter your OTP"/></div>}{!otpSent?<Button onClick={sendOtp} disabled={busy||!email}>{busy ? "Sending…" : "Send verification code"}</Button>:<Button onClick={verifyAndChange} disabled={busy||!otp||!newPassword}>{busy ? "Changing…" : "Verify & change password"}</Button>}{message&&<p className="text-sm text-muted-foreground">{message}</p>}</div> }
function AdvancedSection() { return <div className="py-7"><div className="rounded-2xl border border-border bg-secondary/40 p-6"><SlidersHorizontal className="size-7 text-accent-ink"/><h3 className="mt-4 text-xl font-bold">Advanced settings</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Open the dedicated advanced workspace containing the store's 30+ operational controls. It is intentionally separate from everyday settings.</p><Link to="/advanced-settings" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold">Open Advanced Settings <ExternalLink className="size-4"/></Link></div></div> }
function ComingSoon() { return <div className="py-12 text-center"><CreditCard className="mx-auto size-9 text-muted-foreground"/><h3 className="mt-4 text-xl font-bold">Payments are coming soon</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Payment providers, premium plans and subscription billing are intentionally disabled until launch.</p></div> }
