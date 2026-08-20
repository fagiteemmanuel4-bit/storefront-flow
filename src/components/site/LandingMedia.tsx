import { ArrowRight, BarChart3, PackageCheck, Play, ShoppingBag, Sparkles, Store } from "lucide-react";

const VIDEOS = [
  { src: "https://pixabay.com/videos/download/x-1006_medium.mp4", label: "Run the operation", title: "Keep the shop moving while Kudi keeps the details straight." },
  { src: "https://pixabay.com/videos/download/x-21117_medium.mp4", label: "Take it online", title: "Turn your catalogue into a storefront customers can actually use." },
] as const;

const ILLUSTRATIONS = {
  product: "https://unpkg.com/undraw-svg@1.0.0/svgs/product-demo.svg",
  shopping: "https://unpkg.com/undraw-svg@1.0.0/svgs/web-shopping.svg",
  transactions: "https://unpkg.com/undraw-svg@1.0.0/svgs/online-transactions.svg",
  business: "https://unpkg.com/undraw-svg@1.0.0/svgs/business-shop.svg",
  stats: "https://unpkg.com/undraw-svg@1.0.0/svgs/online-stats.svg",
} as const;

function Illustration({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-auto w-full object-contain ${className}`} width={640} height={520} />
  );
}

function SmartVideo({ src, title }: { src: string; title: string }) {
  return <video className="absolute inset-0 h-full w-full object-cover" src={src} autoPlay muted loop playsInline preload="metadata" aria-label={title} />;
}

export function LandingMedia() {
  return (
    <>
      <section className="relative overflow-hidden border-y border-border bg-surface px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.82fr_1.18fr]">
          <div className="relative z-10">
            <p className="text-label-caps text-accent-ink">Built around the real shop</p>
            <h2 className="text-display-md mt-4">A retail system should make the work feel lighter.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Kudi connects the counter, stockroom, customers and online store so every action has a useful next step.</p>
            <div className="mt-9 flex flex-wrap gap-3 text-sm font-semibold text-foreground">
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-accent" />Sales</span>
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-accent" />Stock</span>
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-accent" />Orders</span>
              <span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-accent" />Online</span>
            </div>
          </div>
          <Illustration src={ILLUSTRATIONS.product} alt="Illustration of a product and digital retail experience" className="mx-auto max-w-[38rem]" />
        </div>
      </section>

      <section className="overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div className="order-2 lg:order-1"><Illustration src={ILLUSTRATIONS.shopping} alt="Illustration of online shopping and digital storefront activity" className="mx-auto max-w-[34rem]" /></div>
            <div className="order-1 lg:order-2">
              <p className="text-label-caps text-accent-ink">Online catalogue</p>
              <h2 className="text-display-md mt-4">Make your products easy to discover.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">Publish products, organise categories, show real stock and let customers browse from anywhere.</p>
              <div className="mt-8 flex items-center gap-3 text-sm font-semibold text-accent-ink"><Store className="size-4" /> One catalogue connected to your stock</div>
            </div>
          </div>

          <div className="mt-24 grid items-center gap-12 lg:grid-cols-[.95fr_1.05fr]">
            <div>
              <p className="text-label-caps text-accent-ink">Sales that stay connected</p>
              <h2 className="text-display-md mt-4">Sell once. Let Kudi keep the records aligned.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">A sale should update stock, revenue and the customer's history without you entering the same information twice.</p>
              <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold"><span className="inline-flex items-center gap-2"><ShoppingBag className="size-4 text-accent-ink" /> Orders</span><span className="inline-flex items-center gap-2"><PackageCheck className="size-4 text-accent-ink" /> Stock</span><span className="inline-flex items-center gap-2"><BarChart3 className="size-4 text-accent-ink" /> Reports</span></div>
            </div>
            <Illustration src={ILLUSTRATIONS.transactions} alt="Illustration of digital transactions and connected payments" className="mx-auto max-w-[32rem]" />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-foreground px-4 py-20 text-background sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-label-caps text-accent">See the operation, not just the software.</p>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight sm:text-5xl">The details keep moving even when you are busy.</h2>
              <p className="mt-5 max-w-xl leading-7 text-background/65">Use the visual stories to understand how Kudi fits into the rhythm of a real retail day.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {VIDEOS.map((video) => <article key={video.src} className="group relative min-h-[17rem] overflow-hidden rounded-[2rem] border border-background/10 bg-background/5"><SmartVideo src={video.src} title={video.title} /><div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">{video.label}</p><h3 className="mt-2 font-display text-xl font-bold">{video.title}</h3></div></article>)}
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <Illustration src={ILLUSTRATIONS.business} alt="Illustration of a business shop and merchant workspace" className="mx-auto max-w-[34rem]" />
            <div><p className="text-label-caps text-accent-ink">One source of truth</p><h2 className="text-display-md mt-4">Your shop should not live in five different places.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Kudi gives your products, sales, customers, expenses and online orders one connected home.</p><div className="mt-8 inline-flex items-center gap-2 font-semibold text-accent-ink"><Sparkles className="size-4" /> Less duplication. Better decisions.</div></div>
          </div>
          <div className="mt-24 grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div><p className="text-label-caps text-accent-ink">Business intelligence</p><h2 className="text-display-md mt-4">Turn daily activity into decisions.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Reports should answer what happened, what needs attention and what you should do next.</p><div className="mt-8 inline-flex items-center gap-2 font-semibold text-accent-ink"><ArrowRight className="size-4" /> From numbers to next action</div></div>
            <Illustration src={ILLUSTRATIONS.stats} alt="Illustration of business analytics and performance insights" className="mx-auto max-w-[34rem]" />
          </div>
        </div>
      </section>
    </>
  );
}
