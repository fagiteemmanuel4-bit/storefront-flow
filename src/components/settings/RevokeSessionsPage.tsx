import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function RevokeSessionsPage() {
  const navigate = useNavigate(); const [busy, setBusy] = useState(false);
  async function revoke() { setBusy(true); const { data, error } = await supabase.functions.invoke("account-security", { body: { action: "revoke_all_others" } }); setBusy(false); if (error) { toast.error(error.message); return; } toast.success(`${data?.revoked ?? 0} other session(s) signed out.`); void navigate({ to: "/settings/sessions", replace: true }); }
  return <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-background p-8 text-center shadow-sm"><span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><ShieldCheck className="size-6" /></span><h2 className="mt-5 text-2xl font-bold">Sign out other devices?</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">This will sign you out everywhere except the device you're currently using.</p><div className="mt-7 flex justify-center gap-2"><Link to="/settings/sessions"><Button variant="ghost" disabled={busy}>Cancel</Button></Link><Button onClick={() => void revoke()} disabled={busy}>{busy ? "Signing out…" : "Sign out other devices"}</Button></div></div>;
}
