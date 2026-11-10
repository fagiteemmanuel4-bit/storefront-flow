type SitemapResponse = {
  status: (code: number) => SitemapResponse;
  type: (contentType: string) => SitemapResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => SitemapResponse;
};

/** Public storefront URLs are omitted while STRAP's online-store area is offline. */
export default function handler(_request: unknown, response: SitemapResponse) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`;
  response.setHeader("Content-Type", "application/xml; charset=utf-8");
  response.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
  return response.status(200).send(xml);
}
