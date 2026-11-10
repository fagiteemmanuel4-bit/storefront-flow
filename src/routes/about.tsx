import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, ShieldCheck, ShoppingBag, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { marketingHead } from "@/lib/marketingSeo";

export const Route = createFileRoute("/about")({
  head: () => marketingHead({
    title: "About Strap — Retail operations software by Kryonara",
    description: "Learn about Strap, the retail operations platform from Kryonara that connects selling, inventory, teams, reporting and online commerce.",
    path: "/about",
  }),
  component: AboutPage,
});

const principles = [
  {
    icon: Boxes,
    title: "Clarity in daily operations",
    text: "Product, stock and sales information should be easy to find and useful when a decision needs to be made.",
  },
  {
    icon: Users,
    title: "Work that fits the team",
    text: "Owners, managers and cashiers need tools that support their responsibilities and keep access organised.",
  },
  {
    icon: ShieldCheck,
    title: "Control that stays with the business",
    text: "Store data, roles and operational settings should remain clear to the people responsible for the business.",
  },
];

function AboutPage() {
  return (
    <div className="marketing-site min-h-screen">
      <SiteHeader />
      <main>
        <section className="marketing-info-hero">
          <div className="marketing-info-hero__copy">
            <span className="marketing-kicker">ABOUT STRAP · BY KRYONARA</span>
            <h1>Retail work, brought into <span>one clear system.</span></h1>
            <p>Strap is a retail operations platform built by Kryonara. It connects point of sale, products, inventory, customers, staff, branches, expenses, reporting and online orders in one workspace.</p>
            <div className="marketing-info-hero__actions">
              <Link to="/product" className="marketing-button">Explore the platform <ArrowRight size={16} /></Link>
              <Link to="/how-it-works" className="marketing-button marketing-button--quiet">How it works</Link>
            </div>
          </div>
          <figure className="marketing-info-hero__media">
            {/* Source: Unsplash, used under the Unsplash License. This is editorial retail photography, not a Strap customer screenshot. */}
            <img
              src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=82"
              alt="Organised grocery products displayed on retail shelves"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <figcaption>Designed around the work of everyday retail</figcaption>
          </figure>
        </section>

        <section className="marketing-info-sections">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">Why Strap exists</p>
            <h2>Retail is more than the moment a customer pays.</h2>
            <p>Every sale connects to products, stock, people, costs and customer expectations. Strap brings those operational details together so a business can work from a more consistent picture.</p>
          </div>
          <div className="marketing-info-grid">
            {principles.map(({ icon: Icon, title, text }) => (
              <article className="marketing-info-card" key={title}>
                <span className="marketing-info-card__icon"><Icon size={21} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="marketing-workflow">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">One connected operation</p>
            <h2>From the counter to the wider business.</h2>
          </div>
          <div className="marketing-audience__grid">
            <article><ShoppingBag size={21}/><h3>Sell</h3><p>Record transactions and keep checkout focused.</p></article>
            <article><Boxes size={21}/><h3>Manage</h3><p>Organise products, inventory and branch activity.</p></article>
            <article><Users size={21}/><h3>Coordinate</h3><p>Give the team clear roles and customer context.</p></article>
            <article><BarChart3 size={21}/><h3>Understand</h3><p>Review sales, expenses and business performance.</p></article>
          </div>
        </section>

        <section className="marketing-info-cta">
          <div>
            <p className="marketing-eyebrow">Built for everyday commerce</p>
            <h2>See how Strap can fit the way your shop works.</h2>
            <p>Explore the product, review the plans or follow the setup guide.</p>
          </div>
          <div className="marketing-info-cta__actions">
            <Link to="/pricing" className="marketing-button marketing-button--quiet">View pricing</Link>
            <Link to="/auth" className="marketing-button">Create a free account <ArrowRight size={16}/></Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
