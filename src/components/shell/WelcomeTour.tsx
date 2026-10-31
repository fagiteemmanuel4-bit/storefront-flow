import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "strap-welcome-tour-pending";

type TourStep = {
  title: string;
  body: string;
  selectors: string[];
};

type TargetRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TooltipPosition = {
  top: number;
  left: number;
  width: number;
};

const STEPS: TourStep[] = [
  {
    title: "Your workspace navigation",
    body: "The sidebar is your main navigation. Sell, Products, Orders, Customers and Analytics are grouped here, so you do not need a second menu on desktop.",
    selectors: ['[data-tour="sidebar-navigation"]', '[data-tour="mobile-menu"]'],
  },
  {
    title: "Business tools",
    body: "Online Store, your team, hardware and daily management tools are grouped here. A small lock marks sections that need a paid plan.",
    selectors: ['[data-tour="sidebar-manage"]', '[data-tour="mobile-menu"]'],
  },
  {
    title: "More workspace tools",
    body: "Insights, branches, Stock Sense, Extensions and your profile are kept together in the More section.",
    selectors: ['[data-tour="sidebar-more"]', '[data-tour="mobile-menu"]'],
  },
  {
    title: "Store and branch switcher",
    body: "When you manage more than one store or branch, switch your active workspace here. The rest of the page follows that selection.",
    selectors: ['[data-tour="store-switcher"]', '[data-tour="mobile-store-switcher"]'],
  },
  {
    title: "Page title and workspace details",
    body: "The page heading lives inside the main content panel. Your current store and branch are shown above the page name.",
    selectors: ['[data-tour="page-heading"]', '[data-tour="main-content"]'],
  },
  {
    title: "Quick find",
    body: "Use Search or press Ctrl/⌘ + K to jump directly to a page or common action without hunting through navigation.",
    selectors: ['[data-tour="quick-find"]', '[aria-label="Search"]'],
  },
  {
    title: "Updates and connection status",
    body: "New activity appears under Updates. The connection indicator also tells you when Strap is offline or has sales waiting to sync.",
    selectors: ['[data-tour="updates"]', '[data-tour="connection-status"]'],
  },
  {
    title: "Guided help and data export",
    body: "You can replay this guide from the sidebar. Downloading store data is a Business-plan feature, so a lock appears until your plan includes it.",
    selectors: ['[data-tour="sidebar-actions"]', '[data-tour="sidebar-export"]'],
  },
];

function findTarget(selectors: string[]) {
  for (const selector of selectors) {
    const target = document.querySelector(selector) as HTMLElement | null;
    if (target && target.getClientRects().length > 0) return target;
  }
  return null;
}

function readTourPending() {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function WelcomeTour() {
  const [step, setStep] = useState(-1);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);

  const finish = useCallback(() => {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      /* local storage can be unavailable */
    }
    setStep(-1);
    setTargetRect(null);
    setTooltipPosition(null);
  }, []);

  const measure = useCallback(() => {
    if (step < 0 || !STEPS[step]) return;
    const target = findTarget(STEPS[step].selectors);
    if (!target) {
      setTargetRect(null);
      setTooltipPosition(null);
      return;
    }

    const bounds = target.getBoundingClientRect();
    const nextRect = {
      top: bounds.top,
      left: bounds.left,
      width: bounds.width,
      height: bounds.height,
    };
    const cardWidth = Math.min(370, window.innerWidth - 32);
    const gap = 16;
    let left = bounds.left + bounds.width / 2 - cardWidth / 2;
    let top = bounds.bottom + gap;

    if (bounds.left < 340 && bounds.right + cardWidth + gap < window.innerWidth) {
      left = bounds.right + gap;
      top = Math.min(
        Math.max(bounds.top - 20, 16),
        window.innerHeight - 240,
      );
    } else if (top + 220 > window.innerHeight) {
      top = Math.max(16, bounds.top - 220);
    }

    left = Math.min(Math.max(left, 16), window.innerWidth - cardWidth - 16);
    top = Math.min(Math.max(top, 16), window.innerHeight - 220);

    setTargetRect(nextRect);
    setTooltipPosition({ top, left, width: cardWidth });
  }, [step]);

  useEffect(() => {
    if (readTourPending()) setStep(0);
    const startTour = () => {
      setStep(0);
      setTargetRect(null);
      setTooltipPosition(null);
    };
    window.addEventListener("strap-start-guided-tour", startTour);
    return () => window.removeEventListener("strap-start-guided-tour", startTour);
  }, []);

  useLayoutEffect(() => {
    if (step < 0) return;
    measure();
    const onViewportChange = () => measure();
    window.addEventListener("resize", onViewportChange, { passive: true });
    window.addEventListener("scroll", onViewportChange, {
      passive: true,
      capture: true,
    });
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [measure, step]);

  useEffect(() => {
    if (step < 0) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
      if (event.key === "ArrowRight") {
        setStep((current) => (current >= STEPS.length - 1 ? current : current + 1));
      }
      if (event.key === "ArrowLeft") {
        setStep((current) => Math.max(0, current - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finish, step]);

  if (step < 0) return null;
  const current = STEPS[step];
  const highlightStyle = targetRect
    ? {
        top: targetRect.top - 5,
        left: targetRect.left - 5,
        width: targetRect.width + 10,
        height: targetRect.height + 10,
      }
    : undefined;

  return (
    <div
      className="fixed inset-0 z-[110]"
      role="dialog"
      aria-modal="true"
      aria-label="Strap guided workspace tour"
      aria-live="polite"
    >
      <div className="absolute inset-0 bg-foreground/55 backdrop-blur-[2px]" />
      {highlightStyle && (
        <div
          className="pointer-events-none absolute z-[111] rounded-xl border-2 border-[#c6f432] shadow-[0_0_0_9999px_rgba(8,12,18,.56)]"
          style={highlightStyle}
        />
      )}

      <section
        className="fixed z-[112] rounded-2xl border border-border bg-background p-4 shadow-2xl"
        style={
          tooltipPosition
            ? {
                top: tooltipPosition.top,
                left: tooltipPosition.left,
                width: tooltipPosition.width,
              }
            : {
                left: "50%",
                bottom: 24,
                width: "min(calc(100vw - 32px), 370px)",
                transform: "translateX(-50%)",
              }
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Strap workspace tour · {step + 1}/{STEPS.length}
            </p>
            <h2 className="mt-1 font-display text-lg font-bold">{current.title}</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{current.body}</p>
          </div>
          <button
            type="button"
            aria-label="Close tour"
            onClick={finish}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={finish}>
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep((currentStep) => currentStep - 1)}
              >
                <ArrowLeft className="mr-1.5 size-3.5" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                if (step === STEPS.length - 1) finish();
                else setStep((currentStep) => currentStep + 1);
              }}
            >
              {step === STEPS.length - 1 ? "Finish" : "Next"}
              {step === STEPS.length - 1 ? (
                <Check className="ml-1.5 size-3.5" />
              ) : (
                <ArrowRight className="ml-1.5 size-3.5" />
              )}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
