import { onlineSupabase } from "@/integrations/supabase/online-client";

const siteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, "") || window.location.origin;

export async function buildPublicSitemapXml() {
  const [{ data: stores, error: storesError }, { data: products, error: productsError }] = await Promise.all([
    onlineSupabase.rpc("get_public_sitemap_stores", { _limit: 5000 }),
    onlineSupabase.rpc("get_public_sitemap_products", { _limit: 50000 }),
  ]);
  if (storesError) throw storesError;
  if (productsError) throw productsError;

  const urls = new Map<string, string>();
  for (const store of stores ?? []) urls.set(`/store/${encodeURIComponent(store.store_slug)}`, store.updated_at);
  for (const product of products ?? []) urls.set(`/store/${encodeURIComponent(product.store_slug)}/products/${encodeURIComponent(product.product_slug)}`, product.updated_at);

  const body = [...urls.entries()].map(([path, updatedAt]) => `  <url><loc>${escapeXml(`${siteUrl}${path}`)}</loc><lastmod>${new Date(updatedAt).toISOString()}</lastmod></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function escapeXml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '\"': "&quot;" })[character] ?? character);
}
