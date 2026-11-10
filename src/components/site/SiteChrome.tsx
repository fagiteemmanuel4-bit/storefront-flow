import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, ShieldCheck, Store, X } from "lucide-react";

const footerGroups = [
  {
    title: "Product",
    links: [
      ["Overview", "/product"],
      ["How it works", "/how-it-works"],
      ["Pricing", "/pricing"],
      ["Point of sale", "/checkout"],
      ["Inventory management", "/inventory-management"],
      ["Customer management", "/customer-management"],
      ["Team management", "/team-management"],
    ],
  },
  {
    title: "Operations",
    links: [
      ["Branches", "/branches-and-locations"],
      ["Business insights", "/business-insights"],
      ["Expenses", "/expense-management"],
      ["Barcode scanning", "/barcode-scanning"],
      ["Receipts and printing", "/receipts-and-printing"],
      ["Retail hardware", "/retail-hardware"],
      ["Store security", "/store-security"],
    ],
  },
  {
    title: "Online commerce",
    links: [
      ["Online store", "/online-store"],
      ["Online orders", "/online-orders"],
      ["Storefront design", "/storefront-design"],
      ["Payments and transactions", "/payments-and-transactions"],
      ["Product imports", "/product-imports"],
      ["Offline selling", "/offline-selling"],
      ["Merchant safety", "/merchant-safety"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Documentation", "/docs"],
      ["Getting started", "/getting-started"],
      ["Help Centre", "/support"],
      ["Frequently asked questions", "/faq"],
      ["Contact", "/contact"],
      ["About Strap", "/about"],
      ["AI integrations", "/mcp"],
    ],
  },
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`marketing-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="marketing-header__inner">
        <Link to="/" className="marketing-brand" onClick={closeMenu} aria-label="Strap home">
          <img src="/brand/logo-mark.svg" alt="" width="34" height="34" />
          <span>Strap</span>
        </Link>

        <nav className="marketing-nav" aria-label="Main navigation">
          <Link to="/product">Product</Link>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/online-store">Online store</Link>
          <Link to="/docs">Resources</Link>
        </nav>

        <div className="marketing-header__actions">
          <Link to="/auth" className="marketing-header__login">Sign in</Link>
          <Link to="/auth" className="marketing-button marketing-button--small">
            Start free <ArrowRight size={15} />
          </Link>
          <button
            type="button"
            className="marketing-menu-toggle"
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={menuOpen}
            aria-controls="marketing-mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav id="marketing-mobile-navigation" className="marketing-mobile-nav" aria-label="Mobile navigation">
          <Link to="/product" onClick={closeMenu}>Product</Link>
          <Link to="/how-it-works" onClick={closeMenu}>How it works</Link>
          <Link to="/pricing" onClick={closeMenu}>Pricing</Link>
          <Link to="/online-store" onClick={closeMenu}>Online store</Link>
          <Link to="/docs" onClick={closeMenu}>Documentation</Link>
          <Link to="/support" onClick={closeMenu}>Help Centre</Link>
          <Link to="/auth" onClick={closeMenu} className="marketing-mobile-nav__cta">Start free <ArrowRight size={15} /></Link>
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer__inner">
        <section className="marketing-footer__cta">
          <div>
            <p className="marketing-eyebrow">A clearer way to run retail</p>
            <h2>Bring your shop into one connected workspace.</h2>
            <p>Manage the counter, stockroom, team and online store with a system built around everyday retail.</p>
          </div>
          <Link to="/auth" className="marketing-button">
            Create a free account <ArrowRight size={16} />
          </Link>
        </section>

        <div className="marketing-footer__main">
          <div className="marketing-footer__brand">
            <Link to="/" className="marketing-brand marketing-brand--footer">
              <img src="/brand/logo-mark-inverse.svg" alt="" width="34" height="34" />
              <span>Strap</span>
            </Link>
            <p>Retail operations software by Kryonara. One place to sell, manage stock, serve customers and grow online.</p>
            <span className="marketing-footer__trust"><ShieldCheck size={15} /> Built for everyday business operations</span>
          </div>

          {footerGroups.map((group) => (
            <nav key={group.title} className="marketing-footer__group" aria-label={group.title}>
              <h3>{group.title}</h3>
              {group.links.map(([label, href]) => (
                <a href={href} key={href}>{label}</a>
              ))}
            </nav>
          ))}
        </div>

        <div className="marketing-footer__bottom">
          <span>© {year} Strap by Kryonara. All rights reserved.</span>
          <nav aria-label="Legal navigation">
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="/cookies">Cookies</a>
            <a href="/contact">Contact</a>
          </nav>
          <span className="marketing-footer__location"><Store size={14} /> Serving modern retail businesses</span>
        </div>
      </div>
    </footer>
  );
}
