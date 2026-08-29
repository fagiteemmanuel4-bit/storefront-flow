import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "strap-page-tours-v1";
const steps = [
  { selector: '[data-tour="page-title"]', title: "Your workspace", body: "This is where the current section and store context stay visible." },
  { selector: '[data-tour="main-content"]', title: "Work here", body: "Your tools and business data live in this main workspace. Controls stay close to the work they affect." },
  { selector: '[data-tour="app-menu"]', title: "Everything else", body: "Use Menu to move quickly between the rest of your store tools and settings." },
];

export function FirstVisitTour({ pageKey }: { pageKey: string }) {
  const [step, setStep] = useState(-1);
  const current = steps[step];
  useEffect(() => {
    try {
      const seen = JSON.parse(localStorage.getItem(KEY) || "[]") as string[];
      if (!seen.includes(pageKey)) setStep(0);
    } catch { setStep(0); }
  }, [pageKey]);
  useEffect(() => {
    if (step < 0 || !current) return;
    const el = document.querySelector(current.selector) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.dataset.tourFocus = "true";
    return () => { delete el.dataset.tourFocus; };
  }, [step, current]);
  if (step < 0 || !current) return null;
  const finish = () => { try { const seen = JSON.parse(localStorage.getItem(KEY) || "[]") as string[]; localStorage.setItem(KEY, JSON.stringify([...new Set([...seen, pageKey])])); } catch {} setStep(-1); };
  return <div className="fixed inset-0 z-[90] pointer-events-none" aria-live="polite"><div className="pointer-events-auto absolute bottom-5 left-1/2 w-[min(92vw,390px)] -translate-x-1/2 rounded-2xl border border-border bg-surface p-4 shadow-float sm:bottom-7"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Quick tour · {step + 1}/{steps.length}</p><h3 className="mt-1 font-display text-base font-bold">{current.title}</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">{current.body}</p></div><button type="button" aria-label="Close tour" onClick={finish} className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-secondary"><X className="size-4"/></button></div><div className="mt-4 flex items-center justify-between gap-2">{step > 0 ? <Button variant="outline" size="sm" onClick={()=>setStep(step-1)}><ArrowLeft className="mr-1.5 size-3.5"/>Back</Button> : <span/>}<Button size="sm" onClick={()=>step === steps.length-1 ? finish() : setStep(step+1)}>{step === steps.length-1 ? "Done" : "Next"}<ArrowRight className="ml-1.5 size-3.5"/></Button></div></div></div>;
}
