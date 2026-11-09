import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity, AlertTriangle, Bell, Check, CheckCircle2, ChevronRight, Clock3, Copy,
  Download, Link2, Package, Plus, RefreshCw, Settings2, Share2, ShieldCheck, Store, Upload, Users, X,
} from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const db = supabase as any;
type Vendor = {
  id: string; business_name: string; slug: string; description: string;
  category: string; city: string; state: string; whatsapp_number: string;
  logo_url: string; is_published: boolean;
};
type Product = {
  id: string; title: string; category: string; description: string; image_url: string;
  wholesale_price: number; suggested_retail_price: number; stock_quantity: number;
  min_order_quantity: number; unit: string; is_active: boolean; distribution_enabled: boolean;
  is_seasonal: boolean; season_start: string | null; season_end: string | null;
  low_stock_threshold: number; availability_status: string; sku: string;
};
type Panel = "overview" | "products" | "distribution" | "connections" | "notifications" | "settings";
const money = (n: number | string) => new Intl.NumberFormat("en-NG", {
  style: "currency", currency: "NGN", maximumFractionDigits: 0,
}).format(Number(n) || 0);
const statusTone: Record<string,string> = {
  available: "bg-emerald-500/10 text-emerald-700", low_stock: "bg-amber-500/10 text-amber-700",
  out_of_stock: "bg-red-500/10 text-red-600", seasonal_paused: "bg-violet-500/10 text-violet-700",
  hidden: "bg-secondary text-muted-foreground",
};
const statusLabel: Record<string,string> = {
  available: "In stock", low_stock: "Low stock", out_of_stock: "Out of stock",
  seasonal_paused: "Out of season", hidden: "Not distributed",
};

