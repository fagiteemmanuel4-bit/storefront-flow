import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Boxes,
  ClipboardList,
  Package,
  ScanLine,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { InteractiveProductStage } from "@/components/site/InteractiveProductStage";
import { PricingSection } from "@/components/site/PricingSection";
import { RetailVisualGallery } from "@/components/site/RetailVisualGallery";
import { SeoJsonLd } from "@/components/site/SeoJsonLd";
import { marketingHead } from "@/lib/marketingSeo";
import { FAQ_ITEMS, FAQ_PAGE_SCHEMA } from "@/lib/faqContent";
import { AnimatedCounter, MagneticAnchor, Reveal } from "@/components/site/MarketingMotion";

const features = [
  {
    icon: ShoppingBag,
    title: "Point of sale",
    body: "Search or scan products, review the cart, record payment methods and issue receipts from a focused checkout.",
    href: "/checkout",
    label: "Sell with confidence",
  },
  {
    icon: Boxes,
    title: "Inventory management",
    body: "Keep product details and stock levels organised. See what is available and what needs attention.",
    href: "/inventory-management",
    label: "Know your stock",
  },
  {
    icon: Users,
    title: "Customers and teams",
    body: "Keep customer records connected to purchases and give staff access that matches their responsibilities.",
    href: "/customer-management",
    label: "Work together",
  },
  {
    icon: BarChart3,
    title: "Reports and insights",
    body: "Review sales, expenses and inventory information to understand what is happening across the business.",
    href: "/business-insights",
    label: "Understand the numbers",
  },
  {
    icon: Store,
    title: "Online storefront",
    body: "Publish a shareable product catalogue and manage incoming online orders from the same workspace.",
    href: "/online-store-platform",
    label: "Sell beyond the counter",
  },
  {
    icon: ClipboardList,
    title: "Branches and operations",
    body: "Organise branch-level stock, sales and team workflows as your retail operation grows.",
    href: "/branches-and-locations",
    label: "Grow with structure",
  },
];

const steps = [
  ["01", "Set up your workspace", "Create your account, add your business details and prepare your first location."],
  ["02", "Build your catalogue", "Add products, prices, categories and barcodes so your team can find items quickly."],
  ["03", "Run daily operations", "Record sales, manage stock, review customers and keep business activity connected."],
  ["04", "Take your catalogue online", "Publish selected products and manage online orders alongside your in-store work."],
];

const shopTypes = [
  { icon: Store, title: "Grocery and convenience", text: "Manage everyday products, fast-moving stock and counter sales." },
  { icon: ShoppingBag, title: "Fashion and lifestyle", text: "Organise products, variants and sales in one retail workspace." },
  { icon: Package, title: "Electronics and accessories", text: "Keep product identifiers, inventory and customer records together." },
  { icon: Wallet, title: "Food service and specialty retail", text: "Connect daily selling, stock and operating costs." },
];

