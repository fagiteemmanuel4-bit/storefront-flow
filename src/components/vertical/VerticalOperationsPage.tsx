import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, BriefcaseBusiness, Pill, Scissors, Plus, Package, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney } from "@/lib/currency";
import { errorMessage } from "@/lib/format";

export type VerticalMode = "pharmacy" | "beauty" | "services";

type Product = { id: string; name: string; price: number };
type PharmacyProfile = { id: string; product_id: string; requires_prescription: boolean; dosage_form: string; strength: string; minimum_patient_age: number | null; controlled_class: string | null };
type PharmacyBatch = { id: string; product_id: string; batch_number: string; manufacturer: string; available_quantity: number; expiry_date: string; recall_status: string; products?: { name: string } | null };
type BeautyService = { id: string; name: string; duration_minutes: number; price: number; is_active: boolean };
type Appointment = { id: string; customer_name: string; customer_phone: string; starts_at: string; ends_at: string; status: string; notes: string; assigned_staff_id: string | null; deposit_amount: number; paid_amount: number };
type Staff = { user_id: string; display_name: string; role: string };
type ServiceCatalogItem = { id: string; name: string; description: string; default_price: number; is_active: boolean };
type ServiceJobItem = { id: string; job_id: string; description: string; quantity: number; unit_price: number; line_total: number };
type ServiceJob = { id: string; reference: string; title: string; customer_name: string; customer_phone: string; status: string; priority: string; quoted_amount: number; final_amount: number; amount_paid: number; due_at: string | null; assigned_staff_id: string | null };

const inputClass = "field h-11 w-full";
const cardClass = "rounded-2xl border border-border bg-surface p-4 sm:p-5";
const labelClass = "mb-1.5 block text-xs font-semibold text-muted-foreground";

