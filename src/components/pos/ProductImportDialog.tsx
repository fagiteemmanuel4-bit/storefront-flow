import { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { ClipboardPaste, FileSpreadsheet, ImagePlus, LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet, BottomSheetContent, BottomSheetDescription, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";

type ImportRow = { name: string; sku: string; barcode: string; category: string; price: number; cost: number; quantity: number; lowStockThreshold: number };
type Props = { open: boolean; onOpenChange: (open: boolean) => void; storeId: string; branchId: string; onImported: () => Promise<void> | void };

function clean(v: unknown) { return String(v ?? "").trim(); }
function money(v: unknown) { const raw = clean(v).replace(/[₦$€£,\s]/g, "").toLowerCase(); const m = raw.endsWith("m") ? 1e6 : raw.endsWith("k") ? 1e3 : 1; const n = Number(raw.replace(/[km]$/, "")); return Number.isFinite(n) ? n * m : 0; }
function integer(v: unknown, fallback = 0) { const n = Number(clean(v).replace(/[,\s]/g, "")); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback; }
function normalizeHeader(v: unknown) { return clean(v).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " "); }
function normalizeName(v: string) { return clean(v).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }

function parseCsv(text: string): string[][] { const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false; for (let i = 0; i < text.length; i++) { const c = text[i], n = text[i + 1]; if (c === '"' && quoted && n === '"') { cell += '"'; i++; } else if (c === '"') quoted = !quoted; else if (c === ',' && !quoted) { row.push(cell); cell = ""; } else if ((c === "\n" || c === "\r") && !quoted) { if (c === "\r" && n === "\n") i++; row.push(cell); if (row.some(v => v.trim())) rows.push(row); row = []; cell = ""; } else cell += c; } if (cell || row.length) { row.push(cell); if (row.some(v => v.trim())) rows.push(row); } return rows; }

function mapRows(rows: string[][]): ImportRow[] {
  if (!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  const aliases: Record<string, string[]> = { name:["name","product","product name","item","item name","title"], sku:["sku","stock keeping unit"], barcode:["barcode","bar code","ean","upc"], category:["category","type","group"], price:["price","selling price","sale price","unit price"], cost:["cost","cost price","buying price","purchase price"], quantity:["quantity","qty","stock","opening stock","inventory"], lowStockThreshold:["low stock threshold","low stock","reorder level","reorder point"] };
  const indexes = Object.fromEntries(Object.keys(aliases).map(k => [k, headers.findIndex(h => aliases[k].includes(h))]));
  return rows.slice(1).flatMap(values => { const get = (k: string) => indexes[k] >= 0 ? values[indexes[k]] : ""; const name = clean(get("name")); return name ? [{ name, sku:clean(get("sku")), barcode:clean(get("barcode")), category:clean(get("category")), price:money(get("price")), cost:money(get("cost")), quantity:integer(get("quantity")), lowStockThreshold:integer(get("lowStockThreshold"),5) }] : []; });
}

function productCandidate(line: string) {
  const s = line.replace(/^[•●▪▫🔸🔹✅️✓✔\-–—*]+\s*/, "").replace(/\s+/g, " ").trim();
  if (!s || s.length < 3) return false;
  return !/^(price|basic details|special features|free software|condition|useful for|brand|model|type|storage|ram|supported os|battery|battery health|battery backup|bluetooth|hdmi|webcam|usb|with|for|yes|no)\s*[:：]/i.test(s) && !/^(price|basic details|special features|free software|condition|useful for)$/i.test(s);
}

/** Turns conversational catalogue posts into products. A product is created only when a price is found in the same paragraph/block. */
function parseSmartText(text: string): ImportRow[] {
  const blocks = text.replace(/\r/g, "").split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
  const rows: ImportRow[] = [];
  const priceRe = /(?:price\s*[:：]?\s*)?(?:₦|NGN|N)\s*([0-9][0-9,]*(?:\.\d{1,2})?\s*[kKmM]?)\b|(?:price\s*[:：]?\s*)\b([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,}|[0-9]+\s*[kKmM])\b/i;
  for (const block of blocks) {
    const lines = block.split("\n").map(v => v.trim()).filter(Boolean);
    const priceLineIndex = lines.findIndex(l => /\bprice\b\s*[:：]?\s*(?:₦|NGN|N|\d)/i.test(l));
    const priceMatch = block.match(priceRe);
    if (!priceMatch) continue;
    const price = money(priceMatch[1] ?? priceMatch[2]); if (!price) continue;
    const beforePrice = priceLineIndex >= 0 ? lines.slice(0, priceLineIndex) : lines;
    const candidates = beforePrice.filter(productCandidate);
    // Prefer the first concise product-title-like line, not technical detail lines.
    const name = (candidates.find(l => l.length <= 140 && !/\b(brand|model|type|storage|ram|screen|battery|bluetooth|hdmi|webcam|usb)\b\s*[:：]/i.test(l)) ?? candidates[0] ?? "").replace(/\s*[–—:-]\s*$/, "").trim();
    if (!name) continue;
    const quantityMatch = block.match(/(?:stock|qty|quantity)\s*[:：]?\s*(\d+)/i);
    rows.push({ name, sku:"", barcode:"", category:"", price, cost:0, quantity:quantityMatch ? integer(quantityMatch[1]) : 0, lowStockThreshold:5 });
  }
  return rows;
}

function dedupeRows(rows: ImportRow[]) { const map = new Map<string, ImportRow>(); for (const row of rows) { const key = row.sku ? `sku:${row.sku.toLowerCase()}` : row.barcode ? `barcode:${row.barcode}` : `name:${normalizeName(row.name)}`; if (!map.has(key)) map.set(key,row); } return [...map.values()]; }

export function ProductImportDialog({ open, onOpenChange, storeId, branchId, onImported }: Props) {
  const [rows,setRows]=useState<ImportRow[]>([]); const [fileName,setFileName]=useState(""); const [smartText,setSmartText]=useState(""); const [busy,setBusy]=useState(false); const [ocrBusy,setOcrBusy]=useState(false); const [imageName,setImageName]=useState(""); const [imagePreview,setImagePreview]=useState(""); const [ocrText,setOcrText]=useState("");
  const validRows=useMemo(()=>dedupeRows(rows.filter(r=>r.name&&r.price>=0)),[rows]);
  useEffect(()=>()=>{if(imagePreview)URL.revokeObjectURL(imagePreview)},[imagePreview]);
  async function readFile(file:File){setFileName(file.name);setRows([]);try{if(file.name.toLowerCase().endsWith(".csv"))setRows(mapRows(parseCsv(await file.text())));else if(/\.xlsx$/i.test(file.name)){const wb=new ExcelJS.Workbook();await wb.xlsx.load(await file.arrayBuffer());const values:string[][]=[];wb.worksheets[0].eachRow(r=>values.push((r.values as unknown[]).slice(1).map(clean)));setRows(mapRows(values));}else throw new Error("Use CSV or XLSX.");}catch(e){toast.error(errorMessage(e,"The file could not be read."));setFileName("");}}
  function addSmartText(){const parsed=parseSmartText(smartText);if(!parsed.length){toast.error("Kudi couldn't confidently find a product title and price. Keep the product and its price in the same paragraph, then review the result.");return;}setRows(c=>[...c,...parsed]);setSmartText("");toast.success(`${parsed.length} product${parsed.length===1?"":"s"} prepared`);}
  async function readImage(file:File){if(!file.type.startsWith("image/")){toast.error("Please choose an image file.");return;}if(file.size>12e6){toast.error("Image is too large. Keep it under 12 MB.");return;}setImageName(file.name);setOcrBusy(true);setImagePreview(c=>{if(c)URL.revokeObjectURL(c);return URL.createObjectURL(file)});try{const{createWorker}=await import("tesseract.js");const worker=await createWorker("eng",1,{logger:m=>{if(m.status==="recognizing text"&&typeof m.progress==="number")setOcrText(`Reading image… ${Math.round(m.progress*100)}%`)}});try{const{data}=await worker.recognize(file);setOcrText(data.text.trim());const parsed=parseSmartText(data.text);if(!parsed.length){toast.error("Kudi read the image but couldn't confidently map products to prices. Review or paste the text instead.");return;}setRows(c=>[...c,...parsed]);toast.success(`${parsed.length} product${parsed.length===1?"":"s"} extracted — review before import`)}finally{await worker.terminate()}}catch(e){toast.error(errorMessage(e,"Kudi Sense couldn't read this image."))}finally{setOcrBusy(false)}}
  async function handlePaste(e:React.ClipboardEvent<HTMLDivElement>){const image=[...e.clipboardData.items].find(i=>i.type.startsWith("image/"));if(image){e.preventDefault();const f=image.getAsFile();if(f)await readImage(f)}}
  async function importRows(){if(!validRows.length)return;setBusy(true);try{const{data:existing,error}=await supabase.from("products").select("id,name,sku,barcode").eq("store_id",storeId).eq("is_active",true);if(error)throw new Error(error.message);const bySku=new Map((existing??[]).filter(p=>p.sku).map(p=>[p.sku!.trim().toLowerCase(),p.id]));const byBarcode=new Map((existing??[]).filter(p=>p.barcode).map(p=>[p.barcode!.trim(),p.id]));const byName=new Map((existing??[]).map(p=>[normalizeName(p.name),p.id]));let created=0,updated=0;for(let i=0;i<validRows.length;i+=8){await Promise.all(validRows.slice(i,i+8).map(async row=>{const id=(row.sku&&bySku.get(row.sku.toLowerCase()))||(row.barcode&&byBarcode.get(row.barcode))||byName.get(normalizeName(row.name));const payload={store_id:storeId,name:row.name,sku:row.sku,barcode:row.barcode,category:row.category,price:row.price,cost:row.cost,low_stock_threshold:row.lowStockThreshold};let productId=id;if(id){const{error:e}=await supabase.from("products").update(payload).eq("id",id);if(e)throw new Error(`${row.name}: ${e.message}`);updated++}else{const{data,error:e}=await supabase.from("products").insert(payload).select("id").single();if(e)throw new Error(`${row.name}: ${e.message}`);productId=data.id;created++}const{error:se}=await supabase.from("branch_stock").upsert({branch_id:branchId,product_id:productId,store_id:storeId,quantity:row.quantity},{onConflict:"branch_id,product_id"});if(se)throw new Error(`${row.name}: ${se.message}`)}))}await onImported();toast.success(`${created} added · ${updated} updated`);reset();onOpenChange(false)}catch(e){toast.error(errorMessage(e,"Import stopped. Review the rows and try again."))}finally{setBusy(false)}}
  function reset(){setRows([]);setFileName("");setSmartText("");setImageName("");setOcrText("");setImagePreview(c=>{if(c)URL.revokeObjectURL(c);return ""})}
  return <BottomSheet open={open} onOpenChange={v=>{if(!v&&!busy&&!ocrBusy)reset();onOpenChange(v)}}><BottomSheetContent className="mx-auto max-h-[94dvh] w-full max-w-4xl overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"><BottomSheetHeader><BottomSheetTitle className="flex items-center gap-2 text-lg"><Sparkles className="size-5 shrink-0"/>Kudi Sense</BottomSheetTitle><BottomSheetDescription>Turn a spreadsheet, chat message, screenshot, handwritten sheet or price list into products. Kudi never imports until you review the result.</BottomSheetDescription></BottomSheetHeader>
    <div className="grid gap-3 sm:grid-cols-3" onPaste={e=>void handlePaste(e)}><label className="cursor-pointer rounded-2xl border border-dashed border-border bg-secondary/30 p-4 transition hover:bg-secondary"><FileSpreadsheet className="size-5"/><p className="mt-2 font-semibold">Spreadsheet</p><p className="text-xs text-muted-foreground">CSV or XLSX</p><input type="file" accept=".csv,.xlsx" className="hidden" onChange={e=>e.target.files?.[0]&&void readFile(e.target.files[0])}/>{fileName&&<p className="mt-2 truncate text-xs">{fileName}</p>}</label><div className="rounded-2xl border border-border p-4"><ClipboardPaste className="size-5"/><p className="mt-2 font-semibold">Paste from WhatsApp</p><p className="text-xs text-muted-foreground">Kudi groups a listing with its price instead of treating every detail line as a product.</p><Input value={smartText} onChange={e=>setSmartText(e.target.value)} className="mt-3 h-11" placeholder="Product name… Price: ₦30,000"/><Button className="mt-2 h-11 w-full" variant="outline" disabled={!smartText.trim()||busy} onClick={addSmartText}><Sparkles className="mr-2 size-4"/>Extract</Button></div><label className="cursor-pointer rounded-2xl border border-border p-4 transition hover:bg-secondary"><ImagePlus className="size-5"/><p className="mt-2 font-semibold">Photo or screenshot</p><p className="text-xs text-muted-foreground">WhatsApp, Telegram, notebook or printed list.</p><input type="file" accept="image/*" className="hidden" onChange={e=>e.target.files?.[0]&&void readImage(e.target.files[0])}/>{imageName&&<p className="mt-2 truncate text-xs">{imageName}</p>}</label></div>
    {ocrBusy&&<div className="mt-4 flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4"><LoaderCircle className="size-5 animate-spin"/><div><p className="font-semibold">Kudi Sense is reading…</p><p className="text-xs text-muted-foreground">{ocrText||"Preparing the image"}</p></div></div>}
    {imagePreview&&!ocrBusy&&<div className="mt-4 flex gap-3 rounded-2xl border border-border p-3"><img src={imagePreview} alt="Catalogue preview" className="size-20 rounded-xl object-cover"/><div className="min-w-0"><p className="font-semibold">Image analysed</p><p className="text-xs text-muted-foreground">Review the extracted products below before importing.</p></div></div>}
    {validRows.length>0&&<div className="mt-4 overflow-hidden rounded-2xl border border-border"><div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/50 px-4 py-3"><div><p className="font-semibold">Review before import</p><p className="text-xs text-muted-foreground">{validRows.length} product{validRows.length===1?"":"s"} detected</p></div><Button variant="ghost" size="icon" aria-label="Clear detected products" onClick={()=>setRows([])}><X className="size-4"/></Button></div><div className="max-h-[34vh] overflow-auto divide-y divide-border">{validRows.map((r,i)=><div key={`${normalizeName(r.name)}-${i}`} className="grid gap-2 p-3 sm:grid-cols-[1fr_130px_100px]"><Input value={r.name} aria-label={`Product ${i+1} name`} onChange={e=>setRows(c=>c.map((x,j)=>j===i?{...x,name:e.target.value}:x))}/><Input value={String(r.price)} inputMode="decimal" aria-label={`Product ${i+1} price`} onChange={e=>setRows(c=>c.map((x,j)=>j===i?{...x,price:money(e.target.value)}:x))}/><Input value={String(r.quantity)} inputMode="numeric" aria-label={`Product ${i+1} stock`} onChange={e=>setRows(c=>c.map((x,j)=>j===i?{...x,quantity:integer(e.target.value)}:x))}/></div>)}</div><div className="sticky bottom-0 border-t border-border bg-background p-3"><Button className="h-12 w-full" disabled={busy||ocrBusy} onClick={()=>void importRows()}>{busy?<><LoaderCircle className="mr-2 size-4 animate-spin"/>Importing…</>:<><Upload className="mr-2 size-4"/>Import {validRows.length} product{validRows.length===1?"":"s"}</>}</Button></div></div>}
  </BottomSheetContent></BottomSheet>;
}