export function Landing() {
  return (
    <div className="marketing-site min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="marketing-hero">
          <div className="marketing-hero__glow marketing-hero__glow--one" aria-hidden="true" />
          <div className="marketing-hero__glow marketing-hero__glow--two" aria-hidden="true" />
          <div className="marketing-hero__inner">
            <div className="marketing-hero__copy">
              <span className="marketing-kicker"><span className="marketing-kicker__dot" /> RETAIL OPERATIONS BY KRYONARA</span>
              <h1>Run your retail business from <span>one connected workspace.</span></h1>
              <p>Strap brings sales, products, inventory, customers, teams, reports and online orders together—so your business can move without disconnected tools.</p>
              <div className="marketing-hero__actions">
                <MagneticAnchor href="/auth" className="marketing-button">Create a free account <ArrowRight size={16} /></MagneticAnchor>
                <Link to="/product" className="marketing-button marketing-button--outline">Explore the platform</Link>
              </div>
              <div className="marketing-hero__signals">
                <span><ScanLine size={16} /> Scan and sell</span>
                <span><Boxes size={16} /> Track inventory</span>
                <span><ShieldCheck size={16} /> Manage access</span>
              </div>
              <p className="marketing-hero__caption">Start with the essentials. Add more tools as your shop grows.</p>
            </div>
            <div className="marketing-hero__visual">
              <InteractiveProductStage />
            </div>
          </div>
          <div className="marketing-hero__bottom">
            <span>One workspace</span><span>Daily operations</span><span>Online commerce</span><span>Business visibility</span>
          </div>
        </section>

        <Reveal><section className="marketing-intro" id="platform">
          <div>
            <p className="marketing-eyebrow">A connected retail system</p>
            <h2>Every important part of your shop, moving together.</h2>
          </div>
          <p>When a sale happens, the details should not stop at the counter. Strap connects the records and workflows that help your team serve customers, manage stock and understand the business.</p>
        </section></Reveal>
        <div className="marketing-marquee" aria-label="Strap retail workflows">
          <div className="marketing-marquee__track" aria-hidden="true">
            {["Point of sale","Inventory","Customers","Teams","Branches","Online store","Reports","Expenses","Point of sale","Inventory","Customers","Teams","Branches","Online store","Reports","Expenses"].map((item,index) => <span key={index}>{item}</span>)}
          </div>
          <span className="sr-only">Point of sale, inventory, customers, teams, branches, online store, reports and expenses.</span>
        </div>
        <Reveal><section className="marketing-feature-section" id="features">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">The platform</p>
            <h2>Built around the work behind every sale.</h2>
            <p>Bring the tools your team uses every day into one clear operating flow.</p>
          </div>
          <div className="marketing-feature-grid">
            {features.map(({ icon: Icon, title, body, href, label }, index) => (
              <article className={`marketing-feature-card marketing-feature-card--${index + 1}`} key={title} onPointerMove={(event) => { if (event.pointerType === "touch") return; const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width - 0.5; const y = (event.clientY - rect.top) / rect.height - 0.5; event.currentTarget.style.setProperty("--card-tilt-x", `${-y * 2.5}deg`); event.currentTarget.style.setProperty("--card-tilt-y", `${x * 3}deg`); }} onPointerLeave={(event) => { event.currentTarget.style.setProperty("--card-tilt-x", "0deg"); event.currentTarget.style.setProperty("--card-tilt-y", "0deg"); }}>
                <div className="marketing-feature-card__top">
                  <span className="marketing-feature-card__icon"><Icon size={21} /></span>
                  <span>{label}</span>
                </div>
                <h3>{title}</h3>
                <p>{body}</p>
                <Link to={href as never} className="marketing-text-link">Explore {title.toLowerCase()} <ArrowRight size={15} /></Link>
              </article>
            ))}
          </div>
        </section></Reveal>
        <Reveal><section className="marketing-showcase">
          <div className="marketing-showcase__copy">
            <p className="marketing-eyebrow">See the workflow</p>
            <h2>One clear view of what is happening in your business.</h2>
            <p>Switch between an overview, inventory and online orders to see how the main parts of a retail operation fit together.</p>
            <ul>
              <li><CheckCircleIcon /> Sales and stock in context</li>
              <li><CheckCircleIcon /> Product records that stay organised</li>
              <li><CheckCircleIcon /> Online orders alongside shop operations</li>
            </ul>
            <Link to="/how-it-works" className="marketing-text-link">See how Strap works <ArrowRight size={15} /></Link>
          </div>
          <div className="marketing-showcase__preview">
            <InteractiveProductStage />
          </div>
        </section></Reveal>
        <Reveal><RetailVisualGallery />

        </Reveal>
        <section className="marketing-stats" aria-label="Strap at a glance">
          <div><AnimatedCounter value={20} label="feature guides" /><span>Dedicated feature guides</span></div>
          <div><AnimatedCounter value={3} label="plans" /><span>Plan options</span></div>
          <div><AnimatedCounter value={1} label="workspace" /><span>Connected retail workspace</span></div>
        </section>
        <Reveal><section className="marketing-workflow" id="how-it-works">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">How it works</p>
            <h2>Simple to start. Structured for the work ahead.</h2>
            <p>Build your workspace in practical steps and grow into the workflows your business needs.</p>
          </div>
          <ol className="marketing-workflow__grid">
            {steps.map(([number, title, body]) => (
              <li key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{body}</p>
              </li>
            ))}
          </ol>
        </section></Reveal>
        <Reveal><section className="marketing-audience">
          <div className="marketing-section-heading">
            <p className="marketing-eyebrow">Made for everyday retail</p>
            <h2>Flexible enough for different kinds of shops.</h2>
            <p>Keep the core workflows consistent while your catalogue and business model stay your own.</p>
          </div>
          <div className="marketing-audience__grid">
            {shopTypes.map(({ icon: Icon, title, text }) => (
              <article key={title}>
                <Icon size={20} />
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section></Reveal>
        <Reveal><PricingSection />

        </Reveal>
        <Reveal><section className="marketing-faq" id="faq">
          <div className="marketing-faq__intro">
            <p className="marketing-eyebrow">Questions, answered</p>
            <h2>Know what to expect before you start.</h2>
            <p>Find practical answers about the platform, supported workflows and where to get help.</p>
            <Link to="/faq" className="marketing-text-link">Visit the FAQ <ArrowRight size={15} /></Link>
          </div>
          <div className="marketing-faq__list">
            {FAQ_ITEMS.map(({ question, answer }) => (
              <details key={question}>
                <summary>{question}<span aria-hidden="true">+</span></summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section></Reveal>
        <Reveal><section className="marketing-final-cta">
          <div>
            <p className="marketing-eyebrow">Start with the essentials</p>
            <h2>Give your shop one place to work from.</h2>
            <p>Create your workspace, add your products and bring the everyday details together.</p>
          </div>
          <MagneticAnchor href="/auth" className="marketing-button">Start with Strap free <ArrowRight size={16} /></MagneticAnchor>
        </section></Reveal>
      </main>
      <SiteFooter />
      <SeoJsonLd data={FAQ_PAGE_SCHEMA} />
    </div>
  );
}

function CheckCircleIcon() {
  return <span className="marketing-check" aria-hidden="true">✓</span>;
}

export const Route = createFileRoute("/landing")({
  head: () => marketingHead({
    title: "Strap — Retail POS, Inventory and Online Store Software",
    description: "Manage sales, products, inventory, customers, staff, branches, expenses and online orders in one retail operations workspace.",
    path: "/",
  }),
  component: Landing,
});
