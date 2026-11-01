/* eslint-disable prettier/prettier -- JSX is intentionally grouped into readable landing sections. */
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Globe2,
  Menu,
  Package,
  ScanLine,
  ShieldCheck,
  ShoppingCart,
  Wallet,
  X,
} from "lucide-react";
import "./../landing-hero.css";

const SITE_URL = "https://storefront-flow.vercel.app";

const navigation = [
  ["Product", "#product"],
  ["How it works", "#how-it-works"],
  ["Online store", "#online-store"],
  ["FAQs", "#faq"],
] as const;

const features = [
  {
    icon: ShoppingCart,
    number: "01",
    title: "Sell without the slowdown",
    description:
      "Search or scan products, build a cart, record a sale and keep the checkout moving.",
  },
  {
    icon: Package,
    number: "02",
    title: "Know what is in your shop",
    description:
      "Keep product quantities, stock movements and low-stock items visible in one place.",
  },
  {
    icon: Wallet,
    number: "03",
    title: "Understand the numbers",
    description:
      "Bring sales, expenses and business reports together to make clearer daily decisions.",
  },
];

const steps = [
  [
    "Set up your shop",
    "Add your products, organise your stock and invite the people who help you run the business.",
  ],
  [
    "Run your daily sales",
    "Use the register to search, scan, build carts and record transactions.",
  ],
  [
    "Keep everything connected",
    "Review stock, expenses and reports, then publish a catalogue when you are ready to sell online.",
  ],
];

const faqs = [
  [
    "What is Strap?",
    "Strap is a retail workspace that brings point of sale, inventory, expenses, reporting and online catalogue tools together.",
  ],
  [
    "Can I use Strap on a phone and a computer?",
    "Yes. Strap is designed to work across modern mobile and desktop browsers. Hardware support depends on your device and browser.",
  ],
  [
    "Can my staff use it?",
    "Yes. Store access supports owner, manager and cashier roles, with permissions for everyday work.",
  ],
  [
    "Can I sell online?",
    "You can publish a shareable product catalogue and manage customer orders from the same workspace. Online-store availability depends on your plan.",
  ],
];

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link to="/" className="strap-brand" aria-label="Strap home">
      <span
        className={`strap-brand-mark ${inverse ? "strap-brand-mark-inverse" : ""}`}
        aria-hidden="true"
      >
        <span />
      </span>
      <span>
        STRAP<span className="strap-brand-period">.</span>
      </span>
    </Link>
  );
}

