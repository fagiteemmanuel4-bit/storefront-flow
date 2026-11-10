import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Building2, LifeBuoy, MessageSquareText } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { SeoJsonLd } from "@/components/site/SeoJsonLd";
import { breadcrumbSchema, marketingHead } from "@/lib/marketingSeo";

const crumbs = breadcrumbSchema([
  { name: "Home", path: "/" },
  { name: "Contact", path: "/contact" },
]);

export const Route = createFileRoute("/contact")({
  head: () => marketingHead({
    title: "Contact Strap — Product help and business enquiries",
    description: "Find the right way to contact Strap for product guidance, account support and business or partnership enquiries.",
    path: "/contact",
  }),
  component: ContactPage,
});

const channels = [
  {
    icon: LifeBuoy,
    title: "Product support",
    text: "Find setup instructions and practical answers in the Strap Help Centre.",
    action: "Visit Help Centre",
    href: "/support",
  },
  {
    icon: MessageSquareText,
    title: "Account-specific help",
    text: "Sign in to your workspace and use the in-app feedback option to report a problem with the page or workflow you are using.",
    action: "Sign in to Strap",
    href: "/auth",
  },
  {
    icon: Building2,
    title: "Partnership enquiries",
    text: "For business partnerships, supplier relationships or retail collaboration, use the partner enquiry form.",
    action: "Explore partnerships",
    href: "/partners",
  },
  {
    icon: BookOpen,
    title: "Product documentation",
    text: "Browse detailed guides for point of sale, inventory, branches, teams and online orders.",
    action: "Read documentation",
    href: "/docs",
  },
];

function ContactPage() {
  return (
    <div className="marketing-site min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto w-[min(1240px,calc(100%-56px))] py-16 sm:py-24">
          <div className="max-w-3xl">
            <p className="marketing-eyebrow">Contact Strap</p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[.98] tracking-[-.06em] sm:text-6xl">Start with the right support channel.</h1>
            <p className="mt-6 text-base leading-8 text-muted-foreground">Choose the route that best matches your question. This helps your request reach the right product or business workflow.</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {channels.map(({ icon: Icon, title, text, action, href }) => (
              <article key={title} className="rounded-3xl border border-border bg-card p-6 sm:p-7">
                <span className="flex size-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Icon size={21}/></span>
                <h2 className="mt-5 text-xl font-bold">{title}</h2>
                <p className="mt-3 min-h-14 text-sm leading-7 text-muted-foreground">{text}</p>
                <Link to={href as never} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-foreground">{action}<ArrowRight size={15}/></Link>
              </article>
            ))}
          </div>
        </section>
        <section className="marketing-info-cta">
          <div>
            <p className="marketing-eyebrow">A more useful conversation</p>
            <h2>Tell us what you are trying to get done.</h2>
            <p>For account-related issues, include the workspace and page you were using when you contact the Strap team through the in-app feedback option.</p>
          </div>
          <Link to="/auth" className="marketing-button">Open your workspace <ArrowRight size={15}/></Link>
        </section>
      </main>
      <SiteFooter />
      <SeoJsonLd data={crumbs} />
    </div>
  );
}
