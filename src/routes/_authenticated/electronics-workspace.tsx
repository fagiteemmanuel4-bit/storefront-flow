import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ClipboardList, Cpu, Plus, Search, ShieldCheck, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchProductsWithStock } from "@/routes/_authenticated/products";
import { formatMoney } from "@/lib/currency";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/electronics-workspace")({
  component: ElectronicsWorkspacePage,
});
type Tab = "devices" | "repairs";
type Device = {
  id: string;
  product_id: string;
  branch_id: string;
  serial_number: string | null;
  imei: string | null;
  status: string;
  warranty_months: number;
  warranty_started_at: string | null;
  warranty_expires_at: string | null;
  notes: string;
  created_at: string;
  products?: { name: string; price: number } | null;
};
type Repair = {
  id: string;
  device_id: string | null;
  device_previous_status: string | null;
  customer_name: string;
  customer_phone: string;
  device_label: string;
  issue_description: string;
  diagnosis: string;
  status: string;
  warranty_claim: boolean;
  estimated_cost: number;
  final_cost: number;
  received_at: string;
  due_at: string | null;
  completed_at: string | null;
};

function ElectronicsWorkspacePage() {
  const { store, branch, role } = useStoreContext();
  const client = useQueryClient();
  const db = supabase as any;
  const storeId = store?.id ?? null;
  const branchId = branch?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const canManage = role === "owner" || role === "manager";
  const [tab, setTab] = useState<Tab>("devices");
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [serial, setSerial] = useState("");
  const [imei, setImei] = useState("");
  const [warrantyMonths, setWarrantyMonths] = useState("12");
  const [deviceNotes, setDeviceNotes] = useState("");
  const [savingDevice, setSavingDevice] = useState(false);
  const [repairDeviceId, setRepairDeviceId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("");
  const [issue, setIssue] = useState("");
  const [warrantyClaim, setWarrantyClaim] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState("0");
  const [savingRepair, setSavingRepair] = useState(false);

  const productsQuery = useQuery({
    queryKey: ["products", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: () => fetchProductsWithStock(storeId!, branchId!),
  });
  const devicesQuery = useQuery({
    queryKey: ["electronics-devices", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: async () => {
      const { data, error } = await db
        .from("electronics_devices")
        .select(
          "id,product_id,branch_id,serial_number,imei,status,warranty_months,warranty_started_at,warranty_expires_at,notes,created_at,products(name,price)",
        )
        .eq("store_id", storeId!)
        .eq("branch_id", branchId!)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Device[];
    },
  });
  const repairsQuery = useQuery({
    queryKey: ["electronics-repairs", storeId, branchId],
    enabled: Boolean(storeId && branchId),
    queryFn: async () => {
      const { data, error } = await db
        .from("electronics_repairs")
        .select(
          "id,device_id,device_previous_status,customer_name,customer_phone,device_label,issue_description,diagnosis,status,warranty_claim,estimated_cost,final_cost,received_at,due_at,completed_at",
        )
        .eq("store_id", storeId!)
        .eq("branch_id", branchId!)
        .order("received_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Repair[];
    },
  });
  const products = productsQuery.data ?? [];
  const devices = devicesQuery.data ?? [];
  const repairs = repairsQuery.data ?? [];
  const filteredDevices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return devices.filter((d) => {
      const name = d.products?.name ?? "";
      return (
        !term ||
        [name, d.serial_number, d.imei, d.status].some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(term),
        )
      );
    });
  }, [devices, search]);
  const filteredRepairs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return repairs.filter(
      (r) =>
        !term ||
        [r.customer_name, r.customer_phone, r.device_label, r.issue_description, r.status].some(
          (v) =>
            String(v ?? "")
              .toLowerCase()
              .includes(term),
        ),
    );
  }, [repairs, search]);

  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["electronics-devices", storeId, branchId] }),
      client.invalidateQueries({ queryKey: ["electronics-repairs", storeId, branchId] }),
      client.invalidateQueries({ queryKey: ["products", storeId, branchId] }),
    ]);
  }
  async function registerDevice(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !branchId || !productId) return toast.error("Choose a product first.");
    if (!serial.trim() && !imei.trim()) return toast.error("Enter a serial number or IMEI.");
    setSavingDevice(true);
    try {
      const { error } = await db
        .from("electronics_devices")
        .insert({
          store_id: storeId,
          branch_id: branchId,
          product_id: productId,
          serial_number: serial.trim() || null,
          imei: imei.trim() || null,
          warranty_months: Number(warrantyMonths),
          notes: deviceNotes.trim(),
        });
      if (error) throw new Error(error.message);
      toast.success("Device registered and available stock updated.");
      setSerial("");
      setImei("");
      setDeviceNotes("");
      setWarrantyMonths("12");
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error, "Device could not be registered."));
    } finally {
      setSavingDevice(false);
    }
  }
  async function createRepair(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !branchId) return;
    if (!customerName.trim() || !customerPhone.trim() || !deviceLabel.trim() || !issue.trim())
      return toast.error("Complete the customer, device and issue fields.");
    setSavingRepair(true);
    try {
      const selectedDevice = devices.find((d) => d.id === repairDeviceId);
      const { error } = await db.rpc("create_electronics_repair", {
        _store_id: storeId,
        _branch_id: branchId,
        _device_id: repairDeviceId || null,
        _customer_id: null,
        _customer_name: customerName.trim(),
        _customer_phone: customerPhone.trim(),
        _device_label: deviceLabel.trim() || (selectedDevice?.products?.name ?? "Device"),
        _issue_description: issue.trim(),
        _warranty_claim: warrantyClaim,
        _estimated_cost: Number(estimatedCost) || 0,
        _due_at: null,
      });
      if (error) throw new Error(error.message);
      toast.success("Repair intake recorded.");
      setCustomerName("");
      setCustomerPhone("");
      setDeviceLabel("");
      setIssue("");
      setRepairDeviceId("");
      setWarrantyClaim(false);
      setEstimatedCost("0");
      setTab("repairs");
      await refresh();
    } catch (error) {
      toast.error(errorMessage(error, "Repair intake could not be saved."));
    } finally {
      setSavingRepair(false);
    }
  }
  async function updateRepair(repair: Repair, nextStatus: string) {
    if (!canManage) return;
    const { error } = await db
      .from("electronics_repairs")
      .update({
        status: nextStatus,
        completed_at: nextStatus === "ready" ? new Date().toISOString() : repair.completed_at,
      })
      .eq("id", repair.id)
      .eq("store_id", storeId);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (repair.device_id && (nextStatus === "collected" || nextStatus === "cancelled")) {
      const restoreStatus = repair.device_previous_status ?? "sold";
      const { error: deviceError } = await db
        .from("electronics_devices")
        .update({ status: restoreStatus, updated_at: new Date().toISOString() })
        .eq("id", repair.device_id)
        .eq("store_id", storeId);
      if (deviceError) {
        toast.error(
          "Repair status saved, but the device status needs manager review: " + deviceError.message,
        );
        await refresh();
        return;
      }
    }
    toast.success("Repair status updated.");
    await refresh();
  }

  return (
    <AppShell title="Electronics workspace">
      <div className="space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-label-caps text-muted-foreground">Electronics & phones</p>
            <h1 className="mt-1 font-display text-2xl font-bold">Devices, warranties & repairs</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              Register each serial number or IMEI, track warranty from sale, and keep repair intake
              in one queue.
            </p>
          </div>
          <div className="flex gap-2">
            {(
              [
                { id: "devices", label: "Device registry", icon: <Cpu className="size-4" /> },
                { id: "repairs", label: "Repair desk", icon: <Wrench className="size-4" /> },
              ] as const
            ).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  setTab(option.id);
                  setSearch("");
                }}
                className={
                  "flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold " +
                  (tab === option.id
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-surface hover:bg-secondary")
                }
              >
                {option.icon}
                {option.label}
              </button>
            ))}
          </div>
        </header>
        <div className="relative max-w-xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-9"
            placeholder={
              tab === "devices"
                ? "Search product, serial or IMEI"
                : "Search repair, customer or status"
            }
          />
        </div>
        {tab === "devices" ? (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
            <section className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="border-b border-border p-4">
                <h2 className="font-display font-semibold">Registered devices</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Serialised stock is counted automatically while a device is available.
                </p>
              </div>
              {devicesQuery.isLoading ? (
                <div className="p-5 text-sm text-muted-foreground">Loading devices…</div>
              ) : devicesQuery.error ? (
                <div className="p-5 text-sm text-destructive">
                  {errorMessage(devicesQuery.error, "Devices could not be loaded.")}
                </div>
              ) : filteredDevices.length === 0 ? (
                <div className="p-8 text-center">
                  <Cpu className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 font-semibold">No registered devices</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Register your first phone, laptop or device to begin serial tracking.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredDevices.map((device) => {
                    const expired =
                      device.warranty_expires_at &&
                      new Date(device.warranty_expires_at) < new Date();
                    return (
                      <div
                        key={device.id}
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                      >
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                          <Cpu className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{device.products?.name ?? "Device"}</p>
                          <p className="mt-1 break-all text-xs text-muted-foreground">
                            {device.serial_number ? "Serial: " + device.serial_number : ""}
                            {device.serial_number && device.imei ? " · " : ""}
                            {device.imei ? "IMEI: " + device.imei : ""}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {device.warranty_expires_at
                              ? "Warranty expires " +
                                new Date(device.warranty_expires_at).toLocaleDateString()
                              : "Warranty starts when sold"}
                          </p>
                        </div>
                        <span
                          className={
                            "w-fit rounded-full px-2.5 py-1 text-xs font-semibold " +
                            (device.status === "in_stock"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : device.status === "repair"
                                ? "bg-amber-500/10 text-amber-700"
                                : "bg-secondary text-muted-foreground")
                          }
                        >
                          {device.status.replaceAll("_", " ")}
                        </span>
                        {device.warranty_started_at && (
                          <span
                            className={
                              "text-xs font-semibold " +
                              (expired ? "text-destructive" : "text-emerald-700")
                            }
                          >
                            <ShieldCheck className="mr-1 inline size-3.5" />
                            {expired ? "Warranty expired" : "Warranty active"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                  <Plus className="size-5" />
                </span>
                <div>
                  <h2 className="font-display font-semibold">Register a device</h2>
                  <p className="text-xs text-muted-foreground">
                    Register every sellable physical unit for a serial-tracked product. Its
                    available stock will equal the registered in-stock devices.
                  </p>
                </div>
              </div>
              {!canManage ? (
                <p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">
                  Only owners and managers can register devices.
                </p>
              ) : (
                <form onSubmit={registerDevice} className="space-y-3">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold">Product</span>
                    <select
                      required
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      className="field h-12"
                    >
                      <option value="">Choose product</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} · {formatMoney(Number(p.price), currency)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold">Serial number</span>
                      <Input
                        value={serial}
                        onChange={(e) => setSerial(e.target.value)}
                        className="h-11"
                        placeholder="Device serial"
                      />
                    </label>
                    <label className="block space-y-1.5">
                      <span className="text-xs font-semibold">IMEI</span>
                      <Input
                        value={imei}
                        onChange={(e) => setImei(e.target.value)}
                        className="h-11"
                        inputMode="numeric"
                        placeholder="15-digit IMEI"
                      />
                    </label>
                  </div>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold">Warranty period (months)</span>
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={warrantyMonths}
                      onChange={(e) => setWarrantyMonths(e.target.value)}
                      className="h-11"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold">Notes</span>
                    <textarea
                      value={deviceNotes}
                      onChange={(e) => setDeviceNotes(e.target.value)}
                      rows={2}
                      className="field w-full resize-y"
                      placeholder="Condition, supplier or purchase reference"
                    />
                  </label>
                  <Button className="h-11 w-full" disabled={savingDevice}>
                    {savingDevice ? "Registering…" : "Register device"}
                  </Button>
                </form>
              )}
            </section>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,.8fr)]">
            <section className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="border-b border-border p-4">
                <h2 className="font-display font-semibold">Repair queue</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Track intake, diagnosis, parts, ready-for-collection and completed repairs.
                </p>
              </div>
              {repairsQuery.isLoading ? (
                <div className="p-5 text-sm text-muted-foreground">Loading repairs…</div>
              ) : repairsQuery.error ? (
                <div className="p-5 text-sm text-destructive">
                  {errorMessage(repairsQuery.error, "Repairs could not be loaded.")}
                </div>
              ) : filteredRepairs.length === 0 ? (
                <div className="p-8 text-center">
                  <ClipboardList className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-3 font-semibold">No repairs yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Record an intake to start the queue.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredRepairs.map((repair) => (
                    <div key={repair.id} className="space-y-3 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold">{repair.device_label}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {repair.customer_name} · {repair.customer_phone}
                          </p>
                          <p className="mt-2 text-sm leading-5">{repair.issue_description}</p>
                          {repair.warranty_claim && (
                            <p className="mt-2 text-xs font-semibold text-emerald-700">
                              <BadgeCheck className="mr-1 inline size-3.5" />
                              Warranty claim
                            </p>
                          )}
                        </div>
                        <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold capitalize">
                          {repair.status.replaceAll("_", " ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                        <span className="text-xs text-muted-foreground">
                          Estimate {formatMoney(Number(repair.estimated_cost), currency)} ·{" "}
                          {new Date(repair.received_at).toLocaleDateString()}
                        </span>
                        <select
                          aria-label="Update repair status"
                          disabled={!canManage}
                          value={repair.status}
                          onChange={(e) => void updateRepair(repair, e.target.value)}
                          className="field h-9 w-auto max-w-full px-2 text-xs"
                        >
                          <option value="received">Received</option>
                          <option value="diagnosing">Diagnosing</option>
                          <option value="waiting_parts">Waiting for parts</option>
                          <option value="ready">Ready</option>
                          <option value="collected">Collected</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section className="rounded-2xl border border-border bg-surface p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary">
                  <Wrench className="size-5" />
                </span>
                <div>
                  <h2 className="font-display font-semibold">New repair intake</h2>
                  <p className="text-xs text-muted-foreground">
                    Register a customer's device and issue.
                  </p>
                </div>
              </div>
              <form onSubmit={createRepair} className="space-y-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Registered device (optional)</span>
                  <select
                    value={repairDeviceId}
                    onChange={(e) => {
                      setRepairDeviceId(e.target.value);
                      const d = devices.find((x) => x.id === e.target.value);
                      if (d)
                        setDeviceLabel(
                          (d.products?.name ?? "Device") + " " + (d.serial_number ?? d.imei ?? ""),
                        );
                    }}
                    className="field h-12"
                  >
                    <option value="">External / not in inventory</option>
                    {devices
                      .filter((d) => d.status === "sold" || d.status === "in_stock")
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.products?.name ?? "Device"} · {d.serial_number ?? d.imei}
                        </option>
                      ))}
                  </select>
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold">Customer name</span>
                    <Input
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-11"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-xs font-semibold">Phone number</span>
                    <Input
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="h-11"
                      inputMode="tel"
                    />
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Device / model</span>
                  <Input
                    required
                    value={deviceLabel}
                    onChange={(e) => setDeviceLabel(e.target.value)}
                    className="h-11"
                    placeholder="iPhone 13, HP EliteBook…"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Issue reported</span>
                  <textarea
                    required
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    rows={3}
                    className="field w-full resize-y"
                    placeholder="Describe the fault or damage"
                  />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold">Estimated repair cost</span>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="h-11"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={warrantyClaim}
                    onChange={(e) => setWarrantyClaim(e.target.checked)}
                    className="size-4"
                  />
                  Check as a warranty claim
                </label>
                <Button className="h-11 w-full" disabled={savingRepair}>
                  {savingRepair ? "Saving intake…" : "Record repair intake"}
                </Button>
              </form>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}
