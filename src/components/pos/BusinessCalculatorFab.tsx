import { useEffect, useState } from "react";
import { Calculator, Grid2X2, List, X } from "lucide-react";
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";
const VIEW_KEY = "strap-sell-product-view";
const keys = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "+", "="];

export function BusinessCalculatorFab() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY);
      if (saved === "grid" || saved === "list") setView(saved);
    } catch {
      // localStorage can be unavailable in private browsing.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // Keep the control usable even when persistence is unavailable.
    }

    const root = document.querySelector('[data-tour="sell"]');
    const grid = root?.parentElement?.querySelector("button.surface-card")?.parentElement;
    if (grid) {
      grid.classList.toggle("sell-products-list", view === "list");
      grid.classList.toggle("grid-cols-1", view === "list");
      grid.classList.toggle("grid-cols-2", view === "grid");
      grid.classList.toggle("sm:grid-cols-3", view === "grid");
    }
  }, [view]);

  const calculate = (a: number, b: number, operator: string) => {
    if (operator === "+") return a + b;
    if (operator === "−") return a - b;
    if (operator === "×") return a * b;
    if (operator === "÷") return b === 0 ? NaN : a / b;
    return b;
  };

  const press = (key: string) => {
    if (/[0-9.]/.test(key)) {
      setDisplay((current) => {
        if (fresh) return key === "." ? "0." : key;
        if (current === "0" && key !== ".") return key;
        if (key === "." && current.includes(".")) return current;
        return current + key;
      });
      setFresh(false);
      return;
    }

    if (key === "=") {
      if (stored !== null && op) {
        const result = calculate(stored, Number(display), op);
        setDisplay(Number.isFinite(result) ? String(result) : "Error");
        setStored(null);
        setOp(null);
        setFresh(true);
      }
      return;
    }

    if (op && stored !== null && !fresh) {
      const result = calculate(stored, Number(display), op);
      setStored(result);
      setDisplay(String(result));
    } else {
      setStored(Number(display));
    }
    setOp(key);
    setFresh(true);
  };

  const clear = () => {
    setDisplay("0");
    setStored(null);
    setOp(null);
    setFresh(true);
  };

  return (
    <>
      <div className="fixed left-1/2 top-[4.75rem] z-40 flex -translate-x-1/2 items-center rounded-2xl border border-border bg-surface px-1.5 py-1.5 shadow-sm lg:left-auto lg:right-6 lg:translate-x-0" aria-label="Sell tools">
        <button
          type="button"
          aria-label="Grid product view"
          aria-pressed={view === "grid"}
          onClick={() => setView("grid")}
          className={cn("flex size-9 items-center justify-center rounded-xl transition-colors", view === "grid" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary")}
        >
          <Grid2X2 className="size-4" />
        </button>
        <button
          type="button"
          aria-label="List product view"
          aria-pressed={view === "list"}
          onClick={() => setView("list")}
          className={cn("flex size-9 items-center justify-center rounded-xl transition-colors", view === "list" ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary")}
        >
          <List className="size-4" />
        </button>
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <button
          type="button"
          aria-label="Open calculator"
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background transition-transform active:scale-95"
        >
          <Calculator className="size-4" />
        </button>
      </div>

      <BottomSheet open={open} onOpenChange={setOpen}>
        <BottomSheetContent className="mx-auto w-full max-w-sm rounded-t-[2rem]">
          <BottomSheetHeader>
            <BottomSheetTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2"><Calculator className="size-5" />Quick calculator</span>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close calculator" className="flex size-9 items-center justify-center rounded-full hover:bg-secondary">
                <X className="size-4" />
              </button>
            </BottomSheetTitle>
          </BottomSheetHeader>
          <div className="px-4 pb-6">
            <div className="mb-3 rounded-2xl border border-border bg-secondary/50 px-4 py-5 text-right">
              <p className="min-h-8 break-all text-3xl font-bold tabular-nums" aria-live="polite">{display}</p>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {keys.map((key) => (
                <button key={key} type="button" onClick={() => press(key)} className={cn("h-14 rounded-xl border border-border text-lg font-semibold transition active:scale-[.97]", key === "=" ? "bg-foreground text-background" : "bg-surface hover:bg-secondary")}>
                  {key}
                </button>
              ))}
              <button type="button" onClick={clear} className="col-span-4 h-11 rounded-xl border border-border text-sm font-semibold hover:bg-secondary">Clear</button>
            </div>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>
  );
}
