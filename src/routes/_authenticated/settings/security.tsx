import { createFileRoute, Link } from "@tanstack/react-router";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AlertTriangle, ArrowLeft, Copy, KeyRound, Laptop, LockKeyhole, LogOut, RefreshCw, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";

type Session = { session_id: string; created_at: string; updated_at: string; refreshed_at: string | null; not_after: string | null; user_agent: string | null; ip: string | null; aal: string | null; current?: boolean };
type IpEntry = { occurred_at: string; ip_address: string; action: string };
type ApiKey = { id: string; name: string; key_prefix: string; created_at: string; last_used_at: string | null; revoked_at: string | null };
const db = supabase as unknown as SupabaseClient;

export const Route = createFileRoute("/_authenticated/settings/security")({ component: SecuritySettingsPage });

const date = (value: string | null | undefined) => value ? new Date(value).toLocaleString() : "Unknown";
const device = (ua: string | null) => !ua ? "Unknown device" : /iphone|ipad|android/i.test(ua) ? "Mobile device" : /macintosh|mac os/i.test(ua) ? "Mac browser" : /windows/i.test(ua) ? "Windows browser" : /linux/i.test(ua) ? "Linux browser" : "Desktop browser";

function newSecret() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return `sk_strap_${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
}

async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function SecuritySettingsPage() {
  const { userId, store, role } = useStoreContext();
  const owner = role === "owner";
  const [sessions, setSessions] = useState<Session[]>([]);
  const [history, setHistory] = useState<IpEntry[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [rateLimit, setRateLimit] = useState("standard");
  const [alerts, setAlerts] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keyName, setKeyName] = useState("Primary integration key");
  const [secret, setSecret] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke("account-security", { body: { action: "get" } });
    if (error) return toast.error(error.message);
    setSessions((data?.sessions ?? []) as Session[]);
    setHistory((data?.ipHistory ?? []) as IpEntry[]);
  }, []);

  const loadKeys = useCallback(async () => {
    if (!store?.id || !owner) return;
    const { data, error } = await db.from("api_keys").select("id,name,key_prefix,created_at,last_used_at,revoked_at").eq("store_id", store.id).order("created_at", { ascending: false });
    if (error) return toast.error(error.message);
    setKeys((data ?? []) as ApiKey[]);
  }, [owner, store?.id]);

  const loadSettings = useCallback(async () => {
    const { data, error } = await db.from("account_security_settings").select("rate_limit_profile,security_alerts").eq("user_id", userId).maybeSingle();
    if (error) return toast.error(error.message);
    if (data) { setRateLimit(data.rate_limit_profile); setAlerts(Boolean(data.security_alerts)); }
  }, [userId]);

  useEffect(() => { void Promise.all([loadSessions(), loadKeys(), loadSettings()]).finally(() => setLoading(false)); }, [loadKeys, loadSessions, loadSettings]);

  const activeSessions = useMemo(() => sessions.filter((s) => !s.not_after || new Date(s.not_after) > new Date()), [sessions]);

  async function changePassword() {
    if (newPasswordValue.length < 8) return toast.error("Use at least 8 characters.");
    if (newPasswordValue !== confirmPassword) return toast.error("The new passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: newPasswordValue, current_password: currentPassword });
    setBusy(false);
    if (error) return toast.error(error.message);
    setCurrentPassword(""); setNewPasswordValue(""); setConfirmPassword("");
    toast.success("Password changed successfully.");
    await loadSessions();
  }

  async function revoke(sessionId: string) {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("account-security", { body: { action: "revoke", sessionId } });
    setBusy(false);
    if (error) return toast.error(error.message);
    if (!data?.revoked) return toast.error("Session could not be revoked.");
    toast.success("Session revoked."); await loadSessions();
  }

  async function revokeOthers() {
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("account-security", { body: { action: "revoke_all_others" } });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${data?.revoked ?? 0} other session(s) revoked.`); await loadSessions();
  }

  async function saveSettings() {
    setBusy(true);
    const { error } = await db.from("account_security_settings").upsert({ user_id: userId, rate_limit_profile: rateLimit, security_alerts: alerts, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Security preferences saved.");
  }

  async function createKey(replace?: ApiKey) {
    if (!store?.id || !owner) return;
    const raw = newSecret();
    const { data, error } = await db.from("api_keys").insert({ store_id: store.id, name: keyName.trim() || "Integration key", key_prefix: raw.slice(0, 18), key_hash: await hash(raw), scopes: ["read"], created_by: userId }).select("id,name,key_prefix,created_at,last_used_at,revoked_at").single();
    if (error) return toast.error(error.message);
    if (replace) {
      const { error: revokeError } = await db.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", replace.id).eq("store_id", store.id);
      if (revokeError) toast.error(`New key created, but old key was not revoked: ${revokeError.message}`);
    }
    setKeys((current) => [data as ApiKey, ...current.filter((key) => key.id !== replace?.id)]);
    setSecret(raw); toast.success(replace ? "API key rotated." : "API key created.");
  }

  async function revokeKey(key: ApiKey) {
    if (!store?.id || !owner) return;
    const { error } = await db.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", key.id).eq("store_id", store.id);
    if (error) return toast.error(error.message);
    setKeys((current) => current.map((item) => item.id === key.id ? { ...item, revoked_at: new Date().toISOString() } : item));
    toast.success("API key revoked.");
  }

  return <div className="min-h-full bg-surface px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-6xl">
    <div className="border-b border-border pb-6"><Link to="/settings" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" />Settings</Link><div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-label-caps text-accent-ink">Account security</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Security & access</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Manage password security, active devices, IP history, API credentials and account-level security preferences.</p></div><span className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-2 text-xs font-semibold text-accent-ink"><ShieldCheck className="size-4" />Supabase Auth protected</span></div></div>

    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-border bg-background p-5 sm:p-6"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><LockKeyhole className="size-5" /></span><div><h2 className="font-semibold">Change password</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">The current password is checked before Supabase accepts the new one.</p></div></div><div className="mt-5 grid gap-3"><input value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} type="password" autoComplete="current-password" placeholder="Current password" className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-accent" /><input value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)} type="password" autoComplete="new-password" placeholder="New password" className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-accent" /><input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" autoComplete="new-password" placeholder="Confirm new password" className="w-full rounded-xl border border-border bg-surface px-3 py-3 text-sm outline-none focus:border-accent" /><button type="button" onClick={changePassword} disabled={busy || !currentPassword || !newPasswordValue || !confirmPassword} className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background disabled:opacity-50"><LockKeyhole className="size-4" />{busy ? "Working…" : "Change password"}</button></div><p className="mt-3 text-xs text-muted-foreground">If you forgot your current password, use the existing password-reset flow from sign in.</p></section>

      <section className="rounded-2xl border border-border bg-background p-5 sm:p-6"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><ShieldCheck className="size-5" /></span><div><h2 className="font-semibold">Security preferences</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Stored per authenticated account, independent of the active store.</p></div></div><div className="mt-5 grid gap-4"><label className="text-sm font-medium">API rate-limit profile<select value={rateLimit} onChange={(e) => setRateLimit(e.target.value)} className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-3 font-normal outline-none focus:border-accent"><option value="strict">Strict — 30 requests/minute</option><option value="standard">Standard — 120 requests/minute</option><option value="relaxed">Relaxed — 300 requests/minute</option></select></label><label className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-3"><span><span className="block text-sm font-medium">Security alerts</span><span className="mt-1 block text-xs text-muted-foreground">Keep account security notifications enabled.</span></span><input type="checkbox" checked={alerts} onChange={(e) => setAlerts(e.target.checked)} className="size-5 accent-[var(--accent)]" /></label><button type="button" onClick={saveSettings} disabled={busy} className="rounded-xl border border-border px-4 py-3 text-sm font-semibold hover:bg-secondary disabled:opacity-50">Save preferences</button></div><p className="mt-3 text-xs text-muted-foreground">The selected profile is persisted and available to managed integration endpoints.</p></section>
    </div>

    <section className="mt-6 rounded-2xl border border-border bg-background p-5 sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Laptop className="size-5" /></span><div><h2 className="font-semibold">Active sessions</h2><p className="mt-1 text-sm text-muted-foreground">Device, IP, last activity and session assurance for your current logins.</p></div></div><button type="button" onClick={revokeOthers} disabled={busy || activeSessions.length <= 1} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-50"><LogOut className="size-4" />Revoke all others</button></div><div className="mt-5 grid gap-3">{loading ? <p className="rounded-xl bg-surface p-4 text-sm text-muted-foreground">Loading sessions…</p> : activeSessions.length === 0 ? <p className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">No active session records were returned.</p> : activeSessions.map((session) => <div key={session.session_id} className="rounded-xl border border-border bg-surface p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{device(session.user_agent)}</p>{session.current && <span className="rounded-full bg-accent-soft px-2 py-1 text-[10px] font-bold uppercase text-accent-ink">This device</span>}</div><p className="mt-1 text-xs text-muted-foreground">IP {session.ip ?? "not recorded"} · Last active {date(session.updated_at)}</p><p className="mt-1 max-w-2xl truncate text-xs text-muted-foreground">{session.user_agent ?? "User agent not recorded"}</p></div>{!session.current && <button type="button" onClick={() => void revoke(session.session_id)} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-50"><Trash2 className="size-3.5" />Revoke</button>}</div><p className="mt-3 text-[11px] text-muted-foreground">Created {date(session.created_at)} · Refreshed {date(session.refreshed_at)} · Assurance {session.aal ?? "unknown"}</p></div>)}</div></section>

    <section className="mt-6 rounded-2xl border border-border bg-background p-5 sm:p-6"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><RefreshCw className="size-5" /></span><div><h2 className="font-semibold">IP history</h2><p className="mt-1 text-sm text-muted-foreground">Retained Supabase Auth audit entries for this account.</p></div></div><div className="mt-5 grid gap-2">{history.length === 0 ? <p className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">No retained authentication IP-history records are available yet. Current session IPs are shown above.</p> : history.map((entry, i) => <div key={`${entry.occurred_at}-${i}`} className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium">{entry.ip_address}</p><p className="text-xs text-muted-foreground">{entry.action}</p></div><p className="text-xs text-muted-foreground">{date(entry.occurred_at)}</p></div>)}</div></section>

    <section className="mt-6 rounded-2xl border border-border bg-background p-5 sm:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div className="flex gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><KeyRound className="size-5" /></span><div><h2 className="font-semibold">API keys</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Only hashes are stored. The full secret is displayed once after generation.</p></div></div>{owner && <div className="flex flex-col gap-2 sm:flex-row"><input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Key name" className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent" /><button type="button" onClick={() => void createKey()} className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background"><KeyRound className="size-4" />Generate key</button></div>}</div>{!owner ? <p className="mt-5 rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">Only the store owner can manage integration credentials.</p> : <div className="mt-5 grid gap-3">{keys.length === 0 ? <p className="rounded-xl border border-dashed border-border bg-surface p-4 text-sm text-muted-foreground">No API keys exist for this store.</p> : keys.map((key) => <div key={key.id} className="rounded-xl border border-border bg-surface p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{key.name}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{key.key_prefix}••••••••</p><p className="mt-1 text-xs text-muted-foreground">Created {date(key.created_at)} · {key.revoked_at ? `Revoked ${date(key.revoked_at)}` : key.last_used_at ? `Last used ${date(key.last_used_at)}` : "Never used"}</p></div>{!key.revoked_at && <div className="flex gap-2"><button type="button" onClick={() => void createKey(key)} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold"><RefreshCw className="size-3.5" />Rotate</button><button type="button" onClick={() => void revokeKey(key)} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-3 py-2 text-xs font-semibold text-destructive"><Trash2 className="size-3.5" />Revoke</button></div>}</div></div>)}</div>}
      {secret && <div className="mt-5 rounded-xl border border-accent/30 bg-accent-soft p-4"><div className="flex gap-3"><AlertTriangle className="size-5 shrink-0 text-accent-ink" /><div className="min-w-0"><p className="font-semibold">Copy this secret now</p><p className="mt-1 text-xs leading-5 text-muted-foreground">This full API key will not be shown again.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><code className="min-w-0 flex-1 overflow-auto rounded-lg bg-background px-3 py-2.5 text-xs">{secret}</code><button type="button" onClick={() => void navigator.clipboard.writeText(secret).then(() => toast.success("Copied."))} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold"><Copy className="size-3.5" />Copy</button><button type="button" onClick={() => setSecret(null)} className="rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground">Dismiss</button></div></div></div></div>}
    </section>

    <div className="mt-6 rounded-2xl border border-accent/20 bg-accent-soft p-5 text-sm leading-6 text-muted-foreground"><p className="font-semibold text-foreground">Important</p><p className="mt-1">Revoking a session removes its refresh-session record. An already-issued access-token JWT can remain usable until its expiry, so sensitive production endpoints should validate session state and use conservative JWT lifetimes.</p></div>
  </div></div>;
}
