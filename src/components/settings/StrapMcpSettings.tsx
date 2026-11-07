import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, Check, Copy, ExternalLink, GitBranch, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
const MCP_URL = "https://lhizunrljottkhemdfei.supabase.co/functions/v1/mcp";

type AccessConfig = {
  allowed_branch_ids: string[] | null;
  allow_store_read: boolean;
  allow_products_read: boolean;
  allow_inventory_read: boolean;
  allow_sales_read: boolean;
  allow_expenses_read: boolean;
  allow_customers_read: boolean;
  allow_product_writes: boolean;
  allow_stock_writes: boolean;
};
type OAuthGrant = {
  id: string;
  client_id: string;
  client_name: string;
  scopes: string[];
  created_at: string;
  updated_at: string;
};
type AuditRow = { id: string; action: string; summary: string; created_at: string };

const DEFAULT_ACCESS: AccessConfig = {
  allowed_branch_ids: null,
  allow_store_read: true,
  allow_products_read: true,
  allow_inventory_read: true,
  allow_sales_read: true,
  allow_expenses_read: false,
  allow_customers_read: false,
  allow_product_writes: false,
  allow_stock_writes: false,
};
const READ_OPTIONS: Array<{ key: keyof AccessConfig; title: string; description: string }> = [
  { key: "allow_store_read", title: "Store profile", description: "Read the store name and general business details." },
  { key: "allow_products_read", title: "Products", description: "Search product names, SKUs, prices and catalogue details." },
  { key: "allow_inventory_read", title: "Inventory and branches", description: "Read stock quantities and authorised branch details." },
  { key: "allow_sales_read", title: "Sales", description: "Read sales totals and transaction summaries." },
  { key: "allow_expenses_read", title: "Expenses", description: "Read expense amounts, categories and descriptions." },
  { key: "allow_customers_read", title: "Customers", description: "Search customer records and limited contact information." },
];
const WRITE_OPTIONS: Array<{ key: keyof AccessConfig; title: string; description: string }> = [
  { key: "allow_product_writes", title: "Create and update products", description: "Add products or edit catalogue details and pricing." },
  { key: "allow_stock_writes", title: "Update branch stock", description: "Set exact stock quantities at the selected branches." },
];

