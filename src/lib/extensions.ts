import type { ComponentType } from "react";
import { Calculator } from "lucide-react";
import { CalculatorExtension } from "@/components/extensions/CalculatorExtension";
export type ExtensionContext = { currency?: string };
export type StrapExtension = { id: string; name: string; description: string; version: string; category: "Tools" | "Operations"; icon: typeof Calculator; component: ComponentType<ExtensionContext> };
/** Add extensions here; the registry keeps discovery independent from the extension UI. */
export const EXTENSIONS: StrapExtension[]=[{id:"calculator",name:"Business calculator",description:"Quickly work out margins, discounts, markups and totals without leaving your sale.",version:"1.0.0",category:"Tools",icon:Calculator,component:CalculatorExtension}];
const STORAGE_KEY="strap.installed-extensions";
export function getInstalledExtensionIds():string[]{if(typeof window==="undefined")return[];try{const value=JSON.parse(window.localStorage.getItem(STORAGE_KEY)??"[]");return Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[]}catch{return[]}}
export function setExtensionInstalled(id:string,installed:boolean):string[]{if(typeof window==="undefined")return[];const ids=new Set(getInstalledExtensionIds());if(installed)ids.add(id);else ids.delete(id);const next=[...ids];window.localStorage.setItem(STORAGE_KEY,JSON.stringify(next));window.dispatchEvent(new CustomEvent("strap-extensions-changed"));return next}
