import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site/SiteChrome";
import { PricingSection } from "@/components/site/PricingSection";
import { SeoJsonLd } from "@/components/site/SeoJsonLd";
import { PREMIUM_PLANS } from "@/lib/premiumPlans";
import { breadcrumbSchema, marketingHead, SITE_URL } from "@/lib/marketingSeo";

const offers = Object.values(PREMIUM_PLANS).map((plan) => ({
  "@type": "Offer",
  name: plan.name,
  price: String(plan.price),
  priceCurrency: "NGN",
  category: "Subscription",
  url: `${SITE_URL}/pricing`,
}));

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Strap",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "Retail operations software for point of sale, inventory, teams, branches and online selling.",
  offers,
};

const crumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Pricing", path: "/pricing" },
]);

export const Route = createFileRoute("/pricing")({
  head: () => marketingHead({
    title: "Strap Pricing — Free, Business and Pro Plans",
    description: "Compare Strap Free, Business and Pro plans for retail point of sale, inventory, staff, branches, reporting and online selling.",
    path: "/pricing",
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="marketing-site min-h-screen">
      <SiteHeader />
      <main>
        <div className="marketing-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Pricing</span>
        </div>
        <section className="mx-auto w-[min(1240px,calc(100%-56px))] py-16 sm:py-24">
          <p className="marketing-eyebrow">Plans for everyday retail</p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold leading-[.98] tracking-[-.06em] sm:text-6xl">Choose the workspace that fits your shop.</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground">Start with the tools you need now. Add more capacity for your team, branches and online store as your operation grows.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold"><CheckCircle2 size={15} /> Free plan available</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold"><CheckCircle2 size={15} /> Prices in Nigerian naira</span>
          </div>
        </section>
        <PricingSection />
        <section className="mx-auto flex w-[min(1240px,calc(100%-56px))] flex-wrap items-center justify-between gap-5 py-16">
          <div>
            <h2 className="font-display text-2xl font-bold">Need help choosing a plan?</h2>
            <p className="mt-2 text-sm text-muted-foreground">Review the product guides or get help with the right setup for your shop.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/faq" className="marketing-button marketing-button--quiet">Read FAQs</Link>
            <Link to="/contact" className="marketing-button">Get help choosing <ArrowRight size={15} /></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
      <SeoJsonLd data={pricingSchema} />
      <SeoJsonLd data={crumbs} />
    </div>
  );
}
