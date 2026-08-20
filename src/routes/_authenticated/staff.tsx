import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, LogIn, Plus, ShieldCheck, UserRound, UserRoundCog, Users, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { STAFF_ROLE_META, clearStaffSession, getStaffSession, setStaffSession, type StaffRole } from "@/lib/staff-session";

export const Route = createFileRoute("/_authenticated/staff")({ component: StaffPage });

type StaffRow = { id: string; name: string; role: StaffRole; is_active: boolean; last_login_at: string | null; locked_until: string | null };

async function fetchStaff(storeId: string): Promise<StaffRow[]> {
  const { data, error } = await (supabase as any).rpc("list_staff_accounts", { _store_id: storeId });
  if (error) throw new Error(error.message);
  return (data ?? []) as StaffRow[];
}

function StaffPage() {
  const { store, role } = useStoreContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<StaffRow | null>(null);
  const [name, setName] = useState("");
  const [staffRole, setStaffRole] = useState<StaffRole>("cashier");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeSession, setActiveSession] = useState(() => getStaffSession(store?.id));
  const canManage = role === "owner" || role === "manager";

  const staffQuery = useQuery({ queryKey: ["staff-accounts", store?.id], enabled: Boolean(store?.id), queryFn: () => fetchStaff(store!.id), staleTime: 10_000 });
  const staff = staffQuery.data ?? [];
  const activeStaff = useMemo(() => staff.filter((item) => item.is_active), [staff]);

  async function createStaff() {
    if (!store?.id || !name.trim() || !/^\d{4,6}$/.test(pin)) {
      toast.error("Enter a staff name and a 4–6 digit PIN.");
      return;
    }
    setBusy(true);
    try {
      const { data: hash, error: hashError } = await (supabase as any).rpc("hash_staff_pin", { _pin: pin });
      if (hashError) throw hashError;
      const { error } = await (supabase as any).from("staff_accounts").insert({ store_id: store.id, name: name.trim(), pin_hash: hash, role: staffRole, created_by: (await supabase.auth.getUser()).data.user?.id });
      if (error) throw error;
      toast.success(`${name.trim()} can now sign in with their PIN.`);
      setName(""); setPin(""); setStaffRole("cashier"); setShowCreate(false);
      await queryClient.invalidateQueries({ queryKey: ["staff-accounts", store.id] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't create staff account.");
    } finally { setBusy(false); }
  }

  async function login(staffMember: StaffRow) {
    if (!store?.id || !/^\d{4,6}$/.test(pin)) { toast.error("Enter the 4–6 digit staff PIN."); return; }
    setBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc("verify_staff_pin", { _store_id: store.id, _staff_id: staffMember.id, _pin: pin });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.message ?? "Incorrect PIN");
      const session = { id: data.staff_id, storeId: store.id, name: data.name, role: data.role as StaffRole, signedInAt: new Date().toISOString() };
      setStaffSession(session); setActiveSession(session); setPin(""); setSelected(null);
      toast.success(`Welcome, ${session.name}.`);
      void navigate({ to: STAFF_ROLE_META[session.role].defaultRoute as any });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "PIN sign-in failed.");
      setPin("");
      await queryClient.invalidateQueries({ queryKey: ["staff-accounts", store.id] });
    } finally { setBusy(false); }
  }

  async function toggleStaff(member: StaffRow) {
    if (!canManage) return;
    const { error } = await (supabase as any).from("staff_accounts").update({ is_active: !member.is_active, updated_at: new Date().toISOString() }).eq("id", member.id).eq("store_id", store!.id);
    if (error) toast.error(error.message); else { toast.success(member.is_active ? "Staff account disabled." : "Staff account enabled."); await queryClient.invalidateQueries({ queryKey: ["staff-accounts", store!.id] }); }
  }

  function signOutStaff() { clearStaffSession(); setActiveSession(null); toast.success("Staff session ended."); }

  return <AppShell title="Staff accounts">
    <div className="space-y-6">
      {activeSession && <Card className="border-accent/30 bg-accent-soft/50"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent"><ShieldCheck className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active staff session</p><p className="truncate text-lg font-bold">{activeSession.name} · {STAFF_ROLE_META[activeSession.role].label}</p><p className="text-sm text-muted-foreground">{STAFF_ROLE_META[activeSession.role].description}</p></div><Button variant="outline" onClick={signOutStaff}><X className="mr-2 size-4" />End session</Button></CardContent></Card>}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <Card><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><Users className="size-5" />Team PINs</CardTitle><CardDescription>Give each team member their own role and PIN. Never share the owner's account.</CardDescription></div>{canManage && <Button onClick={() => setShowCreate((v) => !v)}><Plus className="mr-2 size-4" />Add staff</Button>}</div></CardHeader><CardContent className="space-y-3">
          {staffQuery.isLoading ? <div className="rounded-xl bg-secondary p-6 text-sm text-muted-foreground">Loading staff accounts…</div> : activeStaff.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center"><UserRoundCog className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No staff accounts yet</p><p className="mt-1 text-sm text-muted-foreground">Create the first PIN account for your cashier, inventory person or manager.</p></div> : activeStaff.map((member) => <button key={member.id} type="button" onClick={() => { setSelected(member); setPin(""); }} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/50"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary"><UserRound className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{member.name}</span><span className="block text-xs text-muted-foreground">{STAFF_ROLE_META[member.role].label} · {STAFF_ROLE_META[member.role].description}</span></span><Badge variant="secondary">{member.last_login_at ? "Active before" : "New"}</Badge></button>)}
          {staff.some((member) => !member.is_active) && canManage && <p className="pt-2 text-xs text-muted-foreground">Disabled accounts remain listed in your database and can be re-enabled by a manager.</p>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="size-5" />Sign in a team member</CardTitle><CardDescription>{selected ? `Enter ${selected.name}'s PIN.` : "Choose a staff account to continue."}</CardDescription></CardHeader><CardContent className="space-y-4">
          {selected ? <><div className="rounded-2xl bg-secondary p-4"><p className="font-semibold">{selected.name}</p><p className="text-sm text-muted-foreground">{STAFF_ROLE_META[selected.role].description}</p></div><Label htmlFor="staff-pin">PIN</Label><Input id="staff-pin" inputMode="numeric" type="password" maxLength={6} autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") void login(selected); }} placeholder="••••" className="h-14 text-center text-2xl tracking-[0.5em]" /><Button className="h-12 w-full" disabled={busy} onClick={() => void login(selected)}><LogIn className="mr-2 size-4" />{busy ? "Checking PIN…" : "Sign in"}</Button><Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>Choose someone else</Button></> : <div className="py-8 text-center text-sm text-muted-foreground">Select a staff account from the list.</div>}
        </CardContent></Card>
      </div>

      {showCreate && canManage && <Card className="border-accent/30"><CardHeader><CardTitle>Create staff account</CardTitle><CardDescription>Use a unique PIN that isn't the same as the owner's PIN or a common sequence.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-3"><div><Label htmlFor="staff-name">Name</Label><Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amaka" /></div><div><Label>Role</Label><Select value={staffRole} onValueChange={(value) => setStaffRole(value as StaffRole)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(STAFF_ROLE_META) as StaffRole[]).map((item) => <SelectItem key={item} value={item}>{STAFF_ROLE_META[item].label}</SelectItem>)}</SelectContent></Select></div><div><Label htmlFor="staff-new-pin">PIN</Label><Input id="staff-new-pin" inputMode="numeric" type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="4–6 digits" /></div><div className="sm:col-span-3 flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void createStaff()}>{busy ? "Creating…" : "Create PIN account"}</Button><Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button></div></CardContent></Card>}

      {canManage && <Card><CardHeader><CardTitle>Roles and screens</CardTitle><CardDescription>Keep each team member focused on the screens they actually need.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(Object.keys(STAFF_ROLE_META) as StaffRole[]).map((item) => <div key={item} className="rounded-2xl border border-border p-4"><p className="font-semibold">{STAFF_ROLE_META[item].label}</p><p className="mt-1 text-sm text-muted-foreground">{STAFF_ROLE_META[item].description}</p></div>)}</CardContent></Card>}
    </div>
  </AppShell>;
}
