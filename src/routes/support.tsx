import { marketingHead } from "@/lib/marketingSeo";
import { RetailVisualGallery } from "@/components/site/RetailVisualGallery";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Boxes, CircleHelp, LifeBuoy, PackagePlus, ScanLine, ShieldCheck, Store, Users } from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";

export const Route = createFileRoute("/support")({
  head: () => marketingHead({
    title: "Help Centre — Strap setup, product guides & support",
    description: "Find practical help for setting up Strap, managing products and stock, recording sales, managing your team and selling online.",
    path: "/support",
  }),
  component: Support,
});
const topics = [
  { icon: Store, title: "Getting started", text: "Create your workspace, set up your shop details and prepare your first branch.", href: "/getting-started", action: "Follow the setup walkthrough" },
  { icon: PackagePlus, title: "Products & catalogue", text: "Add products, keep pricing and product details organised, and prepare your catalogue.", href: "/inventory-management", action: "Read product documentation" },
  { icon: ScanLine, title: "Sales & checkout", text: "Find products, scan barcodes, build a cart, record payments and issue receipts.", href: "/checkout", action: "Explore point of sale help" },
  { icon: Boxes, title: "Stock & branches", text: "Understand stock quantities, low-stock visibility and branch-level stock operations.", href: "/branches-and-locations", action: "Learn stock management" },
  { icon: Users, title: "Staff & access", text: "Understand owner, manager and cashier roles and how store access is organised.", href: "/team-management", action: "Read team access guidance" },
  { icon: ShieldCheck, title: "Account & security", text: "Find guidance on signing in, account access, privacy and protecting your workspace.", href: "/store-security", action: "Review security guidance" },
];
function Support() {
  return <div className="marketing-site min-h-screen bg-background text-foreground"><SiteHeader/><main>
    <section className="border-b border-border bg-[radial-gradient(ellipse_at_top_left,var(--color-accent-soft),transparent_58%)]"><div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 sm:py-24"><p className="text-label-caps font-bold text-accent-ink">STRAP HELP CENTRE</p><h1 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">A little help for <span className="text-accent-ink">the work ahead.</span></h1><p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">Find your way around Strap with practical walkthroughs for setup, selling, stock, people and online orders. Start with a topic below or open the full documentation.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/docs" className="rounded-xl bg-foreground px-6 py-3.5 text-sm font-semibold text-background">Browse documentation <ArrowRight className="ml-1 inline size-4"/></Link><Link to="/getting-started" className="rounded-xl border border-border px-6 py-3.5 text-sm font-semibold">Getting started</Link></div></div></section>
    <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-label-caps text-accent-ink">BROWSE BY TOPIC</p><h2 className="mt-2 font-display text-3xl font-bold">What do you need help with?</h2></div><Link to="/docs" className="text-sm font-semibold text-accent-ink">All guides <ArrowRight className="ml-1 inline size-4"/></Link></div><div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{topics.map(({icon:Icon,title,text,href,action})=><article key={title} className="rounded-3xl border border-border bg-card p-6"><span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5"/></span><h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{text}</p><a href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-ink">{action}<ArrowRight className="size-4"/></a></article>)}</div></section>
    <section className="border-y border-border bg-muted/30"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-14 sm:px-8 md:grid-cols-2"><div><LifeBuoy className="size-7 text-accent-ink"/><h2 className="mt-4 text-2xl font-bold">Still finding your feet?</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Start with the six-step workflow for a guided overview, then use the documentation for deeper explanations of individual features.</p><Link to="/how-it-works" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent-ink">Start the walkthrough <ArrowRight className="size-4"/></Link></div><div className="rounded-2xl border border-border bg-card p-5"><BookOpen className="size-6 text-accent-ink"/><h3 className="mt-3 font-bold">Full product documentation</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Browse product guides, quickstart instructions, storefront guidance, security notes and troubleshooting topics.</p><Link to="/docs" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Open documentation <ArrowRight className="size-4"/></Link></div></div></section>
    <section id="contact" className="mx-auto max-w-4xl px-5 py-16 text-center sm:px-8"><CircleHelp className="mx-auto size-8 text-accent-ink"/><h2 className="mt-4 font-display text-2xl font-bold">Need help with something specific?</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Use the in-app feedback option to report a problem or share a suggestion with the Strap team. Include the page you were using and what you expected to happen.</p><Link to="/auth" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-foreground">Open Strap <ArrowRight className="size-4"/></Link></section>
          <RetailVisualGallery />
      </main><SiteFooter/></div>;
}
