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

function parseSmartText(text: string): ImportRow[] {
  const rows: ImportRow[] = [];
  for (const rawLine of text.split(/\r?\n/).map((v) => v.trim()).filter(Boolean)) {
    const line = rawLine.replace(/\s+/g, " ");
    const currencyMatch = line.match(/(?:₦|NGN|N)\s*([0-9][0-9,]*(?:\.\d{1,2})?\s*[kKmM]?)/i);
    const plainMatch = currencyMatch ? null : line.match(/(?:^|\s)([0-9]{1,3}(?:,[0-9]{3})+(?:\.\d{1,2})?|[0-9]{4,}(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?\s*[kKmM])(?:\s*$|\s)/);
    const match = currencyMatch ?? plainMatch;
    if (!match) continue;
    const price = money(match[1]);
    if (!price || price < 0) continue;
    const name = line.slice(0, match.index ?? 0).replace(/[–—:-]+\s*$/, "").trim() || line.slice((match.index ?? 0) + match[0].length).replace(/^[–—:-]+\s*/, "").trim();
    if (!name || name.length < 2) continue;
    rows.push({ name, sku: "", barcode: "", category: "", price, cost: 0, quantity: 0, lowStockThreshold: 5 });
  }
  return rows;
}

function dedupeRows(rows: ImportRow[]) {
  const map = new Map<string, ImportRow>();
  for (const row of rows) {
    const key = row.sku ? `sku:${row.sku.toLowerCase()}` : row.barcode ? `barcode:${row.barcode}` : `name:${normalizeName(row.name)}`;
    map.set(key, row);
  }
  return Array.from(map.values());
}

function downloadTemplate() {
  const csv = ["name,sku,barcode,category,price,cost,quantity,low stock threshold", "Smart Glasses,SG-001,1234567890123,Electronics,30000,18000,20,5"].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "kudi-product-import-template.csv";
  anchor.click();
  URL.revokeObjectURL(url);
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
      else if (file.name.toLowerCase().endsWith(".xlsx")) {
        const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await file.arrayBuffer()); const sheet = workbook.worksheets[0]; const values: string[][] = [];
        sheet.eachRow((row) => values.push((row.values as unknown[]).slice(1).map(clean))); setRows(mapRows(values));
      } else throw new Error("Use a CSV or XLSX file. Legacy .xls files are not supported.");
    } catch (error) { toast.error(errorMessage(error, "The file could not be read.")); setFileName(""); }
  }

  function addSmartText() {
    const parsed = parseSmartText(smartText);
    if (!parsed.length) { toast.error("We couldn't find product names with prices. Try one product per line, e.g. Smart Glasses - ₦30,000."); return; }
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
        if (!parsed.length) { toast.error("The image was read, but no confident product name + price pairs were found. You can paste the text below and correct it before importing."); return; }
        setRows((current) => [...current, ...parsed]);
        toast.success(`${parsed.length} product${parsed.length === 1 ? "" : "s"} extracted locally — review before importing`);
      } finally { await worker.terminate(); }
    } catch (error) {
      toast.error(errorMessage(error, "Local OCR could not read this image."));
    } finally { setOcrBusy(false); }
  }

  async function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const image = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
    if (!image) return;
    event.preventDefault(); const file = image.getAsFile(); if (file) await readImage(file);
  }

  async function importRows() {
    if (!validRows.length) return; setBusy(true);
    try {
      let created = 0;
      let updated = 0;
      let processed = 0;
      for (let i = 0; i < validRows.length; i += 5000) {
        const chunk = validRows.slice(i, i + 5000);
        const { data, error } = await supabase.rpc("bulk_import_products", { _store_id: storeId, _branch_id: branchId, _rows: chunk });
        if (error) throw new Error(error.message);
        const result = data as { created?: number; updated?: number; processed?: number } | null;
        created += Number(result?.created ?? 0);
        updated += Number(result?.updated ?? 0);
        processed += Number(result?.processed ?? chunk.length);
      }
      await onImported();
      toast.success(`${created} added · ${updated} updated · ${processed} processed`);
      reset(); onOpenChange(false);
    } catch (error) { toast.error(errorMessage(error, "Import stopped. No further batches were processed.")); } finally { setBusy(false); }
  }

  function reset() { setRows([]); setFileName(""); setSmartText(""); setImageName(""); setOcrText(""); setImagePreview((current) => { if (current) URL.revokeObjectURL(current); return ""; }); }

  return <BottomSheet open={open} onOpenChange={(value) => { if (!value && !busy && !ocrBusy) reset(); onOpenChange(value); }}>
    <BottomSheetContent className="max-h-[92dvh] overflow-y-auto mx-auto w-full max-w-4xl"><BottomSheetHeader><BottomSheetTitle className="flex items-center gap-2"><Sparkles className="size-5" />Smart product import</BottomSheetTitle><BottomSheetDescription>Move a catalogue into Kudi quickly. Upload a spreadsheet, paste a WhatsApp/Telegram list, or drop/paste a screenshot. OCR runs locally in your browser so the image is not sent to an AI provider.</BottomSheetDescription></BottomSheetHeader>
      <div className="grid gap-4 md:grid-cols-3" onPaste={(event) => void handlePaste(event)}>
        <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-5 hover:bg-secondary"><FileSpreadsheet className="size-6" /><p className="mt-3 font-semibold">CSV / Excel</p><p className="mt-1 text-xs text-muted-foreground">Name, price, stock, SKU, barcode and category.</p><div className="mt-3 flex gap-2"><label className="flex-1"><Button asChild variant="outline" className="w-full"><span>Choose file</span></Button><input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => e.target.files?.[0] && void readFile(e.target.files[0])} /></label><Button type="button" variant="ghost" onClick={downloadTemplate}>Template</Button></div></div>
        <div className="rounded-2xl border border-border p-5"><ClipboardPaste className="size-6" /><p className="mt-3 font-semibold">Paste from chat</p><p className="mt-1 text-xs text-muted-foreground">Paste text copied from WhatsApp, Telegram or another catalogue.</p><Input value={smartText} onChange={(e) => setSmartText(e.target.value)} className="mt-3" placeholder="Smart Glasses - ₦30,000" /><Button className="mt-2 w-full" variant="outline" onClick={addSmartText}>Extract products</Button></div>
        <label className="cursor-pointer rounded-2xl border border-border p-5 hover:bg-secondary"><ImagePlus className="size-6" /><p className="mt-3 font-semibold">Screenshot / image</p><p className="mt-1 text-xs text-muted-foreground">WhatsApp/Telegram screenshot, flyer or price list. You can also paste an image directly here.</p><input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && void readImage(e.target.files[0])} />{imageName && <p className="mt-3 truncate text-xs font-medium">{imageName}</p>}</label>
      </div>
      {imagePreview && <div className="mt-4 grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[180px_1fr]"><img src={imagePreview} alt="Catalogue image preview" className="h-32 w-full rounded-xl object-cover sm:h-36" /><div><div className="flex items-center gap-2"><p className="font-semibold">Local OCR result</p>{ocrBusy && <LoaderCircle className="size-4 animate-spin" />}</div><p className="mt-2 max-h-28 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{ocrText || "Preparing OCR…"}</p></div></div>}
      <div className="mt-5 rounded-2xl border border-border overflow-hidden"><div className="flex items-center gap-2 border-b border-border px-4 py-3"><Upload className="size-4" /><span className="font-semibold">Ready to import</span><span className="ml-auto text-xs text-muted-foreground">{validRows.length} unique rows{fileName ? ` · ${fileName}` : ""}</span></div>{validRows.length ? <div className="max-h-64 overflow-auto"><table className="w-full text-sm"><thead className="sticky top-0 bg-secondary"><tr><th className="p-3 text-left">Product</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Stock</th><th className="p-3 text-left">SKU</th></tr></thead><tbody>{validRows.slice(0, 100).map((row, index) => <tr key={`${row.name}-${row.sku || row.barcode}-${index}`} className="border-t border-border"><td className="p-3">{row.name}</td><td className="p-3 text-right">₦{row.price.toLocaleString()}</td><td className="p-3 text-right">{row.quantity}</td><td className="p-3">{row.sku || "—"}</td></tr>)}</tbody></table>{validRows.length > 100 && <p className="p-3 text-xs text-muted-foreground">Showing first 100 rows. All {validRows.length} prepared rows will be imported.</p>}</div> : <div className="p-8 text-center text-sm text-muted-foreground">No products prepared yet.</div>}</div>
      <div className="mt-4 flex gap-2"><Button variant="outline" className="flex-1" disabled={busy || ocrBusy} onClick={() => { reset(); onOpenChange(false); }}><X className="size-4" />Cancel</Button><Button className="flex-1" disabled={busy || ocrBusy || !validRows.length} onClick={() => void importRows()}>{busy ? "Importing…" : `Import ${validRows.length || ""} product${validRows.length === 1 ? "" : "s"}`}</Button></div>
      <p className="mt-3 text-xs text-muted-foreground">Bulk imports are processed server-side in batches of up to 5,000 rows. Existing products match by SKU first, then barcode, then exact normalized name. Duplicate rows in the same import are collapsed. Review every extracted price before publishing or selling.</p>
    </BottomSheetContent>
  </BottomSheet>;
}
