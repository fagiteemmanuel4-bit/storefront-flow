import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowLeft, ArrowUp, Eye, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/online-store/builder")({ ssr: false, component: StoreBuilder });

type Template = "fashion" | "beauty" | "electronics" | "food" | "retail" | "jewelry" | "furniture" | "fitness" | "luxury" | "minimal-commerce";
type Section = { id: string; type: string; enabled: boolean; settings: Record<string, string> };
type Theme = { primaryColor: string; secondaryColor: string; accentColor: string; textColor: string; backgroundColor: string; buttonRadius: "small" | "medium" | "large"; fontFamily: string };
type Branding = { logoUrl: string; faviconUrl: string; storeName: string; description: string };

const TEMPLATES: Array<{ id: Template; name: string; description: string; sections: string[] }> = [
 {id:"fashion",name:"Fashion",description:"Editorial hero, bold imagery and product-led collections.",sections:["hero","featured-products","categories","product-grid","gallery","newsletter","footer"]},
 {id:"beauty",name:"Beauty",description:"Soft hierarchy for beauty, skincare and cosmetics.",sections:["announcement","hero","categories","featured-products","testimonials","faq","footer"]},
 {id:"electronics",name:"Electronics",description:"Product-first layout built around discovery.",sections:["hero","categories","product-grid","featured-products","social-proof","footer"]},
 {id:"food",name:"Food",description:"Menu-forward presentation with clear ordering paths.",sections:["announcement","hero","categories","product-grid","about","contact","footer"]},
 {id:"retail",name:"General Retail",description:"Balanced storefront for everyday commerce.",sections:["hero","featured-products","categories","product-grid","promotional-banner","footer"]},
 {id:"jewelry",name:"Jewelry",description:"Minimal luxury composition with large product imagery.",sections:["hero","featured-products","gallery","about","testimonials","newsletter","footer"]},
 {id:"furniture",name:"Furniture & Home",description:"Room-inspired editorial sections for home products.",sections:["hero","gallery","categories","featured-products","about","contact","footer"]},
 {id:"fitness",name:"Fitness",description:"Energetic product grid with social proof.",sections:["announcement","hero","featured-products","product-grid","social-proof","faq","footer"]},
 {id:"luxury",name:"Luxury",description:"Dark editorial structure for premium brands.",sections:["hero","featured-products","about","gallery","testimonials","contact","footer"]},
 {id:"minimal-commerce",name:"Minimal Commerce",description:"Clean, fast and product-focused.",sections:["hero","featured-products","product-grid","about","faq","footer"]}
];
const LABELS: Record<string,string>={hero:"Hero","featured-products":"Featured products","product-grid":"Product grid",categories:"Categories","promotional-banner":"Promotional banner",announcement:"Announcement bar",about:"About",testimonials:"Testimonials",faq:"FAQ",contact:"Contact",newsletter:"Newsletter","social-proof":"Social proof",gallery:"Image gallery",footer:"Footer"};
const SECTION_TYPES=Object.keys(LABELS);
const defaultTheme:Theme={primaryColor:"#111827",secondaryColor:"#f3f4f6",accentColor:"#f59e0b",textColor:"#111827",backgroundColor:"#ffffff",buttonRadius:"medium",fontFamily:"Inter"};
const defaultBranding:Branding={logoUrl:"",faviconUrl:"",storeName:"",description:""};
const sectionFields: Record<string, Array<{key:string;label:string;placeholder:string}>>={
 hero:[{key:"headline",label:"Headline",placeholder:"Your brand, beautifully presented."},{key:"subheadline",label:"Supporting text",placeholder:"Tell customers what makes your store special."},{key:"buttonText",label:"Button text",placeholder:"Shop now"}],
 "featured-products":[{key:"title",label:"Title",placeholder:"Featured products"}],
 "product-grid":[{key:"title",label:"Title",placeholder:"Shop our products"}],
 categories:[{key:"title",label:"Title",placeholder:"Shop by category"}],
 "promotional-banner":[{key:"headline",label:"Headline",placeholder:"Special offer"}],
 announcement:[{key:"text",label:"Announcement",placeholder:"Free delivery on selected orders"}],
 about:[{key:"title",label:"Title",placeholder:"About us"},{key:"body",label:"Body",placeholder:"Tell your story."}],
 testimonials:[{key:"title",label:"Title",placeholder:"What customers say"}],
 faq:[{key:"title",label:"Title",placeholder:"Frequently asked questions"}],
 contact:[{key:"title",label:"Title",placeholder:"Get in touch"}],
 newsletter:[{key:"title",label:"Title",placeholder:"Stay in the loop"}],
 "social-proof":[{key:"title",label:"Title",placeholder:"Trusted by our customers"}],
 gallery:[{key:"title",label:"Title",placeholder:"Explore the collection"}],
 footer:[{key:"text",label:"Footer text",placeholder:"Your store name"}],
};

