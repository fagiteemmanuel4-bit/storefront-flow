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
type CreatedStaff = { id: string; name: string; role: StaffRole; is_active: boolean };

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

  function closeCreate() {
    if (busy) return;
    setShowCreate(false);
    setName("");
    setPin("");
    setStaffRole("cashier");
  }

  async function createStaff() {
    if (!store?.id) { toast.error("No active store is selected."); return; }
    const trimmedName = name.trim();
    if (!trimmedName || !/^\d{4,6}$/.test(pin)) { toast.error("Enter a staff name and a 4–6 digit PIN."); return; }
    if (!canManage) { toast.error("You do not have permission to create staff accounts."); return; }
    setBusy(true);
    try {
      const { data, error } = await (supabase as any).rpc("create_staff_account", { _store_id: store.id, _name: trimmedName, _pin: pin, _role: staffRole });
      if (error) throw new Error(error.message);
      const created = (Array.isArray(data) ? data[0] : data) as CreatedStaff | undefined;
      if (!created?.id) throw new Error("Staff account creation did not return a confirmed account.");
      closeCreate();
      await queryClient.invalidateQueries({ queryKey: ["staff-accounts", store.id] });
      toast.success(`${created.name} can now sign in with their PIN.`);
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
    if (!canManage || !store?.id) return;
    const { error } = await (supabase as any).from("staff_accounts").update({ is_active: !member.is_active, updated_at: new Date().toISOString() }).eq("id", member.id).eq("store_id", store.id);
    if (error) toast.error(error.message); else { toast.success(member.is_active ? "Staff account disabled." : "Staff account enabled."); await queryClient.invalidateQueries({ queryKey: ["staff-accounts", store.id] }); }
  }

  function signOutStaff() { clearStaffSession(); setActiveSession(null); toast.success("Staff session ended."); }

  return <AppShell title="Staff accounts">
    <div className="space-y-6">
      {activeSession && <Card className="border-accent/30 bg-accent-soft/50"><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent"><ShieldCheck className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active staff session</p><p className="truncate text-lg font-bold">{activeSession.name} · {STAFF_ROLE_META[activeSession.role].label}</p><p className="text-sm text-muted-foreground">{STAFF_ROLE_META[activeSession.role].description}</p></div><Button variant="outline" onClick={signOutStaff}><X className="mr-2 size-4" />End session</Button></CardContent></Card>}

      <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <Card><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><Users className="size-5" />Team PINs</CardTitle><CardDescription>Give each team member their own role and PIN. Never share the owner's account.</CardDescription></div>{canManage && <Button onClick={() => setShowCreate(true)}><Plus className="mr-2 size-4" />Add staff</Button>}</div></CardHeader><CardContent className="space-y-3">
          {staffQuery.isLoading ? <div className="rounded-xl bg-secondary p-6 text-sm text-muted-foreground">Loading staff accounts…</div> : staffQuery.isError ? <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6"><p className="font-semibold">Staff accounts could not be loaded.</p><p className="mt-1 text-sm text-muted-foreground">{staffQuery.error instanceof Error ? staffQuery.error.message : "Please try again."}</p><Button className="mt-4" variant="outline" onClick={() => void staffQuery.refetch()}>Retry</Button></div> : activeStaff.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center"><UserRoundCog className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 font-semibold">No staff accounts yet</p><p className="mt-1 text-sm text-muted-foreground">Create the first PIN account for your cashier, inventory person or manager.</p></div> : activeStaff.map((member) => <button key={member.id} type="button" onClick={() => { setSelected(member); setPin(""); }} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/50"><span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary"><UserRound className="size-4" /></span><span className="min-w-0 flex-1"><span className="block truncate font-semibold">{member.name}</span><span className="block text-xs text-muted-foreground">{STAFF_ROLE_META[member.role].label} · {STAFF_ROLE_META[member.role].description}</span></span><Badge variant="secondary">{member.last_login_at ? "Active before" : "New"}</Badge></button>)}
          {staff.some((member) => !member.is_active) && canManage && <p className="pt-2 text-xs text-muted-foreground">Disabled accounts remain listed in your database and can be re-enabled by a manager.</p>}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><KeyRound className="size-5" />Sign in a team member</CardTitle><CardDescription>{selected ? `Enter ${selected.name}'s PIN.` : "Choose a staff account to continue."}</CardDescription></CardHeader><CardContent className="space-y-4">
          {selected ? <><div className="rounded-2xl bg-secondary p-4"><p className="font-semibold">{selected.name}</p><p className="text-sm text-muted-foreground">{STAFF_ROLE_META[selected.role].description}</p></div><Label htmlFor="staff-pin">PIN</Label><Input id="staff-pin" inputMode="numeric" type="password" maxLength={6} autoFocus value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") void login(selected); }} placeholder="••••" className="h-14 text-center text-2xl tracking-[0.5em]" /><Button className="h-12 w-full" disabled={busy} onClick={() => void login(selected)}><LogIn className="mr-2 size-4" />{busy ? "Checking PIN…" : "Sign in"}</Button><Button variant="ghost" className="w-full" onClick={() => setSelected(null)}>Choose someone else</Button></> : <div className="py-8 text-center text-sm text-muted-foreground">Select a staff account from the list.</div>}
        </CardContent></Card>
      </div>

      {showCreate && canManage && <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="create-staff-title" onMouseDown={(event) => { if (event.currentTarget === event.target) closeCreate(); }}><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" /><Card className="relative z-10 w-full max-w-2xl overflow-hidden border-border/70 bg-background shadow-2xl"><CardHeader className="border-b border-border/60"><div className="flex items-start justify-between gap-4"><div><CardTitle id="create-staff-title" className="flex items-center gap-2"><UserRoundCog className="size-5" />Create staff account</CardTitle><CardDescription>Set up a secure role and PIN. The account is created only after Kudi confirms the server transaction.</CardDescription></div><Button type="button" variant="ghost" size="icon" aria-label="Close" disabled={busy} onClick={closeCreate}><X className="size-4" /></Button></div></CardHeader><CardContent className="space-y-5 p-5 sm:p-6"><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="staff-name">Name</Label><Input id="staff-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amaka" /></div><div><Label>Role</Label><Select value={staffRole} onValueChange={(value) => setStaffRole(value as StaffRole)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(Object.keys(STAFF_ROLE_META) as StaffRole[]).map((item) => <SelectItem key={item} value={item}>{STAFF_ROLE_META[item].label}</SelectItem>)}</SelectContent></Select></div></div><div><Label htmlFor="staff-new-pin">PIN</Label><Input id="staff-new-pin" inputMode="numeric" type="password" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => { if (e.key === "Enter") void createStaff(); }} placeholder="4–6 digits" className="h-12 text-lg tracking-[0.35em]" /><p className="mt-2 text-xs text-muted-foreground">Use a unique 4–6 digit PIN. Avoid simple sequences or repeating numbers.</p></div><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" disabled={busy} onClick={closeCreate}>Cancel</Button><Button type="button" disabled={busy} onClick={() => void createStaff()}><Plus className="mr-2 size-4" />{busy ? "Creating…" : "Create PIN account"}</Button></div></CardContent></Card></div>}

      {canManage && <Card><CardHeader><CardTitle>Roles and screens</CardTitle><CardDescription>Keep each team member focused on the screens they actually need.</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{(Object.keys(STAFF_ROLE_META) as StaffRole[]).map((item) => <div key={item} className="rounded-2xl border border-border p-4"><p className="font-semibold">{STAFF_ROLE_META[item].label}</p><p className="mt-1 text-sm text-muted-foreground">{STAFF_ROLE_META[item].description}</p></div>)}</CardContent></Card>}
    </div>
  </AppShell>;
}
