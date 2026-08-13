import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { downloadStoreWorkbook, type ExportRange } from "@/lib/store-export";
import type { StoreRow } from "@/lib/pos-types";

type PresetId = "today" | "7d" | "30d" | "month" | "all" | "custom";

const PRESETS: { id: PresetId; label: string; hint: string }[] = [
  { id: "today", label: "Today", hint: "Since midnight" },
  { id: "7d", label: "Last 7 days", hint: "Rolling week" },
  { id: "30d", label: "Last 30 days", hint: "Rolling month" },
  { id: "month", label: "This month", hint: "From the 1st" },
  { id: "all", label: "All time", hint: "Everything" },
  { id: "custom", label: "Pick dates", hint: "From → to" },
];

function startOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date) {
  const c = new Date(d);
  c.setHours(23, 59, 59, 999);
  return c;
}

function buildRange(preset: PresetId, from: string, to: string): ExportRange {
  const now = new Date();
  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now), label: "Today" };
    case "7d": {
      const f = startOfDay(new Date(now.getTime() - 6 * 86400000));
      return { from: f, to: endOfDay(now), label: "Last 7 days" };
    }
    case "30d": {
      const f = startOfDay(new Date(now.getTime() - 29 * 86400000));
      return { from: f, to: endOfDay(now), label: "Last 30 days" };
    }
    case "month": {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: f, to: endOfDay(now), label: "This month" };
    }
    case "all":
      return { from: null, to: null, label: "All time" };
    case "custom": {
      const f = from ? startOfDay(new Date(from)) : null;
      const t = to ? endOfDay(new Date(to)) : null;
      return { from: f, to: t, label: `${from || "start"} → ${to || "today"}` };
    }
  }
}

export function ExportDataDialog({
  store,
  open,
  onOpenChange,
}: {
  store: StoreRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [preset, setPreset] = useState<PresetId>("today");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleDownload() {
    if (!store) return;
    if (preset === "custom" && !from) {
      toast.error("Pick a start date first");
      return;
    }
    setBusy(true);
    try {
      await downloadStoreWorkbook(
        { id: store.id, name: store.name, currency: store.currency },
        buildRange(preset, from, to),
      );
      toast.success("Spreadsheet downloaded");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Download store data</DialogTitle>
          <DialogDescription>
            Products, stock per location, sales and best sellers — one Excel workbook.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                preset === p.id
                  ? "border-accent bg-accent-soft"
                  : "border-border hover:bg-secondary",
              )}
            >
              <span className="block text-sm font-semibold">{p.label}</span>
              <span className="block text-xs text-muted-foreground">{p.hint}</span>
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="export-from">From</Label>
              <Input
                id="export-from"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="export-to">To</Label>
              <Input
                id="export-to"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void handleDownload()} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Download className="size-4" aria-hidden />
            )}
            {busy ? "Building…" : "Download"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
