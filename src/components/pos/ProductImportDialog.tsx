import { useEffect, useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { ClipboardPaste, FileSpreadsheet, ImagePlus, LoaderCircle, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { errorMessage } from "@/lib/format";
import { parseSmartText, type SmartImportRow } from "@/lib/smart-import-parser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomSheet, BottomSheetContent, BottomSheetDescription, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";

type ImportRow = SmartImportRow;
type Props = { open: boolean; onOpenChange: (open: boolean) => void; storeId: string; branchId: string; onImported: () => Promise<void> | void };

function clean(value: unknown) { return String(value ?? "").trim(); }
function money(value: unknown) {
  const raw = clean(value).replace(/[₦$€£,\s]/g, "").toLowerCase();
  const multiplier = raw.endsWith("m") ? 1_000_000 : raw.endsWith("k") ? 1_000 : 1;
  const n = Number(raw.replace(/[km]$/, ""));
  return Number.isFinite(n) ? n * multiplier : 0;
}
function integer(value: unknown, fallback = 0) { const n = Number(clean(value).replace(/[,\s]/g, "")); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback; }
function normalizeHeader(value: unknown) { return clean(value).toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " "); }
function normalizeName(value: string) { return clean(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]; const next = text[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) { if (char === "\r" && next === "\n") i += 1; row.push(cell); if (row.some((v) => v.trim())) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  if (cell || row.length) { row.push(cell); if (row.some((v) => v.trim())) rows.push(row); }
  return rows;
}

function mapRows(rows: string[][]): ImportRow[] {
  if (!rows.length) return [];
  const headers = rows[0].map(normalizeHeader);
  const aliases: Record<string, string[]> = {
    name: ["name", "product", "product name", "item", "item name", "title"],
    sku: ["sku", "stock keeping unit"], barcode: ["barcode", "bar code", "ean", "upc"], category: ["category", "type", "group"],
    price: ["price", "selling price", "sale price", "unit price"], cost: ["cost", "cost price", "buying price", "purchase price"],
    quantity: ["quantity", "qty", "stock", "opening stock", "inventory"], lowStockThreshold: ["low stock threshold", "low stock", "reorder level", "reorder point"],
  };
  const indexes = Object.fromEntries(Object.keys(aliases).map((key) => [key, headers.findIndex((h) => aliases[key].includes(h))]));
  const output: ImportRow[] = [];
  for (const values of rows.slice(1)) {
    const get = (key: keyof typeof indexes) => indexes[key] >= 0 ? values[indexes[key]] : "";
    const name = clean(get("name"));
    if (!name) continue;
    output.push({ name, sku: clean(get("sku")), barcode: clean(get("barcode")), category: clean(get("category")), price: money(get("price")), cost: money(get("cost")), quantity: integer(get("quantity")), lowStockThreshold: integer(get("lowStockThreshold"), 5) });
  }
  return output;
}

function dedupeRows(rows: ImportRow[]) {
  const map = new Map<string, ImportRow>();
  for (const row of rows) {
    const key = row.sku ? `sku:${row.sku.toLowerCase()}` : row.barcode ? `barcode:${row.barcode}` : `name:${normalizeName(row.name)}`;
    map.set(key, row);
  }
  return Array.from(map.values());
}

export function ProductImportDialog({ open, onOpenChange, storeId, branchId, onImported }: Props) {
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [smartText, setSmartText] = useState("");
  const [busy, setBusy] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [imageName, setImageName] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [ocrText, setOcrText] = useState("");
  const validRows = useMemo(() => dedupeRows(rows.filter((row) => row.name && row.price >= 0)), [rows]);

  useEffect(() => () => { if (imagePreview) URL.revokeObjectURL(imagePreview); }, [imagePreview]);

  async function readFile(file: File) {
    setFileName(file.name); setRows([]); setOcrText("");
    try {
      if (file.name.toLowerCase().endsWith(".csv")) setRows(mapRows(parseCsv(await file.text())));
      else if (/\.xlsx?$/i.test(file.name)) {
        const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await file.arrayBuffer()); const sheet = workbook.worksheets[0]; const values: string[][] = [];
        sheet.eachRow((row) => values.push((row.values as unknown[]).slice(1).map(clean))); setRows(mapRows(values));
      } else throw new Error("Use a CSV or XLSX file. Legacy XLS is not supported in the browser importer.");
    } catch (error) { toast.error(errorMessage(error, "The file could not be read.")); setFileName(""); }
  }

  function addSmartText() {
    const parsed = parseSmartText(smartText);
    if (!parsed.length) { toast.error("Kudi couldn't confidently find a product with a price. Put each product and its price in the same message or use the structured template."); return; }
    setRows((current) => [...current, ...parsed]); setSmartText(""); toast.success(`${parsed.length} product${parsed.length === 1 ? "" : "s"} prepared`);
  }

  async function readImage(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    if (file.size > 12 * 1024 * 1024) { toast.error("Image is too large. Keep it under 12 MB for local OCR."); return; }
    setImageName(file.name); setOcrText(""); setOcrBusy(true);
    setImagePreview((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(file); });
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, { logger: (message) => { if (message.status === "recognizing text" && typeof message.progress === "number") setOcrText(`Reading image… ${Math.round(message.progress * 100)}%`); } });
      try {
        const { data } = await worker.recognize(file);
        const text = data.text.trim();
        setOcrText(text);
        const parsed = parseSmartText(text);
        if (!parsed.length) { toast.error("The image was read, but Kudi couldn't confidently find product + price pairs. Review the OCR text and correct it before importing."); return; }
        setRows((current) => [...current, ...parsed]);
        toast.success(`${parsed.length} product${parsed.length === 1 ? "" : "s"} extracted locally — review before importing`);
      } finally { await worker.terminate(); }
    } catch (error) { toast.error(errorMessage(error, "Local OCR could not read this image.")); }
    finally { setOcrBusy(false); }
  }

  async function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const image = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
    if (!image) return;
    event.preventDefault(); const file = image.getAsFile(); if (file) await readImage(file);
  }

  async function importRows() {
    if (!validRows.length) return; setBusy(true);
    try {
      const { data: existing, error: existingError } = await supabase.from("products").select("id,name,sku,barcode").eq("store_id", storeId).eq("is_active", true);
      if (existingError) throw new Error(existingError.message);
      const bySku = new Map((existing ?? []).filter((p) => p.sku).map((p) => [p.sku!.trim().toLowerCase(), p.id]));
      const byBarcode = new Map((existing ?? []).filter((p) => p.barcode).map((p) => [p.barcode!.trim(), p.id]));
      const byName = new Map((existing ?? []).map((p) => [normalizeName(p.name), p.id]));
      let created = 0, updated = 0;
      const process = async (row: ImportRow) => {
        const existingId = (row.sku && bySku.get(row.sku.toLowerCase())) || (row.barcode && byBarcode.get(row.barcode)) || byName.get(normalizeName(row.name)) || null;
        let productId = existingId;
        const payload = { store_id: storeId, name: row.name, sku: row.sku, barcode: row.barcode, category: row.category, price: row.price, cost: row.cost, low_stock_threshold: row.lowStockThreshold };
        if (existingId) { const { error } = await supabase.from("products").update(payload).eq("id", existingId); if (error) throw new Error(`${row.name}: ${error.message}`); updated += 1; }
        else { const { data, error } = await supabase.from("products").insert(payload).select("id").single(); if (error) throw new Error(`${row.name}: ${error.message}`); productId = data.id; created += 1; }
        if (!productId) throw new Error(`No product id returned for ${row.name}.`);
        const { error: stockError } = await supabase.from("branch_stock").upsert({ branch_id: branchId, product_id: productId, store_id: storeId, quantity: row.quantity }, { onConflict: "branch_id,product_id" });
        if (stockError) throw new Error(`${row.name}: ${stockError.message}`);
      };
      for (let i = 0; i < validRows.length; i += 8) await Promise.all(validRows.slice(i, i + 8).map(process));
      await onImported(); toast.success(`${created} added · ${updated} updated`); reset(); onOpenChange(false);
    } catch (error) { toast.error(errorMessage(error, "Import stopped. Review the rows and try again.")); } finally { setBusy(false); }
  }

  function reset() { setRows([]); setFileName(""); setSmartText(""); setImageName(""); setOcrText(""); setImagePreview((current) => { if (current) URL.revokeObjectURL(current); return ""; }); }

  return <BottomSheet open={open} onOpenChange={(value) => { if (!value && !busy && !ocrBusy) reset(); onOpenChange(value); }}>
    <BottomSheetContent className="kudi-import-sheet max-h-[94dvh] overflow-y-auto mx-auto w-full max-w-4xl"><BottomSheetHeader><BottomSheetTitle className="flex items-center gap-2"><Sparkles className="size-5" />Smart product import</BottomSheetTitle><BottomSheetDescription>Move a catalogue into Kudi quickly. Upload a spreadsheet, paste a WhatsApp/Telegram list, or drop/paste a screenshot. OCR runs locally in your browser so the image is not sent to an AI provider.</BottomSheetDescription></BottomSheetHeader>
      <div className="grid gap-3 md:grid-cols-3" onPaste={(event) => void handlePaste(event)}>
        <label className="kudi-import-option cursor-pointer rounded-2xl border border-dashed border-border bg-secondary/30 p-4 hover:bg-secondary"><FileSpreadsheet className="size-6" /><p className="mt-3 font-semibold">CSV / Excel</p><p className="mt-1 text-xs text-muted-foreground">Name, price, stock, SKU, barcode and category.</p><input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && void readFile(e.target.files[0])} /></label>
        <div className="kudi-import-option rounded-2xl border border-border p-4"><ClipboardPaste className="size-6" /><p className="mt-3 font-semibold">Paste from chat</p><p className="mt-1 text-xs text-muted-foreground">Paste text copied from WhatsApp, Telegram or another catalogue.</p><Input value={smartText} onChange={(e) => setSmartText(e.target.value)} className="mt-3" placeholder="Smart Glasses - ₦30,000" /><Button className="mt-2 w-full" variant="outline" onClick={addSmartText}>Extract products</Button></div>
        <label className="kudi-import-option cursor-pointer rounded-2xl border border-border p-4 hover:bg-secondary"><ImagePlus className="size-6" /><p className="mt-3 font-semibold">Screenshot / image</p><p className="mt-1 text-xs text-muted-foreground">WhatsApp/Telegram screenshot, flyer or price list. You can also paste an image directly here.</p><input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void readImage(e.target.files[0])} />{imageName && <p className="mt-3 truncate text-xs font-medium">{imageName}</p>}</label>
      </div>
      {imagePreview && <div className="mt-4 grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[180px_1fr]"><img src={imagePreview} alt="Catalogue image preview" className="h-32 w-full rounded-xl object-cover sm:h-36" /><div><div className="flex items-center gap-2"><p className="font-semibold">Local OCR result</p>{ocrBusy && <LoaderCircle className="size-4 animate-spin" />}</div><p className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{ocrText || "Preparing OCR…"}</p></div></div>}
      <div className="mt-5 rounded-2xl border border-border overflow-hidden"><div className="flex items-center gap-2 border-b border-border px-4 py-3"><Upload className="size-4" /><span className="font-semibold">Ready to import</span><span className="ml-auto text-xs text-muted-foreground">{validRows.length} unique rows{fileName ? ` · ${fileName}` : ""}</span></div>{validRows.length ? <div className="max-h-64 overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-secondary"><tr><th className="p-3 text-left">Product</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Stock</th><th className="p-3 text-left">SKU</th></tr></thead><tbody>{validRows.slice(0, 100).map((row, index) => <tr key={`${row.name}-${row.sku || row.barcode}-${index}`} className="border-t border-border"><td className="p-3">{row.name}</td><td className="p-3 text-right">₦{row.price.toLocaleString()}</td><td className="p-3 text-right">{row.quantity}</td><td className="p-3">{row.sku || "—"}</td></tr>)}</tbody></table>{validRows.length > 100 && <p className="p-3 text-xs text-muted-foreground">Showing first 100 rows. All {validRows.length} prepared rows will be imported.</p>}</div> : <div className="p-8 text-center text-sm text-muted-foreground">No products prepared yet.</div>}</div>
      <div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" disabled={busy || ocrBusy} onClick={() => { reset(); onOpenChange(false); }}><X className="size-4" />Cancel</Button><Button className="flex-1" disabled={busy || ocrBusy || !validRows.length} onClick={() => void importRows()}>{busy ? "Importing…" : `Import ${validRows.length || ""} product${validRows.length === 1 ? "" : "s"}`}</Button></div>
      <p className="mt-3 text-xs text-muted-foreground">Existing products are matched by SKU first, then barcode, then exact normalized name. Duplicate rows in the same import are collapsed. Review every extracted price before publishing or selling.</p>
    </BottomSheetContent>
  </BottomSheet>;
}
