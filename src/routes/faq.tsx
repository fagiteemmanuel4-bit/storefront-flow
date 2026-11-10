import { Reveal } from "@/components/site/MarketingMotion";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SeoJsonLd } from "@/components/site/SeoJsonLd";
import { FAQ_ITEMS, FAQ_PAGE_SCHEMA } from "@/lib/faqContent";
import { breadcrumbSchema, marketingHead } from "@/lib/marketingSeo";

const crumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "FAQ", path: "/faq" },
]);

export const Route = createFileRoute("/faq")({
  head: () => marketingHead({
    title: "Strap FAQ — Retail POS, Inventory, Plans and Online Store",
    description: "Answers to common questions about Strap retail software, point of sale, inventory, branches, online stores, pricing and support.",
    path: "/faq",
  }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <div className="marketing-site min-h-screen">
      <SiteHeader />
      <main>
        <Reveal><section className="mx-auto w-[min(1240px,calc(100%-56px))] py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="marketing-eyebrow">Help and answers</p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[.98] tracking-[-.06em] sm:text-6xl">Frequently asked questions.</h1>
            <p className="mt-6 text-base leading-8 text-muted-foreground">Clear answers about how Strap works, which workflows it supports and where to find help when you need it.</p>
          </div>
          <div className="mt-12 grid gap-3">
            {FAQ_ITEMS.map(({ question, answer }) => (
              <details key={question} className="group rounded-2xl border border-border bg-card px-5 sm:px-7">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5 text-left text-sm font-bold sm:text-base">
                  {question}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                </summary>
                <p className="max-w-3xl pb-6 text-sm leading-7 text-muted-foreground">{answer}</p>
              </details>
            ))}
          </div>
        </section></Reveal>
        <Reveal><section className="marketing-info-cta">
          <div>
            <p className="marketing-eyebrow">Need more detail?</p>
            <h2>Find the guide for your next step.</h2>
            <p>Browse the documentation or visit the Help Centre for practical setup and workflow guidance.</p>
          </div>
          <div className="marketing-info-cta__actions">
            <Link to="/docs" className="marketing-button marketing-button--quiet">Read documentation</Link>
            <Link to="/support" className="marketing-button">Visit Help Centre <ArrowRight size={15}/></Link>
          </div>
        </section></Reveal>
      </main>
      <SiteFooter />
      <SeoJsonLd data={FAQ_PAGE_SCHEMA} />
      <SeoJsonLd data={crumbs} />
    </div>
  );
}
