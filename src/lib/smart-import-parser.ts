export type SmartImportRow = {
  name: string;
  sku: string;
  barcode: string;
  category: string;
  price: number;
  cost: number;
  quantity: number;
  lowStockThreshold: number;
};

function clean(value: unknown) { return String(value ?? "").trim(); }

function money(value: unknown) {
  const raw = clean(value).replace(/[₦$€£,\s]/g, "").toLowerCase();
  const multiplier = raw.endsWith("m") ? 1_000_000 : raw.endsWith("k") ? 1_000 : 1;
  const n = Number(raw.replace(/[km]$/, ""));
  return Number.isFinite(n) ? n * multiplier : 0;
}

function categoryFor(text: string) {
  const value = text.toLowerCase();
  if (/laptop|computer|desktop|macbook|tablet|iphone|phone|android|earbuds|headset|charger|usb|hdmi|bluetooth/.test(value)) return "Electronics";
  if (/shirt|trouser|dress|shoe|sneaker|bag|jacket|clothing|fashion/.test(value)) return "Fashion";
  if (/milk|milo|rice|bread|sugar|drink|beverage|food|noodle|water/.test(value)) return "Groceries";
  if (/cream|lotion|perfume|soap|makeup|beauty|cosmetic/.test(value)) return "Beauty";
  return "";
}

function productCandidate(line: string) {
  const value = clean(line).replace(/^[•●▪🔸🔹➤→-]+\s*/, "");
  if (!value || value.length < 3 || value.length > 140) return false;
  if (/^(price|basic details|special features|free software installation|condition|useful for|brand|model|type|storage|ram|supported os|battery|bluetooth|hdmi|webcam|usb|chrome|microsoft office|vlc|with)$/i.test(value)) return false;
  if (/^[A-Z][A-Z\s\d&-]{3,}$/.test(value) && !/[a-z]/.test(value)) return false;
  if ((value.match(/:/g) || []).length >= 2) return false;
  if (/^(yes|no|excellent|good|available|windows|chrome|vlc|microsoft office)$/i.test(value)) return false;
  return /[a-zA-Z]/.test(value);
}

function extractPrice(line: string) {
  const currency = line.match(/(?:price\s*[:=-]?\s*)?(?:₦|NGN|N)\s*([0-9][0-9,]*(?:\.\d{1,2})?\s*[kKmM]?)/i);
  if (currency) return { price: money(currency[1]), index: currency.index ?? 0, end: (currency.index ?? 0) + currency[0].length };
  const labelled = line.match(/price\s*[:=-]\s*([0-9][0-9,]*(?:\.\d{1,2})?\s*[kKmM]?)/i);
  if (labelled) return { price: money(labelled[1]), index: labelled.index ?? 0, end: (labelled.index ?? 0) + labelled[0].length };
  const direct = line.match(/(?:^|\s)([0-9]{1,3}(?:,[0-9]{3})+(?:\.\d{1,2})?|[0-9]{4,}(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?\s*[kKmM])(?:\s*$|\s)/);
  if (direct) return { price: money(direct[1]), index: direct.index ?? 0, end: (direct.index ?? 0) + direct[0].length };
  return null;
}

export function parseSmartText(text: string): SmartImportRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const rows: SmartImportRow[] = [];
  const used = new Set<number>();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const extracted = extractPrice(line);
    if (!extracted || extracted.price <= 0) continue;

    let name = line.slice(0, extracted.index).replace(/(?:price\s*[:=-]?|[–—:-])\s*$/i, "").trim();
    if (!productCandidate(name)) {
      for (let distance = 1; distance <= 4; distance += 1) {
        const candidateIndex = i - distance;
        if (candidateIndex < 0 || used.has(candidateIndex)) continue;
        const candidate = lines[candidateIndex];
        if (!productCandidate(candidate)) continue;
        name = candidate;
        used.add(candidateIndex);
        break;
      }
    }
    if (!productCandidate(name)) continue;

    const context = lines.slice(Math.max(0, i - 4), Math.min(lines.length, i + 3)).join(" ");
    const packMatch = context.match(/(\d+)\s*(?:pcs?|pieces?)\s*(?:per|\/)\s*pack/i) || context.match(/(\d+)\s*pcs?\s*\/\s*pack/i);
    const quantityMatch = context.match(/(\d+)\s*(?:packs?|pk)\b/i);
    const quantity = quantityMatch ? Math.max(0, Number(quantityMatch[1]) * (packMatch ? Number(packMatch[1]) : 1)) : 0;

    rows.push({
      name: name.replace(/[–—:-]+\s*$/, "").trim(),
      sku: "",
      barcode: "",
      category: categoryFor(context),
      price: extracted.price,
      cost: 0,
      quantity,
      lowStockThreshold: 5,
    });
  }

  return rows;
}
