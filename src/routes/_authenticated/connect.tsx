import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownUp,
  Bookmark,
  Building2,
  Check,
  ChevronRight,
  CircleHelp,
  Compass,
  ExternalLink,
  MapPin,
  MessageCircle,
  Package,
  Plus,
  Search,
  ShieldAlert,
  Store,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/connect")({
  head: () => ({
    meta: [
      { title: "STRAP Connect — Find products and suppliers" },
      {
        name: "description",
        content: "Discover wholesale products, connect with suppliers and grow your business.",
      },
    ],
  }),
  component: ConnectPage,
});

type Vendor = {
  id: string;
  owner_id: string;
  business_name: string;
  slug: string;
  description: string;
  category: string;
  country: string;
  state: string;
  city: string;
  whatsapp_number: string;
  logo_url: string;
  is_published: boolean;
  created_at: string;
};

type ConnectProduct = {
  id: string;
  vendor_id: string;
  title: string;
  description: string;
  category: string;
  image_url: string;
  wholesale_price: number | string;
  suggested_retail_price: number | string;
  stock_quantity: number;
  min_order_quantity: number;
  unit: string;
  is_active: boolean;
  created_at: string;
  vendor: Pick<
    Vendor,
    "id" | "business_name" | "slug" | "category" | "state" | "city" | "whatsapp_number" | "logo_url"
  >;
};

type Tab = "discover" | "saved" | "my-shop";

const db = supabase as any;
const CATEGORIES = [
  "Fashion",
  "Electronics",
  "Beauty",
  "Phones & accessories",
  "Home & living",
  "Food & groceries",
  "Shoes & bags",
  "General",
];

