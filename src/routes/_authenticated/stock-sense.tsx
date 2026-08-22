import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Check, FileImage, LoaderCircle, Sparkles, Table2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/stock-sense")({ component: StockSensePage });

type SenseRow = { name: string; packs: number; unitsPerPack: number; loosePieces: number; packPrice: number; piecePrice: number; sku: string; barcode: string };
const money = (v: string) => { const n = Number(v.replace(/[₦$€£,\s]/g, "")); return Number.isFinite(n) ? n : 0; };
const integer = (v: string, fallback = 0) => { const n = Number(v.replace(/[^0-9-]/g, "")); return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback; };
function parseLine(line: string): SenseRow | null {
  const cells = line.split(/\||\t|\s{2,}/).map((v) => v.trim()).filter(Boolean);
  if (cells.length >= 6) {
    const name = cells[0]; if (!name || /product|name/i.test(name)) return null;
    return { name, packs: integer(cells[1]), unitsPerPack: Math.max(1, integer(cells[2], 1)), loosePieces: integer(cells[3]), packPrice: money(cells[4]), piecePrice: money(cells[5]), sku: cells[6] ?? "", barcode: cells[7] ?? "" };
  }
  const priceMatches = [...line.matchAll(/(?:₦|NGN|N)?\s*([0-9][0-9,]*(?:\.\d+)?)/gi)].map((m) => ({ value: m[1], index: m.index ?? 0 }));
  if (priceMatches.length < 3) return null;
  const first = priceMatches[0]; const name = line.slice(0, first.index).replace(/[|,:-]+\s*$/, "").trim();
  if (!name || /product|name/i.test(name)) return null;
  const numbers = priceMatches.map((m) => integer(m.value));
  return { name, packs: numbers[0], unitsPerPack: Math.max(1, numbers[1] || 1), loosePieces: numbers[2] || 0, packPrice: numbers[3] || 0, piecePrice: numbers[4] || 0, sku: "", barcode: "" };
}
function parseSenseText(text: string): SenseRow[] { return text.split(/\r?\n/).map((line) => parseLine(line.trim())).filter((row): row is SenseRow => Boolean(row)).filter((row) => row.name.length > 1); }

