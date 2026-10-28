import { ArrowRight, BarChart3, PackageCheck, ShoppingBag, Sparkles, Store } from "lucide-react";

const VIDEOS = [
  { src: "https://pixabay.com/videos/download/x-1006_medium.mp4", label: "Run the operation", title: "Keep the shop moving while Strap keeps the details straight.", poster: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1400&q=85" },
  { src: "https://pixabay.com/videos/download/x-21117_medium.mp4", label: "Take it online", title: "Turn your catalogue into a storefront customers can actually use.", poster: "https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=1400&q=85" },
  { src: "https://cdn.pixabay.com/video/2019/01/24/20910-313490233_tiny.mp4", label: "Built for momentum", title: "Let the visual rhythm of the business move with Strap.", poster: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85" },
  { src: "https://cdn.pixabay.com/video/2015/08/08/151-135737478_tiny.mp4", label: "Everyday commerce", title: "Keep the work simple from the first sale to the last order.", poster: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=85" },
] as const;

const ILLUSTRATIONS = {
  product: "https://unpkg.com/undraw-svg@1.0.0/svgs/product-demo.svg",
  shopping: "https://unpkg.com/undraw-svg@1.0.0/svgs/web-shopping.svg",
  transactions: "https://unpkg.com/undraw-svg@1.0.0/svgs/online-transactions.svg",
  business: "https://unpkg.com/undraw-svg@1.0.0/svgs/business-shop.svg",
  stats: "https://unpkg.com/undraw-svg@1.0.0/svgs/online-stats.svg",
} as const;

const PHOTOGRAPHY = [
  { src: "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1400&q=85", alt: "Diverse business team collaborating in a modern workspace", caption: "Made for the people building real businesses" },
  { src: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1400&q=85", alt: "Entrepreneurs working together around a laptop", caption: "Clear tools. Less operational noise." },
  { src: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1400&q=85", alt: "Business team working together in an office", caption: "A business system that grows with you" },
] as const;

function Illustration({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} loading="lazy" decoding="async" className={`h-auto w-full object-contain ${className}`} width={640} height={520} />;
}

function SmartVideo({ src, title, poster }: { src: string; title: string; poster: string }) {
  return (
    <>
      <img src={poster} alt="" aria-hidden="true" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      <video className="absolute inset-0 h-full w-full object-cover" src={src} poster={poster} autoPlay muted loop playsInline preload="metadata" aria-label={title} />
    </>
  );
}

export function LandingMedia() {
  return (
    <>
      <section className="kudi-reveal relative overflow-hidden border-y border-border bg-surface px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.82fr_1.18fr]">
          <div className="relative z-10">
            <p className="text-label-caps text-accent-ink">Built around the real shop</p>
            <h2 className="text-display-md mt-4">A retail system should make the work feel lighter.</h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">Strap connects the counter, stockroom, customers and online store so every action has a useful next step.</p>
            <div className="mt-9 flex flex-wrap gap-3 text-sm font-semibold text-foreground">
              {["Sales", "Stock", "Orders", "Online"].map((item) => <span key={item} className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-accent" />{item}</span>)}
            </div>
          </div>
          <Illustration src={ILLUSTRATIONS.product} alt="Illustration of a product and digital retail experience" className="mx-auto max-w-[38rem]" />
        </div>
      </section>

      <section className="kudi-reveal overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
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
              <h2 className="text-display-md mt-4">Sell once. Let Strap keep the records aligned.</h2>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">A sale should update stock, revenue and the customer's history without you entering the same information twice.</p>
              <div className="mt-8 flex flex-wrap gap-4 text-sm font-semibold"><span className="inline-flex items-center gap-2"><ShoppingBag className="size-4 text-accent-ink" /> Orders</span><span className="inline-flex items-center gap-2"><PackageCheck className="size-4 text-accent-ink" /> Stock</span><span className="inline-flex items-center gap-2"><BarChart3 className="size-4 text-accent-ink" /> Reports</span></div>
            </div>
            <Illustration src={ILLUSTRATIONS.transactions} alt="Illustration of digital transactions and connected payments" className="mx-auto max-w-[32rem]" />
          </div>
        </div>
      </section>

      <section className="kudi-reveal border-y border-white/10 bg-neutral-950 px-4 py-20 text-white sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-8 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <p className="text-label-caps text-accent">Strap in motion</p>
              <h2 className="mt-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">See the operation, not just the software.</h2>
              <p className="mt-5 max-w-xl leading-7 text-white/75">Four visual stories. One connected retail system.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {VIDEOS.map((video) => <article key={video.src} className="group relative min-h-[17rem] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.06]"><SmartVideo src={video.src} poster={video.poster} title={video.title} /><div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">{video.label}</p><h3 className="mt-2 font-display text-xl font-bold text-white">{video.title}</h3></div></article>)}
            </div>
          </div>
        </div>
      </section>

      <section className="kudi-reveal overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <Illustration src={ILLUSTRATIONS.business} alt="Illustration of a business shop and merchant workspace" className="mx-auto max-w-[34rem]" />
            <div><p className="text-label-caps text-accent-ink">One source of truth</p><h2 className="text-display-md mt-4">Your shop should not live in five different places.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Strap gives your products, sales, customers, expenses and online orders one connected home.</p><div className="mt-8 inline-flex items-center gap-2 font-semibold text-accent-ink"><Sparkles className="size-4" /> Less duplication. Better decisions.</div></div>
          </div>
        </div>
      </section>

      <section className="kudi-reveal overflow-hidden border-y border-border bg-background px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl"><p className="text-label-caps text-accent-ink">Built for the people behind the business</p><h2 className="text-display-md mt-4">A little human energy belongs in the product story.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Strap is software, but the reason it exists is simple: make the daily work of running a shop calmer.</p></div>
          <div className="grid gap-5 md:grid-cols-3">
            {PHOTOGRAPHY.map((photo, index) => <figure key={photo.src} className={`group relative overflow-hidden rounded-[2rem] bg-secondary shadow-sm ${index === 1 ? "md:translate-y-10" : ""}`}><img src={photo.src} alt={photo.alt} loading="lazy" decoding="async" width={1400} height={900} className="h-[22rem] w-full object-cover transition duration-700 group-hover:scale-[1.035]" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" /><figcaption className="absolute bottom-0 left-0 p-6 font-display text-xl font-bold text-white">{photo.caption}</figcaption></figure>)}
          </div>
        </div>
      </section>

      <section className="kudi-reveal overflow-hidden px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
            <div><p className="text-label-caps text-accent-ink">Business intelligence</p><h2 className="text-display-md mt-4">Turn daily activity into decisions.</h2><p className="mt-5 text-lg leading-8 text-muted-foreground">Reports should answer what happened, what needs attention and what you should do next.</p><div className="mt-8 inline-flex items-center gap-2 font-semibold text-accent-ink"><ArrowRight className="size-4" /> From numbers to next action</div></div>
            <Illustration src={ILLUSTRATIONS.stats} alt="Illustration of business analytics and performance insights" className="mx-auto max-w-[34rem]" />
          </div>
        </div>
      </section>
    </>
  );
}
