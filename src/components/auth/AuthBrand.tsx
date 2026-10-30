import { Link } from "@tanstack/react-router";

export function AuthBrand() {
  return (
    <section className="sa-l">
      <svg className="sa-ring" aria-hidden="true" viewBox="0 0 700 700" fill="none" stroke="#C6F432" strokeWidth="2">
        <circle cx="350" cy="350" r="60" />
        <circle cx="350" cy="350" r="120" strokeOpacity=".7" />
        <circle cx="350" cy="350" r="180" strokeOpacity=".5" />
        <circle cx="350" cy="350" r="240" strokeOpacity=".32" />
        <circle cx="350" cy="350" r="300" strokeOpacity=".18" />
        <circle cx="350" cy="110" r="9" fill="#C6F432" stroke="none" />
        <circle cx="562" cy="472" r="9" fill="#C6F432" stroke="none" />
      </svg>
      <Link to="/" className="sa-logo" aria-label="Strap home">
        <span className="sa-dot" />
        Strap
      </Link>
      <div>
        <h2>Run the shop. Don’t run after the paperwork.</h2>
        <p className="sa-lead">Your business deserves a system you can trust.</p>
      </div>
      <small>© 2026 Strap by Kryonara</small>
    </section>
  );
}
