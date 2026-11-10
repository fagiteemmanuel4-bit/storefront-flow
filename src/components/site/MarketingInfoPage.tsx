import { Reveal } from "@/components/site/MarketingMotion";
import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, ChevronRight, type LucideIcon } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export type MarketingSection = {
  icon: LucideIcon;
  title: string;
  body: string;
  bullets: string[];
};

export type MarketingPage = {
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  image: string;
  imageAlt: string;
  icon: LucideIcon;
  note: string;
  sections: MarketingSection[];
  steps: string[];
};

export function MarketingInfoPage({ page }: { page: MarketingPage }) {
  const HeroIcon = page.icon;
  return (
    <div className="marketing-site min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <div className="marketing-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <Link to="/product">Product</Link>
          <ChevronRight size={14} aria-hidden="true" />
          <span aria-current="page">{page.eyebrow.toLowerCase()}</span>
        </div>

        <Reveal><section className="marketing-info-hero">
          <div className="marketing-info-hero__copy">
            <span className="marketing-kicker"><HeroIcon size={15} /> {page.eyebrow}</span>
            <h1>{page.title} <span>{page.highlight}</span></h1>
            <p>{page.description}</p>
            <div className="marketing-info-hero__actions">
              <Link to="/auth" className="marketing-button">Start free <ArrowRight size={16} /></Link>
              <Link to="/docs" className="marketing-button marketing-button--quiet">Read the guides</Link>
            </div>
            <span className="marketing-info-note"><CheckCircle2 size={15} /> {page.note}</span>
          </div>
          <figure className="marketing-info-hero__media">
            <img src={page.image} alt={page.imageAlt} loading="eager" fetchPriority="high" decoding="async" />
            <figcaption>Strap for everyday retail operations</figcaption>
          </figure>
        </section></Reveal>

        <Reveal><section className="marketing-info-sections">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">A connected workflow</p>
            <h2>Everything has a place in the way your shop runs.</h2>
            <p>Keep the details together, make the next action clearer and give your team a consistent way to work.</p>
          </div>
          <div className="marketing-info-grid">
            {page.sections.map(({ icon: Icon, title, body, bullets }, index) => (
              <article className="marketing-info-card" key={title}>
                <span className="marketing-info-card__icon"><Icon size={21} /></span>
                <span className="marketing-info-card__number">0{index + 1}</span>
                <h3>{title}</h3>
                <p>{body}</p>
                <ul>
                  {bullets.map((bullet) => <li key={bullet}><CheckCircle2 size={15} /> {bullet}</li>)}
                </ul>
              </article>
            ))}
          </div>
        </section></Reveal>

        <Reveal><section className="marketing-steps-section">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">How it fits together</p>
            <h2>A practical path from setup to everyday use.</h2>
          </div>
          <ol className="marketing-steps">
            {page.steps.map((step, index) => (
              <li key={step}>
                <span>0{index + 1}</span>
                <strong>{step}</strong>
              </li>
            ))}
          </ol>
        </section></Reveal>

        <Reveal><section className="marketing-info-cta">
          <div>
            <p className="marketing-eyebrow">One connected workspace</p>
            <h2>Bring the moving parts of retail together.</h2>
            <p>Explore the full platform or create a free account to set up your shop.</p>
          </div>
          <div className="marketing-info-cta__actions">
            <Link to="/product" className="marketing-button marketing-button--quiet">Explore Strap</Link>
            <Link to="/auth" className="marketing-button">Create a free account <ArrowRight size={16} /></Link>
          </div>
        </section></Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