async function hashCode(code: string) {
  const bytes = new TextEncoder().encode(code.trim().toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') {
      field += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(field.trim());
      if (row.some((cell) => cell.length)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field.trim());
    if (row.some((cell) => cell.length)) rows.push(row);
  }
  if (rows.length < 2) return [];
  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])));
}

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return "STRAP-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}
function Stat({ label, value, hint, icon: Icon }: {label:string;value:string|number;hint:string;icon:any}) {
  return <div className="rounded-2xl border border-border bg-card p-4 sm:p-5">
    <div className="flex items-center justify-between gap-2"><span className="text-xs font-medium text-muted-foreground">{label}</span><span className="grid size-9 place-items-center rounded-xl bg-secondary"><Icon className="size-4"/></span></div>
    <p className="mt-3 font-display text-2xl font-bold tracking-tight">{value}</p>
    <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
  </div>;
}
function SectionTitle({eyebrow,title,description,action}:{eyebrow:string;title:string;description:string;action?:ReactNode}) {
  return <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-muted-foreground">{eyebrow}</p><h2 className="mt-1 font-display text-2xl font-bold tracking-tight">{title}</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action}</div>;
}
export function SupplierWorkspace({ vendor, userId, onBrowseMarketplace }: {
  vendor: Vendor; userId: string; onBrowseMarketplace: () => void;
}) {
  const queryClient = useQueryClient();
  const [panel,setPanel] = useState<Panel>("overview");
  const [selected,setSelected] = useState<string[]>([]);
  const [codeOpen,setCodeOpen] = useState(false);
  const [productCreateOpen,setProductCreateOpen] = useState(false);
  const [productDraft,setProductDraft] = useState({title:"",category:"General",description:"",image_url:"",wholesale_price:"",suggested_retail_price:"",stock_quantity:"0",min_order_quantity:"1",unit:"piece"});
  const [codeLabel,setCodeLabel] = useState("My product collection");
  const [codeScope,setCodeScope] = useState<"selected"|"all"|"group">("selected");
  const [codeApproval,setCodeApproval] = useState(false);
  const [codeLimit,setCodeLimit] = useState("");
  const [codeExpiry,setCodeExpiry] = useState("");
  const [newCode,setNewCode] = useState("");
  const [newLink,setNewLink] = useState("");
  const [codeGroupId,setCodeGroupId] = useState("");
  const [saving,setSaving] = useState(false);
  const [productSearch,setProductSearch] = useState("");
  const [settings,setSettings] = useState<any>(null);
  const [groupName,setGroupName] = useState("");
  const [groupOpen,setGroupOpen] = useState(false);
  const [businessStatus,setBusinessStatus] = useState("open");

  const productsQuery = useQuery({
    queryKey:["connect-supplier-products",vendor.id],
    queryFn:async()=>{const {data,error}=await db.from("connect_products").select("*").eq("vendor_id",vendor.id).order("created_at",{ascending:false});if(error)throw error;return (data??[]) as Product[];},
  });
  const settingsQuery = useQuery({
    queryKey:["connect-supplier-settings",vendor.id],
    queryFn:async()=>{const {data,error}=await db.from("connect_supplier_settings").select("*").eq("vendor_id",vendor.id).maybeSingle();if(error)throw error;return data;},
  });
  const codesQuery = useQuery({
    queryKey:["connect-distribution-codes",vendor.id],
    queryFn:async()=>{const {data,error}=await db.from("connect_distribution_codes").select("id,label,include_all_products,require_approval,expires_at,max_redemptions,redemption_count,is_active,created_at,group_id").eq("vendor_id",vendor.id).order("created_at",{ascending:false});if(error)throw error;return data??[];},
  });
  const connectionsQuery = useQuery({
    queryKey:["connect-supplier-connections",vendor.id],
    queryFn:async()=>{const {data,error}=await db.from("connect_supplier_connections").select("id,retailer_user_id,status,source,connected_at,reviewed_at").eq("vendor_id",vendor.id).order("connected_at",{ascending:false});if(error)throw error;return data??[];},
  });
  const noticesQuery = useQuery({
    queryKey:["connect-supplier-notifications",userId],
    queryFn:async()=>{const {data,error}=await db.from("connect_notifications").select("*").eq("recipient_user_id",userId).order("created_at",{ascending:false}).limit(50);if(error)throw error;return data??[];},
  });
  const eventsQuery = useQuery({
    queryKey:["connect-supplier-events",vendor.id],
    queryFn:async()=>{const {data,error}=await db.from("connect_sync_events").select("id,event_type,created_at,product:connect_products(title)").eq("vendor_id",vendor.id).order("created_at",{ascending:false}).limit(8);if(error)throw error;return data??[];},
  });
  const groupsQuery = useQuery({
    queryKey:["connect-distribution-groups",vendor.id],
    queryFn:async()=>{const {data,error}=await db.from("connect_distribution_groups").select("id,name,description,created_at,products:connect_distribution_group_products(product_id)").eq("vendor_id",vendor.id).order("created_at",{ascending:false});if(error)throw error;return data??[];},
  });
  const products=productsQuery.data??[];
  const connections=connectionsQuery.data??[];
  const activeConnections=connections.filter((c:any)=>c.status==="active").length;
  const pendingConnections=connections.filter((c:any)=>c.status==="pending").length;
  const lowStock=products.filter(p=>p.stock_quantity>0&&p.stock_quantity<=p.low_stock_threshold).length;
  const outStock=products.filter(p=>p.stock_quantity<=0).length;
  const filteredProducts=useMemo(()=>products.filter(p=>!productSearch||[p.title,p.category,p.sku].join(" ").toLowerCase().includes(productSearch.toLowerCase())),[products,productSearch]);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({queryKey:["connect-supplier-products",vendor.id]}),
      queryClient.invalidateQueries({queryKey:["connect-distribution-codes",vendor.id]}),
      queryClient.invalidateQueries({queryKey:["connect-supplier-connections",vendor.id]}),
      queryClient.invalidateQueries({queryKey:["connect-supplier-notifications",userId]}),
      queryClient.invalidateQueries({queryKey:["connect-supplier-events",vendor.id]}),
      queryClient.invalidateQueries({queryKey:["connect-supplier-settings",vendor.id]}),
      queryClient.invalidateQueries({queryKey:["connect-distribution-groups",vendor.id]}),
      queryClient.invalidateQueries({queryKey:["connect-products"]}),
    ]);
  }
  async function importCsv(file: File) {
    if (file.size > 5 * 1024 * 1024) return toast.error("Choose a CSV file smaller than 5 MB.");
    const rows = parseCsv(await file.text());
    if (!rows.length) return toast.error("The CSV is empty or has no product rows.");
    const valid = rows.map((row: any) => ({
      vendor_id: vendor.id,
      sku: String(row.sku ?? "").trim(),
      title: String(row.title ?? row.product_name ?? "").trim(),
      category: String(row.category ?? "General").trim() || "General",
      description: String(row.description ?? "").trim(),
      image_url: String(row.image_url ?? "").trim(),
      wholesale_price: Number(row.wholesale_price),
      suggested_retail_price: Math.max(0, Number(row.suggested_retail_price) || 0),
      stock_quantity: Number(row.stock_quantity ?? 0),
      min_order_quantity: Number(row.min_order_quantity ?? 1),
      unit: String(row.unit ?? "piece").trim() || "piece",
    }));
    const invalid = valid.find((row) => row.title.length < 2 || !Number.isFinite(row.wholesale_price) || row.wholesale_price < 0 || !Number.isInteger(row.stock_quantity) || row.stock_quantity < 0 || !Number.isInteger(row.min_order_quantity) || row.min_order_quantity < 1);
    if (invalid) return toast.error("One or more rows have invalid product names, prices, stock or minimum order quantities.");
    setSaving(true);
    let inserted = 0;
    for (let i = 0; i < valid.length; i += 100) {
      const { error } = await db.from("connect_products").insert(valid.slice(i, i + 100));
      if (error) {
        setSaving(false);
        await refresh();
        return toast.error(`Import stopped after ${inserted} rows: ${error.message}`);
      }
      inserted += valid.slice(i, i + 100).length;
    }
    setSaving(false);
    toast.success(`${inserted} products imported.`);
    await refresh();
  }
  function exportCsv() {
    const headers = ["sku","title","category","description","wholesale_price","suggested_retail_price","stock_quantity","min_order_quantity","unit","is_seasonal","distribution_enabled"];
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"','""')}"`;
    const lines = [headers.join(","), ...products.map((product) => headers.map((key) => escape((product as any)[key])).join(","))];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${vendor.business_name.toLowerCase().replace(/[^a-z0-9]+/g,"-")}-catalogue.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function createProduct(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const wholesale=Number(productDraft.wholesale_price);const stock=Number(productDraft.stock_quantity);const minimum=Number(productDraft.min_order_quantity);
    if(productDraft.title.trim().length<2||!Number.isFinite(wholesale)||wholesale<0||!Number.isInteger(stock)||stock<0||!Number.isInteger(minimum)||minimum<1)return toast.error("Check the product name, price, stock and minimum order.");
    setSaving(true);const {error}=await db.from("connect_products").insert({vendor_id:vendor.id,title:productDraft.title.trim(),category:productDraft.category,description:productDraft.description.trim(),image_url:productDraft.image_url.trim(),wholesale_price:wholesale,suggested_retail_price:Math.max(0,Number(productDraft.suggested_retail_price)||0),stock_quantity:stock,min_order_quantity:minimum,unit:productDraft.unit.trim()||"piece"});setSaving(false);if(error)return toast.error(error.message);toast.success("Product added to your catalogue.");setProductDraft({title:"",category:"General",description:"",image_url:"",wholesale_price:"",suggested_retail_price:"",stock_quantity:"0",min_order_quantity:"1",unit:"piece"});setProductCreateOpen(false);await refresh();
  }
  async function updateProduct(id:string,patch:Record<string,unknown>) {
    const {error}=await db.from("connect_products").update(patch).eq("id",id).eq("vendor_id",vendor.id);
    if(error)return toast.error(error.message);
    toast.success("Product updated. Connected retailers will receive the applicable sync.");
    await refresh();
  }
  async function bulkUpdate(patch:Record<string,unknown>) {
    if(!selected.length)return toast.error("Select at least one product.");
    setSaving(true);
    const {error}=await db.from("connect_products").update(patch).in("id",selected).eq("vendor_id",vendor.id);
    setSaving(false);
    if(error)return toast.error(error.message);
    toast.success(`${selected.length} products updated.`);setSelected([]);await refresh();
  }
  async function generateCode() {
    if(codeScope==="selected"&&!selected.length)return toast.error("Select the products to include first.");
    if(codeScope==="group"&&!codeGroupId)return toast.error("Choose a product collection.");
    setSaving(true);
    const code=makeCode();
    const codeHash=await hashCode(code);
    const {data,error}=await db.from("connect_distribution_codes").insert({
      vendor_id:vendor.id,code_hash:codeHash,label:codeLabel.trim()||"Product access",
      include_all_products:codeScope==="all",group_id:codeScope==="group"?codeGroupId:null,require_approval:codeApproval,
      max_redemptions:codeLimit?Number(codeLimit):null,expires_at:codeExpiry?new Date(codeExpiry).toISOString():null,
    }).select("id").single();
    if(error){setSaving(false);return toast.error(error.message);}
    if(codeScope==="selected"){
      const rows=selected.map(product_id=>({code_id:data.id,product_id}));
      const {error:linkError}=await db.from("connect_distribution_code_products").insert(rows);
      if(linkError){await db.from("connect_distribution_codes").delete().eq("id",data.id);setSaving(false);return toast.error(linkError.message);}
    }
    setSaving(false);setNewCode(code);setNewLink(`${window.location.origin}/connect?code=${encodeURIComponent(code)}`);setCodeOpen(false);setSelected([]);
    await refresh();
  }
  async function makeGroup() {
    if(!groupName.trim()||!selected.length)return toast.error("Enter a collection name and select products.");
    setSaving(true);
    const {data,error}=await db.from("connect_distribution_groups").insert({vendor_id:vendor.id,name:groupName.trim()}).select("id").single();
    if(error){setSaving(false);return toast.error(error.message);}
    const {error:linkError}=await db.from("connect_distribution_group_products").insert(selected.map(product_id=>({group_id:data.id,product_id})));
    setSaving(false);
    if(linkError){await db.from("connect_distribution_groups").delete().eq("id",data.id);return toast.error(linkError.message);}
    setGroupName("");setGroupOpen(false);setSelected([]);toast.success("Product collection created.");await refresh();
  }
  async function reviewConnection(id:string,approve:boolean) {
    const {error}=await db.rpc("review_connect_supplier_request",{p_connection_id:id,p_approve:approve});
    if(error)return toast.error(error.message);
    toast.success(approve?"Retailer approved and eligible products shared.":"Connection request declined.");
    await refresh();
  }
  async function saveSettings(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setSaving(true);
    const payload={vendor_id:vendor.id,...settings,business_status:businessStatus,updated_at:new Date().toISOString()};
    const {error}=await db.from("connect_supplier_settings").upsert(payload,{onConflict:"vendor_id"});
    setSaving(false);if(error)return toast.error(error.message);
    toast.success("Supplier preferences saved.");await refresh();
  }
  async function markRead(id:string) {
    const {error}=await db.from("connect_notifications").update({is_read:true}).eq("id",id).eq("recipient_user_id",userId);
    if(error)return toast.error(error.message);await refresh();
  }
  const nav: {id:Panel;label:string;icon:any}[]=[
    {id:"overview",label:"Overview",icon:Activity},{id:"products",label:"Products",icon:Package},
    {id:"distribution",label:"Distribution",icon:Share2},{id:"connections",label:"Retailers",icon:Users},
    {id:"notifications",label:"Updates",icon:Bell},{id:"settings",label:"Settings",icon:Settings2},
  ];
  const settingsValue=settings??settingsQuery.data??{};
  const unread=(noticesQuery.data??[]).filter((n:any)=>!n.is_read).length;

  return <AppShell title="Supplier workspace">
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-foreground text-background">
            {vendor.logo_url?<img src={vendor.logo_url} alt="" className="size-full object-cover"/>:<Store className="size-5"/>}
          </div>
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h1 className="truncate font-display text-2xl font-bold tracking-tight">{vendor.business_name}</h1><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${vendor.is_published?"bg-emerald-500/10 text-emerald-700":"bg-amber-500/10 text-amber-700"}`}>{vendor.is_published?"PUBLIC PROFILE LIVE":"PROFILE DRAFT"}</span></div><p className="mt-1 text-xs text-muted-foreground">{[vendor.category,vendor.city,vendor.state].filter(Boolean).join(" · ")} · Supplier workspace</p></div>
        </div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" className="rounded-xl" onClick={onBrowseMarketplace}><Store className="mr-2 size-4"/>Browse suppliers</Button><Button className="rounded-xl" onClick={()=>setProductCreateOpen(true)}><Plus className="mr-2 size-4"/>Add product</Button></div>
      </header>

      <div className="flex gap-1 overflow-x-auto border-b border-border pb-2">
        {nav.map(item=><button key={item.id} onClick={()=>setPanel(item.id)} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${panel===item.id?"bg-foreground text-background":"text-muted-foreground hover:bg-secondary hover:text-foreground"}`}><item.icon className="size-4"/>{item.label}{item.id==="notifications"&&unread>0?<span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white">{unread}</span>:null}</button>)}
      </div>

      {panel==="overview"&&<div className="space-y-6">
        <SectionTitle eyebrow="Your business at a glance" title="Supplier overview" description="A live view of your catalogue, retailer network and product availability." action={<Button variant="outline" className="rounded-xl" onClick={()=>void refresh()}><RefreshCw className="mr-2 size-4"/>Refresh</Button>}/>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Catalogue products" value={products.length} hint={`${products.filter(p=>p.is_active).length} active listings`} icon={Package}/>
          <Stat label="Connected retailers" value={activeConnections} hint={pendingConnections? `${pendingConnections} awaiting approval`:"Active supplier relationships"} icon={Users}/>
          <Stat label="Low stock" value={lowStock} hint={`${outStock} currently out of stock`} icon={AlertTriangle}/>
          <Stat label="Distribution codes" value={(codesQuery.data??[]).filter((c:any)=>c.is_active).length} hint="Active share codes" icon={Share2}/>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
          <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-bold">Inventory health</h3><p className="text-xs text-muted-foreground">Stock status across your active catalogue</p></div><Button variant="ghost" size="sm" onClick={()=>setPanel("products")}>Manage <ChevronRight className="ml-1 size-4"/></Button></div>
            <div className="mt-5 space-y-4">{[{label:"Available",count:products.filter(p=>p.availability_status==="available").length,color:"bg-emerald-500"},{label:"Low stock",count:lowStock,color:"bg-amber-500"},{label:"Out of stock",count:outStock,color:"bg-red-500"},{label:"Seasonal / hidden",count:products.filter(p=>["seasonal_paused","hidden"].includes(p.availability_status)).length,color:"bg-violet-500"}].map(row=><div key={row.label}><div className="mb-1.5 flex justify-between text-xs"><span className="text-muted-foreground">{row.label}</span><strong>{row.count}</strong></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className={`h-full rounded-full ${row.color}`} style={{width:`${products.length?row.count/products.length*100:0}%`}}/></div></div>)}</div>
          </section>
          <section className="rounded-2xl border border-border bg-card p-5"><h3 className="font-display text-lg font-bold">Needs attention</h3><div className="mt-4 space-y-3">{pendingConnections>0&&<button onClick={()=>setPanel("connections")} className="flex w-full items-center gap-3 rounded-xl bg-amber-500/10 p-3 text-left"><Users className="size-4 text-amber-700"/><span className="flex-1 text-sm">{pendingConnections} retailer requests to review</span><ChevronRight className="size-4"/></button>}{outStock>0&&<button onClick={()=>setPanel("products")} className="flex w-full items-center gap-3 rounded-xl bg-red-500/10 p-3 text-left"><Package className="size-4 text-red-600"/><span className="flex-1 text-sm">{outStock} products out of stock</span><ChevronRight className="size-4"/></button>}{lowStock>0&&<button onClick={()=>setPanel("products")} className="flex w-full items-center gap-3 rounded-xl bg-amber-500/10 p-3 text-left"><AlertTriangle className="size-4 text-amber-700"/><span className="flex-1 text-sm">{lowStock} products running low</span><ChevronRight className="size-4"/></button>}{!pendingConnections&&!outStock&&!lowStock&&<p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">Everything looks clear. We'll surface important stock and retailer updates here.</p>}</div></section>
        </div>
        <section className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><div><h3 className="font-display text-lg font-bold">Recent product activity</h3><p className="text-xs text-muted-foreground">Supplier changes recorded for your catalogue</p></div><Activity className="size-5 text-muted-foreground"/></div>{(eventsQuery.data??[]).length?<div className="mt-3 divide-y divide-border">{(eventsQuery.data??[]).map((e:any)=><div key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="min-w-0 truncate">{e.product?.title??"Product"} · {e.event_type.replaceAll("_"," ")}</span><span className="shrink-0 text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString()}</span></div>)}</div>:<p className="mt-4 text-sm text-muted-foreground">Product updates will appear here as your catalogue changes.</p>}</section>
      </div>}

      {panel==="products"&&<div className="space-y-5">
        <SectionTitle eyebrow="Catalogue control" title="Your products" description="Update inventory, control distribution and manage seasonal availability. Stock and availability changes are synchronized to connected retailers." action={<Button className="rounded-xl" onClick={()=>setProductCreateOpen(true)}><Plus className="mr-2 size-4"/>Add product</Button>}/>
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-3 sm:flex-row sm:flex-wrap"><Input value={productSearch} onChange={e=>setProductSearch(e.target.value)} placeholder="Search your products or SKU" className="h-10 min-w-48 flex-1 rounded-xl"/><label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-3 text-sm font-medium"><Upload className="size-4"/>Import CSV<input type="file" accept=".csv,text/csv" className="sr-only" onChange={e=>{const file=e.target.files?.[0];if(file)void importCsv(file);e.target.value="";}}/></label><Button type="button" variant="outline" className="rounded-xl" onClick={exportCsv}><Download className="mr-2 size-4"/>Export CSV</Button><Button variant="outline" className="rounded-xl" disabled={!selected.length} onClick={()=>void bulkUpdate({distribution_enabled:false})}>Pause distribution ({selected.length})</Button><Button variant="outline" className="rounded-xl" disabled={!selected.length} onClick={()=>void bulkUpdate({distribution_enabled:true,is_active:true})}>Enable ({selected.length})</Button><Button variant="outline" className="rounded-xl" disabled={!selected.length} onClick={()=>setCodeOpen(true)}><Share2 className="mr-2 size-4"/>Create code</Button><Button variant="outline" className="rounded-xl" disabled={!selected.length} onClick={()=>setGroupOpen(true)}>Save collection</Button></div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card"><div className="hidden grid-cols-[36px_minmax(0,1fr)_120px_120px_125px_130px] gap-3 border-b border-border bg-secondary/50 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid"><span><input type="checkbox" aria-label="Select all products" checked={filteredProducts.length>0&&selected.length===filteredProducts.length} onChange={e=>setSelected(e.target.checked?filteredProducts.map(p=>p.id):[])}/></span><span>Product</span><span>Wholesale</span><span>Stock</span><span>Availability</span><span>Controls</span></div>
          {filteredProducts.map(p=><div key={p.id} className="grid gap-3 border-b border-border p-4 last:border-0 sm:grid-cols-[36px_minmax(0,1fr)_120px_120px_125px_130px] sm:items-center"><div className="flex items-center gap-3 sm:block"><input type="checkbox" aria-label={`Select ${p.title}`} checked={selected.includes(p.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,p.id]:old.filter(id=>id!==p.id))}/><div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary sm:hidden">{p.image_url?<img src={p.image_url} alt="" className="size-full object-cover"/>:<Package className="size-5 text-muted-foreground"/>}</div><div className="min-w-0 flex-1 sm:hidden"><p className="truncate text-sm font-semibold">{p.title}</p><p className="text-xs text-muted-foreground">{p.category}</p></div></div><div className="hidden min-w-0 items-center gap-3 sm:flex"><div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary">{p.image_url?<img src={p.image_url} alt="" className="size-full object-cover"/>:<Package className="size-5 text-muted-foreground"/>}</div><div className="min-w-0"><p className="truncate text-sm font-semibold">{p.title}</p><p className="truncate text-xs text-muted-foreground">{p.sku||p.category} · MOQ {p.min_order_quantity}</p></div></div>
            <div className="grid grid-cols-2 gap-2 sm:block"><label className="text-[10px] text-muted-foreground sm:hidden">Wholesale price</label><Input aria-label={`Wholesale price for ${p.title}`} type="number" min="0" defaultValue={p.wholesale_price} className="h-9 rounded-lg" onBlur={e=>{if(Number(e.target.value)!==Number(p.wholesale_price))void updateProduct(p.id,{wholesale_price:Number(e.target.value)})}}/></div>
            <div className="grid grid-cols-2 gap-2 sm:block"><label className="text-[10px] text-muted-foreground sm:hidden">Stock quantity</label><Input aria-label={`Stock for ${p.title}`} type="number" min="0" defaultValue={p.stock_quantity} className="h-9 rounded-lg" onBlur={e=>{if(Number(e.target.value)!==p.stock_quantity)void updateProduct(p.id,{stock_quantity:Math.max(0,Math.floor(Number(e.target.value)||0))})}}/></div>
            <div><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${statusTone[p.availability_status]??"bg-secondary"}`}>{statusLabel[p.availability_status]??p.availability_status}</span><div className="mt-1 text-[10px] text-muted-foreground">{p.is_seasonal?"Seasonal":"Standard"} · {p.distribution_enabled?"Shared":"Private"}</div>{p.is_seasonal&&<div className="mt-2 grid grid-cols-2 gap-1"><Input aria-label="Season starts" type="date" defaultValue={p.season_start??""} className="h-8 px-1 text-[10px]" onBlur={e=>void updateProduct(p.id,{season_start:e.target.value||null})}/><Input aria-label="Season ends" type="date" defaultValue={p.season_end??""} className="h-8 px-1 text-[10px]" onBlur={e=>void updateProduct(p.id,{season_end:e.target.value||null})}/></div>}</div>
            <div className="flex flex-wrap gap-1"><Button size="sm" variant="outline" className="h-8 rounded-lg px-2 text-xs" onClick={()=>void updateProduct(p.id,{distribution_enabled:!p.distribution_enabled})}>{p.distribution_enabled?"Pause":"Share"}</Button><Button size="sm" variant="outline" className="h-8 rounded-lg px-2 text-xs" onClick={()=>void updateProduct(p.id,{is_seasonal:!p.is_seasonal})}>{p.is_seasonal?"Seasonal ✓":"Seasonal"}</Button></div>
          </div>)}
          {!filteredProducts.length&&<p className="p-8 text-center text-sm text-muted-foreground">No products match your search. Add your first product to start building your catalogue.</p>}
        </div>
        <p className="text-xs text-muted-foreground">Price and stock fields save when you leave the field. Retailer selling prices are never overwritten by supplier updates.</p>
      </div>}

      {panel==="distribution"&&<div className="space-y-5">
        <SectionTitle eyebrow="Product access" title="Distribution centre" description="Create private product access codes. Choose selected products or your entire eligible catalogue, set approval rules, expiry and redemption limits." action={<Button className="rounded-xl" onClick={()=>setCodeOpen(true)}><Plus className="mr-2 size-4"/>Generate code</Button>}/>
        <div className="grid gap-3 md:grid-cols-2"><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><Link2 className="size-5"/><h3 className="font-semibold">Share a product collection</h3></div><p className="mt-2 text-sm text-muted-foreground">Select products in the Products tab, then generate a code. Retailers redeem it from their STRAP Connect marketplace.</p><Button variant="outline" className="mt-4 rounded-xl" onClick={()=>setPanel("products")}>Select products <ChevronRight className="ml-2 size-4"/></Button></div><div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-5"/><h3 className="font-semibold">Control who gets access</h3></div><p className="mt-2 text-sm text-muted-foreground">Require manual approval, set an expiry date and cap redemptions. You can deactivate a code at any time.</p><p className="mt-3 text-xs text-muted-foreground">Codes are stored as hashes. The full code is shown only once when generated.</p></div></div>
        <div className="rounded-2xl border border-border bg-card"><div className="border-b border-border p-4"><h3 className="font-display text-lg font-bold">Your distribution codes</h3></div>{(codesQuery.data??[]).length?(codesQuery.data??[]).map((c:any)=><div key={c.id} className="flex flex-col gap-3 border-b border-border p-4 last:border-0 sm:flex-row sm:items-center"><div className="grid size-10 place-items-center rounded-xl bg-secondary"><Share2 className="size-4"/></div><div className="min-w-0 flex-1"><p className="font-semibold">{c.label}</p><p className="mt-1 text-xs text-muted-foreground">{c.include_all_products?"Entire eligible catalogue":"Selected products"} · {c.redemption_count}{c.max_redemptions? ` / ${c.max_redemptions}`:""} redemptions{c.require_approval?" · Approval required":""}{c.expires_at? ` · Expires ${new Date(c.expires_at).toLocaleDateString()}`:""}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${c.is_active?"bg-emerald-500/10 text-emerald-700":"bg-secondary text-muted-foreground"}`}>{c.is_active?"Active":"Disabled"}</span><Button size="sm" variant="outline" className="rounded-lg" onClick={async()=>{const {error}=await db.from("connect_distribution_codes").update({is_active:!c.is_active}).eq("id",c.id).eq("vendor_id",vendor.id);if(error)toast.error(error.message);else{toast.success(c.is_active?"Code disabled":"Code reactivated");await refresh();}}}>{c.is_active?"Deactivate":"Activate"}</Button></div>):<p className="p-8 text-center text-sm text-muted-foreground">No codes yet. Select products and generate your first distribution code.</p>}</div>
        <div className="rounded-2xl border border-border bg-card p-4"><div className="flex items-center justify-between gap-3"><div><h3 className="font-semibold">Product collections</h3><p className="text-xs text-muted-foreground">Reusable groups of products for targeted sharing</p></div><Button size="sm" variant="outline" className="rounded-lg" onClick={()=>setPanel("products")}>Create from selection</Button></div>{(groupsQuery.data??[]).map((g:any)=><div key={g.id} className="mt-3 flex items-center justify-between border-t border-border pt-3 text-sm"><span>{g.name}</span><span className="text-xs text-muted-foreground">{g.products?.length??0} products</span></div>)}</div>
      </div>}

      {panel==="connections"&&<div className="space-y-5">
        <SectionTitle eyebrow="Business network" title="Retailer connections" description="Review access requests and see retailers who have connected to your catalogue."/>
        <div className="grid gap-3 sm:grid-cols-3"><Stat label="Total connections" value={connections.length} hint="All relationship records" icon={Users}/><Stat label="Active retailers" value={activeConnections} hint="Can access shared products" icon={CheckCircle2}/><Stat label="Awaiting approval" value={pendingConnections} hint="Require your review" icon={Clock3}/></div>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">{connections.length?connections.map((c:any)=><div key={c.id} className="flex flex-col gap-3 border-b border-border p-4 last:border-0 sm:flex-row sm:items-center"><div className="grid size-10 place-items-center rounded-full bg-secondary"><Users className="size-4"/></div><div className="min-w-0 flex-1"><p className="font-semibold">Retailer · {c.retailer_user_id.slice(0,8)}…</p><p className="text-xs text-muted-foreground">Connected {new Date(c.connected_at).toLocaleDateString()} · via {c.source}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${c.status==="active"?"bg-emerald-500/10 text-emerald-700":c.status==="pending"?"bg-amber-500/10 text-amber-700":"bg-secondary text-muted-foreground"}`}>{c.status}</span>{c.status==="pending"&&<div className="flex gap-2"><Button size="sm" className="rounded-lg" onClick={()=>void reviewConnection(c.id,true)}><Check className="mr-1 size-3"/>Approve</Button><Button size="sm" variant="outline" className="rounded-lg" onClick={()=>void reviewConnection(c.id,false)}><X className="mr-1 size-3"/>Decline</Button></div>}</div>):<p className="p-8 text-center text-sm text-muted-foreground">Retailers who redeem your codes will appear here.</p>}</div>
      </div>}

      {panel==="notifications"&&<div className="space-y-5">
        <SectionTitle eyebrow="Business updates" title="Notifications" description="Stock, price, availability and connection events for your supplier business."/>
        <div className="rounded-2xl border border-border bg-card">{(noticesQuery.data??[]).length?(noticesQuery.data??[]).map((n:any)=><div key={n.id} className={`flex gap-3 border-b border-border p-4 last:border-0 ${n.is_read?"":"bg-secondary/40"}`}><div className="grid size-9 shrink-0 place-items-center rounded-xl bg-secondary"><Bell className="size-4"/></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{n.title}</p><p className="mt-1 text-sm text-muted-foreground">{n.message}</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p></div>{!n.is_read&&<Button size="sm" variant="ghost" className="shrink-0" onClick={()=>void markRead(n.id)}>Mark read</Button>}</div>):<p className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</p>}</div>
      </div>}

      {panel==="settings"&&<div className="space-y-5">
        <SectionTitle eyebrow="Business preferences" title="Supplier settings" description="Set default sync behavior, retailer approvals and the operating information retailers see."/>
        <form onSubmit={saveSettings} className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5"><h3 className="font-display text-lg font-bold">Distribution & synchronization</h3>{[
            ["require_connection_approval","Approve retailers before they access products"],
            ["default_sync_stock","Synchronize stock quantity automatically"],
            ["default_sync_wholesale_price","Synchronize wholesale price automatically"],
            ["default_sync_availability","Synchronize availability and seasonal status"],
            ["default_sync_product_details","Synchronize product details automatically"],
            ["notify_low_stock","Notify connected retailers about low stock"],
            ["notify_restock","Notify connected retailers when restocked"],
            ["notify_price_changes","Notify connected retailers about price changes"],
          ].map(([key,label])=><label key={key} className="flex items-center justify-between gap-4 border-b border-border py-2 last:border-0"><span className="text-sm">{label}</span><input type="checkbox" checked={Boolean(settingsValue[key])} onChange={e=>setSettings((old:any)=>({...settingsValue,[key]:e.target.checked}))}/></label>)}</div>
          <div className="space-y-4 rounded-2xl border border-border bg-card p-5"><h3 className="font-display text-lg font-bold">Business operations</h3><label className="block space-y-1.5 text-sm"><span className="font-medium">Business status</span><select className="h-10 w-full rounded-xl border border-input bg-background px-3" value={settingsValue.business_status??businessStatus} onChange={e=>{setBusinessStatus(e.target.value);setSettings((old:any)=>({...settingsValue,business_status:e.target.value}));}}><option value="open">Open for business</option><option value="paused">Temporarily paused</option><option value="closed">Closed</option></select></label><label className="block space-y-1.5 text-sm"><span className="font-medium">Typical dispatch estimate</span><Input value={settingsValue.dispatch_estimate??""} onChange={e=>setSettings((old:any)=>({...settingsValue,dispatch_estimate:e.target.value}))} placeholder="e.g. 1–3 business days"/></label><label className="block space-y-1.5 text-sm"><span className="font-medium">Minimum order information</span><textarea rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-sm" value={settingsValue.minimum_order_notes??""} onChange={e=>setSettings((old:any)=>({...settingsValue,minimum_order_notes:e.target.value}))} placeholder="Explain your minimum order requirements"/></label><label className="block space-y-1.5 text-sm"><span className="font-medium">Returns & service policy</span><textarea rows={3} className="w-full rounded-xl border border-input bg-background p-3 text-sm" value={settingsValue.return_policy??""} onChange={e=>setSettings((old:any)=>({...settingsValue,return_policy:e.target.value}))} placeholder="Share your returns and support terms"/></label><Button type="submit" disabled={saving} className="w-full rounded-xl">{saving?"Saving…":"Save supplier settings"}</Button></div>
        </form>
      </div>}
    </div>

    {codeOpen&&<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"><form onSubmit={e=>{e.preventDefault();void generateCode();}} className="w-full max-w-lg space-y-4 rounded-2xl border border-border bg-card p-5 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Distribution access</p><h3 className="mt-1 font-display text-xl font-bold">Generate supplier code</h3></div><Button type="button" size="icon" variant="ghost" onClick={()=>setCodeOpen(false)}><X className="size-4"/></Button></div><label className="block space-y-1.5 text-sm"><span className="font-medium">Code name</span><Input value={codeLabel} onChange={e=>setCodeLabel(e.target.value)} maxLength={80} className="rounded-xl"/></label><fieldset className="space-y-2"><legend className="text-sm font-medium">Products to share</legend><label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm"><input type="radio" checked={codeScope==="selected"} onChange={()=>setCodeScope("selected")}/> Selected products ({selected.length})</label><label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm"><input type="radio" checked={codeScope==="all"} onChange={()=>setCodeScope("all")}/> Entire eligible catalogue</label><label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm"><input type="radio" checked={codeScope==="group"} onChange={()=>setCodeScope("group")}/> Saved collection</label>{codeScope==="group"&&<select className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={codeGroupId} onChange={e=>setCodeGroupId(e.target.value)}><option value="">Choose a collection</option>{(groupsQuery.data??[]).map((g:any)=><option key={g.id} value={g.id}>{g.name}</option>)}</select>}</fieldset><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={codeApproval} onChange={e=>setCodeApproval(e.target.checked)}/> Require my approval for each retailer</label><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1.5 text-sm"><span>Maximum redemptions</span><Input type="number" min="1" value={codeLimit} onChange={e=>setCodeLimit(e.target.value)} placeholder="Unlimited"/></label><label className="space-y-1.5 text-sm"><span>Expiry date</span><Input type="date" value={codeExpiry} onChange={e=>setCodeExpiry(e.target.value)}/></label></div><p className="text-xs text-muted-foreground">The generated code grants access only to eligible products. You can disable it later. Codes are shown once and stored as a hash.</p><div className="flex justify-end gap-2"><Button type="button" variant="outline" className="rounded-xl" onClick={()=>setCodeOpen(false)}>Cancel</Button><Button type="submit" disabled={saving} className="rounded-xl">{saving?"Generating…":"Generate code"}</Button></div></form></div>}
    {groupOpen&&<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3"><form onSubmit={e=>{e.preventDefault();void makeGroup();}} className="w-full max-w-md space-y-3 rounded-2xl bg-card p-5"><h3 className="font-display text-xl font-bold">Save product collection</h3><Input value={groupName} onChange={e=>setGroupName(e.target.value)} placeholder="e.g. Summer collection"/><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setGroupOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>Save collection</Button></div></form></div>}
    {productCreateOpen&&<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm"><form onSubmit={createProduct} className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-2xl"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Catalogue</p><h3 className="font-display text-xl font-bold">Add a product</h3></div><Button type="button" size="icon" variant="ghost" onClick={()=>setProductCreateOpen(false)}><X className="size-4"/></Button></div><div className="grid gap-3 sm:grid-cols-2"><label className="space-y-1 text-sm"><span>Product name</span><Input required minLength={2} maxLength={160} value={productDraft.title} onChange={e=>setProductDraft({...productDraft,title:e.target.value})}/></label><label className="space-y-1 text-sm"><span>Category</span><Input value={productDraft.category} onChange={e=>setProductDraft({...productDraft,category:e.target.value})}/></label><label className="space-y-1 text-sm"><span>Wholesale price (₦)</span><Input required type="number" min="0" step="0.01" value={productDraft.wholesale_price} onChange={e=>setProductDraft({...productDraft,wholesale_price:e.target.value})}/></label><label className="space-y-1 text-sm"><span>Suggested retail price (₦)</span><Input type="number" min="0" step="0.01" value={productDraft.suggested_retail_price} onChange={e=>setProductDraft({...productDraft,suggested_retail_price:e.target.value})}/></label><label className="space-y-1 text-sm"><span>Stock quantity</span><Input type="number" min="0" step="1" value={productDraft.stock_quantity} onChange={e=>setProductDraft({...productDraft,stock_quantity:e.target.value})}/></label><label className="space-y-1 text-sm"><span>Minimum order quantity</span><Input type="number" min="1" step="1" value={productDraft.min_order_quantity} onChange={e=>setProductDraft({...productDraft,min_order_quantity:e.target.value})}/></label><label className="space-y-1 text-sm"><span>Unit</span><Input value={productDraft.unit} onChange={e=>setProductDraft({...productDraft,unit:e.target.value})}/></label><label className="space-y-1 text-sm"><span>Image URL (optional)</span><Input value={productDraft.image_url} onChange={e=>setProductDraft({...productDraft,image_url:e.target.value})} placeholder="https://…"/></label></div><label className="block space-y-1 text-sm"><span>Product details</span><textarea rows={3} maxLength={2000} className="w-full rounded-xl border border-input bg-background p-3" value={productDraft.description} onChange={e=>setProductDraft({...productDraft,description:e.target.value})}/></label><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>setProductCreateOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving?"Saving…":"Add product"}</Button></div></form></div>}
    {newCode&&<div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-3"><div className="w-full max-w-md space-y-4 rounded-2xl bg-card p-6 text-center shadow-2xl"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/10"><CheckCircle2 className="size-6 text-emerald-600"/></div><h3 className="font-display text-xl font-bold">Your supplier code is ready</h3><p className="text-sm text-muted-foreground">Copy and share this code with dropshippers. It will not be displayed again after you close this window.</p><div className="rounded-xl border border-dashed border-border bg-secondary p-4 font-mono text-lg font-bold tracking-wider">{newCode}</div><div className="flex flex-wrap gap-2"><Button className="flex-1 rounded-xl" onClick={()=>{void navigator.clipboard.writeText(newCode);toast.success("Code copied.");}}><Copy className="mr-2 size-4"/>Copy code</Button><Button variant="outline" className="flex-1 rounded-xl" onClick={()=>{void navigator.clipboard.writeText(newLink);toast.success("Share link copied.");}}><Link2 className="mr-2 size-4"/>Copy link</Button><Button variant="ghost" className="rounded-xl" onClick={()=>setNewCode("")}>Done</Button></div></div></div>}
  </AppShell>;
}
