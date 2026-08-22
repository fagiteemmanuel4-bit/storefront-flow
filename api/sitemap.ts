import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const publicSiteUrl = (process.env.VITE_PUBLIC_SITE_URL || "").replace(/\/$/, "");

export default async function handler(_request: VercelRequest, response: VercelResponse) {
  if (!supabaseUrl || !serviceKey || !publicSiteUrl) {
    return response.status(503).type("text/plain").send("Sitemap is not configured");
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [{ data: stores, error: storesError }, { data: products, error: productsError }] = await Promise.all([
    supabase.rpc("get_public_sitemap_stores", { _limit: 5000 }),
    supabase.rpc("get_public_sitemap_products", { _limit: 50000 }),
  ]);
  if (storesError || productsError) return response.status(502).type("text/plain").send("Unable to generate sitemap");

  const urls = new Map<string, string>();
  for (const store of stores || []) urls.set(`/store/${encodeURIComponent(store.store_slug)}`, store.updated_at);
  for (const product of products || []) urls.set(`/store/${encodeURIComponent(product.store_slug)}/products/${encodeURIComponent(product.product_slug)}`, product.updated_at);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...urls.entries()].map(([path, updated]) => `  <url><loc>${escapeXml(publicSiteUrl + path)}</loc><lastmod>${new Date(updated).toISOString()}</lastmod></url>`).join("\n")}\n</urlset>`;
  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return response.status(200).send(xml);
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '\"': "&quot;" })[c] || c);
}
