import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TourStep = { title: string; body: string; target?: string };

const DEFAULT_STEPS: TourStep[] = [
  { title: "Welcome to Kudi", body: "This quick tour shows you where the important parts of your shop live. You can skip it anytime." },
  { title: "Sell", body: "Search or scan products, build a cart, take payment and print or share a receipt from one fast counter flow.", target: "[data-tour='sell']" },
  { title: "Stock", body: "Add products, monitor quantities and spot low-stock items before they become a problem.", target: "[data-tour='stock']" },
  { title: "Customers", body: "Save regular customers, see their visit history and attach a customer to a sale when you want a better relationship record.", target: "[data-tour='customers']" },
  { title: "Reports", body: "Use sales, expenses and inventory information together to understand how the shop is doing.", target: "[data-tour='reports']" },
  { title: "Your menu", body: "Open Menu anytime for settings, online store tools, receipts, customer management, help and new Kudi features.", target: "[data-tour='menu']" },
];

function keyFor(userId: string | null) { return `kudi.tour.seen.${userId ?? "device"}`; }

export function ProductTour({ steps = DEFAULT_STEPS, force = false, onDone }: { steps?: TourStep[]; force?: boolean; onDone?: () => void }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    import("@/integrations/supabase/client").then(({ supabase }) => supabase.auth.getUser()).then(({ data }) => {
      if (!alive) return;
      const id = data.user?.id ?? null;
      setUserId(id);
      const seen = window.localStorage.getItem(keyFor(id));
      if (force || !seen) window.setTimeout(() => alive && setOpen(true), 900);
    });
    return () => { alive = false; };
  }, [force]);

  const step = steps[index];
  const progress = useMemo(() => `${((index + 1) / steps.length) * 100}%`, [index, steps.length]);

  useEffect(() => {
    if (!open || !step?.target) return;
    const el = document.querySelector(step.target);
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.animate([{ transform: "scale(1)" }, { transform: "scale(1.025)" }, { transform: "scale(1)" }], { duration: 700, easing: "ease-out" });
    }
  }, [open, step]);

  function finish() {
    if (userId) window.localStorage.setItem(keyFor(userId), "1");
    setOpen(false);
    onDone?.();
  }

  if (!open || !step) return null;
  return <div className="fixed inset-0 z-[100] bg-black/25 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label="Kudi guided tour">
    <div className="absolute bottom-5 left-1/2 w-[min(92vw,430px)] -translate-x-1/2 sm:bottom-8">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
        <div className="h-1 bg-secondary"><div className="h-full bg-accent transition-all duration-500" style={{ width: progress }} /></div>
        <div className="p-6">
          <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Sparkles className="size-5" /></span><div className="min-w-0 flex-1"><p className="text-label-caps text-muted-foreground">Kudi tour · {index + 1} of {steps.length}</p><h2 className="mt-1 font-display text-xl font-bold">{step.title}</h2></div><button aria-label="Skip tour" onClick={finish} className="rounded-full p-2 text-muted-foreground hover:bg-secondary"><X className="size-4" /></button></div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">{step.body}</p>
          <div className="mt-5 flex gap-2">{steps.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-accent" : "bg-secondary"}`} />)}</div>
          <div className="mt-5 flex items-center justify-between"><Button variant="ghost" onClick={() => setIndex((v) => Math.max(0, v - 1))} disabled={index === 0}><ArrowLeft className="mr-2 size-4" />Back</Button>{index === steps.length - 1 ? <Button onClick={finish}><Check className="mr-2 size-4" />Finish</Button> : <Button onClick={() => setIndex((v) => v + 1)}>Next <ArrowRight className="ml-2 size-4" /></Button>}</div>
        </div>
      </div>
    </div>
  </div>;
}