function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="strap-landing">
      <header className="strap-header">
        <div className="strap-header-inner">
          <BrandMark />
          <nav className="strap-nav" aria-label="Main navigation">
            {navigation.map(([label, href]) => (
              <a key={label} href={href}>
                {label}
              </a>
            ))}
          </nav>
          <div className="strap-header-actions">
            <Link to="/auth" className="strap-login">
              Sign in
            </Link>
            <Link to="/auth" className="strap-button strap-button-dark strap-button-small">
              Get started <ArrowRight size={16} />
            </Link>
            <button
              type="button"
              className="strap-menu-toggle"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="strap-mobile-nav" aria-label="Mobile navigation">
            {navigation.map(([label, href]) => (
              <a key={label} href={href} onClick={closeMenu}>
                {label}
              </a>
            ))}
            <Link to="/auth" onClick={closeMenu}>
              Sign in / Get started <ArrowRight size={16} />
            </Link>
          </nav>
        )}
      </header>

      <main>
        <section className="strap-hero">
          <div className="strap-hero-orbit strap-hero-orbit-one" aria-hidden="true" />
          <div className="strap-hero-orbit strap-hero-orbit-two" aria-hidden="true" />
          <div className="strap-container strap-hero-grid">
            <div className="strap-hero-copy">
              <p className="strap-eyebrow strap-eyebrow-light">
                <span /> RETAIL, IN ONE PLACE
              </p>
              <h1>
                Run your shop.
                <br />
                <span>Not around it.</span>
              </h1>
              <p className="strap-hero-description">
                Sales, stock, expenses and online orders — connected in one clear workspace, so you
                can focus on the business in front of you.
              </p>
              <div className="strap-hero-actions">
                <Link to="/auth" className="strap-button strap-button-yellow">
                  Start with Strap <ArrowRight size={18} />
                </Link>
                <a href="#product" className="strap-text-link strap-text-link-light">
                  See what you can do <ArrowDownRight size={17} />
                </a>
              </div>
              <div className="strap-hero-note">
                <Check size={15} /> Built for the everyday work of retail
              </div>
            </div>
            <div
              className="strap-hero-art"
              aria-label="Strap connects the essential parts of a retail business"
            >
              <div className="strap-art-ring strap-art-ring-outer" />
              <div className="strap-art-ring strap-art-ring-inner" />
              <div className="strap-art-core">
                <BrandMark inverse />
                <span className="strap-art-caption">YOUR RETAIL WORKSPACE</span>
              </div>
              <div className="strap-art-chip strap-art-chip-sales">
                <ShoppingCart size={18} />
                <span>Sales</span>
              </div>
              <div className="strap-art-chip strap-art-chip-stock">
                <Package size={18} />
                <span>Stock</span>
              </div>
              <div className="strap-art-chip strap-art-chip-money">
                <Wallet size={18} />
                <span>Money</span>
              </div>
              <div className="strap-art-chip strap-art-chip-online">
                <Globe2 size={18} />
                <span>Online</span>
              </div>
            </div>
          </div>
          <div className="strap-container strap-hero-bottom">
            <span>ONE WORKSPACE</span>
            <span className="strap-bottom-line" />
            <span>MORE CONTROL OVER EVERYDAY RETAIL</span>
          </div>
        </section>

        <section id="product" className="strap-section strap-intro">
          <div className="strap-container strap-intro-grid">
            <p className="strap-eyebrow">THE STRAP APPROACH</p>
            <div>
              <h2>Good business starts with a clearer view.</h2>
              <p className="strap-lead">
                No scattered records. No switching between disconnected tools just to understand
                your day. Strap brings the essentials together and keeps the work moving.
              </p>
            </div>
          </div>
        </section>

        <section className="strap-section strap-features">
          <div className="strap-container">
            <div className="strap-section-heading">
              <div>
                <p className="strap-eyebrow">THE ESSENTIALS, CONNECTED</p>
                <h2>Everything has its place.</h2>
              </div>
              <p>One practical system for the work that keeps your shop running.</p>
            </div>
            <div className="strap-feature-grid">
              {features.map(({ icon: Icon, number, title, description }) => (
                <article className="strap-feature" key={number}>
                  <div className="strap-feature-top">
                    <span>{number}</span>
                    <Icon size={22} strokeWidth={1.7} />
                  </div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="strap-section strap-process">
          <div className="strap-container strap-process-grid">
            <div className="strap-process-heading">
              <p className="strap-eyebrow strap-eyebrow-light">A SIMPLE WAY TO WORK</p>
              <h2>From first setup to everyday flow.</h2>
              <p>Start with what you need today. Add more as your business grows.</p>
              <Link to="/auth" className="strap-button strap-button-yellow">
                Open your workspace <ArrowRight size={17} />
              </Link>
            </div>
            <div className="strap-steps">
              {steps.map(([title, description], index) => (
                <article className="strap-step" key={title}>
                  <span className="strap-step-number">0{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="online-store" className="strap-section strap-online">
          <div className="strap-container strap-online-grid">
            <div>
              <p className="strap-eyebrow">YOUR SHOP, BEYOND THE COUNTER</p>
              <h2>Give customers another way to find you.</h2>
              <p className="strap-lead">
                Turn your product catalogue into a shareable online storefront. Keep products
                organised and manage incoming orders from the same place you run your shop.
              </p>
              <Link to="/auth" className="strap-text-link">
                Explore Strap <ArrowRight size={17} />
              </Link>
            </div>
            <div className="strap-online-panel">
              <div className="strap-online-window">
                <div className="strap-window-bar">
                  <i />
                  <i />
                  <i />
                  <span>YOUR STORE</span>
                </div>
                <div className="strap-window-content">
                  <div className="strap-window-heading">
                    <span>Discover the collection</span>
                    <Globe2 size={19} />
                  </div>
                  <div className="strap-window-products">
                    <span className="strap-product-block strap-product-one" />
                    <span className="strap-product-block strap-product-two" />
                    <span className="strap-product-block strap-product-three" />
                  </div>
                  <div className="strap-window-lines">
                    <i />
                    <i />
                  </div>
                </div>
              </div>
              <span className="strap-online-label">
                <Globe2 size={15} /> A storefront you can share
              </span>
            </div>
          </div>
        </section>

        <section className="strap-section strap-control">
          <div className="strap-container strap-control-grid">
            <div className="strap-control-mark">
              <BarChart3 size={38} strokeWidth={1.4} />
            </div>
            <div>
              <p className="strap-eyebrow">CLARITY THAT ADDS UP</p>
              <h2>Make the next decision with better information.</h2>
              <p className="strap-lead">
                See sales, expenses and stock information together. Understand what is happening
                today and what deserves your attention next.
              </p>
            </div>
            <div className="strap-control-points">
              <span>
                <ScanLine size={17} /> Checkout and scanning
              </span>
              <span>
                <ShieldCheck size={17} /> Team access controls
              </span>
              <span>
                <BarChart3 size={17} /> Business reports
              </span>
            </div>
          </div>
        </section>

        <section id="faq" className="strap-section strap-faq">
          <div className="strap-container strap-faq-grid">
            <div>
              <p className="strap-eyebrow">GOOD TO KNOW</p>
              <h2>Questions, answered.</h2>
              <p className="strap-lead">A little more detail before you get started.</p>
              <Link to="/support" className="strap-text-link">
                Visit the Help Centre <ArrowRight size={17} />
              </Link>
            </div>
            <div className="strap-faq-list">
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <ChevronDown size={18} />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="strap-final-cta">
          <div className="strap-container strap-final-cta-inner">
            <div>
              <p className="strap-eyebrow strap-eyebrow-light">MAKE ROOM FOR WHAT'S NEXT</p>
              <h2>Bring your shop together with Strap.</h2>
            </div>
            <Link to="/auth" className="strap-button strap-button-yellow">
              Get started <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="strap-footer">
        <div className="strap-container strap-footer-main">
          <div>
            <BrandMark inverse />
            <p>Retail operations, made clearer.</p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="#product">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#online-store">Online store</a>
            <Link to="/support">Help Centre</Link>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
          </nav>
          <Link to="/auth" className="strap-footer-cta">
            Open Strap <ArrowRight size={16} />
          </Link>
        </div>
        <div className="strap-container strap-footer-bottom">
          <span>© {new Date().getFullYear()} Strap by Kryonara.</span>
          <span>Built for everyday retail.</span>
        </div>
      </footer>
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Strap — Retail, in one place" },
      {
        name: "description",
        content:
          "Strap brings point of sale, inventory, expenses, reporting and online catalogue tools together for everyday retail businesses.",
      },
      {
        name: "keywords",
        content:
          "Strap POS Nigeria, point of sale Nigeria, inventory management, retail software Nigeria, stock management, online store Nigeria",
      },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Strap — Retail, in one place" },
      {
        property: "og:description",
        content:
          "Sell, manage stock, track your business and take orders online from one workspace.",
      },
      { property: "og:url", content: SITE_URL },
      { property: "og:locale", content: "en_NG" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Strap — Retail, in one place" },
      {
        name: "twitter:description",
        content: "A practical retail workspace for sales, inventory, customers and online selling.",
      },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Landing,
});
