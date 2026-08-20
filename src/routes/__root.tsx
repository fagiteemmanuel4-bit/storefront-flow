import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import landingCss from "../landing-modern.css?url";
import modernAppCss from "../kudi-modern.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/sonner";
import { NotFoundScreen } from "@/components/shell/NotFoundScreen";
import { StoreFeedbackFloating } from "@/components/site/StoreFeedbackFloating";
import { StoreCustomerAccess } from "@/components/site/StoreCustomerAccess";
import { Button } from "@/components/ui/button";

const SITE_URL = "https://storefront-flow.vercel.app";
const SITE_TITLE = "Kudi — Point of Sale, Inventory & Online Store for Small Businesses";
const SITE_DESCRIPTION = "Kudi helps small businesses manage stock, record sales, run a POS, publish an online catalogue, and operate a simple virtual store from one place.";

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "tanstack_root_error_component" }); }, [error]);
  return <div className="flex min-h-screen items-center justify-center bg-background px-6"><div className="max-w-md text-center"><p className="text-label-caps text-accent-ink">Something broke</p><h1 className="mt-3 text-title-lg text-foreground">This page didn't load</h1><p className="mt-2 text-sm text-muted-foreground">The problem is on our side. Nothing you were doing was saved — try again.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Button onClick={() => { router.invalidate(); reset(); }}>Try again</Button><Button variant="outline" asChild><a href="/">Go home</a></Button></div></div></div>;
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" }, { title: SITE_TITLE }, { name: "description", content: SITE_DESCRIPTION }, { name: "author", content: "Kudi" },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" }, { name: "googlebot", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" }, { name: "google-site-verification", content: "C8nXbWzuOEhCjnzdPL7QJMSpJ7FEZYl0YO0xaV0v1vs" },
      { property: "og:type", content: "website" }, { property: "og:site_name", content: "Kudi" }, { property: "og:title", content: SITE_TITLE }, { property: "og:description", content: SITE_DESCRIPTION }, { property: "og:url", content: SITE_URL }, { property: "og:locale", content: "en_NG" },
      { name: "twitter:card", content: "summary_large_image" }, { name: "twitter:title", content: SITE_TITLE }, { name: "twitter:description", content: SITE_DESCRIPTION },
    ],
    links: [
      { rel: "canonical", href: SITE_URL }, { rel: "stylesheet", href: appCss }, { rel: "stylesheet", href: landingCss }, { rel: "stylesheet", href: modernAppCss }, { rel: "preconnect", href: "https://fonts.googleapis.com" }, { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" }, { rel: "apple-touch-icon", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundScreen,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) { return <html lang="en"><head><HeadContent /></head><body>{children}<Scripts /></body></html>; }

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  useEffect(() => { const { data } = supabase.auth.onAuthStateChange((event) => { if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return; router.invalidate(); if (event !== "SIGNED_OUT") queryClient.invalidateQueries(); }); return () => data.subscription.unsubscribe(); }, [router, queryClient]);
  return <QueryClientProvider client={queryClient}><Outlet /><StoreFeedbackFloating /><StoreCustomerAccess /><Toaster position="top-center" richColors /></QueryClientProvider>;
}
