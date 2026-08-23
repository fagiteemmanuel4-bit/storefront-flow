import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Boxes, GitBranch, Settings2, Store, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/docs")({ component: DocsPage });

const sections = [
  [Store, "Getting started", "Create your Strap store, complete onboarding, add products and publish your storefront."],
  [Boxes, "Products & inventory", "Manage products, variants, stock levels, sales, purchasing and inventory operations."],
  [Users, "Teams & staff", "Invite staff, control roles and permissions, and keep day-to-day store access organised."],
  [GitBranch, "Multi-branch", "Create and manage multiple business locations while keeping branch operations separated."],
  [Settings2, "Advanced settings", "Configure storefront, inventory, POS, notifications, security, SEO and operational preferences."],
  [Zap, "Store editor", "Use the visual editor to customize your storefront, add sections, edit content and preview responsive layouts."],
] as const;

function DocsPage() {
  return <main className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><Link to="/" className="font-display text-xl font-bold">Strap</Link><span className="text-sm text-muted-foreground">Documentation · Strap by Kryonara</span></div></header>
    <section className="mx-auto max-w-6xl px-5 pb-16 pt-20"><p className="text-sm font-semibold uppercase tracking-[.16em] text-accent-ink">Strap documentation</p><h1 className="mt-4 max-w-4xl font-display text-5xl font-bold tracking-tight sm:text-6xl">Everything you need to run your commerce workspace.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">Learn how Strap works across point of sale, inventory, online stores, staff, branches, settings and storefront customization.</p></section>
    <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 md:grid-cols-2 lg:grid-cols-3">{sections.map(([Icon,title,body]) => <article key={title} className="rounded-2xl border border-border bg-card p-6"><Icon className="size-5 text-accent-ink"/><h2 className="mt-5 font-display text-xl font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></article>)}</section>
    <section className="mx-auto max-w-6xl px-5 pb-24"><div className="rounded-3xl border border-border bg-muted/40 p-8"><h2 className="font-display text-2xl font-bold">Publishing & availability</h2><p className="mt-3 max-w-3xl leading-7 text-muted-foreground">Payments and custom domains are currently marked Coming Soon. Existing commerce, store, inventory, staff and online-store workflows remain available according to your account and plan.</p><Link to="/auth" className="mt-6 inline-flex items-center gap-2 font-semibold text-accent-ink">Start with Strap <ArrowRight className="size-4"/></Link></div></section>
  </main>;
}