function StockSensePage() {
  const { store, branch } = useStoreContext();
  const [busy, setBusy] = useState(false); const [imageUrl, setImageUrl] = useState(""); const [rawText, setRawText] = useState(""); const [rows, setRows] = useState<SenseRow[]>([]);
  async function analyze(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Choose a photo or image of your stock sheet.");
    if (file.size > 12 * 1024 * 1024) return toast.error("Keep the photo under 12 MB.");
    setBusy(true); setRows([]); setRawText(""); if (imageUrl) URL.revokeObjectURL(imageUrl); setImageUrl(URL.createObjectURL(file));
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, { logger: (m) => { if (m.status === "recognizing text" && typeof m.progress === "number") setRawText(`Strap Sense is reading the sheet… ${Math.round(m.progress * 100)}%`); } });
      try { const { data } = await worker.recognize(file); setRawText(data.text.trim()); const parsed = parseSenseText(data.text); setRows(parsed); if (!parsed.length) toast.error("Strap could not confidently read a row. Retake the photo with the table flat, bright and easy to read."); else toast.success(`${parsed.length} stock row${parsed.length === 1 ? "" : "s"} detected. Review before saving.`); } finally { await worker.terminate(); }
    } catch (error) { toast.error(errorMessage(error, "Strap Sense could not read this photo.")); } finally { setBusy(false); }
  }
  async function saveRows() {
    if (!store?.id || !branch?.id || !rows.length) return;
    setBusy(true);
    try {
      const db = supabase as any; const { data: existing, error } = await db.from("products").select("id,name,sku,barcode").eq("store_id", store.id).eq("is_active", true); if (error) throw new Error(error.message);
      const bySku = new Map((existing ?? []).filter((p: any) => p.sku).map((p: any) => [p.sku.toLowerCase(), p.id])); const byBarcode = new Map((existing ?? []).filter((p: any) => p.barcode).map((p: any) => [p.barcode, p.id])); const byName = new Map((existing ?? []).map((p: any) => [String(p.name).toLowerCase(), p.id]));
      let created = 0; let updated = 0;
      for (const row of rows) {
        const id = (row.sku && bySku.get(row.sku.toLowerCase())) || (row.barcode && byBarcode.get(row.barcode)) || byName.get(row.name.toLowerCase()); const quantity = row.packs * row.unitsPerPack + row.loosePieces;
        const payload = { store_id: store.id, name: row.name, sku: row.sku, barcode: row.barcode, units_per_pack: Math.max(1, row.unitsPerPack), pack_price: row.packPrice, piece_price: row.piecePrice, price: row.piecePrice };
        let productId = id;
        if (id) { const { error: updateError } = await db.from("products").update(payload).eq("id", id); if (updateError) throw new Error(updateError.message); updated++; }
        else { const { data: product, error: insertError } = await db.from("products").insert(payload).select("id").single(); if (insertError) throw new Error(insertError.message); productId = product.id; created++; }
        const { error: stockError } = await db.from("branch_stock").upsert({ store_id: store.id, branch_id: branch.id, product_id: productId, quantity }, { onConflict: "branch_id,product_id" }); if (stockError) throw new Error(stockError.message);
      }
      toast.success(`${created} added · ${updated} updated`); setRows([]); setRawText("");
    } catch (error) { toast.error(errorMessage(error, "The stock sheet could not be saved.")); } finally { setBusy(false); }
  }
  function updateRow(index: number, key: keyof SenseRow, value: string) { setRows((current) => current.map((row, i) => i === index ? { ...row, [key]: ["name","sku","barcode"].includes(key) ? value : key.includes("Price") ? money(value) : integer(value) } : row)); }

  return <AppShell title="Strap Sense — stock sheet"><div className="mx-auto max-w-6xl space-y-5">
    <div className="surface-card overflow-hidden"><div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]"><div className="p-6 sm:p-8"><div className="flex items-center gap-2 text-sm font-semibold text-accent-ink"><Sparkles className="size-4" />Strap Sense</div><h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Turn a handwritten stock sheet into inventory.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Draw the Strap stock table, write one product per row, take a clear photo, and let Strap prepare the stock in one pass. Always review the detected rows before saving.</p><div className="mt-5 flex flex-wrap gap-2"><label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background"><Camera className="size-4" />Take / choose photo<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && void analyze(e.target.files[0])} /></label><Button variant="outline" className="h-12" onClick={() => toast.info("Use the exact table format shown in the guide on the right.")}><Table2 className="size-4" />Format guide</Button></div></div><div className="border-t border-border bg-secondary/40 p-6 lg:border-l lg:border-t-0"><p className="text-label-caps text-muted-foreground">Draw this table</p><div className="mt-3 overflow-x-auto rounded-xl border border-border bg-background text-xs"><table className="w-full min-w-[620px] border-collapse"><thead><tr>{["Product","Packs","Pcs/Pack","Loose Pcs","Pack Price","Piece Price"].map((h) => <th key={h} className="border-b border-r border-border p-2 text-left font-bold">{h}</th>)}</tr></thead><tbody>{[1,2,3].map((n) => <tr key={n}>{["Peak Milk","10","12","0","5000","500"].map((v,i) => <td key={i} className="border-b border-r border-border p-2">{n === 1 ? v : ""}</td>)}</tr>)}</tbody></table></div><ol className="mt-4 space-y-2 text-xs leading-5 text-muted-foreground"><li><b>1.</b> Draw the same six columns with a ruler.</li><li><b>2.</b> Write clearly in block letters; one product per row.</li><li><b>3.</b> Use numbers only for stock and prices.</li><li><b>4.</b> Photograph the whole table straight-on in bright light.</li><li><b>5.</b> Strap calculates total pieces as <b>packs × pieces/pack + loose pieces</b>.</li></ol></div></div></div>
    {imageUrl && <div className="grid gap-4 lg:grid-cols-[280px_1fr]"><div className="surface-card p-3"><img src={imageUrl} alt="Uploaded stock sheet" className="max-h-80 w-full rounded-xl object-contain" /></div><div className="surface-card p-5"><div className="flex items-center gap-2"><FileImage className="size-4" /><p className="font-semibold">Detected text</p></div><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{rawText || "Reading…"}</pre></div></div>}
    {rows.length > 0 && <div className="surface-card overflow-hidden"><div className="flex flex-wrap items-center gap-3 border-b border-border p-4"><div><p className="font-semibold">Review {rows.length} detected rows</p><p className="text-xs text-muted-foreground">Nothing changes in your stock until you press Save to inventory.</p></div><Button className="ml-auto" disabled={busy} onClick={() => void saveRows()}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}Save to inventory</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-sm"><thead><tr className="bg-secondary/50">{["Product","Packs","Pcs/Pack","Loose","Pack price","Piece price","SKU","Barcode"].map((h) => <th key={h} className="border-b border-border p-3 text-left text-xs font-bold">{h}</th>)}</tr></thead><tbody>{rows.map((row,i) => <tr key={`${row.name}-${i}`}>{(["name","packs","unitsPerPack","loosePieces","packPrice","piecePrice","sku","barcode"] as (keyof SenseRow)[]).map((key) => <td key={key} className="border-b border-border p-2"><Input value={String(row[key])} onChange={(e) => updateRow(i,key,e.target.value)} className="h-9 min-w-24" /></td>)}</tr>)}</tbody></table></div></div>}
    <div className="rounded-2xl border border-warning/30 bg-warning-soft p-4 text-sm"><b>Important:</b> Strap uses the exact table layout to reduce ambiguity and always gives you a review step. For very cursive or unclear handwriting, the browser OCR engine can make mistakes; correct the row before saving. Never rely on an unreadable scan for automatic stock changes.</div>
  </div></AppShell>;
}