function makeSections(types:string[], prefix=String(Date.now())):Section[]{return types.map((type,index)=>({id:`${type}-${prefix}-${index}`,type,enabled:true,settings:{}}));}

function StoreBuilder(){
 const {store}=useStoreContext();
 const [template,setTemplate]=useState<Template>("minimal-commerce");
 const [theme,setTheme]=useState(defaultTheme);
 const [branding,setBranding]=useState<Branding>(defaultBranding);
 const [sections,setSections]=useState<Section[]>([]);
 const [seoTitle,setSeoTitle]=useState(""); const [seoDescription,setSeoDescription]=useState(""); const [customCss,setCustomCss]=useState("");
 const [published,setPublished]=useState(false); const [slug,setSlug]=useState(""); const [loading,setLoading]=useState(true); const [saving,setSaving]=useState(false); const [selectedSection,setSelectedSection]=useState<string|null>(null);
 const selectedTemplate=useMemo(()=>TEMPLATES.find(x=>x.id===template)!,[template]);
 useEffect(()=>{if(store) void loadConfig();},[store]);
 async function loadConfig(){
  if(!store)return; setLoading(true);
  const [configResult,storeResult]=await Promise.all([
   onlineSupabase.from("storefront_configs").select("*").eq("store_id",store.id).maybeSingle(),
   onlineSupabase.from("online_stores").select("slug,display_name,description,logo_url").eq("store_id",store.id).maybeSingle()
  ]);
  if(configResult.error){toast.error(configResult.error.message);setLoading(false);return;}
  if(storeResult.error){toast.error(storeResult.error.message);setLoading(false);return;}
  const existing=configResult.data;
  const onlineStore=storeResult.data;
  setSlug(onlineStore?.slug ?? "");
  setBranding({...defaultBranding,storeName:onlineStore?.display_name ?? store.name,description:onlineStore?.description ?? "",logoUrl:onlineStore?.logo_url ?? ""});
  if(existing){
   setTemplate(existing.template as Template); setTheme({...defaultTheme,...(existing.theme as Partial<Theme>)});
   setBranding(current=>({...current,...((existing.branding ?? {}) as Partial<Branding>)}));
   setSections(((existing.sections as Section[]) ?? []).map(s=>({...s,settings:s.settings??{}})));
   const seo=existing.seo as {title?:string;description?:string}|null; setSeoTitle(seo?.title??""); setSeoDescription(seo?.description??""); setCustomCss(existing.custom_css??""); setPublished(Boolean(existing.is_published));
  } else setSections(makeSections(selectedTemplate.sections));
  setLoading(false);
 }
 function applyTemplate(next:Template){
  if(next===template)return;
  setTemplate(next); setSections(makeSections(TEMPLATES.find(x=>x.id===next)!.sections)); setSelectedSection(null);
  toast.message("Template changed",{description:"Your products, inventory and orders are unchanged. Save when you're happy with the new layout."});
 }
 function move(index:number,direction:-1|1){const target=index+direction;if(target<0||target>=sections.length)return;setSections(current=>{const next=[...current];[next[index],next[target]]=[next[target],next[index]];return next;});}
 function addSection(type:string){const section={id:`${type}-${Date.now()}`,type,enabled:true,settings:{}};setSections(current=>[...current,section]);setSelectedSection(section.id);}
 function updateSection(id:string,changes:Partial<Section>){setSections(current=>current.map(section=>section.id===id?{...section,...changes}:section));}
 function updateSectionSetting(id:string,key:string,value:string){setSections(current=>current.map(section=>section.id===id?{...section,settings:{...section.settings,[key]:value}}:section));}
 async function save(){
  if(!store)return; setSaving(true);
  try{
   const {data,error}=await onlineSupabase.rpc("upsert_storefront_config",{_store_id:store.id,_template:template,_theme:theme,_branding:branding,_navigation:{links:[]},_sections:sections,_seo:{title:seoTitle.trim(),description:seoDescription.trim(),keywords:[],noIndex:false},_custom_css:customCss,_publish:published});
   if(error)throw new Error(error.message); if(!data?.id)throw new Error("The storefront was not confirmed as saved."); toast.success("Store builder saved");
  }catch(error){toast.error(error instanceof Error?error.message:"Couldn't save the store builder.");}finally{setSaving(false);}
 }
 if(!store||loading)return <main className="min-h-screen bg-background p-8"><p className="text-muted-foreground">Loading store builder…</p></main>;
 const publicUrl=slug?`/store/${slug}`:"/online-store/setup";
 return <main className="min-h-screen bg-background">
  <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur"><div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="flex items-center gap-3"><Link to="/online-store" className="flex size-9 items-center justify-center rounded-lg border border-border"><ArrowLeft className="size-4"/></Link><div><p className="text-xs font-semibold uppercase tracking-wider text-accent-ink">Store Editor</p><p className="font-semibold">{store.name}</p></div></div><div className="flex items-center gap-2"><span className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${published?"bg-emerald-100 text-emerald-800":"bg-secondary text-muted-foreground"}`}>{published?"Published":"Draft"}</span><Link to="/online-store/customize" className="hidden sm:inline-flex"><Button variant="outline">Legacy settings</Button></Link><Button variant="outline" disabled={!slug} onClick={()=>window.open(publicUrl,"_blank")}><Eye className="mr-2 size-4"/>Preview</Button><Button onClick={()=>void save()} disabled={saving}>{saving?"Saving…":<><Save className="mr-2 size-4"/>Save</>}</Button></div></div></header>
  <div className="mx-auto grid max-w-[1500px] gap-6 px-4 py-6 lg:grid-cols-[280px_minmax(0,1fr)_340px] sm:px-6">
   <aside className="space-y-4"><Panel title="Templates"><div className="space-y-2">{TEMPLATES.map(item=><button key={item.id} type="button" onClick={()=>applyTemplate(item.id)} className={`w-full rounded-xl border p-3 text-left transition ${template===item.id?"border-foreground bg-secondary":"border-border hover:border-accent/50"}`}><p className="font-semibold">{item.name}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p></button>)}</div></Panel><Panel title="Add section"><div className="grid grid-cols-2 gap-2">{SECTION_TYPES.map(type=><button key={type} type="button" onClick={()=>addSection(type)} className="rounded-lg border border-border px-2 py-2 text-xs font-semibold hover:bg-secondary"><Plus className="mx-auto mb-1 size-3"/>{LABELS[type]}</button>)}</div></Panel></aside>
   <section className="min-w-0 rounded-[2rem] border border-border bg-secondary/50 p-4 sm:p-6"><div className="mb-3 flex items-center justify-between text-xs text-muted-foreground"><span>Desktop preview</span><span className="lg:hidden">Advanced editing is optimized for desktop.</span></div><div className="mx-auto max-w-3xl overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-lift" style={{color:theme.textColor,backgroundColor:theme.backgroundColor}}><div className="flex items-center justify-between border-b px-5 py-4" style={{borderColor:theme.secondaryColor}}>{branding.logoUrl?<img src={branding.logoUrl} alt={branding.storeName} className="h-8 max-w-32 object-contain"/>:<span className="font-bold">{branding.storeName||selectedTemplate.name}</span>}<div className="flex gap-2 text-xs"><span>Shop</span><span>Products</span><span>Contact</span></div></div>{sections.map((section,index)=><div key={section.id} onClick={()=>setSelectedSection(section.id)} className={`relative cursor-pointer border-b px-6 py-8 transition ${selectedSection===section.id?"ring-2 ring-inset":""}`} style={{borderColor:theme.secondaryColor,opacity:section.enabled?1:.4}}><div className="absolute right-3 top-3 flex gap-1"><button type="button" aria-label="Move section up" disabled={index===0} onClick={(e)=>{e.stopPropagation();move(index,-1)}} className="rounded-md border bg-white p-1"><ArrowUp className="size-3"/></button><button type="button" aria-label="Move section down" disabled={index===sections.length-1} onClick={(e)=>{e.stopPropagation();move(index,1)}} className="rounded-md border bg-white p-1"><ArrowDown className="size-3"/></button><button type="button" aria-label="Remove section" onClick={(e)=>{e.stopPropagation();setSections(current=>current.filter((_,i)=>i!==index));if(selectedSection===section.id)setSelectedSection(null)}} className="rounded-md border bg-white p-1 text-destructive"><Trash2 className="size-3"/></button></div><div className="flex items-center gap-2"><GripVertical className="size-3 text-muted-foreground"/><p className="text-[10px] font-bold uppercase tracking-[.18em]" style={{color:theme.primaryColor}}>{LABELS[section.type]}</p></div><h3 className="mt-2 font-display text-2xl font-bold">{section.settings.headline||section.settings.title||section.settings.text||LABELS[section.type]}</h3><p className="mt-2 max-w-xl text-sm opacity-65">{section.settings.subheadline||section.settings.body||"Live structural preview of this storefront section."}</p>{section.type==="hero"&&<button type="button" className="mt-5 rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{backgroundColor:theme.primaryColor}}>{section.settings.buttonText||"Shop now"}</button>}</div>)}</div></section>
   <aside className="space-y-4"><Panel title="Branding"><label className="block space-y-1"><span className="text-xs font-semibold">Store name</span><input className="field" value={branding.storeName} onChange={e=>setBranding(current=>({...current,storeName:e.target.value}))}/></label><label className="mt-3 block space-y-1"><span className="text-xs font-semibold">Logo URL</span><input className="field" value={branding.logoUrl} onChange={e=>setBranding(current=>({...current,logoUrl:e.target.value}))} placeholder="https://…"/></label><label className="mt-3 block space-y-1"><span className="text-xs font-semibold">Favicon URL</span><input className="field" value={branding.faviconUrl} onChange={e=>setBranding(current=>({...current,faviconUrl:e.target.value}))} placeholder="https://…"/></label><label className="mt-3 block space-y-1"><span className="text-xs font-semibold">Description</span><textarea className="field min-h-20 resize-none" value={branding.description} onChange={e=>setBranding(current=>({...current,description:e.target.value}))}/></label></Panel>
    <Panel title="Theme"><div className="grid grid-cols-2 gap-3">{(["primaryColor","secondaryColor","accentColor","textColor","backgroundColor"] as const).map(key=><label key={key} className="space-y-1"><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{key.replace("Color","")}</span><div className="flex items-center gap-2 rounded-lg border border-border p-1"><input type="color" value={theme[key]} onChange={e=>setTheme(current=>({...current,[key]:e.target.value}))} className="size-7 cursor-pointer border-0 bg-transparent"/><input value={theme[key]} onChange={e=>setTheme(current=>({...current,[key]:e.target.value}))} className="min-w-0 w-full bg-transparent text-xs outline-none"/></div></label>)}</div><label className="mt-4 block space-y-1"><span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Button radius</span><select className="field" value={theme.buttonRadius} onChange={e=>setTheme(current=>({...current,buttonRadius:e.target.value as Theme["buttonRadius"]}))}><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label></Panel>
    {selectedSection&&(()=>{const section=sections.find(x=>x.id===selectedSection);if(!section)return null;const fields=sectionFields[section.type]??[];return <Panel title={`Edit ${LABELS[section.type]}`}><label className="mb-4 flex items-center justify-between gap-3"><span className="text-sm font-semibold">Visible</span><input type="checkbox" checked={section.enabled} onChange={e=>updateSection(section.id,{enabled:e.target.checked})}/></label>{fields.length===0?<p className="text-xs leading-5 text-muted-foreground">This section is structurally configurable. More content controls will be added as the section renderer expands.</p>:fields.map(field=><label key={field.key} className="mb-3 block space-y-1"><span className="text-xs font-semibold">{field.label}</span>{field.key==="body"||field.key==="subheadline"?<textarea className="field min-h-20 resize-none" value={section.settings[field.key]??""} onChange={e=>updateSectionSetting(section.id,field.key,e.target.value)} placeholder={field.placeholder}/>:<input className="field" value={section.settings[field.key]??""} onChange={e=>updateSectionSetting(section.id,field.key,e.target.value)} placeholder={field.placeholder}/>}</label>)}</Panel>})()}
    <Panel title="SEO"><label className="block space-y-1"><span className="text-xs font-semibold">Page title</span><input className="field" maxLength={70} value={seoTitle} onChange={e=>setSeoTitle(e.target.value)} placeholder="Your store name"/></label><label className="mt-3 block space-y-1"><span className="text-xs font-semibold">Meta description</span><textarea className="field min-h-24 resize-none" maxLength={160} value={seoDescription} onChange={e=>setSeoDescription(e.target.value)} placeholder="A clear description of your store."/></label></Panel>
    <Panel title="Publishing"><label className="flex items-center justify-between gap-4"><div><p className="text-sm font-semibold">Publish storefront</p><p className="mt-1 text-xs text-muted-foreground">Only publish when the store is ready for customers.</p></div><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/></label></Panel>
    <Panel title="Advanced"><label className="block space-y-1"><span className="text-xs font-semibold">Custom CSS</span><textarea className="field min-h-32 resize-y font-mono text-xs" maxLength={20000} value={customCss} onChange={e=>setCustomCss(e.target.value)} placeholder="/* Premium customization */"/></label><p className="mt-2 text-xs leading-5 text-muted-foreground">CSS only. Scripts and server secrets are never accepted here.</p></Panel>
   </aside>
  </div>
 </main>;
}
function Panel({title,children}:{title:string;children:React.ReactNode}){return <section className="rounded-2xl border border-border bg-surface p-4"><h2 className="mb-4 font-semibold">{title}</h2>{children}</section>;}
