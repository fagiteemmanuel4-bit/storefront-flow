import { Link } from "@tanstack/react-router";

/** Shared Strap identity header for verification and account setup screens. */
export function AuthBrand() {
  return (
    <section className="sa-l">
      <Link to="/" className="sa-logo" aria-label="Strap home">
        <span className="sa-dot" aria-hidden="true" />
        <span>Strap</span>
      </Link>
      <p className="sa-brand-tagline">Run your business. Not around it.</p>
    </section>
  );
}
