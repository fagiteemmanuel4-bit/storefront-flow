import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Camera, Check, ClipboardPaste, FileImage, FileText, ImagePlus, LoaderCircle, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { errorMessage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/stock-sense")({ component: StockSensePage });

type SenseRow = {
  name: string;
  packs: number;
  unitsPerPack: number;
  loosePieces: number;
  packPrice: number;
  piecePrice: number;
  category: string;
  sku: string;
  barcode: string;
  confidence: number;
};

type Source = "whatsapp" | "telegram" | "handwritten" | "printed" | "notebook" | "text";

const money = (v: string) => {
  const raw = v.replace(/[₦$€£,\s]/g, "").toLowerCase();
  const multiplier = raw.endsWith("m") ? 1_000_000 : raw.endsWith("k") ? 1_000 : 1;
  const n = Number(raw.replace(/[km]$/, ""));
  return Number.isFinite(n) ? n * multiplier : 0;
};
const integer = (v: string, fallback = 0) => {
  const n = Number(v.replace(/[^0-9-]/g, ""));
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : fallback;
};
const normalize = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

function categoryFor(name: string) {
  const n = name.toLowerCase();
  if (/milk|milo|rice|bread|sugar|oil|drink|water|biscuit|noodle|food/.test(n)) return "Groceries";
  if (/shirt|trouser|dress|shoe|sandal|bag|cap|fashion/.test(n)) return "Fashion";
  if (/phone|charger|cable|earbud|headphone|case|usb|laptop|electronics/.test(n)) return "Electronics";
  if (/soap|cream|lotion|shampoo|beauty|cosmetic/.test(n)) return "Beauty";
  return "General";
}

function parseLine(line: string, confidence: number): SenseRow | null {
  const cells = line.split(/\||\t|\s{2,}/).map((v) => v.trim()).filter(Boolean);
  if (cells.length >= 6) {
    const name = cells[0];
    if (!name || /^(product|name)$/i.test(name)) return null;
    return {
      name,
      packs: integer(cells[1]),
      unitsPerPack: Math.max(1, integer(cells[2], 1)),
      loosePieces: integer(cells[3]),
      packPrice: money(cells[4]),
      piecePrice: money(cells[5]),
      category: cells[6] || categoryFor(name),
      sku: cells[7] || "",
      barcode: cells[8] || "",
      confidence,
    };
  }

  const prices = [...line.matchAll(/(?:₦|NGN|N)?\s*([0-9][0-9,]*(?:\.\d+)?\s*[kKmM]?)/gi)].map((m) => ({ value: m[1], index: m.index ?? 0 }));
  if (prices.length < 1) return null;
  const first = prices[0];
  const name = line.slice(0, first.index).replace(/[|,:-]+\s*$/, "").trim();
  if (!name || /^(product|name)$/i.test(name)) return null;
  const numbers = prices.map((m) => money(m.value));
  const looksLikePackRow = numbers.length >= 5;
  return {
    name,
    packs: looksLikePackRow ? Math.round(numbers[0]) : 0,
    unitsPerPack: looksLikePackRow ? Math.max(1, Math.round(numbers[1] || 1)) : 1,
    loosePieces: looksLikePackRow ? Math.round(numbers[2] || 0) : 0,
    packPrice: looksLikePackRow ? numbers[3] || 0 : 0,
    piecePrice: looksLikePackRow ? numbers[4] || numbers[0] : numbers[0],
    category: categoryFor(name),
    sku: "",
    barcode: "",
    confidence,
  };
}

function parseSenseText(text: string, confidence: number) {
  const seen = new Set<string>();
  return text
    .split(/\r?\n/)
    .map((line) => parseLine(line.trim(), confidence))
    .filter((row): row is SenseRow => Boolean(row && row.name.length > 1))
    .filter((row) => {
      const key = normalize(row.name);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

const sourceLabels: Record<Source, string> = {
  whatsapp: "WhatsApp screenshot",
  telegram: "Telegram screenshot",
  handwritten: "Handwritten sheet",
  printed: "Printed price list",
  notebook: "Photographed notebook",
  text: "Pasted text",
};

function StockSensePage() {
  const { store, branch } = useStoreContext();
  const [busy, setBusy] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [rows, setRows] = useState<SenseRow[]>([]);
  const [source, setSource] = useState<Source>("handwritten");
  const [textInput, setTextInput] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState(0);

  useEffect(() => () => { if (imageUrl) URL.revokeObjectURL(imageUrl); }, [imageUrl]);

  async function analyze(file: File, selectedSource = source) {
    if (!file.type.startsWith("image/")) return toast.error("Choose an image, screenshot or photo.");
    if (file.size > 12 * 1024 * 1024) return toast.error("Keep the image under 12 MB.");
    setBusy(true);
    setRows([]);
    setRawText("");
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    try {
      const { createWorker } = await import("tesseract.js");
      const worker = await createWorker("eng", 1, { logger: (m) => { if (m.status === "recognizing text" && typeof m.progress === "number") setRawText(`Kudi Sense is reading… ${Math.round(m.progress * 100)}%`); } });
      try {
        const { data } = await worker.recognize(file);
        const confidence = Math.max(0, Math.min(100, Math.round(Number(data.confidence ?? 0))));
        setOcrConfidence(confidence);
        setRawText(data.text.trim());
        const parsed = parseSenseText(data.text, confidence);
        setRows(parsed);
        if (!parsed.length) toast.error("Kudi could not find product rows. Retake the photo straight-on with bright, even light.");
        else toast.success(`${parsed.length} row${parsed.length === 1 ? "" : "s"} detected from ${sourceLabels[selectedSource]}. Review before saving.`);
      } finally { await worker.terminate(); }
    } catch (error) {
      toast.error(errorMessage(error, "Kudi Sense could not read this image."));
    } finally { setBusy(false); }
  }

  function analyzeText() {
    const parsed = parseSenseText(textInput, 96);
    if (!parsed.length) return toast.error("Try one product per line, for example: Peak Milk | 10 | 12 | 0 | ₦5000 | ₦500");
    setRows(parsed);
    setRawText(textInput);
    setOcrConfidence(96);
    toast.success(`${parsed.length} product${parsed.length === 1 ? "" : "s"} prepared for review.`);
  }

  async function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const image = Array.from(event.clipboardData.items).find((item) => item.type.startsWith("image/"));
    if (!image) return;
    event.preventDefault();
    const file = image.getAsFile();
    if (file) await analyze(file);
  }

  async function saveRows() {
    if (!store?.id || !branch?.id || !rows.length) return;
    setBusy(true);
    try {
      const { data: existing, error } = await supabase.from("products").select("id,name,sku,barcode").eq("store_id", store.id).eq("is_active", true);
      if (error) throw new Error(error.message);
      const bySku = new Map((existing ?? []).filter((p) => p.sku).map((p) => [p.sku!.toLowerCase(), p.id]));
      const byBarcode = new Map((existing ?? []).filter((p) => p.barcode).map((p) => [p.barcode!, p.id]));
      const byName = new Map((existing ?? []).map((p) => [normalize(p.name), p.id]));
      let created = 0;
      let updated = 0;
      for (const row of rows) {
        const id = (row.sku && bySku.get(row.sku.toLowerCase())) || (row.barcode && byBarcode.get(row.barcode)) || byName.get(normalize(row.name));
        const quantity = row.packs * row.unitsPerPack + row.loosePieces;
        const payload = {
          store_id: store.id,
          name: row.name,
          sku: row.sku,
          barcode: row.barcode,
          category: row.category,
          units_per_pack: Math.max(1, row.unitsPerPack),
          pack_price: row.packPrice,
          piece_price: row.piecePrice,
          price: row.piecePrice || row.packPrice,
        };
        let productId = id;
        if (id) {
          const { error: updateError } = await supabase.from("products").update(payload).eq("id", id);
          if (updateError) throw new Error(`${row.name}: ${updateError.message}`);
          updated += 1;
        } else {
          const { data: product, error: insertError } = await supabase.from("products").insert(payload).select("id").single();
          if (insertError) throw new Error(`${row.name}: ${insertError.message}`);
          productId = product.id;
          created += 1;
        }
        const { error: stockError } = await supabase.from("branch_stock").upsert({ store_id: store.id, branch_id: branch.id, product_id: productId, quantity }, { onConflict: "branch_id,product_id" });
        if (stockError) throw new Error(`${row.name}: ${stockError.message}`);
      }
      toast.success(`${created} added · ${updated} updated`);
      setRows([]);
      setRawText("");
      setTextInput("");
    } catch (error) {
      toast.error(errorMessage(error, "The stock could not be saved."));
    } finally { setBusy(false); }
  }

  function updateRow(index: number, key: keyof SenseRow, value: string) {
    setRows((current) => current.map((row, i) => i === index ? {
      ...row,
      [key]: key === "name" || key === "category" || key === "sku" || key === "barcode" ? value : key.includes("Price") ? money(value) : key === "confidence" ? integer(value) : integer(value),
    } : row));
  }

  const averageConfidence = useMemo(() => rows.length ? Math.round(rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length) : ocrConfidence, [ocrConfidence, rows]);

  return <AppShell title="Kudi Sense — smart stock intake">
    <div className="mx-auto max-w-7xl space-y-5" onPaste={(event) => void handlePaste(event)}>
      <section className="surface-card overflow-hidden">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_.9fr]">
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 text-sm font-semibold text-accent-ink"><Sparkles className="size-4" />Kudi Sense</div>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Give Kudi the stock information you already have.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Use a WhatsApp or Telegram screenshot, handwritten sheet, printed price list, photographed notebook, or pasted text. Kudi Sense turns messy catalogue information into a reviewable stock list.</p>
            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(["whatsapp","telegram","handwritten","printed","notebook"] as Source[]).map((item) => <Button key={item} variant={source === item ? "default" : "outline"} className="justify-start" onClick={() => setSource(item)}>{item === "handwritten" ? <Camera className="size-4" /> : <ImagePlus className="size-4" />}{sourceLabels[item]}</Button>)}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background"><Upload className="size-4" />Upload / take photo<input type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && void analyze(e.target.files[0])} /></label>
              <Button variant="outline" className="h-12" onClick={() => document.getElementById("kudi-sense-text")?.scrollIntoView({ behavior: "smooth", block: "center" })}><ClipboardPaste className="size-4" />Paste text instead</Button>
            </div>
          </div>
          <div className="border-t border-border bg-secondary/40 p-6 lg:border-l lg:border-t-0">
            <p className="text-label-caps text-muted-foreground">For handwritten stock</p>
            <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-background text-xs"><table className="w-full min-w-[620px] border-collapse"><thead><tr>{["Product","Packs","Pcs/Pack","Loose Pcs","Pack Price","Piece Price"].map((h) => <th key={h} className="border-b border-r border-border p-2 text-left font-bold">{h}</th>)}</tr></thead><tbody>{[["Peak Milk","10","12","0","5000","500"],["Milo","5","24","3","12000","550"],["" ,"","","","",""]].map((row, r) => <tr key={r}>{row.map((v, i) => <td key={i} className="border-b border-r border-border p-2">{v}</td>)}</tr>)}</tbody></table></div>
            <ol className="mt-4 space-y-2 text-xs leading-5 text-muted-foreground"><li><b>1.</b> Draw these six columns with a ruler.</li><li><b>2.</b> Write one product per row using clear block letters.</li><li><b>3.</b> Use numbers for packs, pieces and prices.</li><li><b>4.</b> Photograph the entire table straight-on in bright light.</li><li><b>5.</b> Kudi calculates <b>packs × pcs/pack + loose pcs</b>.</li></ol>
          </div>
        </div>
      </section>

      <section id="kudi-sense-text" className="surface-card p-5">
        <div className="flex items-center gap-2"><FileText className="size-4" /><div><p className="font-semibold">Paste a catalogue or stock message</p><p className="text-xs text-muted-foreground">Works well with text copied from WhatsApp, Telegram, supplier messages or notes.</p></div></div>
        <Textarea value={textInput} onChange={(e) => setTextInput(e.target.value)} className="mt-3 min-h-28" placeholder={'Peak Milk | 10 | 12 | 0 | ₦5000 | ₦500\nMilo | 5 | 24 | 3 | ₦12000 | ₦550\n\nOr simply: Smart Glasses - ₦30,000'} />
        <Button className="mt-3" onClick={analyzeText}><Sparkles className="size-4" />Understand text</Button>
      </section>

      {imageUrl && <section className="grid gap-4 lg:grid-cols-[280px_1fr]"><div className="surface-card p-3"><img src={imageUrl} alt="Kudi Sense source" className="max-h-80 w-full rounded-xl object-contain" /></div><div className="surface-card p-5"><div className="flex items-center gap-2"><FileImage className="size-4" /><p className="font-semibold">Kudi Sense reading</p></div><pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl bg-secondary p-3 text-xs text-muted-foreground">{rawText || "Reading…"}</pre></div></section>}

      {rows.length > 0 && <section className="surface-card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4"><div><p className="font-semibold">Review {rows.length} detected products</p><p className="text-xs text-muted-foreground">Average confidence: <b>{averageConfidence}%</b>. Kudi never changes inventory until you approve these rows.</p></div><Button className="ml-auto" disabled={busy} onClick={() => void saveRows()}>{busy ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />}One-click import</Button></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1180px] text-sm"><thead><tr className="bg-secondary/50">{["Product","Category","Packs","Pcs/Pack","Loose","Pack price","Piece price","SKU","Barcode","Confidence"].map((h) => <th key={h} className="border-b border-border p-3 text-left text-xs font-bold">{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={`${normalize(row.name)}-${i}`}>{(["name","category","packs","unitsPerPack","loosePieces","packPrice","piecePrice","sku","barcode"] as (keyof SenseRow)[]).map((key) => <td key={key} className="border-b border-border p-2"><Input value={String(row[key])} onChange={(e) => updateRow(i, key, e.target.value)} className="h-9 min-w-24" /></td>)}<td className="border-b border-border p-2"><span className={row.confidence >= 85 ? "font-semibold text-accent-ink" : "font-semibold text-destructive"}>{row.confidence}%</span></td></tr>)}</tbody></table></div>
      </section>}

      <section className="rounded-2xl border border-accent/20 bg-accent-soft p-5"><p className="font-semibold">Kudi Sense is an assistant, not an autopilot.</p><p className="mt-1 text-sm leading-6 text-muted-foreground">OCR can misread handwriting, blurred screenshots or unusual fonts. Always review low-confidence fields. The merchant stays in control of the final inventory change.</p></section>
    </div>
  </AppShell>;
}