export function VerticalOperationsPage({ mode }: { mode: VerticalMode }) {
  const { store, branch } = useStoreContext();
  const client = useQueryClient();
  const db = supabase as any;
  const storeId = store?.id ?? null;
  const branchId = branch?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const [saving, setSaving] = useState(false);

  const [productId, setProductId] = useState("");
  const [profileRx, setProfileRx] = useState(false);
  const [dosageForm, setDosageForm] = useState("");
  const [strength, setStrength] = useState("");
  const [minAge, setMinAge] = useState("");
  const [controlledClass, setControlledClass] = useState("");

  const [batchNumber, setBatchNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [supplier, setSupplier] = useState("");
  const [batchQty, setBatchQty] = useState("1");
  const [expiry, setExpiry] = useState("");
  const [unitCost, setUnitCost] = useState("0");
  const [recallBatch, setRecallBatch] = useState("");
  const [recallReason, setRecallReason] = useState("");
  const [recallRef, setRecallRef] = useState("");

  const [serviceName, setServiceName] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [serviceDuration, setServiceDuration] = useState("30");
  const [servicePrice, setServicePrice] = useState("0");
  const [appointmentService, setAppointmentService] = useState("");
  const [appointmentName, setAppointmentName] = useState("");
  const [appointmentPhone, setAppointmentPhone] = useState("");
  const [appointmentStart, setAppointmentStart] = useState("");
  const [appointmentNotes, setAppointmentNotes] = useState("");
  const [appointmentStaffId, setAppointmentStaffId] = useState("");
  const [appointmentDeposit, setAppointmentDeposit] = useState("0");
  const [appointmentId, setAppointmentId] = useState("");
  const [consumableProduct, setConsumableProduct] = useState("");
  const [consumableQty, setConsumableQty] = useState("1");
  const [consumableUnit, setConsumableUnit] = useState("unit");

  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [jobCustomer, setJobCustomer] = useState("");
  const [jobPhone, setJobPhone] = useState("");
  const [jobQuote, setJobQuote] = useState("0");
  const [jobDue, setJobDue] = useState("");
  const [jobStaffId, setJobStaffId] = useState("");
  const [jobServiceId, setJobServiceId] = useState("");
  const [jobItemQuantity, setJobItemQuantity] = useState("1");
  const [paymentJob, setPaymentJob] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");

  const staffQuery = useQuery({
    queryKey: ["vertical-staff", storeId],
    enabled: Boolean(storeId && (mode === "beauty" || mode === "services")),
    queryFn: async () => {
      const { data, error } = await db.rpc("list_store_staff", { _store_id: storeId! });
      if (error) throw new Error(error.message);
      return (data ?? []) as Staff[];
    },
  });
  const productsQuery = useQuery({
    queryKey: ["vertical-products", storeId],
    enabled: Boolean(storeId && (mode === "pharmacy" || mode === "beauty")),
    queryFn: async () => {
      const { data, error } = await db.from("products").select("id,name,price").eq("store_id", storeId!).eq("is_active", true).order("name");
      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    },
  });
  const profilesQuery = useQuery({
    queryKey: ["pharmacy-profiles", storeId],
    enabled: Boolean(storeId && mode === "pharmacy"),
    queryFn: async () => {
      const { data, error } = await db.from("pharmacy_product_profiles").select("id,product_id,requires_prescription,dosage_form,strength,minimum_patient_age,controlled_class").eq("store_id", storeId!);
      if (error) throw new Error(error.message);
      return (data ?? []) as PharmacyProfile[];
    },
  });
  const batchesQuery = useQuery({
    queryKey: ["pharmacy-batches", storeId, branchId],
    enabled: Boolean(storeId && branchId && mode === "pharmacy"),
    queryFn: async () => {
      const { data, error } = await db.from("pharmacy_batches").select("id,product_id,batch_number,manufacturer,available_quantity,expiry_date,recall_status,products(name)").eq("store_id", storeId!).eq("branch_id", branchId!).order("expiry_date");
      if (error) throw new Error(error.message);
      return (data ?? []) as PharmacyBatch[];
    },
  });
  const beautyServicesQuery = useQuery({
    queryKey: ["beauty-services", storeId],
    enabled: Boolean(storeId && mode === "beauty"),
    queryFn: async () => {
      const { data, error } = await db.from("beauty_services").select("id,name,duration_minutes,price,is_active").eq("store_id", storeId!).order("name");
      if (error) throw new Error(error.message);
      return (data ?? []) as BeautyService[];
    },
  });
  const appointmentsQuery = useQuery({
    queryKey: ["beauty-appointments", storeId, branchId],
    enabled: Boolean(storeId && branchId && mode === "beauty"),
    queryFn: async () => {
      const { data, error } = await db.from("beauty_appointments").select("id,customer_name,customer_phone,starts_at,ends_at,status,notes,assigned_staff_id,deposit_amount,paid_amount").eq("store_id", storeId!).eq("branch_id", branchId!).order("starts_at", { ascending: false }).limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as Appointment[];
    },
  });
  const serviceCatalogQuery = useQuery({
    queryKey: ["service-catalog", storeId],
    enabled: Boolean(storeId && mode === "services"),
    queryFn: async () => {
      const { data, error } = await db.from("service_catalog").select("id,name,description,default_price,is_active").eq("store_id", storeId!).order("name");
      if (error) throw new Error(error.message);
      return (data ?? []) as ServiceCatalogItem[];
    },
  });
  const jobsQuery = useQuery({
    queryKey: ["service-jobs", storeId, branchId],
    enabled: Boolean(storeId && branchId && mode === "services"),
    queryFn: async () => {
      const { data, error } = await db.from("service_jobs").select("id,reference,title,customer_name,customer_phone,status,priority,quoted_amount,final_amount,amount_paid,due_at,assigned_staff_id").eq("store_id", storeId!).eq("branch_id", branchId!).order("created_at", { ascending: false }).limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as ServiceJob[];
    },
  });

  const jobItemsQuery = useQuery({
    queryKey: ["service-job-items", storeId, jobsQuery.data?.map((job: ServiceJob) => job.id).join(",")],
    enabled: Boolean(storeId && mode === "services" && (jobsQuery.data?.length ?? 0) > 0),
    queryFn: async () => {
      const jobIds = (jobsQuery.data ?? []).map((job: ServiceJob) => job.id);
      const { data, error } = await db.from("service_job_items").select("id,job_id,description,quantity,unit_price,line_total").eq("store_id", storeId!).in("job_id", jobIds);
      if (error) throw new Error(error.message);
      return (data ?? []) as ServiceJobItem[];
    },
  });
  async function refresh() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["pharmacy-profiles", storeId] }),
      client.invalidateQueries({ queryKey: ["pharmacy-batches", storeId, branchId] }),
      client.invalidateQueries({ queryKey: ["beauty-services", storeId] }),
      client.invalidateQueries({ queryKey: ["beauty-appointments", storeId, branchId] }),
      client.invalidateQueries({ queryKey: ["service-catalog", storeId] }),
      client.invalidateQueries({ queryKey: ["service-jobs", storeId, branchId] }),
      client.invalidateQueries({ queryKey: ["service-job-items", storeId] }),
      client.invalidateQueries({ queryKey: ["vertical-products", storeId] }),
      client.invalidateQueries({ queryKey: ["products", storeId, branchId] }),
    ]);
  }

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !productId) return;
    setSaving(true);
    try {
      const { error } = await db.from("pharmacy_product_profiles").upsert({
        store_id: storeId, product_id: productId, requires_prescription: profileRx,
        dosage_form: dosageForm.trim(), strength: strength.trim(),
        minimum_patient_age: minAge ? Number(minAge) : null,
        controlled_class: controlledClass.trim() || null, is_active: true, updated_at: new Date().toISOString(),
      }, { onConflict: "store_id,product_id" });
      if (error) throw error;
      toast.success("Pharmacy product safeguards saved.");
      setProductId(""); setDosageForm(""); setStrength(""); setMinAge(""); setControlledClass(""); setProfileRx(false);
      await refresh();
    } catch (error) { toast.error(errorMessage(error, "Could not save pharmacy profile.")); }
    finally { setSaving(false); }
  }

  async function receiveBatch(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !branchId || !productId) return;
    setSaving(true);
    try {
      const { error } = await db.rpc("receive_pharmacy_batch", {
        _store_id: storeId, _branch_id: branchId, _product_id: productId,
        _batch_number: batchNumber.trim(), _manufacturer: manufacturer.trim(),
        _supplier_name: supplier.trim(), _quantity: Number(batchQty),
        _expiry_date: expiry, _unit_cost: Number(unitCost),
      });
      if (error) throw error;
      toast.success("Pharmacy batch received and branch stock updated.");
      setBatchNumber(""); setManufacturer(""); setSupplier(""); setBatchQty("1"); setExpiry(""); setUnitCost("0");
      await refresh();
    } catch (error) { toast.error(errorMessage(error, "Batch could not be received.")); }
    finally { setSaving(false); }
  }

  async function reportRecall(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !recallBatch || recallReason.trim().length < 3) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in again before recording a recall.");
      const { error } = await db.from("pharmacy_recalls").insert({
        store_id: storeId, batch_id: recallBatch, reason: recallReason.trim(),
        authority_reference: recallRef.trim(), reported_by: auth.user.id,
      });
      if (error) throw error;
      toast.success("Recall recorded. The batch is now quarantined.");
      setRecallBatch(""); setRecallReason(""); setRecallRef("");
      await refresh();
    } catch (error) { toast.error(errorMessage(error, "Recall could not be recorded.")); }
    finally { setSaving(false); }
  }

  async function saveBeautyService(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !serviceName.trim()) return;
    setSaving(true);
    try {
      const { error } = await db.from("beauty_services").insert({
        store_id: storeId, name: serviceName.trim(), description: serviceDescription.trim(),
        duration_minutes: Number(serviceDuration), price: Number(servicePrice),
      });
      if (error) throw error;
      toast.success("Beauty service added.");
      setServiceName(""); setServiceDescription(""); setServiceDuration("30"); setServicePrice("0");
      await refresh();
    } catch (error) { toast.error(errorMessage(error, "Service could not be saved.")); }
    finally { setSaving(false); }
  }

  async function bookAppointment(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !branchId || !appointmentService || !appointmentName.trim() || !appointmentPhone.trim() || !appointmentStart) return;
    const selected = (beautyServicesQuery.data ?? []).find((s) => s.id === appointmentService);
    if (!selected) return toast.error("Choose a valid service.");
    const start = new Date(appointmentStart);
    const end = new Date(start.getTime() + selected.duration_minutes * 60_000);
    setSaving(true);
    let createdId: string | null = null;
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in again before booking.");
      const { data, error } = await db.from("beauty_appointments").insert({
        store_id: storeId, branch_id: branchId, customer_name: appointmentName.trim(),
        customer_phone: appointmentPhone.trim(), starts_at: start.toISOString(), ends_at: end.toISOString(),
        notes: appointmentNotes.trim(), created_by: auth.user.id,
        assigned_staff_id: appointmentStaffId || null, deposit_amount: Number(appointmentDeposit) || 0,
      }).select("id").single();
      if (error) throw error;
      createdId = data.id;
      const { error: itemError } = await db.from("beauty_appointment_services").insert({
        store_id: storeId, appointment_id: data.id, service_id: selected.id,
        service_name: selected.name, duration_minutes: selected.duration_minutes, unit_price: selected.price,
      });
      if (itemError) {
        await db.from("beauty_appointments").delete().eq("id", data.id).eq("store_id", storeId);
        throw itemError;
      }
      toast.success("Appointment booked.");
      setAppointmentService(""); setAppointmentName(""); setAppointmentPhone(""); setAppointmentStart(""); setAppointmentNotes(""); setAppointmentStaffId(""); setAppointmentDeposit("0");
      await refresh();
    } catch (error) {
      if (createdId) await client.invalidateQueries({ queryKey: ["beauty-appointments", storeId, branchId] });
      toast.error(errorMessage(error, "Appointment could not be booked."));
    } finally { setSaving(false); }
  }

  async function recordAppointmentPayment(event: React.FormEvent<HTMLFormElement>, appointment: Appointment) {
    event.preventDefault();
    if (!storeId) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount") ?? 0);
    const reference = String(data.get("reference") ?? "").trim();
    const paymentMethod = String(data.get("payment_method") ?? "cash");
    if (!Number.isFinite(amount) || amount <= 0 || reference.length < 3) {
      toast.error("Enter a valid amount and payment reference.");
      return;
    }
    setSaving(true);
    try {
      const { error } = await db.rpc("record_beauty_appointment_payment", {
        _store_id: storeId, _appointment_id: appointment.id, _amount: amount,
        _payment_method: paymentMethod, _reference: reference,
      });
      if (error) throw error;
      toast.success("Appointment payment recorded.");
      form.reset();
      await refresh();
    } catch (error) { toast.error(errorMessage(error, "Appointment payment could not be recorded.")); }
    finally { setSaving(false); }
  }

  async function updateAppointment(id: string, status: string) {
    if (!storeId) return;
    const { error } = await db.from("beauty_appointments").update({ status, updated_at: new Date().toISOString() }).eq("id", id).eq("store_id", storeId);
    if (error) toast.error(error.message); else { toast.success("Appointment updated."); await refresh(); }
  }

  async function recordConsumable(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !branchId || !appointmentId || !consumableProduct) return;
    setSaving(true);
    try {
      const { error } = await db.rpc("record_beauty_consumable_usage", {
        _store_id: storeId, _branch_id: branchId, _appointment_id: appointmentId,
        _product_id: consumableProduct, _quantity: Number(consumableQty), _unit: consumableUnit,
      });
      if (error) throw error;
      toast.success("Consumable recorded and stock deducted.");
      setConsumableProduct(""); setConsumableQty("1"); await refresh();
    } catch (error) { toast.error(errorMessage(error, "Consumable usage could not be recorded.")); }
    finally { setSaving(false); }
  }

  async function saveServiceCatalog(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !serviceName.trim()) return;
    setSaving(true);
    try {
      const { error } = await db.from("service_catalog").insert({
        store_id: storeId, name: serviceName.trim(), description: serviceDescription.trim(),
        default_price: Number(servicePrice), is_active: true,
      });
      if (error) throw error;
      toast.success("Service added to catalogue.");
      setServiceName(""); setServiceDescription(""); setServicePrice("0"); await refresh();
    } catch (error) { toast.error(errorMessage(error, "Service could not be saved.")); }
    finally { setSaving(false); }
  }

  async function createJob(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !branchId || !jobTitle.trim() || !jobCustomer.trim() || !jobPhone.trim()) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in again before creating a job.");
      const reference = "JOB-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14) + "-" + crypto.randomUUID().slice(0, 6).toUpperCase();
      const selectedService = catalog.find((service) => service.id === jobServiceId);
      const quote = Number(jobQuote) > 0 ? Number(jobQuote) : Number(selectedService?.default_price ?? 0) * Number(jobItemQuantity);
      const { data: createdJob, error } = await db.from("service_jobs").insert({
        store_id: storeId, branch_id: branchId, customer_name: jobCustomer.trim(),
        customer_phone: jobPhone.trim(), reference, title: jobTitle.trim(),
        description: jobDescription.trim(), quoted_amount: quote, final_amount: quote,
        assigned_staff_id: jobStaffId || null,
        due_at: jobDue ? new Date(jobDue).toISOString() : null, created_by: auth.user.id,
      }).select("id").single();
      if (error) throw error;
      if (!createdJob) throw new Error("The job card could not be confirmed.");
      if (selectedService) {
        const { error: itemError } = await db.from("service_job_items").insert({
          store_id: storeId, job_id: createdJob.id, service_id: selectedService.id,
          description: selectedService.name, quantity: Number(jobItemQuantity),
          unit_price: Number(selectedService.default_price),
        });
        if (itemError) {
          await db.from("service_jobs").delete().eq("id", createdJob.id).eq("store_id", storeId);
          throw itemError;
        }
      }
      toast.success("Job card created: " + reference);
      setJobTitle(""); setJobDescription(""); setJobCustomer(""); setJobPhone(""); setJobQuote("0"); setJobDue(""); setJobStaffId(""); setJobServiceId(""); setJobItemQuantity("1");
      await refresh();
    } catch (error) { toast.error(errorMessage(error, "Job card could not be created.")); }
    finally { setSaving(false); }
  }

  async function saveJobFinalAmount(event: React.FormEvent<HTMLFormElement>, job: ServiceJob) {
    event.preventDefault();
    if (!storeId) return;
    const amount = Number(new FormData(event.currentTarget).get("final_amount") ?? 0);
    if (!Number.isFinite(amount) || amount < Number(job.amount_paid)) {
      toast.error("Final amount cannot be lower than payments already received.");
      return;
    }
    const { error } = await db.from("service_jobs").update({ final_amount: amount, updated_at: new Date().toISOString() }).eq("id", job.id).eq("store_id", storeId);
    if (error) toast.error(error.message); else { toast.success("Final job amount updated."); await refresh(); }
  }

  async function updateJob(job: ServiceJob, status: string) {
    if (!storeId) return;
    const { error } = await db.from("service_jobs").update({
      status, completed_at: status === "completed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id).eq("store_id", storeId);
    if (error) toast.error(error.message); else { toast.success("Job status updated."); await refresh(); }
  }

  async function recordJobPayment(event: React.FormEvent) {
    event.preventDefault();
    if (!storeId || !paymentJob || !paymentReference.trim()) return;
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in again before recording payment.");
      const { error } = await db.from("service_job_payments").insert({
        store_id: storeId, job_id: paymentJob, amount: Number(paymentAmount),
        payment_method: paymentMethod, reference: paymentReference.trim(), received_by: auth.user.id,
      });
      if (error) throw error;
      toast.success("Job payment recorded.");
      setPaymentJob(""); setPaymentAmount(""); setPaymentReference(""); await refresh();
    } catch (error) { toast.error(errorMessage(error, "Payment could not be recorded.")); }
    finally { setSaving(false); }
  }

  const products = productsQuery.data ?? [];
  const profiles = profilesQuery.data ?? [];
  const batches = batchesQuery.data ?? [];
  const beautyServices = beautyServicesQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];
  const catalog = serviceCatalogQuery.data ?? [];
  const jobs = jobsQuery.data ?? [];
  const jobItems = jobItemsQuery.data ?? [];

  if (mode === "pharmacy") return (
    <AppShell title="Pharmacy operations">
      <div className="space-y-5">
        <header><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pharmacy & health products</p><h1 className="mt-1 font-display text-2xl font-bold">Medicine safety & batch control</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Configure prescription safeguards, receive traceable batches and quarantine recalled stock. Prescription items with profiles are validated during in-person checkout.</p></header>
        <div className="grid gap-5 xl:grid-cols-2">
          <section className={cardClass}><div className="mb-4 flex items-center gap-2"><Pill className="size-5"/><h2 className="font-semibold">Product dispensing profile</h2></div><form onSubmit={saveProfile} className="space-y-3">
            <label><span className={labelClass}>Medicine / product</span><select className={inputClass} value={productId} onChange={e=>setProductId(e.target.value)} required><option value="">Choose product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Dosage form</span><Input className="h-11" value={dosageForm} onChange={e=>setDosageForm(e.target.value)} placeholder="Tablet, syrup…"/></label><label><span className={labelClass}>Strength</span><Input className="h-11" value={strength} onChange={e=>setStrength(e.target.value)} placeholder="500 mg…"/></label></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={profileRx} onChange={e=>setProfileRx(e.target.checked)}/> Prescription required</label>
            <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Minimum patient age</span><Input type="number" min="0" max="120" className="h-11" value={minAge} onChange={e=>setMinAge(e.target.value)} placeholder="Optional"/></label><label><span className={labelClass}>Controlled class</span><Input className="h-11" value={controlledClass} onChange={e=>setControlledClass(e.target.value)} placeholder="Optional classification"/></label></div>
            <Button type="submit" disabled={saving || !productId}><Plus className="mr-2 size-4"/>Save safeguards</Button>
          </form><div className="mt-4 space-y-2 border-t border-border pt-4">{profiles.map(p=><div key={p.id} className="flex justify-between gap-3 text-sm"><span>{products.find(x=>x.id===p.product_id)?.name ?? "Product"} · {p.dosage_form} {p.strength}</span><span className="text-muted-foreground">{p.requires_prescription ? "Prescription" : "Non-prescription"}</span></div>)}</div></section>
          <section className={cardClass}><div className="mb-4 flex items-center gap-2"><Package className="size-5"/><h2 className="font-semibold">Receive a batch</h2></div><form onSubmit={receiveBatch} className="space-y-3">
            <label><span className={labelClass}>Product</span><select className={inputClass} value={productId} onChange={e=>setProductId(e.target.value)} required><option value="">Choose product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Batch number</span><Input className="h-11" value={batchNumber} onChange={e=>setBatchNumber(e.target.value)} required/></label><label><span className={labelClass}>Expiry date</span><Input className="h-11" type="date" value={expiry} onChange={e=>setExpiry(e.target.value)} required/></label></div>
            <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Manufacturer</span><Input className="h-11" value={manufacturer} onChange={e=>setManufacturer(e.target.value)}/></label><label><span className={labelClass}>Supplier</span><Input className="h-11" value={supplier} onChange={e=>setSupplier(e.target.value)}/></label></div>
            <div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Quantity received</span><Input className="h-11" type="number" min="1" step="1" value={batchQty} onChange={e=>setBatchQty(e.target.value)} required/></label><label><span className={labelClass}>Unit cost</span><Input className="h-11" type="number" min="0" step="0.01" value={unitCost} onChange={e=>setUnitCost(e.target.value)}/></label></div>
            <Button type="submit" disabled={saving || !productId || !expiry}><Plus className="mr-2 size-4"/>Receive stock</Button>
          </form></section>
        </div>
        <section className={cardClass}><h2 className="font-semibold">Batch & expiry register</h2>{batchesQuery.isLoading ? <p className="mt-3 text-sm text-muted-foreground">Loading batches…</p> : batches.length===0 ? <p className="mt-3 text-sm text-muted-foreground">No pharmacy batches recorded for this branch yet.</p> : <div className="mt-3 divide-y divide-border">{batches.map(b=><div key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-semibold">{b.products?.name ?? products.find(p=>p.id===b.product_id)?.name ?? "Product"} · {b.batch_number}</p><p className="text-xs text-muted-foreground">{b.manufacturer || "Manufacturer not recorded"} · Expires {b.expiry_date}</p></div><div className="text-right"><p>{b.available_quantity} available</p><p className={b.recall_status==="clear" ? "text-xs text-emerald-700" : "text-xs text-destructive"}>{b.recall_status}</p></div></div>)}</div>}</section>
        <section className={cardClass}><h2 className="font-semibold">Quarantine / recall a batch</h2><form onSubmit={reportRecall} className="mt-3 grid gap-3 sm:grid-cols-2"><label><span className={labelClass}>Batch</span><select className={inputClass} value={recallBatch} onChange={e=>setRecallBatch(e.target.value)} required><option value="">Choose batch</option>{batches.filter(b=>b.recall_status==="clear").map(b=><option key={b.id} value={b.id}>{b.batch_number} · {b.products?.name ?? "Product"}</option>)}</select></label><label><span className={labelClass}>Reason</span><Input className="h-11" value={recallReason} onChange={e=>setRecallReason(e.target.value)} required/></label><label><span className={labelClass}>Authority / recall reference</span><Input className="h-11" value={recallRef} onChange={e=>setRecallRef(e.target.value)}/></label><div className="flex items-end"><Button type="submit" variant="destructive" disabled={saving || !recallBatch}>Quarantine batch</Button></div></form></section>
      </div>
    </AppShell>
  );

  if (mode === "beauty") return (
    <AppShell title="Beauty studio">
      <div className="space-y-5">
        <header><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Beauty & personal care</p><h1 className="mt-1 font-display text-2xl font-bold">Services, appointments & consumables</h1><p className="mt-1 text-sm text-muted-foreground">Manage a service menu, book customers and record stock used during treatments.</p></header>
        <div className="grid gap-5 xl:grid-cols-2">
          <section className={cardClass}><div className="mb-3 flex items-center gap-2"><Scissors className="size-5"/><h2 className="font-semibold">Service menu</h2></div><form onSubmit={saveBeautyService} className="space-y-3"><label><span className={labelClass}>Service name</span><Input className="h-11" value={serviceName} onChange={e=>setServiceName(e.target.value)} required/></label><label><span className={labelClass}>Description</span><Input className="h-11" value={serviceDescription} onChange={e=>setServiceDescription(e.target.value)}/></label><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Duration (minutes)</span><Input className="h-11" type="number" min="5" max="1440" value={serviceDuration} onChange={e=>setServiceDuration(e.target.value)}/></label><label><span className={labelClass}>Price</span><Input className="h-11" type="number" min="0" step="0.01" value={servicePrice} onChange={e=>setServicePrice(e.target.value)}/></label></div><Button type="submit" disabled={saving || !serviceName.trim()}><Plus className="mr-2 size-4"/>Add service</Button></form><div className="mt-4 divide-y divide-border">{beautyServices.map(s=><div key={s.id} className="flex justify-between py-2 text-sm"><span>{s.name} · {s.duration_minutes} min</span><strong>{formatMoney(Number(s.price),currency)}</strong></div>)}</div></section>
          <section className={cardClass}><div className="mb-3 flex items-center gap-2"><CalendarClock className="size-5"/><h2 className="font-semibold">Book an appointment</h2></div><form onSubmit={bookAppointment} className="space-y-3"><label><span className={labelClass}>Service</span><select className={inputClass} value={appointmentService} onChange={e=>setAppointmentService(e.target.value)} required><option value="">Choose service</option>{beautyServices.filter(s=>s.is_active).map(s=><option key={s.id} value={s.id}>{s.name} · {s.duration_minutes} min</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Customer name</span><Input className="h-11" value={appointmentName} onChange={e=>setAppointmentName(e.target.value)} required/></label><label><span className={labelClass}>Phone</span><Input className="h-11" value={appointmentPhone} onChange={e=>setAppointmentPhone(e.target.value)} required/></label></div><label><span className={labelClass}>Start date & time</span><Input className="h-11" type="datetime-local" value={appointmentStart} onChange={e=>setAppointmentStart(e.target.value)} required/></label><label><span className={labelClass}>Assign staff member (optional)</span><select className={inputClass} value={appointmentStaffId} onChange={e=>setAppointmentStaffId(e.target.value)}><option value="">Unassigned</option>{(staffQuery.data ?? []).map(staff=><option key={staff.user_id} value={staff.user_id}>{staff.display_name} · {staff.role}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Deposit required</span><Input className="h-11" type="number" min="0" step="0.01" value={appointmentDeposit} onChange={e=>setAppointmentDeposit(e.target.value)}/></label><label><span className={labelClass}>Notes</span><Input className="h-11" value={appointmentNotes} onChange={e=>setAppointmentNotes(e.target.value)}/></label></div><Button type="submit" disabled={saving || !appointmentService}><Plus className="mr-2 size-4"/>Book appointment</Button></form></section>
        </div>
        <section className={cardClass}><h2 className="font-semibold">Appointment calendar</h2><div className="mt-3 divide-y divide-border">{appointments.map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p className="font-semibold">{a.customer_name} · {a.customer_phone}</p><p className="text-xs text-muted-foreground">{new Date(a.starts_at).toLocaleString()} – {new Date(a.ends_at).toLocaleTimeString()} {a.notes ? " · "+a.notes : ""}</p><p className="text-xs text-muted-foreground">Staff: {(staffQuery.data ?? []).find(s=>s.user_id===a.assigned_staff_id)?.display_name ?? "Unassigned"} · Deposit {formatMoney(Number(a.deposit_amount),currency)} · Paid {formatMoney(Number(a.paid_amount),currency)}</p></div><select className="field h-9 w-auto" value={a.status} onChange={e=>void updateAppointment(a.id,e.target.value)}><option value="booked">Booked</option><option value="confirmed">Confirmed</option><option value="checked_in">Checked in</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="no_show">No show</option></select><form onSubmit={(event)=>void recordAppointmentPayment(event,a)} className="mt-2 grid gap-2 sm:grid-cols-4"><Input name="amount" type="number" min="0.01" step="0.01" className="h-9" placeholder="Amount" required/><select name="payment_method" className="field h-9"><option value="cash">Cash</option><option value="card">Card</option><option value="transfer">Transfer</option></select><Input name="reference" className="h-9" placeholder="Payment reference" required/><Button type="submit" size="sm" disabled={saving || ["cancelled","no_show"].includes(a.status)}>Record payment</Button></form></div>)}</div></section>
        <section className={cardClass}><h2 className="font-semibold">Treatment consumables</h2><form onSubmit={recordConsumable} className="mt-3 grid gap-3 sm:grid-cols-2"><label><span className={labelClass}>Completed / active appointment</span><select className={inputClass} value={appointmentId} onChange={e=>setAppointmentId(e.target.value)} required><option value="">Choose appointment</option>{appointments.filter(a=>["checked_in","in_progress","completed"].includes(a.status)).map(a=><option key={a.id} value={a.id}>{a.customer_name} · {new Date(a.starts_at).toLocaleString()}</option>)}</select></label><label><span className={labelClass}>Product used</span><select className={inputClass} value={consumableProduct} onChange={e=>setConsumableProduct(e.target.value)} required><option value="">Choose product</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Quantity</span><Input className="h-11" type="number" min="1" step="1" value={consumableQty} onChange={e=>setConsumableQty(e.target.value)}/></label><label><span className={labelClass}>Unit</span><Input className="h-11" value={consumableUnit} onChange={e=>setConsumableUnit(e.target.value)}/></label></div><div className="flex items-end"><Button type="submit" disabled={saving || !appointmentId || !consumableProduct}>Record usage & deduct stock</Button></div></form></section>
      </div>
    </AppShell>
  );

  return (
    <AppShell title="Service operations">
      <div className="space-y-5">
        <header><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Services & appointments</p><h1 className="mt-1 font-display text-2xl font-bold">Service catalogue & job cards</h1><p className="mt-1 text-sm text-muted-foreground">Create service quotes, track jobs from intake to completion and record deposits or part-payments.</p></header>
        <div className="grid gap-5 xl:grid-cols-2">
          <section className={cardClass}><div className="mb-3 flex items-center gap-2"><BriefcaseBusiness className="size-5"/><h2 className="font-semibold">Service catalogue</h2></div><form onSubmit={saveServiceCatalog} className="space-y-3"><label><span className={labelClass}>Service name</span><Input className="h-11" value={serviceName} onChange={e=>setServiceName(e.target.value)} required/></label><label><span className={labelClass}>Description</span><Input className="h-11" value={serviceDescription} onChange={e=>setServiceDescription(e.target.value)}/></label><label><span className={labelClass}>Default price</span><Input className="h-11" type="number" min="0" step="0.01" value={servicePrice} onChange={e=>setServicePrice(e.target.value)}/></label><Button disabled={saving || !serviceName.trim()}><Plus className="mr-2 size-4"/>Add service</Button></form><div className="mt-4 divide-y divide-border">{catalog.map(s=><div key={s.id} className="flex justify-between py-2 text-sm"><span>{s.name}</span><strong>{formatMoney(Number(s.default_price),currency)}</strong></div>)}</div></section>
          <section className={cardClass}><div className="mb-3 flex items-center gap-2"><ClipboardList className="size-5"/><h2 className="font-semibold">Create a job card</h2></div><form onSubmit={createJob} className="space-y-3"><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Customer name</span><Input className="h-11" value={jobCustomer} onChange={e=>setJobCustomer(e.target.value)} required/></label><label><span className={labelClass}>Phone</span><Input className="h-11" value={jobPhone} onChange={e=>setJobPhone(e.target.value)} required/></label></div><label><span className={labelClass}>Job title</span><Input className="h-11" value={jobTitle} onChange={e=>setJobTitle(e.target.value)} required/></label><label><span className={labelClass}>Work description</span><Input className="h-11" value={jobDescription} onChange={e=>setJobDescription(e.target.value)}/></label><label><span className={labelClass}>Assign staff member (optional)</span><select className={inputClass} value={jobStaffId} onChange={e=>setJobStaffId(e.target.value)}><option value="">Unassigned</option>{(staffQuery.data ?? []).map(staff=><option key={staff.user_id} value={staff.user_id}>{staff.display_name} · {staff.role}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Service item (optional)</span><select className={inputClass} value={jobServiceId} onChange={e=>{setJobServiceId(e.target.value);const service=catalog.find(s=>s.id===e.target.value);if(service)setJobQuote(String(service.default_price*Number(jobItemQuantity)));}}><option value="">Custom job</option>{catalog.filter(s=>s.is_active).map(s=><option key={s.id} value={s.id}>{s.name} · {formatMoney(Number(s.default_price),currency)}</option>)}</select></label><label><span className={labelClass}>Item quantity</span><Input className="h-11" type="number" min="0.01" step="0.01" value={jobItemQuantity} onChange={e=>{setJobItemQuantity(e.target.value);const service=catalog.find(s=>s.id===jobServiceId);if(service)setJobQuote(String(service.default_price*Number(e.target.value)));}}/></label></div><div className="grid grid-cols-2 gap-3"><label><span className={labelClass}>Quoted amount</span><Input className="h-11" type="number" min="0" step="0.01" value={jobQuote} onChange={e=>setJobQuote(e.target.value)}/></label><label><span className={labelClass}>Due date</span><Input className="h-11" type="datetime-local" value={jobDue} onChange={e=>setJobDue(e.target.value)}/></label></div><Button type="submit" disabled={saving || !jobTitle.trim()}><Plus className="mr-2 size-4"/>Create job card</Button></form></section>
        </div>
        <section className={cardClass}><h2 className="font-semibold">Job queue & payments</h2><div className="mt-3 divide-y divide-border">{jobs.map(job=><div key={job.id} className="space-y-3 py-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{job.reference} · {job.title}</p><p className="text-xs text-muted-foreground">{job.customer_name} · {job.customer_phone}</p><p className="text-xs text-muted-foreground">Assigned: {(staffQuery.data ?? []).find(s=>s.user_id===job.assigned_staff_id)?.display_name ?? "Unassigned"}</p><p className="mt-1 text-xs">Quoted {formatMoney(Number(job.quoted_amount),currency)} · Final {formatMoney(Number(job.final_amount),currency)} · Paid {formatMoney(Number(job.amount_paid),currency)} · Balance {formatMoney(Math.max(0,Number(job.final_amount)-Number(job.amount_paid)),currency)}</p>{jobItems.filter(item=>item.job_id===job.id).map(item=><p key={item.id} className="mt-1 text-xs text-muted-foreground">{item.description} × {item.quantity} · {formatMoney(Number(item.line_total),currency)}</p>)}</div><select className="field h-9 w-auto" value={job.status} onChange={e=>void updateJob(job,e.target.value)}><option value="requested">Requested</option><option value="quoted">Quoted</option><option value="approved">Approved</option><option value="in_progress">In progress</option><option value="on_hold">On hold</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></div><form onSubmit={(event)=>void saveJobFinalAmount(event,job)} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"><Input name="final_amount" type="number" min={job.amount_paid} step="0.01" defaultValue={job.final_amount} className="h-9" aria-label="Final job amount"/><Button type="submit" size="sm" variant="outline">Update final amount</Button></form><form onSubmit={recordJobPayment} className="grid gap-2 sm:grid-cols-4"><Input className="h-10" type="number" min="0.01" step="0.01" placeholder="Payment amount" value={paymentJob===job.id ? paymentAmount : ""} onFocus={()=>setPaymentJob(job.id)} onChange={e=>{setPaymentJob(job.id);setPaymentAmount(e.target.value)}} required/><select className="field h-10" value={paymentJob===job.id ? paymentMethod : "cash"} onChange={e=>{setPaymentJob(job.id);setPaymentMethod(e.target.value)}}><option value="cash">Cash</option><option value="card">Card</option><option value="transfer">Transfer</option></select><Input className="h-10" placeholder="Payment reference" value={paymentJob===job.id ? paymentReference : ""} onFocus={()=>setPaymentJob(job.id)} onChange={e=>{setPaymentJob(job.id);setPaymentReference(e.target.value)}} required/><Button type="submit" size="sm" disabled={saving || paymentJob!==job.id}>Record payment</Button></form></div>)}</div></section>
      </div>
    </AppShell>
  );
}
