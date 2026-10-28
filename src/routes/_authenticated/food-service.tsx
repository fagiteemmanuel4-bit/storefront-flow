import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChefHat, ClipboardList, Plus, Trash2, Utensils, CookingPot } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchProductsWithStock } from "@/routes/_authenticated/products";
import { formatMoney } from "@/lib/currency";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/food-service")({ component: FoodServicePage });
type Tab = "kitchen" | "recipes" | "waste";
type Product = { id: string; name: string; price: number; cost: number | null; quantity: number };
type Modifier = { id: string; product_id: string; name: string; options: Array<{label:string;price_delta:number}>; is_required: boolean; is_active: boolean };
type Recipe = { id: string; menu_product_id: string; ingredient_product_id: string; quantity_per_serving: number };
type Ticket = { id: string; ticket_number: string; status: string; notes: string; created_at: string; sale_id: string };
type TicketItem = { ticket_id: string; product_name: string; quantity: number; modifiers: Array<{name?:string;option_label?:string;label?:string}>; order_notes: string };
type Waste = { id: string; ingredient_product_id: string; quantity: number; reason: string; created_at: string };

function FoodServicePage() {
  const { store, branch, role } = useStoreContext();
  const client = useQueryClient();
  const db = supabase as any;
  const storeId = store?.id ?? null;
  const branchId = branch?.id ?? null;
  const currency = store?.currency ?? "NGN";
  const canManage = role === "owner" || role === "manager";
  const [tab, setTab] = useState<Tab>("kitchen");
  const [menuProductId, setMenuProductId] = useState("");
  const [modifierName, setModifierName] = useState("");
  const [modifierOptions, setModifierOptions] = useState("");
  const [modifierRequired, setModifierRequired] = useState(false);
  const [recipeMenuId, setRecipeMenuId] = useState("");
  const [ingredientId, setIngredientId] = useState("");
  const [ingredientQty, setIngredientQty] = useState("1");
  const [wasteIngredientId, setWasteIngredientId] = useState("");
  const [wasteQty, setWasteQty] = useState("1");
  const [wasteReason, setWasteReason] = useState("");
  const [saving, setSaving] = useState(false);

  const productsQuery = useQuery({ queryKey:["products",storeId,branchId], enabled:Boolean(storeId&&branchId), queryFn:()=>fetchProductsWithStock(storeId!,branchId!) });
  const modifiersQuery = useQuery({ queryKey:["food-menu-modifiers",storeId], enabled:Boolean(storeId), queryFn:async()=>{const {data,error}=await db.from("food_menu_modifiers").select("id,product_id,name,options,is_required,is_active").eq("store_id",storeId!).order("sort_order").order("name");if(error)throw new Error(error.message);return(data??[]) as Modifier[];} });
  const recipesQuery = useQuery({ queryKey:["food-recipes",storeId,branchId], enabled:Boolean(storeId&&branchId), queryFn:async()=>{const {data,error}=await db.from("food_recipe_ingredients").select("id,menu_product_id,ingredient_product_id,quantity_per_serving").eq("store_id",storeId!).eq("branch_id",branchId!).order("menu_product_id");if(error)throw new Error(error.message);return(data??[]) as Recipe[];} });
  const ticketsQuery = useQuery({ queryKey:["food-kitchen-tickets",storeId,branchId], enabled:Boolean(storeId&&branchId), queryFn:async()=>{const {data,error}=await db.from("food_kitchen_tickets").select("id,ticket_number,status,notes,created_at,sale_id").eq("store_id",storeId!).eq("branch_id",branchId!).neq("status","served").neq("status","cancelled").order("created_at");if(error)throw new Error(error.message);return(data??[]) as Ticket[];} });
  const tickets = ticketsQuery.data ?? [];
  const ticketItemsQuery = useQuery({ queryKey:["food-kitchen-ticket-items",tickets.map(t=>t.id).join(",")], enabled:tickets.length>0, queryFn:async()=>{const {data,error}=await db.from("food_kitchen_ticket_items").select("ticket_id,product_name,quantity,modifiers,order_notes").in("ticket_id",tickets.map(t=>t.id));if(error)throw new Error(error.message);return(data??[]) as TicketItem[];} });
  const wasteQuery = useQuery({ queryKey:["food-waste",storeId,branchId], enabled:Boolean(storeId&&branchId), queryFn:async()=>{const {data,error}=await db.from("food_waste_records").select("id,ingredient_product_id,quantity,reason,created_at").eq("store_id",storeId!).eq("branch_id",branchId!).order("created_at",{ascending:false}).limit(100);if(error)throw new Error(error.message);return(data??[]) as Waste[];} });
  const products = (productsQuery.data ?? []) as Product[];
  const modifiers = modifiersQuery.data ?? [];
  const recipes = recipesQuery.data ?? [];
  const waste = wasteQuery.data ?? [];
  const itemsByTicket = useMemo(()=>{const map=new Map<string,TicketItem[]>();for(const item of ticketItemsQuery.data??[])map.set(item.ticket_id,[...(map.get(item.ticket_id)??[]),item]);return map;},[ticketItemsQuery.data]);
  const recipeCosts = useMemo(()=>{const map=new Map<string,number>();for(const recipe of recipes){const ingredient=products.find(p=>p.id===recipe.ingredient_product_id);map.set(recipe.menu_product_id,(map.get(recipe.menu_product_id)??0)+Number(ingredient?.cost??0)*recipe.quantity_per_serving);}return map;},[recipes,products]);

  async function refresh() {
    await Promise.all([
      client.invalidateQueries({queryKey:["food-menu-modifiers",storeId]}),
      client.invalidateQueries({queryKey:["food-recipes",storeId,branchId]}),
      client.invalidateQueries({queryKey:["food-kitchen-tickets",storeId,branchId]}),
      client.invalidateQueries({queryKey:["food-kitchen-ticket-items"]}),
      client.invalidateQueries({queryKey:["food-waste",storeId,branchId]}),
      client.invalidateQueries({queryKey:["products",storeId,branchId]}),
    ]);
  }
  async function saveModifier(event:React.FormEvent) {
    event.preventDefault();
    if(!storeId||!menuProductId||!modifierName.trim())return toast.error("Choose a menu item and enter a modifier name.");
    const options=modifierOptions.split("\n").map(line=>line.trim()).filter(Boolean).map(line=>{const index=line.lastIndexOf(":");const label=(index<0?line:line.slice(0,index)).trim();const price=index<0?0:Number(line.slice(index+1).trim());return {label,price_delta:price};});
    if(!options.length||options.some(o=>!o.label||!Number.isFinite(o.price_delta)||o.price_delta<0))return toast.error("Enter options one per line as Option name:Price addition (for example Large:500).");
    if(new Set(options.map(o=>o.label.toLowerCase())).size!==options.length)return toast.error("Modifier option names must be unique.");
    setSaving(true);
    try{const {error}=await db.from("food_menu_modifiers").upsert({store_id:storeId,product_id:menuProductId,name:modifierName.trim(),options,is_required:modifierRequired,is_active:true},{onConflict:"store_id,product_id,name"});if(error)throw new Error(error.message);toast.success("Menu modifier saved.");setModifierName("");setModifierOptions("");setModifierRequired(false);await refresh();}
    catch(error){toast.error(errorMessage(error,"Modifier could not be saved."));}finally{setSaving(false);}
  }
  async function saveRecipe(event:React.FormEvent) {
    event.preventDefault();
    if(!storeId||!branchId||!recipeMenuId||!ingredientId)return toast.error("Choose the menu item and ingredient.");
    const quantity=Number(ingredientQty);
    if(!Number.isInteger(quantity)||quantity<1)return toast.error("Ingredient quantity must be a whole number of at least one.");
    setSaving(true);
    try{const {error}=await db.from("food_recipe_ingredients").upsert({store_id:storeId,branch_id:branchId,menu_product_id:recipeMenuId,ingredient_product_id:ingredientId,quantity_per_serving:quantity},{onConflict:"branch_id,menu_product_id,ingredient_product_id"});if(error)throw new Error(error.message);toast.success("Recipe ingredient saved.");setIngredientQty("1");await refresh();}
    catch(error){toast.error(errorMessage(error,"Recipe ingredient could not be saved."));}finally{setSaving(false);}
  }
  async function removeRow(table:string,id:string) {
    if(!canManage)return;
    const {error}=await db.from(table).delete().eq("id",id);
    if(error){toast.error(error.message);return;}
    toast.success("Removed.");
    await refresh();
  }
  async function updateTicket(ticket:Ticket,status:string) {
    const {error}=await db.from("food_kitchen_tickets").update({status,updated_at:new Date().toISOString()}).eq("id",ticket.id).eq("store_id",storeId);
    if(error){toast.error(error.message);return;}
    toast.success("Kitchen ticket updated.");
    await refresh();
  }
  async function recordWaste(event:React.FormEvent) {
    event.preventDefault();
    if(!storeId||!branchId||!wasteIngredientId)return toast.error("Choose an ingredient.");
    setSaving(true);
    try{const {error}=await db.rpc("record_food_waste",{_store_id:storeId,_branch_id:branchId,_ingredient_product_id:wasteIngredientId,_quantity:Number(wasteQty),_reason:wasteReason.trim()});if(error)throw new Error(error.message);toast.success("Waste recorded and stock reduced.");setWasteQty("1");setWasteReason("");await refresh();}
    catch(error){toast.error(errorMessage(error,"Waste could not be recorded."));}finally{setSaving(false);}
  }

  return <AppShell title="Food service">
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-label-caps text-muted-foreground">Food & restaurants</p><h1 className="mt-1 font-display text-2xl font-bold">Menu, kitchen & ingredients</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">Capture menu options and preparation notes, keep kitchen tickets moving, and reduce ingredient stock when meals sell or waste is recorded.</p></div><div className="flex flex-wrap gap-2">{([{id:"kitchen",label:"Kitchen",icon:<ChefHat className="size-4"/>},{id:"recipes",label:"Recipes & modifiers",icon:<CookingPot className="size-4"/>},{id:"waste",label:"Waste log",icon:<AlertTriangle className="size-4"/>}] as const).map(option=><button key={option.id} type="button" onClick={()=>setTab(option.id)} className={"flex min-h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold "+(tab===option.id?"border-foreground bg-foreground text-background":"border-border bg-surface hover:bg-secondary")}>{option.icon}{option.label}</button>)}</div></header>

      {tab==="kitchen" && <section className="overflow-hidden rounded-2xl border border-border bg-surface"><div className="flex items-center justify-between gap-3 border-b border-border p-4"><div><h2 className="font-display font-semibold">Kitchen order queue</h2><p className="mt-1 text-xs text-muted-foreground">New tickets are created automatically when food-service sales are completed.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{tickets.length} active</span></div>{ticketsQuery.isLoading?<div className="p-5 text-sm text-muted-foreground">Loading tickets…</div>:ticketsQuery.error?<div className="p-5 text-sm text-destructive">{errorMessage(ticketsQuery.error,"Kitchen queue could not be loaded.")}</div>:tickets.length===0?<div className="p-12 text-center"><ChefHat className="mx-auto size-9 text-muted-foreground"/><h3 className="mt-3 font-display font-semibold">Kitchen is clear</h3><p className="mt-1 text-sm text-muted-foreground">Completed food-service sales will appear here automatically.</p></div>:<div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-3">{tickets.map(ticket=><article key={ticket.id} className="rounded-2xl border border-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{ticket.ticket_number}</p><h3 className="mt-1 font-display text-lg font-bold">Kitchen ticket</h3><p className="mt-1 text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</p></div><span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold capitalize">{ticket.status}</span></div><div className="mt-4 space-y-3">{(itemsByTicket.get(ticket.id)??[]).map((item,index)=><div key={item.ticket_id+"-"+index} className="border-t border-border pt-3"><p className="font-semibold">{item.quantity} × {item.product_name}</p>{(item.modifiers??[]).length>0&&<p className="mt-1 text-xs text-muted-foreground">{item.modifiers.map(m=>(m.name?m.name+": ":"")+(m.option_label??m.label??"")).join(" · ")}</p>}{item.order_notes&&<p className="mt-1 rounded-lg bg-amber-500/10 px-2.5 py-2 text-xs font-medium">Note: {item.order_notes}</p>}</div>)}</div>{ticket.notes&&<p className="mt-3 rounded-lg bg-secondary p-2.5 text-xs">Order note: {ticket.notes}</p>}<div className="mt-4 border-t border-border pt-3"><label className="text-xs font-semibold text-muted-foreground">Kitchen status</label><select value={ticket.status} onChange={e=>void updateTicket(ticket,e.target.value)} className="field mt-1.5 h-10 w-full"><option value="new">New</option><option value="preparing">Preparing</option><option value="ready">Ready</option><option value="served">Served</option><option value="cancelled">Cancelled</option></select></div></article>)}</div>}</section>}

      {tab==="recipes" && <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary"><Utensils className="size-5"/></span><div><h2 className="font-display font-semibold">Menu modifiers</h2><p className="text-xs text-muted-foreground">Options such as size, add-ons or preparation style.</p></div></div>{!canManage?<p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">Only owners and managers can edit menu modifiers.</p>:<form onSubmit={saveModifier} className="space-y-3"><label className="block space-y-1.5"><span className="text-xs font-semibold">Menu item</span><select required value={menuProductId} onChange={e=>setMenuProductId(e.target.value)} className="field h-11 w-full"><option value="">Choose menu item</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="block space-y-1.5"><span className="text-xs font-semibold">Modifier group</span><Input required value={modifierName} onChange={e=>setModifierName(e.target.value)} className="h-11" placeholder="Size, Extras, Preparation…"/></label><label className="block space-y-1.5"><span className="text-xs font-semibold">Options (one per line: name:price addition)</span><textarea required value={modifierOptions} onChange={e=>setModifierOptions(e.target.value)} rows={4} className="field w-full resize-y" placeholder={"Regular:0\nLarge:500\nExtra cheese:300"}/></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={modifierRequired} onChange={e=>setModifierRequired(e.target.checked)} className="size-4"/>Customer must choose an option</label><Button className="h-11 w-full" disabled={saving}><Plus className="mr-2 size-4"/>Save modifier group</Button></form>}<div className="mt-5 space-y-2">{modifiers.map(m=><div key={m.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"><div className="min-w-0"><p className="font-semibold">{products.find(p=>p.id===m.product_id)?.name??"Menu item"} · {m.name}</p><p className="mt-1 text-xs text-muted-foreground">{m.options.map(o=>o.label+" ("+formatMoney(o.price_delta,currency)+")").join(" · ")}{m.is_required?" · Required":""}</p></div>{canManage&&<button type="button" aria-label="Remove modifier" onClick={()=>void removeRow("food_menu_modifiers",m.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><Trash2 className="size-4"/></button>}</div>)}</div></section>
        <section className="rounded-2xl border border-border bg-surface p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary"><CookingPot className="size-5"/></span><div><h2 className="font-display font-semibold">Recipe costing & ingredients</h2><p className="text-xs text-muted-foreground">Ingredients are deducted per serving when a food sale is completed.</p></div></div>{!canManage?<p className="rounded-xl bg-secondary p-3 text-sm text-muted-foreground">Only owners and managers can edit recipes.</p>:<form onSubmit={saveRecipe} className="space-y-3"><label className="block space-y-1.5"><span className="text-xs font-semibold">Menu item</span><select required value={recipeMenuId} onChange={e=>setRecipeMenuId(e.target.value)} className="field h-11 w-full"><option value="">Choose menu item</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="block space-y-1.5"><span className="text-xs font-semibold">Ingredient product</span><select required value={ingredientId} onChange={e=>setIngredientId(e.target.value)} className="field h-11 w-full"><option value="">Choose ingredient</option>{products.filter(p=>p.id!==recipeMenuId).map(p=><option key={p.id} value={p.id}>{p.name} · {p.quantity} in stock</option>)}</select></label><label className="block space-y-1.5"><span className="text-xs font-semibold">Units used per serving</span><Input type="number" min={1} step={1} required value={ingredientQty} onChange={e=>setIngredientQty(e.target.value)} className="h-11"/></label><Button className="h-11 w-full" disabled={saving}><Plus className="mr-2 size-4"/>Add ingredient to recipe</Button></form>}<div className="mt-5 space-y-2">{recipes.map(r=><div key={r.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3"><div className="min-w-0"><p className="font-semibold">{products.find(p=>p.id===r.menu_product_id)?.name??"Menu item"} ← {r.quantity_per_serving} × {products.find(p=>p.id===r.ingredient_product_id)?.name??"Ingredient"}</p><p className="mt-1 text-xs text-muted-foreground">Estimated recipe cost: {formatMoney(recipeCosts.get(r.menu_product_id)??0,currency)} per serving</p></div>{canManage&&<button type="button" aria-label="Remove recipe ingredient" onClick={()=>void removeRow("food_recipe_ingredients",r.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"><Trash2 className="size-4"/></button>}</div>)}</div></section>
      </div>}

      {tab==="waste" && <div className="grid gap-5 xl:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)]"><section className="rounded-2xl border border-border bg-surface p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary"><AlertTriangle className="size-5"/></span><div><h2 className="font-display font-semibold">Record waste / spoilage</h2><p className="text-xs text-muted-foreground">Stock is checked and reduced in the same transaction.</p></div></div><form onSubmit={recordWaste} className="space-y-3"><label className="block space-y-1.5"><span className="text-xs font-semibold">Ingredient</span><select required value={wasteIngredientId} onChange={e=>setWasteIngredientId(e.target.value)} className="field h-11 w-full"><option value="">Choose ingredient</option>{products.map(p=><option key={p.id} value={p.id}>{p.name} · {p.quantity} in stock</option>)}</select></label><label className="block space-y-1.5"><span className="text-xs font-semibold">Quantity wasted</span><Input type="number" min={1} step={1} required value={wasteQty} onChange={e=>setWasteQty(e.target.value)} className="h-11"/></label><label className="block space-y-1.5"><span className="text-xs font-semibold">Reason</span><textarea required value={wasteReason} onChange={e=>setWasteReason(e.target.value)} rows={3} className="field w-full resize-y" placeholder="Spoilage, damaged ingredient, preparation loss…"/></label><Button className="h-11 w-full" disabled={saving}>Record waste and adjust stock</Button></form></section><section className="overflow-hidden rounded-2xl border border-border bg-surface"><div className="border-b border-border p-4"><h2 className="font-display font-semibold">Recent waste records</h2><p className="mt-1 text-xs text-muted-foreground">Latest 100 records for this branch.</p></div>{wasteQuery.isLoading?<div className="p-5 text-sm text-muted-foreground">Loading waste records…</div>:wasteQuery.error?<div className="p-5 text-sm text-destructive">{errorMessage(wasteQuery.error,"Waste records could not be loaded.")}</div>:waste.length===0?<div className="p-8 text-center text-sm text-muted-foreground">No waste recorded yet.</div>:<div className="divide-y divide-border">{waste.map(w=><div key={w.id} className="flex items-start justify-between gap-3 p-4"><div><p className="font-semibold">{products.find(p=>p.id===w.ingredient_product_id)?.name??"Ingredient"} · {w.quantity} units</p><p className="mt-1 text-xs text-muted-foreground">{w.reason}</p></div><span className="shrink-0 text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</span></div>)}</div>}</section></div>}
    </div>
  </AppShell>;
}
