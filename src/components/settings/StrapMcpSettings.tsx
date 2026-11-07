import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bot, Check, Copy, ExternalLink, GitBranch, Info, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
const MCP_URL = "https://lhizunrljottkhemdfei.supabase.co/functions/v1/mcp";

type Settings = {
  enabled: boolean;
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

const DEFAULTS: Settings = {
  enabled: true,
  allowed_branch_ids: null,
  allow_store_read: true,
  allow_products_read: true,
  allow_inventory_read: true,
  allow_sales_read: true,
  allow_expenses_read: true,
  allow_customers_read: true,
  allow_product_writes: false,
  allow_stock_writes: false,
};

const READ_OPTIONS: { key: keyof Settings; title: string; description: string }[] = [
  { key: "allow_store_read", title: "Store profile", description: "Let AI assistants read the store name, business details and general profile." },
  { key: "allow_products_read", title: "Product catalogue", description: "Let AI assistants search product names, SKUs, prices and catalogue details." },
  { key: "allow_inventory_read", title: "Inventory and branches", description: "Read stock quantities, branch details and low-stock information." },
  { key: "allow_sales_read", title: "Sales", description: "Read sales totals, payment methods and transaction summaries for authorised branches." },
  { key: "allow_expenses_read", title: "Expenses", description: "Read expense amounts, categories and descriptions for authorised branches." },
  { key: "allow_customers_read", title: "Customers", description: "Search customer records and view limited contact and loyalty information." },
];

const WRITE_OPTIONS: { key: keyof Settings; title: string; description: string }[] = [
  { key: "allow_product_writes", title: "Create and update products", description: "Allow an AI assistant to add products or update store-wide catalogue fields such as name, SKU, price, cost and category." },
  { key: "allow_stock_writes", title: "Set branch stock quantities", description: "Allow an AI assistant to set the exact on-hand quantity for a product at an authorised branch. Every change is recorded in the activity log." },
];

type AuditRow = { id: string; action: string; resource_type: string; summary: string; created_at: string };

export function StrapMcpSettingsPage() {
  const { store, branches, role, userId } = useStoreContext();
  const canManage = role === "owner" || role === "manager";
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const allBranchesSelected = settings.allowed_branch_ids === null;
  const selectedCount = allBranchesSelected ? branches.length : selectedBranches.length;

  useEffect(() => {
    if (!store?.id) return;
    let active = true;
    setLoading(true);
    void (async () => {
      const { data, error } = await db.from("mcp_access_settings")
        .select("enabled,allowed_branch_ids,allow_store_read,allow_products_read,allow_inventory_read,allow_sales_read,allow_expenses_read,allow_customers_read,allow_product_writes,allow_stock_writes")
        .eq("store_id", store.id).maybeSingle();
      if (!active) return;
      if (error) {
        toast.error("Couldn't load AI access settings: " + error.message);
      } else {
        const next = data ? { ...DEFAULTS, ...data } : DEFAULTS;
        setSettings(next);
        setSelectedBranches(next.allowed_branch_ids ?? branches.map((item: any) => item.id));
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [store?.id, branches]);

  useEffect(() => {
    if (!store?.id || !canManage) return;
    let active = true;
    setAuditLoading(true);
    void db.from("mcp_action_audit")
      .select("id,action,resource_type,summary,created_at")
      .eq("store_id", store.id).order("created_at", { ascending: false }).limit(12)
      .then(({ data, error }: any) => {
        if (!active) return;
        if (error) setAudit([]);
        else setAudit(data ?? []);
        setAuditLoading(false);
      });
    return () => { active = false; };
  }, [store?.id, canManage]);

  const setFlag = (key: keyof Settings, value: boolean) =>
    setSettings((current) => ({ ...current, [key]: value }));

  const copyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(MCP_URL);
      toast.success("MCP endpoint copied");
    } catch {
      toast.error("Copy failed. Select and copy the endpoint manually.");
    }
  };

  const save = async () => {
    if (!store?.id || !canManage || saving) return;
    setSaving(true);
    const allSelected = branches.length > 0 && selectedBranches.length === branches.length;
    const payload = {
      store_id: store.id,
      enabled: settings.enabled,
      allowed_branch_ids: allSelected ? null : selectedBranches,
      allow_store_read: settings.allow_store_read,
      allow_products_read: settings.allow_products_read,
      allow_inventory_read: settings.allow_inventory_read,
      allow_sales_read: settings.allow_sales_read,
      allow_expenses_read: settings.allow_expenses_read,
      allow_customers_read: settings.allow_customers_read,
      allow_product_writes: settings.allow_product_writes,
      allow_stock_writes: settings.allow_stock_writes,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    };
    const { error } = await db.from("mcp_access_settings").upsert(payload, { onConflict: "store_id" });
    if (error) toast.error("Couldn't save AI permissions: " + error.message);
    else {
      setSettings((current) => ({ ...current, allowed_branch_ids: allSelected ? null : selectedBranches }));
      toast.success("STRAP AI permissions saved");
    }
    setSaving(false);
  };

  const selectAllBranches = (checked: boolean) => {
    if (checked) {
      setSelectedBranches(branches.map((b: any) => b.id));
      setSettings((current) => ({ ...current, allowed_branch_ids: null }));
    } else {
      setSelectedBranches([]);
      setSettings((current) => ({ ...current, allowed_branch_ids: [] }));
    }
  };

  if (!store) return <div className="rounded-2xl border border-border p-6 text-sm text-muted-foreground">Choose a store to manage its AI connections.</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
        <section className="overflow-hidden rounded-3xl border border-border bg-background">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-7">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-[#c6f432] text-[#0e1116]">
              <Bot className="size-7" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold tracking-tight">STRAP MCP server</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300"><span className="size-1.5 rounded-full bg-emerald-500" /> Live</span>
              </div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Connect AI assistants such as Claude and other MCP-compatible agents to your STRAP workspace. These branch and action permissions are shared by the AI clients connected to this store.</p>
            </div>
            <Link to="/mcp" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-secondary">Learn more <ExternalLink className="size-4" /></Link>
          </div>
          <div className="border-t border-border bg-secondary/30 p-4 sm:p-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">Remote MCP endpoint</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="min-w-0 flex-1 break-all rounded-xl border border-border bg-background px-3 py-3 text-xs sm:text-sm">{MCP_URL}</code>
              <Button variant="outline" onClick={() => void copyEndpoint()} className="gap-2"><Copy className="size-4" /> Copy endpoint</Button>
            </div>
          </div>
        </section>

        {!canManage && <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">Only a store owner or manager can change AI access permissions. You can still review the connection status.</div>}

        <section className="rounded-3xl border border-border bg-background p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div><h3 className="text-xl font-bold">Connection access</h3><p className="mt-1 text-sm text-muted-foreground">Control whether AI agents can access this store at all.</p></div>
            <Switch checked={settings.enabled} disabled={!canManage || loading} onCheckedChange={(value) => setFlag("enabled", value)} />
          </div>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-secondary/50 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0" />
            <div><p className="text-sm font-semibold">Your STRAP account remains in control</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Agents use the connected user's identity and STRAP permissions. They cannot access another merchant's store by changing a store ID. Write actions are also subject to STRAP owner/manager database policies.</p></div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-background p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><h3 className="text-xl font-bold">Branch access</h3><p className="mt-1 text-sm text-muted-foreground">Choose which branches AI agents can inspect or update. This scope applies to inventory, sales, expenses and stock quantities; product catalogue edits are store-wide.</p></div>
            <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{selectedCount} of {branches.length} branches</span>
          </div>
          {loading ? <p className="py-6 text-sm text-muted-foreground">Loading branches…</p> : branches.length === 0 ? <p className="py-6 text-sm text-muted-foreground">This store has no branches yet.</p> : (
            <div className="mt-5 space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
                <input type="checkbox" checked={allBranchesSelected} disabled={!canManage} onChange={(e) => selectAllBranches(e.target.checked)} className="size-4 accent-[#c6f432]" />
                <span className="text-sm font-semibold">All branches</span>
                <span className="ml-auto text-xs text-muted-foreground">Full branch coverage</span>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                {branches.map((item: any) => {
                  const checked = allBranchesSelected || selectedBranches.includes(item.id);
                  return <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-border p-3">
                    <input type="checkbox" checked={checked} disabled={!canManage || allBranchesSelected} onChange={(e) => {
                      const next = e.target.checked ? [...new Set([...selectedBranches, item.id])] : selectedBranches.filter((id) => id !== item.id);
                      setSelectedBranches(next);
                      setSettings((current) => ({ ...current, allowed_branch_ids: next }));
                    }} className="size-4 accent-[#c6f432]" />
                    <GitBranch className="size-4 text-muted-foreground" />
                    <span className="min-w-0 flex-1 text-sm font-medium">{item.name}</span>
                    {item.is_default && <span className="text-[10px] font-semibold text-muted-foreground">DEFAULT</span>}
                  </label>;
                })}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-border bg-background p-5 sm:p-7">
          <div className="border-b border-border pb-4"><h3 className="text-xl font-bold">Read permissions</h3><p className="mt-1 text-sm text-muted-foreground">Choose the business information AI agents can retrieve.</p></div>
          <div className="mt-4 divide-y divide-border">
            {READ_OPTIONS.map((option) => <div key={option.key} className="flex items-center justify-between gap-5 py-4"><div><p className="text-sm font-semibold">{option.title}</p><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{option.description}</p></div><Switch checked={Boolean(settings[option.key])} disabled={!canManage || loading} onCheckedChange={(value) => setFlag(option.key, value)} /></div>)}
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-background p-5 sm:p-7">
          <div className="flex items-start gap-3 border-b border-border pb-4"><div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700"><Sparkles className="size-5" /></div><div><h3 className="text-xl font-bold">Write permissions</h3><p className="mt-1 text-sm text-muted-foreground">Writing is off by default. Enable only the actions you want AI agents to perform.</p></div></div>
          <div className="mt-3 divide-y divide-border">
            {WRITE_OPTIONS.map((option) => <div key={option.key} className="flex items-center justify-between gap-5 py-4"><div><p className="text-sm font-semibold">{option.title}</p><p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground">{option.description}</p></div><Switch checked={Boolean(settings[option.key])} disabled={!canManage || loading || !settings.enabled} onCheckedChange={(value) => setFlag(option.key, value)} /></div>)}
          </div>
          <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs leading-5 text-muted-foreground">AI write actions are restricted to owners and managers by STRAP's existing row-level security rules. Sales, payments, refunds, staff permissions and store deletion are not exposed as write tools.</p>
        </section>

        {canManage && <section className="rounded-3xl border border-border bg-background p-5 sm:p-7"><div className="flex items-start gap-3"><Info className="mt-0.5 size-5" /><div><h3 className="text-lg font-bold">Recent AI activity</h3><p className="mt-1 text-sm text-muted-foreground">A record of product and stock changes made through STRAP MCP.</p></div></div>{auditLoading ? <p className="py-5 text-sm text-muted-foreground">Loading activity…</p> : audit.length === 0 ? <p className="py-5 text-sm text-muted-foreground">No AI write actions have been recorded yet.</p> : <div className="mt-4 divide-y divide-border">{audit.map((item) => <div key={item.id} className="py-3"><p className="text-sm font-semibold">{item.summary}</p><p className="mt-1 text-xs text-muted-foreground">{item.action.replaceAll(".", " · ")} · {new Date(item.created_at).toLocaleString()}</p></div>)}</div>}</section>}

        {canManage && <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted-foreground">Changes apply to future MCP requests for this store.</p><Button onClick={() => void save()} disabled={saving || loading} className="gap-2"><Check className="size-4" />{saving ? "Saving…" : "Save AI permissions"}</Button></div>}
    </div>
  );
}
