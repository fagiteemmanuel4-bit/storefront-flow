import { Link } from "@tanstack/react-router";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-accent">
            <span className="size-3 rotate-45 rounded-[3px] bg-foreground" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">KUDI.</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
          <Link to="/support" className="transition-colors hover:text-accent-ink">
            Help centre
          </Link>
          <Link to="/terms" className="transition-colors hover:text-accent-ink">
            Terms
          </Link>
          <Link to="/privacy" className="transition-colors hover:text-accent-ink">
            Privacy
          </Link>
        </nav>
        <Link
          to="/auth"
          className="touch-target inline-flex items-center rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Open register
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-foreground px-4 py-12 text-background sm:px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="size-6 rounded-full bg-accent" />
          <span className="font-display text-lg font-bold">KUDI POS</span>
        </div>
        <p className="text-xs text-background/50">
          © {new Date().getFullYear()} Kudi. Built for small shops across West and East Africa.
        </p>
        <div className="text-label-caps flex gap-6">
          <Link to="/privacy" className="transition-colors hover:text-accent">
            Privacy
          </Link>
          <Link to="/terms" className="transition-colors hover:text-accent">
            Terms
          </Link>
          <Link to="/support" className="transition-colors hover:text-accent">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
