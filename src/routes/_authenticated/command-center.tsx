import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, ClipboardList, Gift, PackageSearch, ReceiptText, Send, ShieldCheck, Truck, Users, Warehouse } from "lucide-react";
import { AppShell } from "@/components/shell/AppShell";

export const Route = createFileRoute("/_authenticated/command-center")({ component: CommandCenter });

const ACTIONS = [
  [PackageSearch, "Inventory intelligence", "Low-stock risk, inventory value and actionable stock signals.", "/stock-sense"],
  [Boxes, "Products", "Manage your catalogue, pricing and stock from one workspace.", "/products"],
  [Gift, "Storefront", "Manage your online catalogue and publishing workflow.", "/online-store"],
  [Users, "Customer intelligence", "Understand customer relationships and purchase behaviour.", "/customers"],
  [ClipboardList, "Orders", "Review online orders and move them through fulfilment.", "/online-store/orders"],
  [Send, "Branches", "Compare branches and coordinate multi-location operations.", "/branches"],
  [ReceiptText, "Expenses", "Track business spending alongside sales performance.", "/expenses"],
  [Truck, "Fulfilment", "Open online orders and keep fulfilment work moving.", "/online-store/orders"],
  [Warehouse, "Analytics", "Turn real trading data into decisions and reports.", "/reports"],
  [BarChart3, "Business insights", "See fast operational signals across sales, stock and customers.", "/insights"],
];

function CommandCenter() {
  return <AppShell title="Command center"><div className="space-y-7">
    <section className="relative overflow-hidden rounded-[2rem] border border-border bg-foreground px-6 py-7 text-background sm:px-8 sm:py-8">
      <div className="relative"><div className="flex items-center gap-2 text-background/60"><ShieldCheck className="size-4" /><span className="text-label-caps">Owner & manager workspace</span></div><h2 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-4xl">Everything your business needs, one decision away.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-background/60">Jump directly into the work that matters instead of hunting through menus. Each destination opens the existing Strap workflow for that job.</p></div>
    </section>
    <section><div className="flex items-end justify-between gap-4"><div><p className="text-label-caps text-accent-ink">Operations</p><h3 className="mt-1 font-display text-xl font-semibold">Your commerce workspace</h3></div><Link to="/pos" className="hidden items-center gap-1.5 text-sm font-semibold text-accent-ink sm:inline-flex">Open Sell<ArrowRight className="size-4" /></Link></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ACTIONS.map(([Icon, title, body, to], index) => <Link key={title as string} to={to as never} className="group rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5" /></span><span className="font-display text-2xl font-bold text-border group-hover:text-accent/50">{String(index + 1).padStart(2, "0")}</span></div><h4 className="mt-5 font-semibold">{title as string}</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-ink">Open<ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></Link>)}</div>
    </section>
  </div></AppShell>;
}
