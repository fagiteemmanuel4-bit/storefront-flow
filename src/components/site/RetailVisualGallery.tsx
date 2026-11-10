import { ArrowUpRight, BarChart3, Boxes, ShoppingBag } from "lucide-react";

// Editorial photography sourced from Unsplash under the Unsplash License; these are not Strap product screenshots.\nconst visuals = [
  {
    title: "The counter, in control",
    body: "A focused point-of-sale flow for the moments when the shop gets busy.",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=82",
    alt: "Modern point of sale terminal on a retail counter",
    icon: ShoppingBag,
    tag: "SELL WITH CLARITY",
  },
  {
    title: "Stock with a place",
    body: "Keep product information and quantities organised as the business moves.",
    image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=82",
    alt: "Organised products on shelves in a grocery store",
    icon: Boxes,
    tag: "STAY ORGANISED",
  },
  {
    title: "A view beyond today",
    body: "Bring sales, stock and business signals into a more useful picture.",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=82",
    alt: "Business analytics displayed on a laptop",
    icon: BarChart3,
    tag: "UNDERSTAND THE BUSINESS",
  },
];

export function RetailVisualGallery() {
  return (
    <section className="border-y border-border bg-muted/25">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[.2em] text-accent-ink">THE STRAP EXPERIENCE</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">Made for the real rhythm of retail.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">From the counter to the stockroom and the reports that guide tomorrow, the details of your shop deserve one clear home.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold text-muted-foreground"><ShoppingBag className="size-4 text-accent-ink" /> Retail, connected</span>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {visuals.map(({title,body,image,alt,icon:Icon,tag}) => (
            <article key={title} className="group overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="relative h-56 overflow-hidden">
                <img src={image} alt={alt} loading="lazy" decoding="async" width="1200" height="800" sizes="(max-width: 768px) 100vw, 33vw" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full border border-white/20 bg-black/35 px-3 py-1.5 text-[10px] font-bold tracking-[.16em] text-white backdrop-blur">{tag}</span>
                <span className="absolute right-4 top-4 grid size-10 place-items-center rounded-xl border border-white/20 bg-black/35 text-white backdrop-blur"><Icon className="size-5" /></span>
              </div>
              <div className="p-6"><div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">{title}</h3><ArrowUpRight className="size-4 shrink-0 text-accent-ink transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
