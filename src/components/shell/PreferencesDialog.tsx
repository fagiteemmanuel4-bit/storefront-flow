import { useEffect, useState } from "react";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DEFAULT_PREFERENCES,
  readPreferences,
  writePreferences,
  type Preferences,
} from "@/lib/preferences";

const ROWS: { key: keyof Preferences; label: string; hint: string }[] = [
  { key: "sound", label: "Sale sound", hint: "Chime when a sale is saved" },
  { key: "haptics", label: "Vibration", hint: "Buzz on scan and checkout" },
  { key: "compact", label: "Compact rows", hint: "Fit more items on screen" },
];

export function PreferencesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (open) setPrefs(readPreferences());
  }, [open]);

  function update(key: keyof Preferences, value: boolean) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    writePreferences(next);
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="mx-auto w-full max-w-md">
        <BottomSheetHeader>
          <BottomSheetTitle>Change preference</BottomSheetTitle>
          <BottomSheetDescription>How the app behaves on this device only.</BottomSheetDescription>
        </BottomSheetHeader>

        <div className="space-y-2">
          {ROWS.map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"
            >
              <div>
                <Label htmlFor={`pref-${row.key}`} className="text-sm font-semibold">
                  {row.label}
                </Label>
                <p className="text-xs text-muted-foreground">{row.hint}</p>
              </div>
              <Switch
                id={`pref-${row.key}`}
                checked={prefs[row.key]}
                onCheckedChange={(v) => update(row.key, v)}
              />
            </div>
          ))}
        </div>

        <BottomSheetFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </BottomSheetFooter>
      </BottomSheetContent>
    </BottomSheet>
  );
}
