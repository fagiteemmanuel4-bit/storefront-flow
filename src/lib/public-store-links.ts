export function publicCategoryPath(storeSlug: string, category: string) {
  return `/store/${encodeURIComponent(storeSlug)}/category/${encodeURIComponent(category.trim().toLowerCase())}`;
}

export function publicProductPath(storeSlug: string, productSlug: string) {
  return `/store/${encodeURIComponent(storeSlug)}/products/${encodeURIComponent(productSlug)}`;
}