const money = (value: number | string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

function cleanPhone(value: string) {
  return value.replace(/[^0-9]/g, "");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function safeImage(value: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function whatsappLink(phone: string, message: string) {
  const digits = cleanPhone(phone);
  if (digits.length < 8) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function ConnectPage() {
  const { userId } = useStoreContext();
  const client = useQueryClient();
  const [tab, setTab] = useState<Tab>("discover");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [minOrderFilter, setMinOrderFilter] = useState("all");
  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [vendorForm, setVendorForm] = useState({
    business_name: "",
    category: "Fashion",
    description: "",
    state: "",
    city: "",
    whatsapp_number: "",
    logo_url: "",
  });
  const [productForm, setProductForm] = useState({
    title: "",
    category: "Fashion",
    description: "",
    image_url: "",
    wholesale_price: "",
    suggested_retail_price: "",
    stock_quantity: "0",
    min_order_quantity: "1",
    unit: "piece",
  });

  const productsQuery = useQuery({
    queryKey: ["connect-products"],
    queryFn: async () => {
      const { data, error } = await db
        .from("connect_products")
        .select(
          "id,vendor_id,title,description,category,image_url,wholesale_price,suggested_retail_price,stock_quantity,min_order_quantity,unit,is_active,created_at,vendor:connect_vendors!inner(id,business_name,slug,category,state,city,whatsapp_number,logo_url)",
        )
        .eq("is_active", true)
        .eq("vendor.is_published", true)
        .order("created_at", { ascending: false })
        .limit(120);
      if (error) throw new Error(error.message);
      return (data ?? []) as ConnectProduct[];
    },
    staleTime: 30_000,
  });

  const vendorsQuery = useQuery({
    queryKey: ["connect-vendors"],
    queryFn: async () => {
      const { data, error } = await db
        .from("connect_vendors")
        .select(
          "id,owner_id,business_name,slug,description,category,country,state,city,whatsapp_number,logo_url,is_published,created_at",
        )
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(80);
      if (error) throw new Error(error.message);
      return (data ?? []) as Vendor[];
    },
    staleTime: 30_000,
  });

  const myVendorQuery = useQuery({
    queryKey: ["connect-my-vendor", userId],
    queryFn: async () => {
      const { data, error } = await db
        .from("connect_vendors")
        .select("*")
        .eq("owner_id", userId)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data ?? null) as Vendor | null;
    },
    enabled: Boolean(userId),
  });

  const savedProductsQuery = useQuery({
    queryKey: ["connect-saved-products", userId],
    queryFn: async () => {
      const { data, error } = await db
        .from("connect_saved_products")
        .select("product_id")
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return new Set<string>((data ?? []).map((row: { product_id: string }) => row.product_id));
    },
    enabled: Boolean(userId),
  });

  const savedVendorsQuery = useQuery({
    queryKey: ["connect-saved-vendors", userId],
    queryFn: async () => {
      const { data, error } = await db
        .from("connect_saved_vendors")
        .select("vendor_id")
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      return new Set<string>((data ?? []).map((row: { vendor_id: string }) => row.vendor_id));
    },
    enabled: Boolean(userId),
  });

  const myProductsQuery = useQuery({
    queryKey: ["connect-my-products", myVendorQuery.data?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from("connect_products")
        .select("*")
        .eq("vendor_id", myVendorQuery.data!.id)
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Omit<ConnectProduct, "vendor">[];
    },
    enabled: Boolean(myVendorQuery.data?.id),
  });

  useEffect(() => {
    const vendor = myVendorQuery.data;
    if (!vendor) return;
    setVendorForm({
      business_name: vendor.business_name,
      category: vendor.category,
      description: vendor.description,
      state: vendor.state,
      city: vendor.city,
      whatsapp_number: vendor.whatsapp_number,
      logo_url: vendor.logo_url,
    });
  }, [myVendorQuery.data?.id]);

  const savedProductIds = savedProductsQuery.data ?? new Set<string>();
  const savedVendorIds = savedVendorsQuery.data ?? new Set<string>();
  const products = productsQuery.data ?? [];
  const vendors = vendorsQuery.data ?? [];
  const myVendor = myVendorQuery.data;

  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      const searchable =
        `${product.title} ${product.description} ${product.category} ${product.vendor.business_name} ${product.vendor.city} ${product.vendor.state}`.toLowerCase();
      if (term && !searchable.includes(term)) return false;
      if (category !== "all" && product.category !== category) return false;
      if (stateFilter !== "all" && product.vendor.state !== stateFilter) return false;
      if (minOrderFilter === "small" && product.min_order_quantity > 5) return false;
      if (minOrderFilter === "bulk" && product.min_order_quantity <= 5) return false;
      if (tab === "saved" && !savedProductIds.has(product.id)) return false;
      return true;
    });
  }, [products, search, category, stateFilter, minOrderFilter, tab, savedProductIds]);

  const visibleVendors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const searchable =
        `${vendor.business_name} ${vendor.description} ${vendor.category} ${vendor.city} ${vendor.state}`.toLowerCase();
      if (term && !searchable.includes(term)) return false;
      if (category !== "all" && vendor.category !== category) return false;
      if (stateFilter !== "all" && vendor.state !== stateFilter) return false;
      if (tab === "saved" && !savedVendorIds.has(vendor.id)) return false;
      return true;
    });
  }, [vendors, search, category, stateFilter, tab, savedVendorIds]);

  const locations = useMemo(
    () => [...new Set(vendors.map((vendor) => vendor.state).filter(Boolean))].sort(),
    [vendors],
  );

  async function refreshConnect() {
    await Promise.all([
      client.invalidateQueries({ queryKey: ["connect-products"] }),
      client.invalidateQueries({ queryKey: ["connect-vendors"] }),
      client.invalidateQueries({ queryKey: ["connect-my-vendor", userId] }),
      client.invalidateQueries({ queryKey: ["connect-my-products"] }),
      client.invalidateQueries({ queryKey: ["connect-saved-products", userId] }),
      client.invalidateQueries({ queryKey: ["connect-saved-vendors", userId] }),
    ]);
  }

  async function saveVendor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const businessName = vendorForm.business_name.trim();
    const phone = cleanPhone(vendorForm.whatsapp_number);
    if (businessName.length < 2) return toast.error("Enter your business name.");
    if (phone.length < 8) return toast.error("Enter a valid WhatsApp number with country code.");
    setBusy(true);
    const payload = {
      owner_id: userId,
      business_name: businessName,
      slug: myVendor?.slug ?? `${slugify(businessName)}-${userId.slice(0, 6)}`,
      category: vendorForm.category,
      description: vendorForm.description.trim(),
      state: vendorForm.state.trim(),
      city: vendorForm.city.trim(),
      whatsapp_number: phone,
      logo_url: safeImage(vendorForm.logo_url),
      country: "Nigeria",
    };
    const result = myVendor
      ? await db.from("connect_vendors").update(payload).eq("id", myVendor.id)
      : await db.from("connect_vendors").insert(payload);
    setBusy(false);
    if (result.error) return toast.error(result.error.message);
    toast.success(myVendor ? "Supplier profile updated." : "Your supplier profile is ready.");
    setVendorFormOpen(false);
    await refreshConnect();
  }

  async function togglePublish() {
    if (!myVendor) return;
    if (!myVendor.is_published && (!vendorForm.state.trim() || !vendorForm.city.trim())) {
      toast.error("Add your state and city before publishing your profile.");
      setVendorFormOpen(true);
      return;
    }
    setBusy(true);
    const { error } = await db
      .from("connect_vendors")
      .update({ is_published: !myVendor.is_published })
      .eq("id", myVendor.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(myVendor.is_published ? "Your profile is now hidden." : "Your profile is live.");
    await refreshConnect();
  }

  async function addProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!myVendor) return;
    const wholesale = Number(productForm.wholesale_price);
    const retail = Number(productForm.suggested_retail_price || 0);
    const stock = Number(productForm.stock_quantity);
    const minimum = Number(productForm.min_order_quantity);
    if (!productForm.title.trim() || !Number.isFinite(wholesale) || wholesale < 0) {
      toast.error("Enter a product name and a valid wholesale price.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0 || !Number.isInteger(minimum) || minimum < 1) {
      toast.error("Check the stock quantity and minimum order quantity.");
      return;
    }
    setBusy(true);
    const { error } = await db.from("connect_products").insert({
      vendor_id: myVendor.id,
      title: productForm.title.trim(),
      category: productForm.category,
      description: productForm.description.trim(),
      image_url: safeImage(productForm.image_url),
      wholesale_price: wholesale,
      suggested_retail_price: Number.isFinite(retail) && retail >= 0 ? retail : 0,
      stock_quantity: stock,
      min_order_quantity: minimum,
      unit: productForm.unit.trim() || "piece",
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Product added to your Connect catalogue.");
    setProductForm({
      title: "",
      category: vendorForm.category,
      description: "",
      image_url: "",
      wholesale_price: "",
      suggested_retail_price: "",
      stock_quantity: "0",
      min_order_quantity: "1",
      unit: "piece",
    });
    setProductFormOpen(false);
    await refreshConnect();
  }

  async function removeProduct(productId: string) {
    if (!window.confirm("Remove this product from STRAP Connect?")) return;
    const { error } = await db
      .from("connect_products")
      .delete()
      .eq("id", productId)
      .eq("vendor_id", myVendor?.id);
    if (error) return toast.error(error.message);
    toast.success("Product removed.");
    await refreshConnect();
  }

  async function toggleSavedProduct(productId: string) {
    if (savedProductIds.has(productId)) {
      const { error } = await db
        .from("connect_saved_products")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await db
        .from("connect_saved_products")
        .insert({ user_id: userId, product_id: productId });
      if (error) return toast.error(error.message);
    }
    await client.invalidateQueries({ queryKey: ["connect-saved-products", userId] });
  }

  async function toggleSavedVendor(vendorId: string) {
    if (savedVendorIds.has(vendorId)) {
      const { error } = await db
        .from("connect_saved_vendors")
        .delete()
        .eq("user_id", userId)
        .eq("vendor_id", vendorId);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await db
        .from("connect_saved_vendors")
        .insert({ user_id: userId, vendor_id: vendorId });
      if (error) return toast.error(error.message);
    }
    await client.invalidateQueries({ queryKey: ["connect-saved-vendors", userId] });
  }

  function contactVendor(vendor: Pick<Vendor, "business_name" | "whatsapp_number">, product?: string) {
    const url = whatsappLink(
      vendor.whatsapp_number,
      product
        ? `Hello ${vendor.business_name}, I'm interested in ${product}. Please share availability and delivery details.`
        : `Hello ${vendor.business_name}, I'd like to know more about your wholesale products.`,
    );
    if (!url) return toast.error("This supplier has not added a valid WhatsApp number yet.");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const loading = productsQuery.isLoading || vendorsQuery.isLoading;
  const queryError = productsQuery.error || vendorsQuery.error;

  return (
    <AppShell title="STRAP Connect">
      <div className="mx-auto max-w-7xl space-y-6 pb-10">
        <section className="relative overflow-hidden rounded-[28px] bg-[#0e1116] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 size-72 rounded-full bg-[#c6f432]/15 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c6f432]">
                <Compass className="size-3.5" /> The business connection hub
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
                Source smarter.
                <br />
                <span className="text-[#c6f432]">Grow together.</span>
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 sm:text-base">
                Discover wholesale products, meet suppliers and build stronger business
                relationships — all from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setTab("discover")}
                className="min-h-11 rounded-xl bg-[#c6f432] px-5 font-semibold text-[#0e1116] hover:bg-[#d8f18a]"
              >
                Explore products <ChevronRight className="ml-1 size-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTab("my-shop");
                  if (!myVendor) setVendorFormOpen(true);
                }}
                className="min-h-11 rounded-xl border-white/25 bg-white/5 px-5 text-white hover:bg-white/10 hover:text-white"
              >
                <Store className="mr-2 size-4" /> Become a supplier
              </Button>
            </div>
          </div>
          <div className="relative mt-8 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
            <div>
              <p className="font-display text-2xl font-bold">{vendors.length}</p>
              <p className="mt-1 text-[11px] text-white/55 sm:text-xs">Suppliers listed</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">{products.length}</p>
              <p className="mt-1 text-[11px] text-white/55 sm:text-xs">Products to explore</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">₦</p>
              <p className="mt-1 text-[11px] text-white/55 sm:text-xs">Built for local trade</p>
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
          {(
            [
              ["discover", "Discover", Compass],
              ["saved", "Saved", Bookmark],
              ["my-shop", "My supplier space", Store],
            ] as const
          ).map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${tab === value ? "bg-foreground text-background dark:bg-[#c6f432] dark:text-[#0e1116]" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              <Icon className="size-4" /> {label}
              {value === "saved" && savedProductIds.size + savedVendorIds.size > 0 && (
                <span className="rounded-full bg-background/15 px-1.5 py-0.5 text-[10px]">
                  {savedProductIds.size + savedVendorIds.size}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab !== "my-shop" && (
          <>
            <section className="grid gap-3 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-[minmax(0,1fr)_190px_180px_170px] sm:p-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products, suppliers or locations"
                  className="h-11 rounded-xl pl-9"
                />
              </div>
              <select
                aria-label="Filter by category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="all">All categories</option>
                {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select
                aria-label="Filter by state"
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
              >
                <option value="all">All locations</option>
                {locations.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              {tab === "discover" ? (
                <select
                  aria-label="Filter by minimum order"
                  value={minOrderFilter}
                  onChange={(event) => setMinOrderFilter(event.target.value)}
                  className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
                >
                  <option value="all">Any order size</option>
                  <option value="small">Low MOQ (1–5)</option>
                  <option value="bulk">Bulk MOQ (6+)</option>
                </select>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setCategory("all");
                    setStateFilter("all");
                    setMinOrderFilter("all");
                  }}
                  className="h-11 rounded-xl"
                >
                  <X className="mr-2 size-4" /> Clear filters
                </Button>
              )}
            </section>

            {tab === "discover" && (
              <section className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Wholesale marketplace</p>
                    <h2 className="mt-1 font-display text-2xl font-bold">Products worth sourcing</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{visibleProducts.length} results</span>
                </div>
                {loading ? <LoadingGrid /> : queryError ? <ErrorState message={(queryError as Error).message} /> : visibleProducts.length === 0 ? (
                  <EmptyState title="No products match those filters" text="Try another category or location, or check back as more suppliers join." />
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        saved={savedProductIds.has(product.id)}
                        onSave={() => void toggleSavedProduct(product.id)}
                        onContact={() => contactVendor(product.vendor, product.title)}
                      />
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between gap-3 pt-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Meet the people behind the products</p>
                    <h2 className="mt-1 font-display text-2xl font-bold">Suppliers to know</h2>
                  </div>
                  <span className="text-xs text-muted-foreground">{visibleVendors.length} suppliers</span>
                </div>
                {visibleVendors.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleVendors.slice(0, 12).map((vendor) => (
                      <VendorCard
                        key={vendor.id}
                        vendor={vendor}
                        saved={savedVendorIds.has(vendor.id)}
                        onSave={() => void toggleSavedVendor(vendor.id)}
                        onContact={() => contactVendor(vendor)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Supplier profiles will appear here as vendors publish their businesses.</p>
                )}
              </section>
            )}

            {tab === "saved" && (
              <section className="space-y-7">
                <div>
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your shortlist</p>
                      <h2 className="mt-1 font-display text-2xl font-bold">Saved products</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">{visibleProducts.length} saved</span>
                  </div>
                  {visibleProducts.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          saved
                          onSave={() => void toggleSavedProduct(product.id)}
                          onContact={() => contactVendor(product.vendor, product.title)}
                        />
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No saved products yet" text="Bookmark products while browsing and they will be waiting here." />
                  )}
                </div>
                <div>
                  <div className="mb-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Your network</p>
                      <h2 className="mt-1 font-display text-2xl font-bold">Saved suppliers</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">{visibleVendors.length} saved</span>
                  </div>
                  {visibleVendors.length ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {visibleVendors.map((vendor) => (
                        <VendorCard key={vendor.id} vendor={vendor} saved onSave={() => void toggleSavedVendor(vendor.id)} onContact={() => contactVendor(vendor)} />
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No saved suppliers yet" text="Save suppliers you want to keep in your business network." />
                  )}
                </div>
              </section>
            )}
          </>
        )}

        {tab === "my-shop" && (
          <section className="space-y-5">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Supplier workspace</p>
                <h2 className="mt-1 font-display text-2xl font-bold">Your supplier space</h2>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Create your supplier profile, publish wholesale products and let retailers reach you directly.</p>
              </div>
              {myVendor && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setVendorFormOpen((open) => !open)} className="rounded-xl">
                    <Building2 className="mr-2 size-4" /> Edit profile
                  </Button>
                  <Button onClick={() => void togglePublish()} disabled={busy} className="rounded-xl">
                    {myVendor.is_published ? "Unpublish profile" : "Publish profile"}
                  </Button>
                </div>
              )}
            </div>

            {!myVendor && (
              <div className="surface-card flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:p-8">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Store className="size-7" /></div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold">Start selling wholesale on Connect</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Set up your business profile once. You can then add products, manage availability and receive enquiries through WhatsApp.</p>
                </div>
                <Button onClick={() => setVendorFormOpen(true)} className="min-h-11 rounded-xl"><Plus className="mr-2 size-4" /> Create supplier profile</Button>
              </div>
            )}

            {myVendor && (
              <>
                <div className="surface-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
                  <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-secondary text-xl font-bold">
                    {safeImage(myVendor.logo_url) ? <img src={safeImage(myVendor.logo_url)} alt="" className="size-full object-cover" /> : myVendor.business_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-xl font-bold">{myVendor.business_name}</h3>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${myVendor.is_published ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-700"}`}>{myVendor.is_published ? "Live" : "Draft"}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{[myVendor.category, myVendor.city, myVendor.state].filter(Boolean).join(" · ")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">WhatsApp: {myVendor.whatsapp_number || "Not added"}</p>
                  </div>
                  <div className="rounded-xl bg-secondary px-4 py-3 text-center">
                    <p className="font-display text-2xl font-bold">{myProductsQuery.data?.length ?? 0}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Products</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold">Your catalogue</h3>
                    <p className="text-sm text-muted-foreground">Manage the products retailers can discover.</p>
                  </div>
                  <Button onClick={() => setProductFormOpen((open) => !open)} className="rounded-xl"><Plus className="mr-2 size-4" /> Add product</Button>
                </div>
                {productFormOpen && (
                  <form onSubmit={(event) => void addProduct(event)} className="surface-card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
                    <Field label="Product name"><Input required minLength={2} maxLength={160} value={productForm.title} onChange={(e) => setProductForm({ ...productForm, title: e.target.value })} placeholder="e.g. Premium cotton T-shirt" /></Field>
                    <Field label="Category"><select value={productForm.category} onChange={(e) => setProductForm({ ...productForm, category: e.target.value })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
                    <Field label="Wholesale price (₦)"><Input required type="number" min="0" step="0.01" value={productForm.wholesale_price} onChange={(e) => setProductForm({ ...productForm, wholesale_price: e.target.value })} placeholder="2500" /></Field>
                    <Field label="Suggested retail price (₦)"><Input type="number" min="0" step="0.01" value={productForm.suggested_retail_price} onChange={(e) => setProductForm({ ...productForm, suggested_retail_price: e.target.value })} placeholder="4000" /></Field>
                    <Field label="Available stock"><Input type="number" min="0" step="1" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} /></Field>
                    <Field label="Minimum order quantity"><Input required type="number" min="1" step="1" value={productForm.min_order_quantity} onChange={(e) => setProductForm({ ...productForm, min_order_quantity: e.target.value })} /></Field>
                    <Field label="Unit"><Input maxLength={32} value={productForm.unit} onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })} placeholder="piece, pack, carton" /></Field>
                    <Field label="Product image URL"><Input type="url" value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} placeholder="https://…" /></Field>
                    <div className="sm:col-span-2"><Field label="Product details"><textarea maxLength={2000} rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full rounded-xl border border-input bg-background p-3 text-sm" placeholder="Describe quality, sizes, colours, packaging and delivery terms." /></Field></div>
                    {Number(productForm.suggested_retail_price) > Number(productForm.wholesale_price) && Number(productForm.wholesale_price) >= 0 && (
                      <p className="sm:col-span-2 rounded-xl bg-accent-soft p-3 text-sm text-accent-ink">Indicative reseller spread: <strong>{money(Number(productForm.suggested_retail_price) - Number(productForm.wholesale_price))}</strong> per {productForm.unit || "unit"} before other costs.</p>
                    )}
                    <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                      <Button type="button" variant="outline" onClick={() => setProductFormOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Add to catalogue"}</Button>
                    </div>
                  </form>
                )}

                {myProductsQuery.isLoading ? <LoadingGrid /> : (myProductsQuery.data ?? []).length ? (
                  <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                    {(myProductsQuery.data ?? []).map((product) => (
                      <div key={product.id} className="flex items-center gap-3 border-b border-border p-3 last:border-0 sm:p-4">
                        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary">
                          {safeImage(product.image_url) ? <img src={safeImage(product.image_url)} alt="" className="size-full object-cover" /> : <Package className="size-5 text-muted-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{product.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{money(product.wholesale_price)} · MOQ {product.min_order_quantity} · {product.stock_quantity} in stock</p>
                        </div>
                        <span className={`hidden rounded-full px-2 py-1 text-[10px] font-bold sm:inline-flex ${product.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-secondary text-muted-foreground"}`}>{product.is_active ? "Active" : "Hidden"}</span>
                        <Button size="icon" variant="ghost" aria-label={`Remove ${product.title}`} onClick={() => void removeProduct(product.id)}><Trash2 className="size-4 text-muted-foreground" /></Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Your catalogue is empty" text="Add your first wholesale product to make it discoverable to retailers and resellers." />
                )}
              </>
            )}

            {vendorFormOpen && (
              <form onSubmit={(event) => void saveVendor(event)} className="surface-card space-y-4 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-bold">{myVendor ? "Edit supplier profile" : "Create supplier profile"}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Use accurate business and contact details so buyers know who they are reaching.</p>
                  </div>
                  <Button type="button" size="icon" variant="ghost" aria-label="Close form" onClick={() => setVendorFormOpen(false)}><X className="size-4" /></Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business name"><Input required minLength={2} maxLength={120} value={vendorForm.business_name} onChange={(e) => setVendorForm({ ...vendorForm, business_name: e.target.value })} placeholder="Your business name" /></Field>
                  <Field label="Main category"><select value={vendorForm.category} onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></Field>
                  <Field label="State"><Input required maxLength={80} value={vendorForm.state} onChange={(e) => setVendorForm({ ...vendorForm, state: e.target.value })} placeholder="e.g. Lagos" /></Field>
                  <Field label="City / area"><Input required maxLength={80} value={vendorForm.city} onChange={(e) => setVendorForm({ ...vendorForm, city: e.target.value })} placeholder="e.g. Ikeja" /></Field>
                  <Field label="WhatsApp number (include country code)"><Input required maxLength={32} value={vendorForm.whatsapp_number} onChange={(e) => setVendorForm({ ...vendorForm, whatsapp_number: e.target.value })} placeholder="2348012345678" /></Field>
                  <Field label="Business logo URL (optional)"><Input type="url" value={vendorForm.logo_url} onChange={(e) => setVendorForm({ ...vendorForm, logo_url: e.target.value })} placeholder="https://…" /></Field>
                  <div className="sm:col-span-2"><Field label="About your business"><textarea maxLength={1200} rows={4} value={vendorForm.description} onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })} className="w-full rounded-xl border border-input bg-background p-3 text-sm" placeholder="What do you supply? Tell buyers about quality, experience, delivery areas and terms." /></Field></div>
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setVendorFormOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={busy}>{busy ? "Saving…" : myVendor ? "Save profile" : "Create profile"}</Button>
                </div>
              </form>
            )}
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-muted-foreground">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
              <p>Connect introduces buyers and suppliers. WhatsApp numbers are supplied by vendors and are not independently verified yet. Confirm product quality, stock, delivery terms and payment arrangements directly before sending money. STRAP does not currently process or guarantee these transactions.</p>
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label>{label}</Label>{children}</div>;
}

function ProductCard({
  product,
  saved,
  onSave,
  onContact,
}: {
  product: ConnectProduct;
  saved: boolean;
  onSave: () => void;
  onContact: () => void;
}) {
  const image = safeImage(product.image_url);
  const wholesale = Number(product.wholesale_price);
  const retail = Number(product.suggested_retail_price);
  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-surface transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-[5/3] overflow-hidden bg-secondary">
        {image ? <img src={image} alt={product.title} loading="lazy" className="size-full object-cover transition duration-500 group-hover:scale-[1.03]" /> : <div className="flex size-full items-center justify-center"><Package className="size-10 text-muted-foreground/40" /></div>}
        <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide backdrop-blur">{product.category}</span>
        <button type="button" onClick={onSave} aria-label={saved ? "Remove saved product" : "Save product"} className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm backdrop-blur hover:bg-[#c6f432]"><Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} /></button>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-semibold leading-5">{product.title}</h3>
            <p className="mt-1 truncate text-xs text-muted-foreground">{product.vendor.business_name}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-lg font-bold">{money(wholesale)}</p>
            <p className="text-[10px] text-muted-foreground">wholesale / {product.unit}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {[product.vendor.city, product.vendor.state].filter(Boolean).join(", ") || "Nigeria"}</span>
          <span>·</span><span>MOQ {product.min_order_quantity}</span>
          <span>·</span><span>{product.stock_quantity > 0 ? `${product.stock_quantity} available` : "Stock on request"}</span>
        </div>
        {retail > wholesale && (
          <div className="flex items-center justify-between rounded-xl bg-accent-soft px-3 py-2 text-xs text-accent-ink">
            <span>Suggested reseller spread</span>
            <strong>{money(retail - wholesale)}</strong>
          </div>
        )}
        <Button onClick={onContact} className="min-h-10 w-full rounded-xl"><MessageCircle className="mr-2 size-4" /> Contact supplier</Button>
      </div>
    </article>
  );
}

function VendorCard({
  vendor,
  saved,
  onSave,
  onContact,
}: {
  vendor: Vendor;
  saved: boolean;
  onSave: () => void;
  onContact: () => void;
}) {
  const image = safeImage(vendor.logo_url);
  return (
    <article className="flex min-w-0 gap-3 rounded-2xl border border-border bg-surface p-4">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-secondary font-bold">
        {image ? <img src={image} alt="" loading="lazy" className="size-full object-cover" /> : vendor.business_name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold">{vendor.business_name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{vendor.category}</p>
          </div>
          <button type="button" onClick={onSave} aria-label={saved ? "Remove saved supplier" : "Save supplier"} className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-secondary"><Bookmark className={`size-4 ${saved ? "fill-current" : ""}`} /></button>
        </div>
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{vendor.description || "Wholesale supplier on STRAP Connect."}</p>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="size-3.5" /> {[vendor.city, vendor.state].filter(Boolean).join(", ") || vendor.country}</p>
        <Button variant="outline" size="sm" onClick={onContact} className="mt-3 min-h-9 rounded-lg"><MessageCircle className="mr-2 size-3.5" /> Contact supplier</Button>
      </div>
    </article>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-surface px-5 py-10 text-center"><div className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-secondary"><CircleHelp className="size-5 text-muted-foreground" /></div><h3 className="mt-3 font-semibold">{title}</h3><p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">{text}</p></div>;
}

function LoadingGrid() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-2xl bg-secondary" />)}</div>;
}

function ErrorState({ message }: { message: string }) {
  return <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Connect could not load this information: {message}</div>;
}
