import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  type ErrorComponentProps,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";
import appCss from "../styles.css?url";
import landingCss from "../landing-modern.css?url";
import modernAppCss from "../kudi-modern.css?url";
import mobileNativeCss from "../mobile-native.css?url";
import mobileNavCss from "../mobile-nav.css?url";
import strapDesignSystemCss from "../strap-design-system.css?url";
import strapLoadingOverridesCss from "../strap-loading-overrides.css?url";
import strapMobileDensityCss from "../strap-mobile-density.css?url";
import strapRedesignBaseCss from "../strap-redesign-base.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { NotFoundScreen } from "@/components/shell/NotFoundScreen";
import { serializeJsonLd } from "@/lib/storefront-seo";
import { DEFAULT_OG_IMAGE, SITE_URL } from "@/lib/marketingSeo";
import { PREMIUM_PLANS } from "@/lib/premiumPlans";
import { StoreFeedbackFloating } from "@/components/site/StoreFeedbackFloating";
import { StoreCustomerAccess } from "@/components/site/StoreCustomerAccess";
import { QuickFindHost } from "@/components/shell/QuickFind";
import { MobileNav } from "@/components/shell/MobileNav";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import { Button } from "@/components/ui/button";

const SITE_TITLE = "Strap — Retail Commerce, POS, Inventory & Online Store";
const SITE_DESCRIPTION =
  "Strap is a retail commerce platform for managing products, inventory, point of sale, customers, staff, branches, expenses, orders, reports, and online storefronts in one workspace.";
const KEYWORDS =
  "Strap, retail management software, retail POS, point of sale, inventory management, stock management, online store, ecommerce, shop management, small business software, retail operations, ecommerce Nigeria";
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Kryonara",
      url: SITE_URL,
      brand: { "@type": "Brand", name: "Strap" },
      logo: `${SITE_URL}/brand/logo-mark.svg`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Strap",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-NG",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/docs?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}/#software`,
      name: "Strap",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "NGN",
        lowPrice: 0,
        highPrice: 5000,
        offerCount: 3,
        offers: Object.values(PREMIUM_PLANS).map((plan) => ({
          "@type": "Offer",
          name: plan.name,
          price: String(plan.price),
          priceCurrency: "NGN",
          url: `${SITE_URL}/pricing`,
        })),
      },
      featureList: [
        "Retail point of sale",
        "Inventory management",
        "Product catalogue",
        "Customer management",
        "Staff and roles",
        "Branch management",
        "Expenses and reports",
        "Online storefront",
        "Online orders",
        "Store builder",
      ],
    },
  ],
};

function getErrorVariant(error: Error) {
  const message = `${error.name} ${error.message}`.toLowerCase();
  if (typeof navigator !== "undefined" && !navigator.onLine) return "offline" as const;
  if (/permission|forbidden|not authorized|unauthorized|403|rls/.test(message))
    return "permission" as const;
  if (/not found|404|does not exist|missing/.test(message)) return "missing" as const;
  return "server" as const;
}
function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  const safeError = useMemo(
    () => (error instanceof Error ? error : new Error(String(error))),
    [error],
  );
  const variant = getErrorVariant(safeError);
  useEffect(() => {
    reportLovableError(safeError, { boundary: `tanstack_root_${variant}_error` });
  }, [safeError, variant]);
  const content = {
    offline: {
      eyebrow: "You're offline",
      title: "Your connection dropped",
      body: "Strap couldn't reach the service right now. Local work can continue where supported; reconnect and try again when you're ready.",
    },
    permission: {
      eyebrow: "Access restricted",
      title: "You don't have access to this area",
      body: "Your current role doesn't have permission to open this page. Ask the store owner or manager if you need access.",
    },
    missing: {
      eyebrow: "Not found",
      title: "This item no longer exists",
      body: "The page or record you're looking for may have been removed or the link may be out of date.",
    },
    server: {
      eyebrow: "Something went wrong",
      title: "Strap couldn't load this page",
      body: "We hit a problem while loading this workspace. Your existing store data is safe. Try again or return to the dashboard.",
    },
  }[variant];
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="w-full max-w-md">
        <div className="rounded-[28px] border border-border bg-surface p-7 text-center shadow-sm sm:p-9">
          <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-sm font-bold text-accent-ink">
            {variant === "offline"
              ? "×"
              : variant === "permission"
                ? "!"
                : variant === "missing"
                  ? "404"
                  : "—"}
          </span>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            {content.eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {content.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{content.body}</p>
          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
            <Button
              onClick={() => {
                router.invalidate();
                reset();
              }}
            >
              Try again
            </Button>
            <Button variant="outline" asChild>
              <a href="/dashboard">Go to dashboard</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { name: "keywords", content: KEYWORDS },
      { name: "author", content: "Kryonara" },
      { name: "application-name", content: "Strap" },
      { name: "apple-mobile-web-app-title", content: "Strap" },
      { name: "theme-color", content: "#f7f8f5" },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      {
        name: "googlebot",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      {
        name: "bingbot",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:large",
      },
      { name: "google-site-verification", content: "C8nXbWzuOEhCjnzdPL7QJMSpJ7FEZYl0YO0xaV0v1vs" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Strap" },
      { property: "og:title", content: SITE_TITLE },
      { property: "og:description", content: SITE_DESCRIPTION },
      { property: "og:url", content: SITE_URL },
      { property: "og:locale", content: "en_NG" },
      { property: "og:image", content: DEFAULT_OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: SITE_TITLE },
      { name: "twitter:description", content: SITE_DESCRIPTION },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE },
    ],
    links: [
      { rel: "sitemap", type: "application/xml", href: `${SITE_URL}/sitemap.xml` },
      {
        rel: "alternate",
        type: "text/plain",
        href: `${SITE_URL}/llms.txt`,
        title: "AI-readable site summary",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: landingCss },
      { rel: "stylesheet", href: modernAppCss },
      { rel: "stylesheet", href: mobileNativeCss },
      { rel: "stylesheet", href: mobileNavCss },
      { rel: "stylesheet", href: strapDesignSystemCss },
      { rel: "stylesheet", href: strapLoadingOverridesCss },
      { rel: "stylesheet", href: strapMobileDensityCss },
      { rel: "stylesheet", href: strapRedesignBaseCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundScreen,
  errorComponent: ErrorComponent,
});
function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(STRUCTURED_DATA) }}
        />
        <Scripts />
      </body>
    </html>
  );
}
function RouteProgress() {
  const isLoading = useRouterState({ select: (state) => state.status === "pending" });
  if (!isLoading) return null;
  return (
    <div
      className="strap-route-progress"
      role="progressbar"
      aria-label="Loading"
      aria-busy="true"
    />
  );
}
function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const forceLight =
    pathname === "/auth" || pathname === "/oauth/consent" || pathname === "/verify-email";
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      router.invalidate();
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });
    return () => data.subscription.unsubscribe();
  }, [router, queryClient]);
  return (
    <ThemeProvider forceLight={forceLight}>
      <QueryClientProvider client={queryClient}>
        <RouteProgress />
        <Outlet />
        <QuickFindHost />
        <MobileNav />
        <StoreFeedbackFloating />
        <StoreCustomerAccess />
        <Toaster position="top-center" richColors />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
