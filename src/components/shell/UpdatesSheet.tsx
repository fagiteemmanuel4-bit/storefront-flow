import { useEffect, useState } from "react";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { LATEST_UPDATE, hasUnseenUpdate, markUpdateSeen } from "@/lib/app-updates";

/** Shows the latest release notes once per version, per device. */
export function UpdatesSheet() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Wait a beat so it doesn't fight with the first paint of the page.
    const timer = window.setTimeout(() => {
      if (!cancelled && hasUnseenUpdate()) setOpen(true);
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    markUpdateSeen(LATEST_UPDATE.version);
    setOpen(false);
  }

  return (
    <BottomSheet open={open} onOpenChange={(next) => (next ? setOpen(true) : dismiss())}>
      <BottomSheetContent className="mx-auto w-full max-w-md">
        <BottomSheetHeader>
          <span className="flex size-11 items-center justify-center rounded-full bg-accent-soft">
            <Sparkles className="size-5 text-accent-ink" aria-hidden />
          </span>
          <p className="text-label-caps mt-2 text-muted-foreground">
            What's new · {LATEST_UPDATE.date}
          </p>
          <BottomSheetTitle>{LATEST_UPDATE.title}</BottomSheetTitle>
          <BottomSheetDescription>
            Version {LATEST_UPDATE.version} is live on your till.
          </BottomSheetDescription>
        </BottomSheetHeader>

        <ul className="space-y-3">
          {LATEST_UPDATE.items.map((item) => (
            <li key={item} className="flex gap-3 text-sm">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent">
                <Check className="size-3 text-foreground" aria-hidden />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <Button className="h-12 w-full" onClick={dismiss}>
          Got it
        </Button>
      </BottomSheetContent>
    </BottomSheet>
  );
}