export function StrapMcpSettingsPage() {
  const { store, branches, role, userId } = useStoreContext();
  const canManage = role === "owner" || role === "manager";
  const [grants, setGrants] = useState<OAuthGrant[]>([]);
  const [saved, setSaved] = useState<Record<string, AccessConfig>>({});
  const [drafts, setDrafts] = useState<Record<string, AccessConfig>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!store?.id || !userId) return;
    setLoading(true);
    try {
      const { data: grantData, error: grantError } = await supabase.auth.oauth.listGrants();
      if (grantError) throw grantError;
      const nextGrants = (grantData ?? []) as OAuthGrant[];
      setGrants(nextGrants);
      const clientIds = nextGrants.map((grant) => grant.client_id).filter(Boolean);
      if (clientIds.length) {
        const { data, error } = await db.from("mcp_client_access_settings")
          .select("client_id,allowed_branch_ids,allow_store_read,allow_products_read,allow_inventory_read,allow_sales_read,allow_expenses_read,allow_customers_read,allow_product_writes,allow_stock_writes")
          .eq("store_id", store.id).eq("user_id", userId).in("client_id", clientIds);
        if (error) throw error;
        const map: Record<string, AccessConfig> = {};
        for (const row of data ?? []) map[row.client_id] = { ...DEFAULT_ACCESS, ...row };
        setSaved(map);
        setDrafts(map);
      } else {
        setSaved({});
        setDrafts({});
      }
      const { data: activity } = await db.from("mcp_action_audit")
        .select("id,action,summary,created_at").eq("store_id", store.id)
        .order("created_at", { ascending: false }).limit(10);
      setAudit(activity ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load connected applications.");
    } finally {
      setLoading(false);
    }
  }, [store?.id, userId]);

  useEffect(() => { void load(); }, [load]);

  const copyEndpoint = async () => {
    try { await navigator.clipboard.writeText(MCP_URL); toast.success("MCP endpoint copied"); }
    catch { toast.error("Copy failed. Select and copy the endpoint manually."); }
  };

  const updateDraft = (clientId: string, patch: Partial<AccessConfig>) => {
    setDrafts((current) => ({
      ...current,
      [clientId]: { ...(current[clientId] ?? DEFAULT_ACCESS), ...patch },
    }));
  };

  const saveAccess = async (grant: OAuthGrant) => {
    const config = drafts[grant.client_id] ?? DEFAULT_ACCESS;
    if (!store?.id || !userId || !canManage) return;
    setSavingId(grant.client_id);
    try {
      const allSelected = config.allowed_branch_ids === null ||
        (branches.length > 0 && config.allowed_branch_ids.length === branches.length);
      const payload = {
        store_id: store.id, user_id: userId, client_id: grant.client_id,
        client_name: grant.client_name || "Connected AI application",
        allowed_branch_ids: allSelected ? null : config.allowed_branch_ids,
        allow_store_read: config.allow_store_read,
        allow_products_read: config.allow_products_read,
        allow_inventory_read: config.allow_inventory_read,
        allow_sales_read: config.allow_sales_read,
        allow_expenses_read: config.allow_expenses_read,
        allow_customers_read: config.allow_customers_read,
        allow_product_writes: config.allow_product_writes,
        allow_stock_writes: config.allow_stock_writes,
        updated_at: new Date().toISOString(),
      };
      const { error } = await db.from("mcp_client_access_settings").upsert(payload, { onConflict: "store_id,user_id,client_id" });
      if (error) throw error;
      const next = { ...DEFAULT_ACCESS, ...config, allowed_branch_ids: allSelected ? null : config.allowed_branch_ids };
      setSaved((current) => ({ ...current, [grant.client_id]: next }));
      setDrafts((current) => ({ ...current, [grant.client_id]: next }));
      setEditing(null);
      toast.success(`Access for ${grant.client_name} saved.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save app permissions.");
    } finally { setSavingId(null); }
  };

  const revoke = async (grant: OAuthGrant) => {
    if (!window.confirm(`Revoke ${grant.client_name}'s access to your STRAP account? Its active tokens will stop working.`)) return;
    setRevokingId(grant.client_id);
    try {
      const { error } = await supabase.auth.oauth.revokeGrant(grant.client_id);
      if (error) throw error;
      await db.from("mcp_client_access_settings").delete()
        .eq("user_id", userId).eq("client_id", grant.client_id);
      toast.success(`${grant.client_name} has been disconnected.`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not revoke this connection.");
    } finally { setRevokingId(null); }
  };

  if (!store) return <div className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">Choose a store to manage its connected applications.</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <section className="rounded-3xl border border-border bg-background">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-7">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Bot className="size-6" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold tracking-tight">Connected applications</h2><span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">OAuth protected</span></div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Review third-party apps that have been authorised to connect to your STRAP account. Edit their branch and action permissions, or revoke access whenever you need to.</p>
          </div>
          <Link to="/mcp" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-secondary">Learn more <ExternalLink className="size-4" /></Link>
        </div>
        <div className="border-t border-border bg-secondary/30 p-4 sm:p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">STRAP remote MCP endpoint</p>
          <div className="flex flex-col gap-2 sm:flex-row"><code className="min-w-0 flex-1 break-all rounded-xl border border-border bg-background px-3 py-3 text-xs sm:text-sm">{MCP_URL}</code><Button variant="outline" onClick={() => void copyEndpoint()} className="gap-2"><Copy className="size-4" /> Copy endpoint</Button></div>
        </div>
      </section>

      {!canManage && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">Only a store owner or manager can edit or revoke connected app access.</div>}

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><h3 className="text-xl font-bold">Authorised third-party apps</h3><p className="mt-1 text-sm text-muted-foreground">Connections authorised through STRAP's secure sign-in and consent flow.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{grants.length} connected</span></div>
        {loading ? <div className="rounded-2xl border border-border p-8 text-sm text-muted-foreground">Loading connected apps…</div> :
          grants.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-8 text-center"><Bot className="mx-auto size-8 text-muted-foreground" /><h4 className="mt-3 font-semibold">No third-party apps connected</h4><p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">When you connect Claude or another compatible AI assistant, it will appear here.</p><Link to="/mcp" className="mt-4 inline-flex text-sm font-semibold text-accent-ink hover:underline">How to connect an AI assistant</Link></div> :
          grants.map((grant) => {
            const config = drafts[grant.client_id] ?? DEFAULT_ACCESS;
            const savedConfig = saved[grant.client_id];
            const isEditing = editing === grant.client_id;
            const allBranches = config.allowed_branch_ids === null;
            return <article key={grant.client_id} className="rounded-2xl border border-border bg-background p-5 sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary"><Bot className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><h4 className="text-lg font-bold">{grant.client_name || "Connected application"}</h4><span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Connected</span></div>
                  <p className="mt-1 break-all text-xs text-muted-foreground">Client ID: {grant.client_id}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Authorised {new Date(grant.created_at).toLocaleDateString()} · Scopes: {(grant.scopes ?? []).join(", ") || "standard OAuth"}</p>
                  <p className="mt-3 text-sm text-muted-foreground">{savedConfig ? `${savedConfig.allowed_branch_ids === null ? "All branches" : savedConfig.allowed_branch_ids.length + " selected branches"} · ${[savedConfig.allow_products_read, savedConfig.allow_inventory_read, savedConfig.allow_sales_read, savedConfig.allow_expenses_read, savedConfig.allow_customers_read].filter(Boolean).length} data categories enabled` : "Access permissions need to be configured for this store."}</p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled={!canManage} onClick={() => { setEditing(isEditing ? null : grant.client_id); setDrafts((current) => ({ ...current, [grant.client_id]: current[grant.client_id] ?? savedConfig ?? DEFAULT_ACCESS })); }}>{isEditing ? "Close editor" : "Edit access"}</Button>
                  <Button variant="destructive" size="sm" disabled={!canManage || revokingId === grant.client_id} onClick={() => void revoke(grant)}><Trash2 className="mr-1 size-4" />{revokingId === grant.client_id ? "Revoking…" : "Revoke"}</Button>
                </div>
              </div>
              {isEditing && <div className="mt-5 space-y-5 border-t border-border pt-5">
                <div><h5 className="font-semibold">Branch access</h5><p className="mt-1 text-xs text-muted-foreground">Choose where this application can read branch-level information and change stock.</p>
                  <label className="mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3"><input type="checkbox" checked={allBranches} disabled={!canManage} onChange={(e) => updateDraft(grant.client_id, { allowed_branch_ids: e.target.checked ? null : [] })} className="size-4 accent-accent" /><span className="text-sm font-semibold">All branches</span></label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">{branches.map((branch: any) => <label key={branch.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3"><input type="checkbox" checked={allBranches || (config.allowed_branch_ids ?? []).includes(branch.id)} disabled={!canManage || allBranches} onChange={(e) => { const current = config.allowed_branch_ids ?? []; const next = e.target.checked ? [...current, branch.id] : current.filter((id) => id !== branch.id); updateDraft(grant.client_id, { allowed_branch_ids: next }); }} className="size-4 accent-accent" /><GitBranch className="size-4 text-muted-foreground" /><span className="text-sm">{branch.name}</span></label>)}</div>
                </div>
                <div><h5 className="font-semibold">Read permissions</h5><div className="mt-2 divide-y divide-border">{READ_OPTIONS.map((option) => <div key={option.key} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold">{option.title}</p><p className="mt-1 text-xs text-muted-foreground">{option.description}</p></div><Switch checked={Boolean(config[option.key])} disabled={!canManage} onCheckedChange={(value) => updateDraft(grant.client_id, { [option.key]: value })} /></div>)}</div></div>
                <div><h5 className="font-semibold">Write permissions</h5><div className="mt-2 divide-y divide-border">{WRITE_OPTIONS.map((option) => <div key={option.key} className="flex items-center justify-between gap-4 py-3"><div><p className="text-sm font-semibold">{option.title}</p><p className="mt-1 text-xs text-muted-foreground">{option.description}</p></div><Switch checked={Boolean(config[option.key])} disabled={!canManage} onCheckedChange={(value) => updateDraft(grant.client_id, { [option.key]: value })} /></div>)}</div></div>
                <div className="flex justify-end"><Button onClick={() => void saveAccess(grant)} disabled={!canManage || savingId === grant.client_id} className="gap-2"><Check className="size-4" />{savingId === grant.client_id ? "Saving…" : "Save permissions"}</Button></div>
              </div>}
            </article>;
          })}
      </section>

      <section className="rounded-2xl border border-border bg-background p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><h3 className="text-lg font-bold">Recent AI activity</h3><p className="mt-1 text-sm text-muted-foreground">Product and inventory changes made by connected assistants in this store.</p></div><ShieldCheck className="size-5 text-muted-foreground" /></div>
        {audit.length ? <div className="mt-4 divide-y divide-border">{audit.map((item) => <div key={item.id} className="py-3"><p className="text-sm font-semibold">{item.summary}</p><p className="mt-1 text-xs text-muted-foreground">{item.action.replaceAll(".", " · ")} · {new Date(item.created_at).toLocaleString()}</p></div>)}</div> : <p className="mt-4 text-sm text-muted-foreground">No AI write activity recorded for this store yet.</p>}
      </section>
    </div>
  );
}
