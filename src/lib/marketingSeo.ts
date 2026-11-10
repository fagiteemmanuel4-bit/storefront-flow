export const SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://storefront-flow.vercel.app"
).replace(/\/$/, "");

export const DEFAULT_OG_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&h=630&q=85";

export function marketingHead({
  title,
  description,
  path,
  image = DEFAULT_OG_IMAGE,
  indexable = true,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  indexable?: boolean;
}) {
  const canonical = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: indexable ? "index, follow, max-image-preview:large" : "noindex, follow" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Strap" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: canonical },
      { property: "og:image", content: image },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
    ],
    links: [{ rel: "canonical", href: canonical }],
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

export function noIndexHead(title: string, description?: string) {
  return {
    meta: [
      { title },
      ...(description ? [{ name: "description", content: description }] : []),
      { name: "robots", content: "noindex, nofollow" },
      { name: "googlebot", content: "noindex, nofollow" },
    ],
  };
}
