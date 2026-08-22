import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { formatMoney } from "@/lib/currency";
import { buildProductJsonLd, buildStoreJsonLd } from "@/lib/storefront-seo";
import { Button } from "@/components/ui/button";

type PublicProduct = {
  store_id: string; store_slug: string; store_name: string; store_description: string | null; store_logo_url: string | null; currency: string;
  product_id: string; product_slug: string; product_name: string; product_description: string | null; product_price: number; product_sku: string | null;
  product_category: string | null; product_image_url: string | null; product_image_urls: string[] | null; product_featured: boolean; stock_quantity: number; available: boolean;
};

export const Route = createFileRoute("/store/$slug/products/$productSlug")({ ssr: true, component: PublicProductPage });

function PublicProductPage() {
  const { slug, productSlug } = Route.useParams();
  const query = useQuery({
    queryKey: ["public-store-product", slug, productSlug],
    queryFn: async () => {
      const { data, error } = await onlineSupabase.rpc("get_public_store_product", { _store_slug: slug, _product_slug: productSlug });
      if (error) throw new Error(error.message);
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) throw new Error("Product not found");
      return row as PublicProduct;
    }, retry: false,
  });

  if (query.isLoading) return <main className="min-h-screen bg-background p-6"><div className="mx-auto max-w-6xl animate-pulse"><div className="h-6 w-32 rounded bg-secondary" /><div className="mt-8 grid gap-8 lg:grid-cols-2"><div className="aspect-square rounded-[2rem] bg-secondary" /><div className="space-y-5"><div className="h-10 w-2/3 rounded bg-secondary" /><div className="h-6 w-1/3 rounded bg-secondary" /><div className="h-24 rounded bg-secondary" /></div></div></div></main>;
  if (query.error || !query.data) return <main className="flex min-h-screen items-center justify-center bg-background px-5 text-center"><div><ShoppingBag className="mx-auto size-10 text-muted-foreground" /><h1 className="text-display-md mt-5">Product not found</h1><p className="mt-2 text-sm text-muted-foreground">This product may have been unpublished or the link may be incorrect.</p><Link to="/store/$slug" params={{ slug }} className="mt-6 inline-flex"><Button variant="outline" className="rounded-xl">Back to store</Button></Link></div></main>;

  const product = query.data;
  const images = (product.product_image_urls?.length ? product.product_image_urls : [product.product_image_url].filter(Boolean)) as string[];
  const canonical = `/store/${encodeURIComponent(product.store_slug)}/products/${encodeURIComponent(product.product_slug)}`;
  const productJsonLd = buildProductJsonLd({ name: product.product_name, description: product.product_description ?? undefined, url: canonical, imageUrl: images, price: product.product_price, currency: product.currency, sku: product.product_sku ?? undefined, category: product.product_category ?? undefined, available: product.available });
  const storeJsonLd = buildStoreJsonLd({ name: product.store_name, description: product.store_description ?? undefined, logoUrl: product.store_logo_url ?? undefined, url: `/store/${encodeURIComponent(product.store_slug)}` });

  return <main className="min-h-screen bg-background">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd) }} />
    <header className="border-b border-border bg-surface/90 backdrop-blur-xl"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8"><Link to="/store/$slug" params={{ slug }} className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="size-4" /> {product.store_name}</Link><span className="text-xs text-muted-foreground">Official online store</span></div></header>
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8 lg:py-12">
      <nav aria-label="Breadcrumb" className="mb-7 text-xs text-muted-foreground"><Link to="/store/$slug" params={{ slug }} className="hover:underline">{product.store_name}</Link><span className="mx-2">/</span>{product.product_category && <><span>{product.product_category}</span><span className="mx-2">/</span></>}<span className="text-foreground">{product.product_name}</span></nav>
      <section className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,.92fr)] lg:items-start">
        <div className="grid gap-3 sm:grid-cols-2">{images.length ? images.map((image, index) => <div key={`${image}-${index}`} className="overflow-hidden rounded-[1.75rem] border border-border bg-secondary/30"><img src={image} alt={`${product.product_name} — image ${index + 1}`} className="aspect-square h-full w-full object-cover" loading={index === 0 ? "eager" : "lazy"} /></div>) : <div className="flex aspect-square items-center justify-center rounded-[1.75rem] border border-border bg-secondary/40 text-muted-foreground"><ShoppingBag className="size-12" /></div>}</div>
        <article className="lg:sticky lg:top-8"><p className="text-label-caps text-muted-foreground">{product.product_category || "Product"}</p><h1 className="text-display-lg mt-3">{product.product_name}</h1><p className="numeric mt-5 text-2xl font-bold">{formatMoney(product.product_price, product.currency)}</p><p className={`mt-2 text-sm font-semibold ${product.available ? "text-success" : "text-destructive"}`}>{product.available ? `${product.stock_quantity} available` : "Currently out of stock"}</p>{product.product_description && <div className="mt-7 border-t border-border pt-7"><h2 className="font-display text-lg font-semibold">About this product</h2><p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.product_description}</p></div>}<div className="mt-7 border-t border-border pt-7"><p className="text-xs text-muted-foreground">Sold by</p><Link to="/store/$slug" params={{ slug }} className="mt-1 inline-block font-semibold hover:underline">{product.store_name}</Link>{product.product_sku && <p className="mt-3 text-xs text-muted-foreground">SKU: {product.product_sku}</p>}</div><Link to="/store/$slug" params={{ slug }} className="mt-8 inline-flex"><Button size="lg" className="rounded-xl">Continue shopping</Button></Link></article>
      </section>
    </div>
    <footer className="mt-10 border-t border-border px-5 py-8"><div className="mx-auto flex max-w-6xl justify-between gap-4 text-xs text-muted-foreground"><span>{product.store_name}</span><span>Powered by Kudi</span></div></footer>
  </main>;
}
