import { useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { FileSpreadsheet, ImagePlus, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomSheet, BottomSheetContent, BottomSheetDescription, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";

type ImportRow = { name: string; sku: string; barcode: string; category: string; price: number; cost: number; quantity: number; lowStockThreshold: number };

type Props = { open: boolean; onOpenChange: (open: boolean) => void; storeId: string; branchId: string; onImported: () => Promise<void> | void };

function clean(value: unknown) { return String(value ?? "").trim(); }
function money(value: unknown) { const raw = clean(value).replace(/[₦$€£,\s]/g, ""); const n = Number(raw); return Number.isFinite(n) ? n : 0; }
function integer(value: unknown, fallback = 0) { const n = Number(clean(value).replace(/[,\s]/g, "")); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback; }
function normalizeHeader(value: unknown) { return clean(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " "); }
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) { const char = text[i]; const next = text[i + 1]; if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { row.push(cell); cell = ""; } else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") i += 1; row.push(cell); if (row.some((v) => v.trim())) rows.push(row); row = []; cell = ""; } else cell += char; }
  if (cell || row.length) { row.push(cell); if (row.some((v) => v.trim())) rows.push(row); }
  return rows;
}
function mapRows(rows: string[][]): ImportRow[] {
  if (!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  const aliases: Record<string, string[]> = {
    name: ["name", "product", "product name", "item", "item name", "title"], sku: ["sku", "stock keeping unit"], barcode: ["barcode", "bar code", "ean", "upc"], category: ["category", "type", "group"], price: ["price", "selling price", "sale price", "unit price"], cost: ["cost", "cost price", "buying price", "purchase price"], quantity: ["quantity", "qty", "stock", "opening stock", "inventory"], lowStockThreshold: ["low stock threshold", "low stock", "reorder level", "reorder point"]
  };
  const indexOf = (key: string) => { const options = aliases[key]; return headers.findIndex((h) => options.includes(h)); };
  const indexes = Object.fromEntries(Object.keys(aliases).map((key) => [key, indexOf(key)]));
  const rowsOut: ImportRow[] = [];
  for (const values of rows.slice(1)) {
    const get = (key: keyof typeof indexes) => indexes[key] >= 0 ? values[indexes[key]] : "";
    const name = clean(get("name"));
    if (!name) continue;
    rowsOut.push({ name, sku: clean(get("sku")), barcode: clean(get("barcode")), category: clean(get("category")), price: money(get("price")), cost: money(get("cost")), quantity: integer(get("quantity")), lowStockThreshold: integer(get("lowStockThreshold"), 5) });
  }
  return rowsOut;
}
function parseSmartText(text: string): ImportRow[] {
  const rows: ImportRow[] = [];
  for (const line of text.split(/\r?\n/).map((v) => v.trim()).filter(Boolean)) {
    const parts = line.split(/\t|\s{2,}|\s+[–—-]\s+/).map((v) => v.trim()).filter(Boolean);
    const priceMatch = line.match(/(?:₦|NGN|N)?\s*([0-9][0-9,]*(?:\.\d{1,2})?)/i);
    const price = priceMatch ? money(priceMatch[1]) : 0;
    let name = parts[0] ?? line;
    if (priceMatch && name === line) name = line.slice(0, priceMatch.index).replace(/[–—:-]+\s*$/, "").trim();
    if (!name || !price) continue;
    rows.push({ name, sku: "", barcode: "", category: "", price, cost: 0, quantity: 0, lowStockThreshold: 5 });
  }
  return rows;
}

export function ProductImportDialog({ open, onOpenChange, storeId, branchId, onImported }: Props) {
  const [rows, setRows] = useState<ImportRow[]>([]); const [fileName, setFileName] = useState(""); const [smartText, setSmartText] = useState(""); const [busy, setBusy] = useState(false); const [imageName, setImageName] = useState("");
  const validRows = useMemo(() => rows.filter((row) => row.name && row.price >= 0), [rows]);
  async function readFile(file: File) {
    setFileName(file.name); setRows([]);
    try {
      if (file.name.toLowerCase().endsWith(".csv")) setRows(mapRows(parseCsv(await file.text())));
      else if (/\.xlsx?$/i.test(file.name)) { const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await file.arrayBuffer()); const sheet = workbook.worksheets[0]; const values: string[][] = []; sheet.eachRow((row) => values.push((row.values as unknown[]).slice(1).map(clean))); setRows(mapRows(values)); }
      else throw new Error("Use a CSV, XLSX or XLS file.");
    } catch (error) { toast.error(errorMessage(error, "The file could not be read.")); setFileName(""); }
  }
  function addSmartText() { const parsed = parseSmartText(smartText); if (!parsed.length) { toast.error("We couldn't find product names with prices. Try one product per line, e.g. Smart Glasses - ₦30,000."); return; } setRows((current) => [...current, ...parsed]); setSmartText(""); toast.success(`${parsed.length} product${parsed.length === 1 ? "" : "s"} prepared`); }
  async function importRows() {
    if (!validRows.length) return; setBusy(true);
    try {
      const { data: existing, error: existingError } = await supabase.from("products").select("id,name,sku,barcode").eq("store_id", storeId).eq("is_active", true);
      if (existingError) throw new Error(existingError.message);
      const bySku = new Map((existing ?? []).filter((p) => p.sku).map((p) => [p.sku!.trim().toLowerCase(), p.id])); const byBarcode = new Map((existing ?? []).filter((p) => p.barcode).map((p) => [p.barcode!.trim(), p.id]));
      let created = 0, updated = 0;
      for (const row of validRows) {
        const existingId = (row.sku && bySku.get(row.sku.toLowerCase())) || (row.barcode && byBarcode.get(row.barcode)) || null;
        let productId = existingId;
        const payload = { store_id: storeId, name: row.name, sku: row.sku, barcode: row.barcode, category: row.category, price: row.price, cost: row.cost, low_stock_threshold: row.lowStockThreshold };
        if (existingId) { const { error } = await supabase.from("products").update(payload).eq("id", existingId); if (error) throw new Error(`${row.name}: ${error.message}`); updated += 1; }
        else { const { data, error } = await supabase.from("products").insert(payload).select("id").single(); if (error) throw new Error(`${row.name}: ${error.message}`); productId = data.id; created += 1; }
        if (!productId) throw new Error(`No product id returned for ${row.name}.`);
        const { error: stockError } = await supabase.from("branch_stock").upsert({ branch_id: branchId, product_id: productId, store_id: storeId, quantity: row.quantity }, { onConflict: "branch_id,product_id" });
        if (stockError) throw new Error(`${row.name}: ${stockError.message}`);
      }
      await onImported(); toast.success(`${created} added · ${updated} updated`); setRows([]); setFileName(""); setImageName(""); onOpenChange(false);
    } catch (error) { toast.error(errorMessage(error, "Import stopped. No further rows were processed.")); } finally { setBusy(false); }
  }
  function reset() { setRows([]); setFileName(""); setSmartText(""); setImageName(""); }
  return <BottomSheet open={open} onOpenChange={(value) => { if (!value && !busy) reset(); onOpenChange(value); }}>
    <BottomSheetContent className="max-h-[92dvh] overflow-y-auto mx-auto w-full max-w-3xl"><BottomSheetHeader><BottomSheetTitle className="flex items-center gap-2"><Sparkles className="size-5" />Smart product import</BottomSheetTitle><BottomSheetDescription>Move a catalogue into Kudi quickly. Upload a spreadsheet, paste a WhatsApp/Telegram-style list, or prepare an image for the smart-capture workflow.</BottomSheetDescription></BottomSheetHeader>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="cursor-pointer rounded-2xl border border-dashed border-border bg-secondary/30 p-5 hover:bg-secondary"><FileSpreadsheet className="size-6" /><p className="mt-3 font-semibold">CSV / Excel</p><p className="mt-1 text-xs text-muted-foreground">Name, price, stock, SKU, barcode and category.</p><input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && void readFile(e.target.files[0])} /></label>
        <div className="rounded-2xl border border-border p-5"><Sparkles className="size-6" /><p className="mt-3 font-semibold">Paste from chat</p><p className="mt-1 text-xs text-muted-foreground">One item per line: Product — ₦30,000.</p><Input value={smartText} onChange={(e) => setSmartText(e.target.value)} className="mt-3" placeholder="Smart Glasses - ₦30,000" /><Button className="mt-2 w-full" variant="outline" onClick={addSmartText}>Extract products</Button></div>
        <label className="cursor-pointer rounded-2xl border border-border p-5 hover:bg-secondary"><ImagePlus className="size-6" /><p className="mt-3 font-semibold">Product list image</p><p className="mt-1 text-xs text-muted-foreground">Upload a screenshot from WhatsApp/Telegram to prepare for OCR.</p><input type="file" accept="image/*" className="hidden" onChange={(e) => setImageName(e.target.files?.[0]?.name ?? "")} />{imageName && <p className="mt-3 truncate text-xs font-medium">{imageName}</p>}</label>
      </div>
      <div className="mt-5 rounded-2xl border border-border overflow-hidden"><div className="flex items-center gap-2 border-b border-border px-4 py-3"><Upload className="size-4" /><span className="font-semibold">Ready to import</span><span className="ml-auto text-xs text-muted-foreground">{validRows.length} rows{fileName ? ` · ${fileName}` : ""}</span></div>{validRows.length ? <div className="max-h-64 overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-secondary"><tr><th className="p-3 text-left">Product</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Stock</th><th className="p-3 text-left">SKU</th></tr></thead><tbody>{validRows.slice(0, 100).map((row, index) => <tr key={`${row.name}-${index}`} className="border-t border-border"><td className="p-3">{row.name}</td><td className="p-3 text-right">₦{row.price.toLocaleString()}</td><td className="p-3 text-right">{row.quantity}</td><td className="p-3">{row.sku || "—"}</td></tr>)}</tbody></table>{validRows.length > 100 && <p className="p-3 text-xs text-muted-foreground">Showing first 100 rows. All {validRows.length} prepared rows will be imported.</p>}</div> : <div className="p-8 text-center text-sm text-muted-foreground">No products prepared yet.</div>}</div>
      {imageName && <div className="mt-3 rounded-xl border border-accent/30 bg-accent-soft p-3 text-sm"><strong>Image captured.</strong> Full OCR extraction is intentionally gated until an OCR/AI provider is configured, so Kudi never silently sends a merchant's private WhatsApp/Telegram screenshot to an unknown third party. You can still paste the image text above and import it now.</div>}
      <div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" disabled={busy} onClick={() => { reset(); onOpenChange(false); }}><X className="size-4" />Cancel</Button><Button className="flex-1" disabled={busy || !validRows.length} onClick={() => void importRows()}>{busy ? "Importing…" : `Import ${validRows.length || ""} product${validRows.length === 1 ? "" : "s"}`}</Button></div>
      <p className="mt-3 text-xs text-muted-foreground">Existing products are matched by SKU first, then barcode, and updated instead of duplicated. New products are created with branch stock in one workflow.</p>
    </BottomSheetContent>
  </BottomSheet>;
}
