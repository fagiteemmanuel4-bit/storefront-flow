import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type TourStep = { selector: string[]; title: string; body: string };
type Rect = { top: number; left: number; width: number; height: number };

const KEY = "strap-page-tours-v2";
const pageSteps: Record<string, TourStep[]> = {
  "/pos": [
    {
      selector: [
        '[data-tour="pos-search"]',
        'input[placeholder*="Search"]',
        'input[placeholder*="search"]',
        "main input",
      ],
      title: "Search & scan",
      body: "Find products by name, SKU or barcode. Use this when a customer is ready to buy.",
    },
    {
      selector: ['[data-tour="pos-cart"]', '[aria-label*="cart" i]', "main section"],
      title: "Current sale",
      body: "Everything the customer is buying appears here. Change quantities or remove items before charging.",
    },
    {
      selector: ['[data-tour="pos-calculator"]', '[aria-label*="calculator" i]'],
      title: "Quick calculator",
      body: "Perform a quick calculation without leaving the sale.",
    },
  ],
  "/products": [
    {
      selector: ['[data-tour="main-content"]'],
      title: "Product catalog",
      body: "Add products, update prices and monitor stock.",
    },
  ],
  "/online-store/orders": [
    {
      selector: ['[data-tour="main-content"]'],
      title: "Orders",
      body: "Manage online and in-store orders from one place.",
    },
  ],
  "/expenses": [
    {
      selector: ['[data-tour="main-content"]'],
      title: "Expenses",
      body: "Record money leaving the business so your reports stay accurate.",
    },
  ],
  "/reports": [
    {
      selector: ['[data-tour="main-content"]'],
      title: "Reports",
      body: "Understand how the business is performing over time.",
    },
  ],
  "/online-store": [
    { selector: ['[data-tour="main-content"]'], title: "Your storefront", body: "Review your public store, setup progress and the tools for managing products, orders and design." },
  ],
  "/online-store/builder": [
    { selector: ['[data-tour="main-content"]', "main"], title: "Store Studio", body: "Choose a business-profile template and arrange only the section types supported by your store." },
    { selector: ['[data-tour="template-list"]'], title: "Choose a template", body: "Templates provide a starting layout. Switching templates does not change your product catalogue, inventory or orders." },
    { selector: ['[data-tour="section-list"]'], title: "Build your pages", body: "Add, remove and reorder sections, then select each section to edit its content." },
    { selector: ['[data-tour="theme-controls"]'], title: "Brand your store", body: "Adjust your colours, logo, store description and search appearance before previewing." },
  ],
  "/online-store/setup": [
    { selector: ['[data-tour="main-content"]', "main"], title: "Store identity", body: "Set your public store name, link, contact details and brand assets. Review the information carefully before publishing." },
  ],
  "/customers": [
    { selector: ['[data-tour="main-content"]'], title: "Customer records", body: "Keep customer contact details and purchase history together so your team can support repeat business." },
  ],
  "/dashboard": [
    { selector: ['[data-tour="page-heading"]', '[data-tour="main-content"]'], title: "Business overview", body: "Use this page to review recent activity and move into the workflows that need attention." },
  ],
  "/settings/inventory": [
    { selector: ['[data-tour="main-content"]'], title: "Inventory controls", body: "Review stock settings before changing how quantities, alerts and branch-level inventory are handled." },
  ],
  "/food-service": [
    { selector: ['[data-tour="main-content"]'], title: "Food service workspace", body: "Manage menu and kitchen workflows here. Check order and ingredient details before confirming stock-affecting actions." },
  ],
  "/grocery-inventory": [
    { selector: ['[data-tour="main-content"]'], title: "Grocery inventory", body: "Review batches, expiry dates and replenishment needs. Keep expired or quarantined stock out of saleable quantities." },
  ],
  "/pharmacy": [
    { selector: ['[data-tour="main-content"]'], title: "Pharmacy controls", body: "Use batch and expiry information to support traceability. Follow prescription and dispensing safeguards for restricted products." },
  ],
  "/electronics-workspace": [
    { selector: ['[data-tour="main-content"]'], title: "Device workspace", body: "Keep device identifiers, warranty details and repair progress connected to the correct customer and product." },
  ],
  "/beauty": [
    { selector: ['[data-tour="main-content"]'], title: "Beauty services", body: "Manage appointments, staff availability and treatment details while checking for schedule conflicts." },
  ],
  "/services": [
    { selector: ['[data-tour="main-content"]'], title: "Service jobs", body: "Track customer jobs, estimates, due dates and payment progress from intake through completion." },
  ],
  "/settings": [
    {
      selector: ['[data-tour="main-content"]'],
      title: "Settings",
      body: "Manage your store configuration without leaving your workflow.",
    },
  ],
};

