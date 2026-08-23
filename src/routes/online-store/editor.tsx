import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Tablet, Smartphone, Save, Eye, Plus, Undo2, Redo2, Palette, Type, Layout, ExternalLink } from "lucide-react";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/online-store/editor")({ ssr: false, component: StoreEditorPage });

type Viewport = "desktop" | "tablet" | "mobile";
type Snapshot = { html: string; styles: string; title: string; background: string; savedAt: string };

const starterSections = [
  ["Announcement", "A short announcement for your customers"],
  ["Promo banner", "Highlight an offer or important message"],
  ["Custom section", "Add your own content block"],
];

function StoreEditorPage() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [slug, setSlug] = useState("");
  const [storeName, setStoreName] = useState("Your store");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [background, setBackground] = useState("#ffffff");
  const [textColor, setTextColor] = useState("#111111");
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [future, setFuture] = useState<Snapshot[]>([]);
  const [saving, setSaving] = useState(false);

  const frameWidth = useMemo(() => ({ desktop: "100%", tablet: "768px", mobile: "390px" }[viewport]), [viewport]);

  useEffect(() => {
    const saved = window.localStorage.getItem("strap-editor-store-slug");
    if (saved) setSlug(saved);
    void loadStore();
  }, []);

  async function loadStore() {
    const { data, error } = await onlineSupabase.from("online_stores").select("slug,display_name").eq("is_published", true).eq("setup_completed", true).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (error) return;
    if (data?.slug) {
      setSlug(data.slug);
      setStoreName(data.display_name || "Your store");
      window.localStorage.setItem("strap-editor-store-slug", data.slug);
    }
  }

  function doc() { return frameRef.current?.contentDocument ?? null; }

  function snapshot(): Snapshot | null {
    const d = doc();
    if (!d?.body) return null;
    return { html: d.body.innerHTML, styles: d.documentElement.getAttribute("style") || "", title: d.title, background: d.body.style.backgroundColor || "", savedAt: new Date().toISOString() };
  }

  function remember() {
    const snap = snapshot();
    if (!snap) return;
    setHistory((items) => [...items.slice(-19), snap]);
    setFuture([]);
  }

  function enableEditing() {
    const d = doc();
    if (!d) return;
    d.body.style.backgroundColor = background;
    d.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,span,a").forEach((el) => {
      el.dataset.strapEditable = "true";
      el.style.cursor = "text";
      el.addEventListener("click", onElementClick);
      el.addEventListener("dblclick", onElementDoubleClick);
    });
    d.querySelectorAll<HTMLElement>("header,section,footer,article").forEach((el) => {
      el.dataset.strapSection = "true";
      el.style.transition = "outline .15s ease, box-shadow .15s ease";
      el.addEventListener("click", onElementClick);
    });
  }

  function onElementClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    setSelected(el);
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    clearSelectionStyles();
    el.style.outline = "2px solid #111827";
    el.style.outlineOffset = "3px";
  }

  function onElementDoubleClick(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    const el = event.currentTarget as HTMLElement;
    if (el.tagName === "A" || ["H1", "H2", "H3", "H4", "P", "SPAN"].includes(el.tagName)) {
      remember();
      el.contentEditable = "true";
      el.focus();
      el.addEventListener("blur", () => { el.contentEditable = "false"; }, { once: true });
    }
  }

  function clearSelectionStyles() {
    doc()?.querySelectorAll<HTMLElement>("[data-strap-selected]").forEach((el) => { el.style.outline = ""; el.removeAttribute("data-strap-selected"); });
  }

  function changeBackground(value: string) {
    remember();
    setBackground(value);
    const d = doc();
    if (d) d.body.style.backgroundColor = value;
  }

  function changeTextColor(value: string) {
    remember();
    setTextColor(value);
    if (selected) selected.style.color = value;
  }

  function addSection() {
    const d = doc();
    if (!d?.body) return;
    remember();
    const section = d.createElement("section");
    section.dataset.strapSection = "true";
    section.style.cssText = `margin:24px auto;padding:48px 28px;max-width:1152px;border:1px dashed #9ca3af;border-radius:24px;background:#f8fafc;color:${textColor};`;
    section.innerHTML = `<div style="max-width:720px;margin:auto;text-align:center"><div style="font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.55">NEW SECTION</div><h2 style="font-size:32px;font-weight:800;margin:10px 0">Your new section</h2><p style="font-size:15px;line-height:1.6;opacity:.7">Double-click this text to edit it directly on the storefront canvas.</p><button type="button" style="margin-top:18px;border:0;border-radius:12px;padding:12px 18px;background:#111827;color:white;font-weight:700">Add button</button></div>`;
    d.body.appendChild(section);
    enableEditing();
  }

  async function save() {
    if (!slug) { toast.error("Select a store first."); return; }
    const snap = snapshot();
    if (!snap) return;
    setSaving(true);
    try {
      const { data: store, error: storeError } = await onlineSupabase.from("online_stores").select("store_id").eq("slug", slug).maybeSingle();
      if (storeError || !store) throw new Error("Store could not be resolved");
      const { error } = await onlineSupabase.from("storefront_editor_layouts").upsert({ store_id: store.store_id, draft: snap, updated_at: new Date().toISOString() }, { onConflict: "store_id" });
      if (error) throw error;
      toast.success("Store draft saved");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save the draft"); } finally { setSaving(false); }
  }

  function undo() {
    const previous = history.at(-1);
    const current = snapshot();
    if (!previous || !current || !doc()?.body) return;
    setFuture((items) => [...items, current]);
    doc()!.body.innerHTML = previous.html;
    setHistory((items) => items.slice(0, -1));
    window.setTimeout(enableEditing, 0);
  }

  function redo() {
    const next = future.at(-1);
    const current = snapshot();
    if (!next || !current || !doc()?.body) return;
    setHistory((items) => [...items, current]);
    doc()!.body.innerHTML = next.html;
    setFuture((items) => items.slice(0, -1));
    window.setTimeout(enableEditing, 0);
  }

  function removeSelected() {
    if (!selected || selected === doc()?.body) return;
    remember();
    selected.remove();
    setSelected(null);
  }

  function onFrameLoad() {
    window.setTimeout(enableEditing, 250);
  }

  return <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-white">
    <header className="flex min-h-16 items-center justify-between gap-3 border-b border-white/10 bg-slate-900 px-4">
      <div className="flex min-w-0 items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-white text-slate-950 font-black">S</div><div className="min-w-0"><div className="truncate text-sm font-bold">Store Editor</div><div className="truncate text-xs text-white/50">{storeName} · live storefront canvas</div></div></div>
      <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1 md:flex">{([["desktop",Monitor],["tablet",Tablet],["mobile",Smartphone]] as const).map(([key, Icon]) => <button key={key} onClick={() => setViewport(key)} className={`rounded-lg p-2 ${viewport === key ? "bg-white text-slate-950" : "text-white/60 hover:bg-white/10"}`}><Icon className="size-4" /></button>)}</div>
      <div className="flex items-center gap-2"><button disabled={!history.length} onClick={undo} className="rounded-lg p-2 text-white/60 hover:bg-white/10 disabled:opacity-30"><Undo2 className="size-4" /></button><button disabled={!future.length} onClick={redo} className="rounded-lg p-2 text-white/60 hover:bg-white/10 disabled:opacity-30"><Redo2 className="size-4" /></button><Button onClick={save} disabled={saving} className="rounded-xl bg-white text-slate-950 hover:bg-white/90"><Save className="mr-2 size-4" />{saving ? "Saving…" : "Save draft"}</Button></div>
    </header>
    <div className="flex min-h-0 flex-1">
      <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-slate-900 p-4 lg:block"><div className="mb-5"><p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/40">Sections</p><div className="mt-3 space-y-2">{starterSections.map(([name, description]) => <button key={name} onClick={addSection} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-left hover:bg-white/10"><div className="flex items-center justify-between"><span className="text-sm font-semibold">{name}</span><Plus className="size-4 text-white/40" /></div><p className="mt-1 text-xs text-white/40">{description}</p></button>)}</div></div><button onClick={addSection} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 py-3 text-sm font-semibold text-white/70 hover:bg-white/5"><Plus className="size-4" /> Add section</button></aside>
      <main className="min-w-0 flex-1 overflow-auto bg-slate-800 p-4 sm:p-6"><div className="mx-auto flex min-h-full justify-center"><div className="relative h-fit overflow-hidden rounded-2xl bg-white shadow-2xl transition-all" style={{ width: frameWidth, maxWidth: "1152px", minHeight: "720px" }}><iframe ref={frameRef} title="Live storefront editor canvas" src={slug ? `/store/${encodeURIComponent(slug)}` : "about:blank"} onLoad={onFrameLoad} className="block h-[calc(100vh-112px)] min-h-[720px] w-full border-0" /></div></div></main>
      <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-white/10 bg-slate-900 p-4 xl:block"><div className="flex items-center gap-2"><Palette className="size-4 text-white/50" /><p className="text-[11px] font-bold uppercase tracking-[.14em] text-white/40">Design</p></div><div className="mt-4 space-y-4"><label className="block text-sm"><span className="mb-2 block text-white/60">Canvas background</span><div className="flex gap-2"><input type="color" value={background} onChange={(e) => changeBackground(e.target.value)} className="h-10 w-12 rounded-lg border-0 bg-transparent" /><input value={background} onChange={(e) => changeBackground(e.target.value)} className="field h-10 flex-1 bg-white/5 text-white" /></div></label><label className="block text-sm"><span className="mb-2 block text-white/60">Selected text color</span><div className="flex gap-2"><input type="color" value={textColor} onChange={(e) => changeTextColor(e.target.value)} className="h-10 w-12 rounded-lg border-0 bg-transparent" /><input value={textColor} onChange={(e) => changeTextColor(e.target.value)} className="field h-10 flex-1 bg-white/5 text-white" /></div></label><div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-2 text-sm font-semibold"><Type className="size-4" /> Direct editing</div><p className="mt-2 text-xs leading-5 text-white/45">Click an element to select it. Double-click text to edit it directly on the live storefront canvas.</p></div><div className="rounded-xl border border-white/10 bg-white/5 p-3"><div className="flex items-center gap-2 text-sm font-semibold"><Layout className="size-4" /> Page controls</div><p className="mt-2 text-xs leading-5 text-white/45">Add sections from the left panel, then edit their content directly on the canvas.</p></div>{selected && <button onClick={removeSelected} className="w-full rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-400/15">Remove selected element</button>} {slug && <a href={`/store/${encodeURIComponent(slug)}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5"><Eye className="size-4" /> Open live store <ExternalLink className="size-3" /></a>}</div></aside>
    </div>
  </div>;
}
