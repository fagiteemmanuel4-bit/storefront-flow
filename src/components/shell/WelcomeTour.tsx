import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "strap-welcome-tour-pending";
const STEPS = [
  ["Your command centre", "The dashboard is your daily starting point. It surfaces today's sales, low-stock signals, online activity and the actions that matter next."],
  ["Sell", "Open Sell when a customer is ready. Search or scan products, build the cart, choose the payment method and finish the transaction."],
  ["Products", "Products is where your catalogue and stock live. Keep prices, SKUs, barcodes and quantities accurate so every sale updates the right inventory."],
  ["Customers", "Customer records help you understand repeat buying and keep useful relationships connected to the store."],
  ["Settings", "Settings is your control centre. Store profile, preferences, security, billing and the Strap Online Store controls live there."],
];

export function WelcomeTour() {
  const [step, setStep] = useState(-1);
  useEffect(() => { try { if (localStorage.getItem(KEY) === "1") setStep(0); } catch {} }, []);
  if (step < 0) return null;
  const finish = () => { try { localStorage.removeItem(KEY); } catch {} setStep(-1); };
  const [title, body] = STEPS[step];
  return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-foreground/45 p-4 backdrop-blur-sm sm:items-center"><div role="dialog" aria-modal="true" aria-labelledby="strap-tour-title" className="w-full max-w-lg overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Welcome to Strap · {step + 1}/{STEPS.length}</p><h2 id="strap-tour-title" className="mt-1 font-display text-xl font-bold">{title}</h2></div><button type="button" aria-label="Close tour" onClick={finish} className="flex size-9 items-center justify-center rounded-xl hover:bg-secondary"><X className="size-4"/></button></div><div className="p-6"><div className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent-ink"><Check className="size-6"/></div><p className="mt-5 text-sm leading-7 text-muted-foreground">{body}</p><div className="mt-6 flex gap-1.5">{STEPS.map((_, i)=><span key={i} className={`h-1.5 flex-1 rounded-full ${i<=step?"bg-accent":"bg-secondary"}`}/>)}</div></div><div className="flex items-center justify-between border-t border-border bg-secondary/25 p-4"><Button variant="ghost" onClick={finish}>Skip tour</Button><div className="flex gap-2">{step>0&&<Button variant="outline" onClick={()=>setStep(s=>s-1)}><ArrowLeft/>Back</Button>}{step<STEPS.length-1?<Button onClick={()=>setStep(s=>s+1)}>Next<ArrowRight/></Button>:<Button onClick={finish}>Finish<Check/></Button>}</div></div></div></div>;
}
