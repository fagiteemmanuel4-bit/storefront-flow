import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import landingCss from "../landing-modern.css?url";
import modernAppCss from "../kudi-modern.css?url";
import mobileNativeCss from "../mobile-native.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { NotFoundScreen } from "@/components/shell/NotFoundScreen";
import { StoreFeedbackFloating } from "@/components/site/StoreFeedbackFloating";
import { StoreCustomerAccess } from "@/components/site/StoreCustomerAccess";
import { Button } from "@/components/ui/button";

const SITE_URL = "https://storefront-flow.vercel.app";
const SITE_TITLE = "Strap — Retail Commerce, POS, Inventory & Online Store";
const SITE_DESCRIPTION = "Strap is a retail commerce platform for managing products, inventory, point of sale, customers, staff, branches, expenses, orders, reports, and online storefronts in one workspace.";
const KEYWORDS = "Strap, retail management software, retail POS, point of sale, inventory management, stock management, online store builder, ecommerce platform, ecommerce software, shop management, small business software, retail business management, Shopify alternative, Wix alternative, ecommerce Nigeria";
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: "Kryonara", url: SITE_URL, brand: { "@type": "Brand", name: "Strap" } },
    { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: "Strap", url: SITE_URL, description: SITE_DESCRIPTION, publisher: { "@id": `${SITE_URL}/#organization` }, inLanguage: "en-NG" },
    { "@type": "SoftwareApplication", "@id": `${SITE_URL}/#software`, name: "Strap", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: SITE_URL, description: SITE_DESCRIPTION, publisher: { "@id": `${SITE_URL}/#organization` }, featureList: ["Retail point of sale", "Inventory management", "Product catalogue", "Customer management", "Staff and roles", "Branch management", "Expenses and reports", "Online storefront", "Online orders", "Store builder"] },
  ],
};

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return <div className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-md text-center"><p className="text-label-caps text-accent-ink">Something broke</p><h1 className="mt-3 text-title-lg text-foreground">This page didn't load</h1><p className="mt-2 text-sm text-muted-foreground">The problem is on our side. Nothing you were doing was saved — try again.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={() => { router.invalidate(); reset(); }}>Try again</Button><Button variant="outline" asChild><a href="/">Go home</a></Button></div></div></div>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }, { title: SITE_TITLE }, { name: "description", content: SITE_DESCRIPTION }, { name: "keywords", content: KEYWORDS }, { name: "author", content: "Kryonara" }, { name: "application-name", content: "Strap" }, { name: "apple-mobile-web-app-title", content: "Strap" }, { name: "theme-color", content: "#111111" }, { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" }, { name: "googlebot", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" }, { name: "bingbot", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" }, { name: "google-site-verification", content: "C8nXbWzuOEhCjnzdPL7QJMSpJ7FEZYl0YO0xaV0v1vs" }, { property: "og:type", content: "website" }, { property: "og:site_name", content: "Strap" }, { property: "og:title", content: SITE_TITLE }, { property: "og:description", content: SITE_DESCRIPTION }, { property: "og:url", content: SITE_URL }, { property: "og:locale", content: "en_NG" }, { property: "og:image", content: `${SITE_URL}/favicon.svg` }, { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:title", content: SITE_TITLE }, { name: "twitter:description", content: SITE_DESCRIPTION }, { name: "twitter:image", content: `${SITE_URL}/favicon.svg` },
    ],
    links: [
      { rel: "canonical", href: SITE_URL }, { rel: "sitemap", type: "application/xml", href: `${SITE_URL}/sitemap.xml` }, { rel: "alternate", type: "text/plain", href: `${SITE_URL}/llms.txt`, title: "AI-readable site summary" }, { rel: "stylesheet", href: appCss }, { rel: "stylesheet", href: landingCss }, { rel: "stylesheet", href: modernAppCss }, { rel: "stylesheet", href: mobileNativeCss }, { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" }, { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" }, { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }, { rel: "apple-touch-icon", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell, component: RootComponent, notFoundComponent: NotFoundScreen, errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) { return <html lang="en"><head><HeadContent /></head><body>{children}<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} /> <Scripts /></body></html>; }

function RootComponent() {
  const { queryClient } = Route.useRouteContext(); const router = useRouter();
  useEffect(() => { const { data } = supabase.auth.onAuthStateChange((event) => { if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return; router.invalidate(); if (event !== "SIGNED_OUT") queryClient.invalidateQueries(); }); return () => data.subscription.unsubscribe(); }, [router, queryClient]);
  return <QueryClientProvider client={queryClient}><Outlet /><StoreFeedbackFloating /><StoreCustomerAccess /><Toaster position="top-center" richColors /></QueryClientProvider>;
}
