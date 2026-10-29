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

/**
 * A catalogue message often contains a product followed by many attributes
 * (brand, RAM, battery, ports, software, etc.). Those attributes must NEVER
 * become products just because they contain a number. A candidate product
 * name is therefore intentionally conservative.
 */
function productCandidate(line: string) {
  const value = clean(line).replace(/^[•●▪🔸🔹➤→-]+\s*/, "");
  if (!value || value.length < 3 || value.length > 140) return false;
  if (/:/.test(value)) return false;
  if (/\b(?:yes|no|excellent|good|available|windows|chrome|vlc|microsoft office)\b/i.test(value) && value.split(/\s+/).length <= 5) return false;
  if (/^(?:price|basic details|special features|free software installation|condition|useful for|brand|model|type|storage|ram|supported os|battery(?: health| backup)?|bluetooth|hdmi|webcam|usb(?: port)?s?|chrome|microsoft office|vlc|with)$/i.test(value)) return false;
  if (/^(?:for|useful for)\b/i.test(value)) return false;
  if (/^[A-Z][A-Z\s\d&-]{3,}$/.test(value) && !/[a-z]/.test(value)) return false;
  if (/^\d+(?:gb|tb|mb|hours?|hrs?|pcs?|pieces?|port|ports?)?$/i.test(value)) return false;
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

function looksLikeDetailLine(line: string) {
  const value = clean(line).replace(/^[•●▪🔸🔹➤→-]+\s*/, "");
  return /:/.test(value) || /^(?:brand|model|type|storage|ram|supported os|battery|bluetooth|hdmi|webcam|usb|chrome|microsoft office|vlc|condition|with|useful for)\b/i.test(value);
}

export function parseSmartText(text: string): SmartImportRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const rows: SmartImportRow[] = [];
  const used = new Set<number>();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const extracted = extractPrice(line);
    if (!extracted || extracted.price <= 0) continue;

    // If the price is on a dedicated "Price: ..." line, use the nearest
    // genuine title above it. Do not treat specification lines as products.
    let name = line.slice(0, extracted.index).replace(/(?:price\s*[:=-]?|[–—:-])\s*$/i, "").trim();
    if (!productCandidate(name)) {
      for (let distance = 1; distance <= 6; distance += 1) {
        const candidateIndex = i - distance;
        if (candidateIndex < 0 || used.has(candidateIndex)) continue;
        const candidate = lines[candidateIndex];
        if (looksLikeDetailLine(candidate) || !productCandidate(candidate)) continue;
        name = candidate;
        used.add(candidateIndex);
        break;
      }
    }
    if (!productCandidate(name)) continue;

    const context = lines.slice(Math.max(0, i - 6), Math.min(lines.length, i + 3)).join(" ");
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

  // Defensive de-duplication: a single social post should never create the
  // same product more than once when several price-like lines are present.
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.name.toLowerCase()}|${row.price}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
