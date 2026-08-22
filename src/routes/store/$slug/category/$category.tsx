import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { formatMoney } from "@/lib/currency";
import { publicProductPath } from "@/lib/public-store-links";

export const Route = createFileRoute("/store/$slug/category/$category")({
  component: PublicStoreCategoryPage,
});

type Product = {
  product_id: string;
  product_slug: string;
  product_name: string;
  product_price: number;
  currency: string;
  image_url: string | null;
  available: boolean;
};

function PublicStoreCategoryPage() {
  const { slug, category } = Route.useParams();
  const decodedCategory = decodeURIComponent(category);
  const products = useQuery({
    queryKey: ["public-store-category", slug, decodedCategory],
    queryFn: async () => {
      const { data, error } = await onlineSupabase.rpc("get_public_store_category_products", {
        _store_slug: slug,
        _category: decodedCategory,
        _limit: 100,
      });
      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    },
    staleTime: 30_000,
  });

  return (
    <main className="min-h-screen bg-background px-5 py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/store/$slug" params={{ slug }} className="text-sm font-semibold underline">
          Back to store
        </Link>
        <p className="mt-10 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Category</p>
        <h1 className="mt-2 font-display text-4xl font-bold capitalize">{decodedCategory}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{products.data?.length ?? 0} published products</p>

        {products.isLoading && <div className="mt-10 text-sm text-muted-foreground">Loading products…</div>}
        {products.error && <div className="mt-10 rounded-2xl border p-6 text-sm">Products could not be loaded.</div>}
        {!products.isLoading && !products.error && products.data?.length === 0 && (
          <div className="mt-10 rounded-2xl border p-10 text-center text-sm text-muted-foreground">
            No published products are available in this category.
          </div>
        )}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.data?.map((product) => (
            <Link
              key={product.product_id}
              to={publicProductPath(slug, product.product_slug) as never}
              className="overflow-hidden rounded-3xl border bg-card transition hover:-translate-y-1"
            >
              <div className="aspect-square bg-muted">
                {product.image_url && <img src={product.image_url} alt={product.product_name} className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="p-4">
                <h2 className="font-semibold">{product.product_name}</h2>
                <p className="mt-2 font-bold">{formatMoney(product.product_price, product.currency)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.available ? "In stock" : "Out of stock"}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
