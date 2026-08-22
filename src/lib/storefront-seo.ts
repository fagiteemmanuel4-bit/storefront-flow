export type StorefrontSeoStore = {
  name: string;
  slug: string;
  description?: string | null;
  logoUrl?: string | null;
  phone?: string | null;
  email?: string | null;
  category?: string | null;
  address?: string | null;
  url: string;
};

export type StorefrontSeoProduct = {
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  imageUrl?: string | null;
  sku?: string | null;
  brand?: string | null;
  category?: string | null;
  available: boolean;
  url: string;
};

/**
 * Creates schema.org JSON-LD from verified storefront data only.
 * No ratings, reviews, prices or availability are invented here.
 */
export function buildStoreJsonLd(store: StorefrontSeoStore): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": store.address ? "LocalBusiness" : "Organization",
    name: store.name,
    url: store.url,
  };

  if (store.description) data.description = store.description;
  if (store.logoUrl) data.logo = store.logoUrl;
  if (store.phone) data.telephone = store.phone;
  if (store.email) data.email = store.email;
  if (store.category) data.category = store.category;
  if (store.address) data.address = { "@type": "PostalAddress", streetAddress: store.address };

  return data;
}

export function buildProductJsonLd(product: StorefrontSeoProduct): Record<string, unknown> {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    url: product.url,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: product.currency,
      availability: product.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: product.url,
    },
  };

  if (product.description) data.description = product.description;
  if (product.imageUrl) data.image = [product.imageUrl];
  if (product.sku) data.sku = product.sku;
  if (product.brand) data.brand = { "@type": "Brand", name: product.brand };
  if (product.category) data.category = product.category;

  return data;
}
