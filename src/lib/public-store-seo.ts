export function getPublicStoreCanonicalUrl(slug: string, origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/store/${encodeURIComponent(slug.trim().toLowerCase())}`;
}

export function getPublicProductCanonicalUrl(slug: string, productSlug: string, origin?: string) {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/store/${encodeURIComponent(slug.trim().toLowerCase())}/products/${encodeURIComponent(productSlug)}`;
}

export function buildStoreJsonLd(store: {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  slug: string;
  email?: string | null;
  phone?: string | null;
}, origin?: string) {
  const sameAs: string[] = [];
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: store.name,
    url: getPublicStoreCanonicalUrl(store.slug, origin),
  };
  if (store.description) data.description = store.description;
  if (store.logoUrl) data.logo = store.logoUrl;
  if (store.email) data.email = store.email;
  if (store.phone) data.telephone = store.phone;
  if (sameAs.length) data.sameAs = sameAs;
  return data;
}

export function buildProductJsonLd(product: {
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  imageUrls?: string[];
  sku?: string | null;
  category?: string | null;
  available: boolean;
  slug: string;
  storeSlug: string;
  brandName?: string | null;
}, origin?: string) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: getPublicProductCanonicalUrl(product.storeSlug, product.slug, origin),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: getPublicProductCanonicalUrl(product.storeSlug, product.slug, origin),
    },
  };
  if (product.description) data.description = product.description;
  if (product.imageUrls?.length) data.image = product.imageUrls;
  if (product.sku) data.sku = product.sku;
  if (product.category) data.category = product.category;
  if (product.brandName) data.brand = { "@type": "Brand", name: product.brandName };
  return data;
}
