import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, LogOut, UserRound } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Strap" }, { name: "description", content: "Manage your personal Strap profile and account preferences." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [savedName, setSavedName] = useState("");

  useEffect(() => { void supabase.auth.getUser().then(({ data }) => { const user = data.user; const current = String(user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? ""); setName(current); setSavedName(current); setEmail(user?.email ?? ""); setLoading(false); }); }, []);

  async function save() {
    const next = name.trim();
    if (next === savedName) return;
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: next, name: next } });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setSavedName(next);
    toast.success("Profile updated");
  }

  async function signOut() { await supabase.auth.signOut(); window.location.assign("/auth"); }

  if (loading) return <AppShell title="Profile"><div className="mx-auto max-w-2xl animate-pulse space-y-4"><div className="h-28 rounded-2xl bg-secondary" /><div className="h-40 rounded-2xl bg-secondary" /></div></AppShell>;
  return <AppShell title="Profile"><div className="mx-auto max-w-2xl space-y-5 pb-8">
    <section className="surface-card overflow-hidden"><div className="flex items-center gap-4 border-b border-border p-5 sm:p-6"><div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-secondary"><UserRound className="size-6 text-muted-foreground" /></div><div className="min-w-0"><p className="text-label-caps text-muted-foreground">Personal profile</p><h1 className="mt-1 truncate text-xl font-semibold">{name || "Your profile"}</h1><p className="mt-1 truncate text-sm text-muted-foreground">{email}</p></div></div>
      <div className="space-y-5 p-5 sm:p-6"><div className="space-y-2"><Label htmlFor="profile-name">Display name</Label><Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" maxLength={80} /><p className="text-xs text-muted-foreground">This is your personal name inside Strap. Your store name is managed separately.</p></div><div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">Email changes are managed through your account security flow.</p><Button onClick={() => void save()} disabled={saving || name.trim() === savedName}>{saving ? "Saving…" : <><Check className="size-4" /> Save changes</>}</Button></div></div>
    </section>
    <section className="surface-card p-5 sm:p-6"><div><p className="font-semibold">Coming soon</p><p className="mt-1 text-sm text-muted-foreground">Profile photo, notification preferences, login activity, connected devices and personal shortcuts are being prepared for Strap.</p></div></section>
    <section className="surface-card flex items-center justify-between gap-4 p-5 sm:p-6"><div><p className="font-semibold">Sign out</p><p className="mt-1 text-sm text-muted-foreground">End your current Strap session on this device.</p></div><Button variant="outline" onClick={() => void signOut()}><LogOut className="size-4" /> Sign out</Button></section>
  </div></AppShell>;
}
