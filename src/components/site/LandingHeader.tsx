import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X } from "lucide-react";

const NAV_ITEMS = [["Features", "#features"], ["How it works", "#how-it-works"], ["Online store", "#online-store"], ["Insights", "#insights"]] as const;

export function LandingHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 56);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!visible) setMobileOpen(false);
  }, [visible]);

  return (
    <header className={`fixed left-1/2 top-3 z-50 w-[calc(100%-1rem)] max-w-5xl -translate-x-1/2 rounded-full border border-border/70 bg-surface/88 shadow-[0_18px_55px_-35px_rgba(0,0,0,.55)] backdrop-blur-xl transition-all duration-500 motion-reduce:transition-none ${visible ? "pointer-events-auto translate-y-0 opacity-100" : "pointer-events-none -translate-y-8 opacity-0"}`} aria-hidden={!visible}>
      <div className="mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-5">
        <Link to="/" className="group flex shrink-0 items-center gap-2" onClick={() => setMobileOpen(false)}>
          <span className="flex size-8 items-center justify-center rounded-full bg-accent shadow-sm transition-transform duration-300 group-hover:scale-110"><span className="size-3 rotate-45 rounded-[3px] bg-foreground" /></span>
          <span className="font-display text-xl font-bold tracking-tight">KUDI.</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label="Primary navigation">
          {NAV_ITEMS.map(([label, href]) => <a key={label} href={href} className="relative py-2 transition-colors hover:text-accent-ink after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-accent after:transition-all hover:after:w-full">{label}</a>)}
          <Link to="/support" className="transition-colors hover:text-accent-ink">Help</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/support" className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-secondary sm:inline-flex">Help</Link>
          <Link to="/auth" className="hidden items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground sm:inline-flex">Open register</Link>
          <button type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} onClick={() => setMobileOpen((open) => !open)} className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-secondary sm:hidden">{mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}</button>
        </div>
      </div>
      {mobileOpen && <div className="absolute left-0 right-0 top-[calc(100%+.5rem)] rounded-3xl border border-border bg-surface/98 px-4 pb-5 pt-3 shadow-lift backdrop-blur-xl sm:hidden"><nav className="grid gap-1" aria-label="Mobile navigation">{NAV_ITEMS.map(([label, href]) => <a key={label} href={href} onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-secondary">{label}</a>)}<Link to="/support" onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors hover:bg-secondary">Help Centre</Link><Link to="/auth" onClick={() => setMobileOpen(false)} className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3.5 text-sm font-semibold text-background transition-all hover:bg-accent hover:text-accent-foreground">Open register <ArrowRight className="size-4" /></Link></nav></div>}
    </header>
  );
}
