import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Bot, Boxes, Branch, CheckCircle2, LockKeyhole, ShieldCheck, Workflow } from "lucide-react";

export const Route = createFileRoute("/mcp")({
  head: () => ({
    meta: [
      { title: "STRAP MCP — Connect your AI assistants to your store" },
      { name: "description", content: "Learn how STRAP MCP securely connects AI assistants to your retail operations, with branch-level access controls and permissioned actions." },
    ],
  }),
  component: StrapMcpLearnPage,
});

function StrapMcpLearnPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3"><img src="/favicon.svg" alt="STRAP" className="size-9" /><span className="text-lg font-extrabold tracking-tight">STRAP</span></Link>
          <Link to="/settings/ai-agents" className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background">Manage AI access</Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 pb-20 pt-14 sm:pt-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300"><span className="size-2 rounded-full bg-emerald-500" /> STRAP MCP SERVER IS LIVE</div>
          <h1 className="mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">Your store data. Your AI assistant. Your rules.</h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">STRAP MCP connects your retail workspace to AI assistants that support the Model Context Protocol (MCP). Ask an assistant to inspect your catalogue, understand stock levels, review sales and expenses, or carry out approved product and inventory updates—without handing over your STRAP password or database credentials.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link to="/settings/ai-agents" className="rounded-xl bg-[#c6f432] px-5 py-3 text-sm font-bold text-[#0e1116]">Configure AI access</Link><a href="#how-it-works" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold">How it works</a></div>
        </div>

        <section className="mt-16 grid gap-4 sm:grid-cols-3">
          {[{icon:Boxes,title:"Understand operations",body:"Let an assistant search products, check low stock, read branch information and retrieve permitted sales or expense records."},{icon:Workflow,title:"Take approved actions",body:"When enabled, assistants can create or update products and set branch stock quantities. Write access is off by default."},{icon:ShieldCheck,title:"Keep control",body:"Choose the branches and data categories available to AI. STRAP still enforces the connected user's account and role permissions."}].map((item) => { const Icon = item.icon; return <article key={item.title} className="rounded-2xl border border-border p-5"><Icon className="size-6" /><h2 className="mt-4 text-lg font-bold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p></article>; })}
        </section>

        <section id="how-it-works" className="mt-20 scroll-mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">01 · How it works</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">A secure connection, not a shared password.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">MCP is a standard that lets compatible AI applications discover and call tools exposed by a service. STRAP hosts the MCP server as a remote service. When an AI application connects, STRAP uses OAuth to authenticate the merchant and obtain permission for the connection. Requests are then processed with the authenticated user's STRAP identity and existing database access rules.</p>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {[["1","Connect an AI app","Add the STRAP MCP endpoint to a compatible AI client and start its secure sign-in flow."],["2","Sign in and approve","Authenticate with your STRAP account. Review the requesting application and approve or deny access."],["3","Set your boundaries","Choose permitted branches and read/write capabilities in Settings → AI agents & MCP."]].map(([number,title,body]) => <div key={number} className="rounded-2xl border border-border p-5"><span className="text-3xl font-extrabold text-muted-foreground/50">{number}</span><h3 className="mt-3 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>)}
          </div>
        </section>

        <section className="mt-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">02 · Capabilities</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">What connected AI assistants can do</h2>
          <div className="mt-7 divide-y divide-border border-y border-border">
            {[["Product catalogue","Search products and view catalogue details. With write access enabled, create products or update names, SKUs, barcodes, categories, pricing and stock thresholds."],["Inventory and branches","List authorised branches, inspect low-stock products and read branch-level quantities. With stock write access, set the exact quantity for a product at an authorised branch."],["Sales and expenses","Retrieve permitted sales and expense records, with date filters and branch-level restrictions."],["Customer information","Search customer records and retrieve limited contact and loyalty summary fields when customer access is enabled."],["Store identity","Identify the connected STRAP account, list accessible stores and read permitted store profile details."]].map(([title,body]) => <article key={title} className="grid gap-2 py-5 sm:grid-cols-[220px_1fr]"><h3 className="text-base font-bold">{title}</h3><p className="text-sm leading-6 text-muted-foreground">{body}</p></article>)}
          </div>
        </section>

        <section className="mt-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">03 · Access and security</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Permissions are deliberate, and write access is optional.</h2>
          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-border p-5"><LockKeyhole className="size-6" /><h3 className="mt-4 text-lg font-bold">Branch-level access</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Owners and managers can allow all branches or select only the locations an AI assistant should be able to inspect or update. Branch-scoped sales, expenses and inventory tools honour that selection.</p></div>
            <div className="rounded-2xl border border-border p-5"><ShieldCheck className="size-6" /><h3 className="mt-4 text-lg font-bold">Existing STRAP permissions</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">The MCP server uses the authenticated user's access token and row-level security. Product and stock writes remain subject to STRAP's owner/manager database policies. The service does not use a public service-role key for merchant operations.</p></div>
            <div className="rounded-2xl border border-border p-5"><CheckCircle2 className="size-6" /><h3 className="mt-4 text-lg font-bold">Read by default, writes by choice</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Read permissions can be configured by category. Product and stock write permissions are off by default and must be enabled by an owner or manager. Disabling the connection blocks future MCP tool access.</p></div>
            <div className="rounded-2xl border border-border p-5"><Workflow className="size-6" /><h3 className="mt-4 text-lg font-bold">Action records</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Product and stock changes performed through MCP are written to a store audit log that owners and managers can review from the AI agents settings page.</p></div>
          </div>
          <p className="mt-5 text-sm leading-6 text-muted-foreground">As with any connected AI service, only connect applications you trust. AI providers process information according to their own privacy terms. Avoid asking an assistant to retrieve customer details unless that information is necessary for the task.</p>
        </section>

        <section className="mt-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">04 · Getting started</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Connect your preferred AI client.</h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">STRAP MCP uses a remote Streamable HTTP endpoint. Add the endpoint in an AI client that supports remote MCP servers and OAuth authentication. The client will guide you through the STRAP sign-in and authorisation process. Availability and setup steps vary by AI provider and subscription.</p>
          <div className="mt-6 rounded-2xl border border-border bg-secondary/30 p-5"><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">STRAP MCP endpoint</p><code className="mt-3 block break-all text-sm">https://lhizunrljottkhemdfei.supabase.co/functions/v1/mcp</code></div>
          <div className="mt-6 flex flex-wrap gap-3"><Link to="/settings/ai-agents" className="rounded-xl bg-foreground px-5 py-3 text-sm font-bold text-background">Open AI agent settings</Link><Link to="/settings" className="rounded-xl border border-border px-5 py-3 text-sm font-semibold">Back to settings</Link></div>
        </section>

        <footer className="mt-20 border-t border-border pt-7 text-sm text-muted-foreground">STRAP is developed by Kryonara. MCP access is an optional integration; your core STRAP workspace continues to work if you disconnect an AI client.</footer>
      </div>
    </main>
  );
}
