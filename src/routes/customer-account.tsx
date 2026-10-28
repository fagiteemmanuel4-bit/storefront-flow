import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, LogOut, PackageSearch, Plus, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/customer-account")({
  validateSearch: (search: Record<string, unknown>) => ({ store: typeof search.store === "string" ? search.store : "", order: typeof search.order === "string" ? search.order : "", phone: typeof search.phone === "string" ? search.phone : "" }),
  head: () => ({ meta: [{ title: "My orders — Strap" }, { name: "description", content: "Manage your temporary Strap customer account and track your orders." }] }),
  component: CustomerAccountPage,
});

type Account = { id: string; store_id: string; name: string; email: string; phone: string; created_at: string; expires_at: string };
type Order = { order_id: string; order_number: string; status: string; total: number; created_at: string; tracking_token: string | null };

function sessionKey(store: string) { return `kudi_customer_session:${store}`; }
function readToken(store: string) { try { return localStorage.getItem(sessionKey(store)) ?? ""; } catch { return ""; } }
function saveToken(store: string, token: string) { localStorage.setItem(sessionKey(store), token); }
function clearToken(store: string) { localStorage.removeItem(sessionKey(store)); }
function prettyStatus(status: string) { return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

function CustomerAccountPage() {
  const { store, order, phone: orderPhone } = Route.useSearch();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [account, setAccount] = useState<Account | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [claiming, setClaiming] = useState(Boolean(order));
  const [form, setForm] = useState({ name: "", email: "", phone: orderPhone, password: "" });
  const [trackingToken, setTrackingToken] = useState("");

  async function refresh(token: string) {
    if (!token || !store) { setAccount(null); setOrders([]); setLoading(false); return; }
    const result = await onlineSupabase.rpc("customer_account_get", { _token: token });
    if (result.error) { clearToken(store); setAccount(null); setOrders([]); setLoading(false); return; }
    setAccount(result.data as Account);
    const orderResult = await onlineSupabase.rpc("customer_account_orders", { _token: token });
    if (!orderResult.error) setOrders((orderResult.data ?? []) as Order[]);
    setLoading(false);
  }

  useEffect(() => { void refresh(readToken(store)); }, [store]);

  async function resolveOrderToken(orderNumber: string, phone: string) {
    if (!orderNumber.trim() || !phone.trim()) return "";
    const result = await onlineSupabase.rpc("get_order_tracking_token", { _order_number: orderNumber.trim(), _customer_phone: phone.trim() });
    if (result.error) throw new Error(result.error.message);
    return String(result.data ?? "");
  }

  async function submitAccount() {
    if (!store) { toast.error("Open this page from a Strap store."); return; }
    setSubmitting(true);
    try {
      const rpc = mode === "register" ? onlineSupabase.rpc("customer_account_register", { _slug: store, _name: form.name, _email: form.email, _phone: form.phone, _password: form.password }) : onlineSupabase.rpc("customer_account_login", { _slug: store, _email: form.email, _password: form.password });
      const result = await rpc;
      if (result.error) throw new Error(result.error.message);
      const token = String(result.data?.token ?? "");
      if (!token) throw new Error("Could not create a secure session");
      saveToken(store, token);
      setForm({ name: "", email: "", phone: "", password: "" });
      await refresh(token);
      if (order && form.phone) {
        const tracking = await resolveOrderToken(order, form.phone);
        if (tracking) {
          const linkResult = await onlineSupabase.rpc("customer_account_link_order", { _token: token, _tracking_token: tracking });
          if (!linkResult.error) toast.success("Your new account is ready and your order was added.");
          else toast.success(mode === "register" ? "Your temporary customer account is ready." : "Welcome back.");
        } else {
          toast.success(mode === "register" ? "Your temporary customer account is ready." : "Welcome back.");
        }
      } else {
        toast.success(mode === "register" ? "Your temporary customer account is ready." : "Welcome back.");
      }
      setClaiming(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not continue."); } finally { setSubmitting(false); }
  }

  async function linkOrder() {
    const token = readToken(store);
    if (!token || !trackingToken.trim()) return;
    const result = await onlineSupabase.rpc("customer_account_link_order", { _token: token, _tracking_token: trackingToken.trim() });
    if (result.error) { toast.error(result.error.message); return; }
    setTrackingToken("");
    await refresh(token);
    toast.success("Order added to your account.");
  }

  async function logout() {
    const token = readToken(store);
    if (token) await onlineSupabase.rpc("customer_account_logout", { _token: token });
    clearToken(store); setAccount(null); setOrders([]); toast.success("Signed out.");
  }

  if (!store) return <main className="flex min-h-screen items-center justify-center bg-background px-5"><div className="surface-card max-w-md p-8 text-center"><h1 className="font-display text-2xl font-bold">Open this from a store</h1><p className="mt-2 text-sm text-muted-foreground">Use the My orders button on a Strap storefront to create or access your temporary customer account.</p></div></main>;

  return <main className="min-h-screen bg-background px-5 py-8 sm:py-12"><div className="mx-auto max-w-3xl">
    <a href={`/store/${encodeURIComponent(store)}`} className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back to store</a>
    <div className="mt-6 overflow-hidden rounded-[2rem] border border-border bg-surface shadow-float">
      <div className="bg-foreground p-7 text-background sm:p-9"><div className="flex items-start justify-between gap-5"><div><span className="flex size-11 items-center justify-center rounded-2xl bg-accent text-foreground"><UserRound className="size-5" /></span><p className="mt-5 text-label-caps text-background/55">Customer account</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Keep your orders close.</h1><p className="mt-3 max-w-xl text-sm leading-6 text-background/65">Create a lightweight account for this store and come back to see the orders you have linked to it.</p></div>{account && <button type="button" onClick={() => void logout()} className="inline-flex items-center gap-2 rounded-xl border border-background/15 px-3 py-2 text-xs font-semibold text-background/75 hover:bg-background/10"><LogOut className="size-3.5" /> Sign out</button>}</div></div>
      {loading ? <div className="p-8 text-sm text-muted-foreground">Checking your account…</div> : account ? <AccountHome account={account} orders={orders} trackingToken={trackingToken} setTrackingToken={setTrackingToken} onLink={linkOrder} /> : <div className="p-7 sm:p-9"><div className="rounded-2xl border border-accent/20 bg-accent-soft p-4 text-sm leading-6 text-muted-foreground"><strong className="text-foreground">{claiming ? "Save this order to your account." : "Your orders, in one place."}</strong><br />{claiming ? `Order ${order} was just placed. Create your free 14-day account and Strap will attach it automatically using the phone number from checkout.` : "Create a lightweight account for this store and return later to track your purchases."}</div><div className="mt-5 flex gap-1 rounded-xl bg-secondary p-1"><button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${mode === "login" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}>Sign in</button><button type="button" onClick={() => setMode("register")} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold ${mode === "register" ? "bg-surface shadow-sm" : "text-muted-foreground"}`}>Create account</button></div><div className="mt-7 grid gap-4 sm:grid-cols-2">{mode === "register" && <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name" autoComplete="name" /></Field>}<Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" autoComplete="email" /></Field>{mode === "register" && <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080…" autoComplete="tel" /></Field>}{mode === "login" && order && <Field label="Checkout phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone used for the order" autoComplete="tel" /></Field>}<Field label="Password"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" autoComplete={mode === "register" ? "new-password" : "current-password"} /></Field></div><div className="mt-6 flex items-start gap-3 rounded-xl bg-accent-soft p-4 text-xs leading-5 text-muted-foreground"><Clock3 className="mt-0.5 size-4 shrink-0 text-accent-ink" /><span>This customer account automatically expires after <strong>14 days</strong>. Your existing order tracking links continue to work separately.</span></div><Button disabled={submitting} onClick={() => void submitAccount()} className="mt-6 w-full rounded-xl py-6 font-bold">{submitting ? "Please wait…" : mode === "register" ? "Create temporary account" : "Sign in"}</Button><div className="mt-5 flex items-start gap-3 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><span>Your password is stored as a cryptographic hash. The session token is kept in this browser and expires with the account.</span></div></div>}
    </div>
  </div></main>;
}

function AccountHome({ account, orders, trackingToken, setTrackingToken, onLink }: { account: Account; orders: Order[]; trackingToken: string; setTrackingToken: (value: string) => void; onLink: () => void }) {
  const expiry = new Date(account.expires_at);
  return <div className="p-7 sm:p-9"><div className="flex flex-col gap-4 rounded-2xl border border-border bg-secondary/40 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-label-caps text-muted-foreground">Signed in as</p><h2 className="mt-1 font-display text-lg font-semibold">{account.name}</h2><p className="text-sm text-muted-foreground">{account.email}</p></div><div className="rounded-xl bg-accent-soft px-4 py-3 text-xs font-semibold text-accent-ink">Account expires {expiry.toLocaleDateString()}</div></div><div className="mt-7"><div className="flex items-end justify-between gap-3"><div><p className="text-label-caps text-muted-foreground">Your orders</p><h2 className="mt-1 font-display text-xl font-semibold">Order history</h2></div><span className="rounded-full border border-border px-3 py-1.5 text-xs font-bold">{orders.length}</span></div>{orders.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-border p-8 text-center"><PackageSearch className="mx-auto size-7 text-muted-foreground" /><p className="mt-3 text-sm font-semibold">No linked orders yet.</p><p className="mt-1 text-xs text-muted-foreground">Use the tracking token from your order confirmation to add a previous purchase.</p></div> : <div className="mt-4 space-y-3">{orders.map((order) => <a key={order.order_id} href={order.tracking_token ? `/track/${encodeURIComponent(order.tracking_token)}` : "#"} className="flex items-center justify-between gap-4 rounded-2xl border border-border p-4 transition hover:-translate-y-0.5 hover:border-accent/40"><div><p className="numeric text-sm font-bold">{order.order_number}</p><p className="mt-1 text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p></div><div className="text-right"><p className="text-xs font-bold text-accent-ink">{prettyStatus(order.status)}</p><p className="mt-1 text-xs text-muted-foreground">View tracking</p></div></a>)}</div>}</div><div className="mt-7 rounded-2xl border border-border bg-surface p-5"><p className="text-label-caps text-muted-foreground">Add an order</p><h3 className="mt-1 font-display text-lg font-semibold">Link a previous purchase</h3><p className="mt-1 text-sm text-muted-foreground">Paste the tracking token from your Strap order confirmation.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Input value={trackingToken} onChange={(e) => setTrackingToken(e.target.value)} placeholder="Paste tracking token" /><Button onClick={onLink} className="shrink-0 rounded-xl"><Plus className="size-4" /> Add order</Button></div></div></div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="space-y-2 text-sm font-semibold"><span>{label}</span>{children}</label>; }
