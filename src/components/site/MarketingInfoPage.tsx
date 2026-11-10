import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Sparkles, type LucideIcon } from "lucide-react";

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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
            <span className="grid size-8 place-items-center rounded-full border-2 border-[#c6f432] bg-[#0e1116]"><span className="size-3 rounded-full bg-[#c6f432]" /></span>
            Strap
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
            <Link to="/product" className="hover:text-foreground">Product</Link>
            <Link to="/how-it-works" className="hover:text-foreground">How it works</Link>
            <Link to="/support" className="hover:text-foreground">Help</Link>
          </nav>
          <Link to="/auth" className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">Open Strap <ArrowRight className="ml-1 inline size-4" /></Link>
        </div>
      </header>
      <main>
        <section className="relative isolate overflow-hidden border-b border-border bg-[radial-gradient(ellipse_at_15%_5%,var(--color-accent-soft),transparent_48%)]">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1fr_.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[.14em] text-accent-ink"><HeroIcon className="size-4" /> {page.eyebrow}</div>
              <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl">{page.title} <span className="text-accent-ink">{page.highlight}</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">{page.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/auth" className="rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background">Explore Strap <ArrowRight className="ml-1 inline size-4" /></Link>
                <Link to="/docs" className="rounded-xl border border-border bg-card px-6 py-3.5 text-sm font-semibold">Read the guides</Link>
              </div>
              <div className="mt-9 flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-accent-ink" /> Connected workflows</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-accent-ink" /> Store-aware operations</span>
                <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-accent-ink" /> Built for everyday retail</span>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-5 rounded-[2.5rem] bg-accent/15 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-2 shadow-2xl">
                <img src={page.image} alt={page.imageAlt} className="h-[330px] w-full rounded-[1.5rem] object-cover sm:h-[420px]" loading="eager" />
                <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-[#10130c]/85 p-4 text-white shadow-xl backdrop-blur-xl">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#c6f432] text-[#10130c]"><HeroIcon className="size-5" /></span>
                    <div><p className="text-sm font-bold">{page.note}</p><p className="mt-1 text-xs text-white/65">A clearer way to run your shop</p></div>
                    <Sparkles className="ml-auto size-5 text-[#c6f432]" />
                  </div>
                </div>
              </div>
              <div className="absolute -right-3 -top-4 hidden rounded-2xl border border-border bg-card px-4 py-3 shadow-xl sm:block"><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">STRAP WORKSPACE</p><p className="mt-1 text-sm font-bold">One connected view</p></div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-accent-ink">A CLOSER LOOK</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Designed around the details that matter.</h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">Good retail operations are built from repeatable habits. These tools help your team keep information clear, work consistently and understand what needs attention.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {page.sections.map(({ icon: Icon, title, body, bullets }, index) => (
              <article key={title} className="group rounded-3xl border border-border bg-card p-6 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                <div className="flex items-center justify-between"><span className="grid size-12 place-items-center rounded-2xl bg-accent-soft text-accent-ink transition group-hover:bg-accent group-hover:text-accent-foreground"><Icon className="size-5" /></span><span className="text-xs font-bold tracking-widest text-muted-foreground">0{index + 1}</span></div>
                <h3 className="mt-6 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{body}</p>
                <ul className="mt-5 space-y-2">{bullets.map((item) => <li key={item} className="flex gap-2 text-xs leading-5 text-muted-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent-ink" />{item}</li>)}</ul>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-foreground text-background">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">THE EVERYDAY FLOW</p><h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Make the next step feel obvious.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-background/65">Strap brings connected parts of the business into one place, so teams can build a dependable routine without losing sight of the bigger picture.</p></div>
            <div className="grid gap-3 sm:grid-cols-3">{page.steps.map((step, index) => <div key={step} className="rounded-2xl border border-background/15 bg-background/[.05] p-5"><p className="text-xs font-bold text-accent">STEP 0{index + 1}</p><p className="mt-3 text-sm font-semibold leading-6">{step}</p></div>)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-8 sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[.2em] text-accent-ink">KEEP EXPLORING</p>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Bring the moving parts together.</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">Explore the wider Strap workspace, follow the setup walkthrough or visit the Help Centre for practical guidance.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3"><Link to="/product" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold">Explore product</Link><Link to="/how-it-works" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold">How it works</Link><Link to="/support" className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground">Visit Help Centre <ArrowRight className="ml-1 inline size-4" /></Link></div>
        </section>
      </main>
    </div>
  );
}
