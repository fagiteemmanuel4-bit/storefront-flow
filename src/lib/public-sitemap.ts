import { onlineSupabase } from "@/integrations/supabase/online-client";

const siteUrl =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  (typeof window !== "undefined" ? window.location.origin : "https://storefront-flow.vercel.app");

export async function buildPublicSitemapXml() {
  const [{ data: stores, error: storesError }, { data: products, error: productsError }] =
    await Promise.all([
      onlineSupabase
        .from("online_stores")
        .select("store_id,slug,updated_at")
        .eq("is_published", true),
      onlineSupabase.from("online_products").select("store_id,slug,updated_at").eq("enabled", true),
    ]);
  if (storesError) throw storesError;
  if (productsError) throw productsError;

  const urls = new Map<string, string>();
  const storeSlugs = new Map((stores ?? []).map((store) => [store.store_id, store.slug]));

  for (const store of stores ?? []) {
    urls.set(`/store/${encodeURIComponent(store.slug)}`, store.updated_at);
  }

  for (const product of products ?? []) {
    const storeSlug = storeSlugs.get(product.store_id);
    if (!storeSlug || !product.slug) continue;
    urls.set(
      `/store/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(product.slug)}`,
      product.updated_at,
    );
  }

  const body = [...urls.entries()]
    .map(
      ([path, updatedAt]) =>
        `  <url><loc>${escapeXml(`${siteUrl}${path}`)}</loc><lastmod>${new Date(updatedAt).toISOString()}</lastmod></url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}

function escapeXml(value: string) {
  return value.replace(
    /[<>&'"]/g,
    (character) =>
      ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[character] ??
      character,
  );
}
