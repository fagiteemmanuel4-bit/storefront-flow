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

function clean(value: unknown) { return String(value ?? "").replace(/\s+/g, " ").trim(); }

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

const headingPattern = /^(price|basic details|special features|free software installation|condition|useful for|brand|model|type|storage|ram|supported os|battery|battery health|battery backup|bluetooth|hdmi|webcam|usb|chrome|microsoft office|vlc|with|features|details|specifications?)\b/i;
const detailPattern = /^(brand|model|type|storage|ram|supported os|battery|battery health|battery backup|bluetooth|hdmi|webcam|usb|chrome|microsoft office|vlc)\s*[:=-]/i;

function stripBullet(value: string) {
  return clean(value).replace(/^[•●▪🔸🔹➤→*\-]+\s*/, "").trim();
}

function productCandidate(line: string) {
  const value = stripBullet(line);
  if (!value || value.length < 3 || value.length > 180) return false;
  if (headingPattern.test(value) || detailPattern.test(value)) return false;
  if (/^(yes|no|excellent|good|available|windows|chrome|vlc|microsoft office)$/i.test(value)) return false;
  if ((value.match(/:/g) || []).length >= 2) return false;
  if (/^\d+(?:\.\d+)?\s*(?:gb|tb|mb|inch|inches|hours?|pcs?|pieces?|ports?)\b/i.test(value)) return false;
  return /[a-zA-Z]/.test(value);
}

function extractPrice(line: string) {
  const value = clean(line);
  const currency = value.match(/(?:price|selling\s+price|sale\s+price)\s*[:=-]?\s*(?:₦|NGN|N)?\s*([0-9][0-9,]*(?:\.\d{1,2})?\s*[kKmM]?)/i)
    || value.match(/(?:₦|NGN)\s*([0-9][0-9,]*(?:\.\d{1,2})?\s*[kKmM]?)/i);
  if (currency) return { price: money(currency[1]), index: currency.index ?? 0, labelled: true };

  // Only accept an unlabelled number when it is clearly a price at the end of a product-like line.
  // This prevents RAM, storage, screen size, battery hours and USB counts from becoming prices.
  const direct = value.match(/(?:^|\s)(?:₦|NGN)?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.\d{1,2})?|[0-9]{4,}(?:\.\d{1,2})?|[0-9]+(?:\.\d{1,2})?\s*[kKmM])\s*$/i);
  if (direct) return { price: money(direct[1]), index: direct.index ?? 0, labelled: false };
  return null;
}

function findProductTitle(lines: string[], priceIndex: number, priceLine: string, priceStart: number, usedTitles: Set<number>) {
  if (priceStart > 0) {
    const before = stripBullet(priceLine.slice(0, priceStart).replace(/[|–—:-]+\s*$/, ""));
    if (productCandidate(before)) return before;
  }

  const candidates: Array<{ name: string; score: number; index: number }> = [];
  for (let distance = 1; distance <= 8; distance += 1) {
    const index = priceIndex - distance;
    if (index < 0 || usedTitles.has(index)) continue;
    const candidate = stripBullet(lines[index]);
    if (!productCandidate(candidate)) continue;
    let score = 0;
    if (/[a-z]/i.test(candidate)) score += 1;
    if (/\b(model|laptop|phone|tablet|watch|shoe|shirt|dress|bag|milk|milo|rice|earbuds|headset|charger|glasses|computer|printer|tv|television)\b/i.test(candidate)) score += 4;
    if (/\b(dell|hp|lenovo|apple|iphone|samsung|tecno|infinix|nike|adidas|coke|coca|peak|milo)\b/i.test(candidate)) score += 3;
    if (candidate.length >= 12) score += 1;
    if (detailPattern.test(candidate) || headingPattern.test(candidate)) score -= 10;
    candidates.push({ name: candidate, score, index });
  }
  candidates.sort((a, b) => b.score - a.score || b.index - a.index);
  return candidates[0] || null;
}

export function parseSmartText(text: string): SmartImportRow[] {
  const lines = text.split(/\r?\n/).map(clean).filter(Boolean);
  const rows: SmartImportRow[] = [];
  const usedTitles = new Set<number>();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const extracted = extractPrice(line);
    if (!extracted || extracted.price <= 0) continue;

    const title = findProductTitle(lines, i, line, extracted.index, usedTitles);
    if (!title || !productCandidate(title.name)) continue;
    usedTitles.add(title.index);

    const context = lines.slice(Math.max(0, i - 8), Math.min(lines.length, i + 4)).join(" ");
    const packMatch = context.match(/(\d+)\s*(?:pcs?|pieces?)\s*(?:per|\/)\s*pack/i);
    const quantityMatch = context.match(/(\d+)\s*(?:packs?|pk)\b/i);
    const quantity = quantityMatch ? Math.max(0, Number(quantityMatch[1]) * (packMatch ? Number(packMatch[1]) : 1)) : 0;

    rows.push({
      name: title.name,
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
