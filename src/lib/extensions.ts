import type { LucideIcon } from "lucide-react";
import { Calculator } from "lucide-react";

export type ExtensionContext = { currency?: string };

export type StrapExtension = {
  id: string;
  name: string;
  description: string;
  version: string;
  category: "Tools" | "Operations";
  icon: LucideIcon;
  component: React.ComponentType<ExtensionContext>;
};

export function CalculatorExtension() {
  return null;
}

/** Add extensions here; the registry keeps discovery independent from the extension UI. */
export const EXTENSIONS: StrapExtension[] = [
  {
    id: "calculator",
    name: "Business calculator",
    description: "Quickly work out margins, discounts, markups and totals without leaving your sale.",
    version: "1.0.0",
    category: "Tools",
    icon: Calculator,
    component: CalculatorExtension,
  },
];

const STORAGE_KEY = "strap.installed-extensions";

export function getInstalledExtensionIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function setExtensionInstalled(id: string, installed: boolean): string[] {
  const ids = new Set(getInstalledExtensionIds());
  if (installed) ids.add(id);
  else ids.delete(id);
  const next = [...ids];
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("strap-extensions-changed"));
  return next;
}