function readSeen() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}") as Record<string, boolean>;
  } catch {
    return {};
  }
}
function writeSeen(pageKey: string) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readSeen(), [pageKey]: true }));
  } catch {
    /* storage may be unavailable */
  }
}
function findTarget(selectors: string[]) {
  for (const selector of selectors) {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (element && element.getClientRects().length) return element;
  }
  return null;
}

export function FirstVisitTour({ pageKey }: { pageKey: string }) {
  const pageLabel = useMemo(() => {
    const segment = pageKey.split("/").filter(Boolean).at(-1) ?? "workspace";
    return segment
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }, [pageKey]);
  const normalizedPageKey = pageKey.replace(/\\/+$/, "") || "/dashboard";
  const steps = useMemo(
    () =>
      pageSteps[normalizedPageKey] ?? [
        {
          selector: ['[data-tour="page-heading"]'],
          title: `${pageLabel} overview`,
          body: `This heading identifies your ${pageLabel.toLowerCase()} workspace. Use the tools and information below to complete the tasks available in this section.`,
        },
        {
          selector: ['[data-tour="main-content"]'],
          title: `Work in ${pageLabel}`,
          body: `The controls and information for ${pageLabel.toLowerCase()} are grouped in this workspace. Follow the page actions and review details before confirming changes.`,
        },
      ],
    [normalizedPageKey, pageLabel],
  );
  const [step, setStep] = useState(-1);
  const [rect, setRect] = useState<Rect | null>(null);

  const close = useCallback(
    (remember = true) => {
      if (remember) writeSeen(normalizedPageKey);
      setStep(-1);
      setRect(null);
    },
    [normalizedPageKey],
  );

  const measure = useCallback(() => {
    if (step < 0 || !steps[step]) return;
    const target = findTarget(steps[step].selector);
    if (!target) {
      setRect(null);
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    requestAnimationFrame(() => {
      const box = target.getBoundingClientRect();
      setRect({ top: box.top, left: box.left, width: box.width, height: box.height });
    });
  }, [step, steps]);

  useEffect(() => {
    if (!steps.length) return;
    const seen = readSeen();
    setRect(null);
    setStep(seen[normalizedPageKey] ? -1 : 0);
    const replay = () => {
      setRect(null);
      setStep(0);
    };
    window.addEventListener("strap-start-guided-tour", replay);
    return () => window.removeEventListener("strap-start-guided-tour", replay);
  }, [normalizedPageKey, steps.length]);

  useLayoutEffect(() => {
    if (step < 0) return;
    measure();
    const onViewportChange = () => measure();
    window.addEventListener("resize", onViewportChange, { passive: true });
    window.addEventListener("scroll", onViewportChange, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [step, measure]);

  if (step < 0 || !steps[step]) return null;
  const current = steps[step];
  const targetStyle = rect
    ? {
        top: rect.top - 6,
        left: rect.left - 6,
        width: rect.width + 12,
        height: rect.height + 12,
      }
    : null;
  const tooltipTop = rect
    ? Math.min(Math.max(rect.top + rect.height + 18, 16), window.innerHeight - 190)
    : undefined;
  const tooltipLeft = rect
    ? Math.min(
        Math.max(rect.left, 16),
        window.innerWidth - Math.min(390, window.innerWidth - 32) - 16,
      )
    : undefined;

  return (
    <div
      className="fixed inset-0 z-[90]"
      aria-live="polite"
      role="dialog"
      aria-modal="true"
      aria-label="Strap quick tour"
    >
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      {targetStyle && (
        <div
          className="pointer-events-none absolute rounded-xl border-2 border-foreground/80 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,.58)]"
          style={targetStyle}
        />
      )}
      <div
        className="absolute w-[min(calc(100vw-32px),390px)] rounded-2xl border border-border bg-surface p-4 shadow-2xl"
        style={
          rect
            ? { top: tooltipTop, left: tooltipLeft }
            : { left: "50%", bottom: 24, transform: "translateX(-50%)" }
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Quick tour · {step + 1}/{steps.length}
            </p>
            <h3 className="mt-1 font-display text-base font-bold">{current.title}</h3>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">{current.body}</p>
          </div>
          <button
            type="button"
            aria-label="Close tour"
            onClick={() => close()}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => close()}>
            Skip
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep((value) => value - 1)}>
                <ArrowLeft className="mr-1.5 size-3.5" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => (step === steps.length - 1 ? close() : setStep((value) => value + 1))}
            >
              {step === steps.length - 1 ? "Done" : "Next"}
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
