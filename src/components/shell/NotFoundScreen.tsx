import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Compass, Home, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotFoundScreen() {
  return (
    <main
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-background px-5 py-12"
      aria-labelledby="not-found-title"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-32 -top-36 size-80 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-28 size-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <section className="relative w-full max-w-xl">
        <div className="rounded-[2rem] border border-border bg-card/95 p-7 text-center shadow-lift backdrop-blur sm:p-12">
          <Link
            to="/"
            aria-label="Strap home"
            className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
          >
            <span className="flex size-7 items-center justify-center rounded-lg bg-accent text-accent-foreground">
              <Compass className="size-4" aria-hidden="true" />
            </span>
            STRAP
          </Link>

          <div className="mx-auto mt-9 flex size-20 items-center justify-center rounded-3xl border border-accent/25 bg-accent-soft text-accent-ink">
            <span className="numeric text-3xl font-bold tracking-tight">404</span>
          </div>

          <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
            Page not found
          </p>
          <h1
            id="not-found-title"
            className="mt-3 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            Looks like this page took a wrong turn.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">
            We can’t find the page you’re looking for. The address may be incorrect,
            the link may have expired, or the page may have been moved.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="min-h-11">
              <Link to="/">
                <Home className="mr-2 size-4" aria-hidden="true" />
                Back to Strap home
                <ArrowRight className="ml-2 size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="min-h-11">
              <Link to="/auth">
                <LogIn className="mr-2 size-4" aria-hidden="true" />
                Sign in to Strap
              </Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) window.history.back();
              else window.location.assign("/");
            }}
            className="mx-auto mt-7 inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Go back to the previous page
          </button>
        </div>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Strap by Kryonara · Retail commerce, made simpler.
        </p>
      </section>
    </main>
  );
}
