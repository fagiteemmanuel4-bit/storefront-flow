import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BarChart3, Boxes, ClipboardList, Gift, PackageSearch, ReceiptText, Search, Send, ShieldCheck, Truck, Users, Warehouse } from "lucide-react";

export const Route = createFileRoute("/_authenticated/command-center")({ component: CommandCenter });

const ACTIONS = [
  [PackageSearch, "Inventory intelligence", "Low stock, out of stock, inventory value and attention signals.", "/commerce-operations"],
  [Boxes, "Product variants", "Manage SKU-level product options and stock-aware variants.", "/commerce-operations"],
  [Gift, "Product bundles", "Group products into sellable bundles and prepare component stock workflows.", "/commerce-operations"],
  [Users, "Suppliers", "Keep supplier records connected to purchasing operations.", "/commerce-operations"],
  [ClipboardList, "Purchase orders", "Move purchasing from draft through ordering and receiving.", "/commerce-operations"],
  [Send, "Stock transfers", "Coordinate inventory movement between branches.", "/commerce-operations"],
  [ReceiptText, "Discounts & promotions", "Create and manage discount-code operations.", "/commerce-operations"],
  [Gift, "Loyalty", "Track customer loyalty balances and adjustments.", "/commerce-operations"],
  [Truck, "Fulfillment", "Move online orders through operational fulfillment stages.", "/commerce-operations"],
  [Warehouse, "Shipping", "Configure shipping-rate operations for online orders.", "/commerce-operations"],
  [BarChart3, "Customer intelligence", "Use segments and insights to understand customer behaviour.", "/insights"],
  [Search, "Global search", "Jump into the right operational surface quickly.", "/dashboard"],
];

function CommandCenter() { return <div className="min-h-full bg-surface px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-label-caps text-accent-ink">Operations</p><h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Strap Command Center</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A single launchpad for the twelve commerce capabilities that turn Strap from a POS into a broader retail operating system.</p></div><div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-xs font-semibold"><ShieldCheck className="size-4 text-accent-ink" />Owner & manager workspace</div></div><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{ACTIONS.map(([Icon,title,body,to], index) => <Link key={title as string} to={to as "/commerce-operations" | "/insights" | "/dashboard"} className="group rounded-2xl border border-border bg-background p-5 transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-sm"><div className="flex items-start justify-between"><span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Icon className="size-5" /></span><span className="font-display text-3xl font-bold text-border group-hover:text-accent/40">{String(index + 1).padStart(2,"0")}</span></div><h2 className="mt-5 font-semibold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-ink">Open workflow<ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></Link>)}</div><div className="mt-8 rounded-2xl border border-border bg-foreground p-6 text-background"><p className="text-label-caps text-accent">Next layer</p><h2 className="mt-2 font-display text-2xl font-bold">The command center is the bridge to deeper workflows.</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-background/60">The underlying commerce operations already exist; this surface makes them discoverable from one place. Payments and custom domains remain intentionally held.</p></div></div></div>; }
