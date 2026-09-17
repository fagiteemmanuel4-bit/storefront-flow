import type { ComponentType, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type ExtensionContext = { currency?: string };
export type StrapExtension = { id: string; name: string; description: string; version: string; category: "Tools" | "Operations"; icon: typeof Calculator; component: ComponentType<ExtensionContext> };

function CalculatorExtension({ currency = "NGN" }: ExtensionContext) {
  const [cost, setCost] = useState(0); const [price, setPrice] = useState(0); const [discount, setDiscount] = useState(0);
  const result = useMemo(() => { const discounted = price * Math.max(0, 1 - discount / 100); const profit = discounted - cost; return { discounted, profit, margin: discounted ? (profit / discounted) * 100 : 0 }; }, [cost, price, discount]);
  const money = (value: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const field = (label: string, value: number, setValue: (value: number) => void): ReactNode => <div><Label className="text-xs font-semibold">{label}</Label><Input className="mt-1.5" type="number" min="0" value={value || ""} onChange={(e) => setValue(Number(e.target.value) || 0)} /></div>;
  return <div className="space-y-4"><div className="grid gap-3 sm:grid-cols-3">{field("Cost", cost, setCost)}{field("Selling price", price, setPrice)}{field("Discount %", discount, setDiscount)}</div><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-secondary/60 p-4"><p className="text-xs text-muted-foreground">Customer pays</p><p className="mt-1 font-display text-lg font-bold">{money(result.discounted)}</p></div><div className="rounded-xl bg-secondary/60 p-4"><p className="text-xs text-muted-foreground">Profit</p><p className="mt-1 font-display text-lg font-bold">{money(result.profit)}</p></div><div className="rounded-xl bg-accent-soft p-4"><p className="text-xs text-muted-foreground">Margin</p><p className="mt-1 font-display text-lg font-bold text-accent-ink">{result.margin.toFixed(1)}%</p></div></div></div>;
}

/** Add extensions here; the registry keeps discovery independent from the extension UI. */
export const EXTENSIONS: StrapExtension[] = [{ id: "calculator", name: "Business calculator", description: "Quickly work out margins, discounts, markups and totals without leaving your sale.", version: "1.0.0", category: "Tools", icon: Calculator, component: CalculatorExtension }];
const STORAGE_KEY = "strap.installed-extensions";
export function getInstalledExtensionIds(): string[] { if (typeof window === "undefined") return []; try { const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]"); return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; } catch { return []; } }
export function setExtensionInstalled(id: string, installed: boolean): string[] { const ids = new Set(getInstalledExtensionIds()); if (installed) ids.add(id); else ids.delete(id); const next = [...ids]; if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); window.dispatchEvent(new CustomEvent("strap-extensions-changed")); return next; }
