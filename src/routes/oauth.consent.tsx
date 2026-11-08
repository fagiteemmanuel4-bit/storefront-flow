import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bot, Check, GitBranch, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;
export const Route = createFileRoute("/oauth/consent")({
  ssr: false,
  head: () => ({
    meta: [{ title: "Connect an app — STRAP" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: OAuthConsentPage,
});

type ConsentDetails = {
  authorization_id?: string;
  redirect_url?: string;
  client_id?: string;
  client: {
    id?: string;
    client_id?: string;
    name: string;
    uri?: string | null;
    logo_uri?: string | null;
  };
  redirect_uri: string;
  scope?: string;
};
type StoreOption = { id: string; name: string; owner_id: string };
type BranchOption = { id: string; name: string; is_default?: boolean };
type Permissions = {
  allow_store_read: boolean;
  allow_products_read: boolean;
  allow_inventory_read: boolean;
  allow_sales_read: boolean;
  allow_expenses_read: boolean;
  allow_customers_read: boolean;
  allow_product_writes: boolean;
  allow_stock_writes: boolean;
};
const DEFAULT_PERMISSIONS: Permissions = {
  allow_store_read: true,
  allow_products_read: true,
  allow_inventory_read: true,
  allow_sales_read: true,
  allow_expenses_read: false,
  allow_customers_read: false,
  allow_product_writes: false,
  allow_stock_writes: false,
};
const READ_OPTIONS: Array<{ key: keyof Permissions; title: string; description: string }> = [
  {
    key: "allow_store_read",
    title: "Store profile",
    description: "Store name and general business details.",
  },
  {
    key: "allow_products_read",
    title: "Products",
    description: "Product names, SKUs, prices and catalogue details.",
  },
  {
    key: "allow_inventory_read",
    title: "Inventory and branches",
    description: "Stock quantities and branch information.",
  },
  {
    key: "allow_sales_read",
    title: "Sales",
    description: "Sales totals and transaction summaries.",
  },
  {
    key: "allow_expenses_read",
    title: "Expenses",
    description: "Expense amounts, categories and descriptions.",
  },
  {
    key: "allow_customers_read",
    title: "Customers",
    description: "Customer records and limited contact information.",
  },
];
const WRITE_OPTIONS: Array<{ key: keyof Permissions; title: string; description: string }> = [
  {
    key: "allow_product_writes",
    title: "Create and update products",
    description: "Add products and update catalogue fields, including pricing.",
  },
  {
    key: "allow_stock_writes",
    title: "Update branch stock",
    description: "Set exact stock quantities at the branches you select.",
  },
];

function OAuthConsentPage() {
  const navigate = useNavigate();
  const [details, setDetails] = useState<ConsentDetails | null>(null);
  const [userId, setUserId] = useState("");
  const [stores, setStores] = useState<StoreOption[]>([]);
  const [storeId, setStoreId] = useState("");
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [branchesLoadedForStoreId, setBranchesLoadedForStoreId] = useState("");
  const [branchesError, setBranchesError] = useState("");
  const [allBranches, setAllBranches] = useState(true);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<Permissions>(DEFAULT_PERMISSIONS);
  const [enabled, setEnabled] = useState(true);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const clientId = details?.client?.id ?? details?.client?.client_id ?? details?.client_id ?? "";
  const scopes = useMemo(
    () => (details?.scope ?? "").split(/\s+/).filter(Boolean),
    [details?.scope],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      const authorizationId = new URLSearchParams(window.location.search).get("authorization_id");
      if (!authorizationId || authorizationId.length > 512) {
        setError(
          "This authorization request is missing or invalid. Return to the app and try again.",
        );
        setLoading(false);
        return;
      }
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        sessionStorage.setItem(
          "strap_oauth_return",
          `${window.location.pathname}${window.location.search}`,
        );
        await navigate({ to: "/auth", replace: true });
        return;
      }
      if (!active) return;
      setUserId(userData.user.id);
      const [{ data: authData, error: detailsError }, { data: storeData, error: storesError }] =
        await Promise.all([
          supabase.auth.oauth.getAuthorizationDetails(authorizationId),
          db.from("stores").select("id,name,owner_id").order("created_at", { ascending: true }),
        ]);
      if (!active) return;
      if (detailsError || !authData)
        throw detailsError ?? new Error("We couldn't verify this authorization request.");
      const authorization = authData as ConsentDetails;
      if (!("authorization_id" in authorization) && authorization.redirect_url) {
        window.location.assign(authorization.redirect_url);
        return;
      }
      if (!storesError && storeData) {
        const manageable = await Promise.all(
          (storeData as StoreOption[]).map(async (store) => {
            if (store.owner_id === userData.user.id) return store;
            const { data: member } = await db
              .from("store_members")
              .select("role")
              .eq("store_id", store.id)
              .eq("user_id", userData.user.id)
              .maybeSingle();
            return member?.role === "owner" || member?.role === "manager" ? store : null;
          }),
        );
        const available = manageable.filter(Boolean) as StoreOption[];
        setStores(available);
        setStoreId(available[0]?.id ?? "");
        if (!available.length)
          setError(
            "You need owner or manager access to a STRAP store before authorising an AI connection.",
          );
      } else if (storesError) {
        throw storesError;
      }
      setDetails(authorization);
      setLoading(false);
    };
    void load().catch((cause: unknown) => {
      if (active) {
        setError(cause instanceof Error ? cause.message : "Unable to load authorization.");
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!storeId) {
      setBranches([]);
      setSelectedBranches([]);
      setBranchesLoadedForStoreId("");
      setBranchesError("");
      return;
    }
    let active = true;
    setBranchesLoadedForStoreId("");
    setBranchesError("");
    void db
      .from("branches")
      .select("id,name,is_default")
      .eq("store_id", storeId)
      .order("name")
      .then(({ data, error: branchError }: any) => {
        if (!active) return;
        if (branchError) throw branchError;
        const rows = (data ?? []) as BranchOption[];
        setBranches(rows);
        setSelectedBranches(rows.map((branch) => branch.id));
        setAllBranches(true);
        setBranchesLoadedForStoreId(storeId);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const message =
          cause instanceof Error ? cause.message : "We couldn't verify this store's branches.";
        setBranchesError(message);
        setError("We couldn't load the branch list. Reload this page before approving access.");
      });
    return () => {
      active = false;
    };
  }, [storeId]);

  async function decide(decision: "approve" | "deny") {
    if (!details?.authorization_id || busy) return;
    if (decision === "approve" && (!clientId || !storeId)) {
      setError("The requesting application or selected store could not be verified.");
      return;
    }
    if (decision === "approve" && branchesLoadedForStoreId !== storeId) {
      setError(
        branchesError ||
          "We haven't verified this store's branches yet. Wait for the branch list or reload the page.",
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (decision === "approve") {
        const { error: saveError } = await db.from("mcp_client_access_settings").upsert(
          {
            store_id: storeId,
            user_id: userId,
            client_id: clientId,
            client_name: details.client.name || "Connected AI application",
            enabled,
            allowed_branch_ids: allBranches ? null : selectedBranches,
            ...permissions,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "store_id,user_id,client_id" },
        );
        if (saveError) throw saveError;
      }
      const response =
        decision === "approve"
          ? await supabase.auth.oauth.approveAuthorization(details.authorization_id)
          : await supabase.auth.oauth.denyAuthorization(details.authorization_id);
      if (response.error) throw response.error;
      const redirectUrl = response.data?.redirect_url;
      if (!redirectUrl) throw new Error("Supabase did not return an authorization redirect.");
      sessionStorage.removeItem("strap_oauth_return");
      window.location.assign(redirectUrl);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your decision could not be saved.");
      setBusy(false);
    }
  }

  const selectedStore = stores.find((store) => store.id === storeId);
  const setPermission = (key: keyof Permissions, value: boolean) =>
    setPermissions((current) => ({ ...current, [key]: value }));

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:py-14">
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 flex items-center justify-between">
          <Link to="/auth" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="STRAP" className="size-9" />
            <span className="text-lg font-extrabold tracking-tight">STRAP</span>
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <LockKeyhole className="size-3.5" /> Secure authorisation
          </span>
        </header>

        <section className="rounded-3xl border border-border bg-surface p-5 shadow-lift sm:p-8">
          {loading ? (
            <div className="py-14 text-center text-sm text-muted-foreground">
              Preparing your secure connection…
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink">
                  <Bot className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-[.15em] text-muted-foreground">
                    Third-party connection request
                  </p>
                  <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
                    {details?.client?.name ?? "An AI application"} wants to connect to STRAP
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Choose exactly which store information and actions this application may access.
                    You can change these permissions or revoke the connection later in Settings →
                    Connected applications.
                  </p>
                </div>
              </div>

              {details?.redirect_uri && (
                <p className="mt-5 break-all rounded-xl bg-secondary p-3 text-xs text-muted-foreground">
                  Redirect destination:{" "}
                  <span className="font-semibold text-foreground">
                    {(() => {
                      try {
                        return new URL(details.redirect_uri).host;
                      } catch {
                        return "Unrecognised destination";
                      }
                    })()}
                  </span>
                </p>
              )}

              {stores.length > 0 && (
                <>
                  <div className="mt-7 border-t border-border pt-6">
                    <h2 className="text-base font-bold">Choose a STRAP store</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      This connection will be authorised for the selected store.
                    </p>
                    <select
                      value={storeId}
                      onChange={(event) => setStoreId(event.target.value)}
                      className="field mt-3 h-12 text-sm font-semibold"
                    >
                      {stores.map((store) => (
                        <option key={store.id} value={store.id}>
                          {store.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-7 border-t border-border pt-6">
                    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4">
                      <div className="min-w-0">
                        <h2 className="text-base font-bold">Connection status</h2>
                        <p className="mt-1 text-sm leading-5 text-muted-foreground">
                          You can approve the connection while keeping its data access paused.
                          Re-enable it later in Settings → Connected applications.
                        </p>
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={setEnabled}
                        aria-label="Enable this application"
                      />
                    </div>
                  </div>

                  <div className="mt-7 border-t border-border pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-base font-bold">Branch access</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Limit branch-level information and stock updates to selected locations.
                        </p>
                      </div>
                      <GitBranch className="size-5 text-muted-foreground" />
                    </div>
                    <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
                      <Checkbox
                        checked={allBranches}
                        onCheckedChange={(checked) => {
                          const selected = checked === true;
                          setAllBranches(selected);
                          setSelectedBranches(selected ? branches.map((branch) => branch.id) : []);
                        }}
                      />
                      <span className="text-sm font-semibold">All branches</span>
                    </label>
                    {!allBranches && (
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {branches.map((branch) => (
                          <label
                            key={branch.id}
                            className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-3"
                          >
                            <Checkbox
                              checked={selectedBranches.includes(branch.id)}
                              onCheckedChange={(checked) =>
                                setSelectedBranches((current) =>
                                  checked === true
                                    ? [...current.filter((id) => id !== branch.id), branch.id]
                                    : current.filter((id) => id !== branch.id),
                                )
                              }
                            />
                            <span className="text-sm">{branch.name}</span>
                            {branch.is_default && (
                              <span className="ml-auto text-[10px] font-bold text-muted-foreground">
                                DEFAULT
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                    {branches.length === 0 && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        No branches have been created for this store yet.
                      </p>
                    )}
                  </div>

                  <div className="mt-7 border-t border-border pt-6">
                    <h2 className="text-base font-bold">Read permissions</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Select the information the assistant may inspect.
                    </p>
                    <div className="mt-3 divide-y divide-border">
                      {READ_OPTIONS.map((option) => (
                        <div
                          key={option.key}
                          className="flex items-center justify-between gap-4 py-3.5"
                        >
                          <div>
                            <p className="text-sm font-semibold">{option.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                          <Switch
                            checked={permissions[option.key]}
                            onCheckedChange={(value) => setPermission(option.key, value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-7 border-t border-border pt-6">
                    <h2 className="text-base font-bold">Write permissions</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Write access is off by default. Enable only actions you trust this application
                      to perform.
                    </p>
                    <div className="mt-3 divide-y divide-border">
                      {WRITE_OPTIONS.map((option) => (
                        <div
                          key={option.key}
                          className="flex items-center justify-between gap-4 py-3.5"
                        >
                          <div>
                            <p className="text-sm font-semibold">{option.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {option.description}
                            </p>
                          </div>
                          <Switch
                            checked={permissions[option.key]}
                            onCheckedChange={(value) => setPermission(option.key, value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="mt-6 flex items-start gap-3 rounded-xl bg-accent-soft p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-accent-ink" />
                <p className="text-xs leading-5 text-muted-foreground">
                  STRAP uses your authenticated account, store role and the permissions selected
                  here. AI clients cannot use this approval to access other merchants. You can
                  revoke an app's OAuth grant later to invalidate its active tokens.
                </p>
              </div>
              {scopes.length > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  Requested identity scopes: {scopes.join(", ")}. These are separate from the STRAP
                  data permissions above.
                </p>
              )}
              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  disabled={busy || loading}
                  onClick={() => void decide("deny")}
                  className="h-11"
                >
                  Deny request
                </Button>
                <Button
                  disabled={busy || loading || !stores.length || !selectedStore || branchesLoadedForStoreId !== storeId || Boolean(branchesError)}
                  onClick={() => void decide("approve")}
                  className="h-11 gap-2"
                >
                  {busy ? (
                    "Saving…"
                  ) : (
                    <>
                      <Check className="size-4" /> Approve connection
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </section>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          You remain in control of connected applications and their access to STRAP.
        </p>
      </div>
    </main>
  );
}
