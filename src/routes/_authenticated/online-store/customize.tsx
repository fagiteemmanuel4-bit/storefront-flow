import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Save, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { onlineSupabase } from "@/integrations/supabase/online-client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/online-store/customize")({ ssr: false, component: OnlineStoreCustomizePage });

type Hero = { id?: string; image_url: string; title: string; subtitle: string; sort_order: number; is_active?: boolean; file?: File };

type Form = { displayName: string; slug: string; displayEmail: string; displayPhone: string; description: string; shippingNote: string; checkoutNote: string; logoUrl: string };

function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "my-store"; }

function OnlineStoreCustomizePage() {
  const { store } = useStoreContext();
  const logoRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>({ displayName: "", slug: "my-store", displayEmail: "", displayPhone: "", description: "", shippingNote: "", checkoutNote: "", logoUrl: "" });
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [storeExists, setStoreExists] = useState(false);

  useEffect(() => {
    if (!store) return;
    void loadStore();
  }, [store]);

  async function loadStore() {
    if (!store) return;
    const existing = await onlineSupabase.from("online_stores").select("*").eq("store_id", store.id).maybeSingle();
    if (existing.error) { toast.error(existing.error.message); return; }
    setStoreExists(Boolean(existing.data));
    if (existing.data) {
      setForm({ displayName: existing.data.display_name, slug: existing.data.slug, displayEmail: existing.data.display_email, displayPhone: existing.data.display_phone, description: existing.data.description, shippingNote: existing.data.shipping_note, checkoutNote: existing.data.checkout_note, logoUrl: existing.data.logo_url });
    } else {
      setForm((current) => ({ ...current, displayName: store.name, slug: slugify(store.name) }));
    }
    const bannerResult = await onlineSupabase.from("store_hero_banners").select("id,image_url,title,subtitle,sort_order,is_active").eq("store_id", store.id).order("sort_order");
    if (bannerResult.error) { toast.error(bannerResult.error.message); return; }
    setHeroes((bannerResult.data ?? []) as Hero[]);
  }

  function update(key: keyof Form, value: string) { setForm((current) => ({ ...current, [key]: value })); }

  function chooseLogo(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5_000_000) { toast.error("Logo must be an image smaller than 5 MB."); return; }
    setLogoFile(file);
  }

  function chooseHeroes(files: FileList | null) {
    if (!files) return;
    const room = 5 - heroes.length;
    if (room <= 0) { toast.error("You can have up to 5 hero banners."); return; }
    const selected = Array.from(files).slice(0, room);
    if (selected.some((file) => !file.type.startsWith("image/") || file.size > 8_000_000)) { toast.error("Hero images must be images smaller than 8 MB each."); return; }
    setHeroes((current) => [...current, ...selected.map((file, index) => ({ image_url: URL.createObjectURL(file), title: "", subtitle: "", sort_order: current.length + index, file }))]);
  }

  function updateHero(index: number, key: "title" | "subtitle", value: string) { setHeroes((current) => current.map((hero, heroIndex) => heroIndex === index ? { ...hero, [key]: value } : hero)); }
  function removeHero(index: number) { setHeroes((current) => current.filter((_, heroIndex) => heroIndex !== index).map((hero, heroIndex) => ({ ...hero, sort_order: heroIndex }))); }

  async function uploadImage(file: File, folder: string) {
    if (!store) throw new Error("No store selected");
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${store.id}/${folder}/${crypto.randomUUID()}.${extension}`;
    const upload = await onlineSupabase.storage.from("kudi-store-assets").upload(path, file, { upsert: false, contentType: file.type });
    if (upload.error) throw new Error(upload.error.message);
    return onlineSupabase.storage.from("kudi-store-assets").getPublicUrl(path).data.publicUrl;
  }

  async function save() {
    if (!store) return;
    if (!form.displayName.trim()) { toast.error("Store name is required."); return; }
    if (!form.slug.trim()) { toast.error("Store link is required."); return; }
    if (heroes.length > 5) { toast.error("Maximum 5 hero banners."); return; }
    setSaving(true);
    try {
      let logoUrl = form.logoUrl;
      if (logoFile) logoUrl = await uploadImage(logoFile, "storefront-logo");
      const payload = { store_id: store.id, slug: slugify(form.slug), display_name: form.displayName.trim(), logo_url: logoUrl, display_email: form.displayEmail.trim(), display_phone: form.displayPhone.trim(), description: form.description.trim(), shipping_note: form.shippingNote.trim(), checkout_note: form.checkoutNote.trim(), is_published: true, setup_completed: true };
      const result = storeExists ? await onlineSupabase.from("online_stores").update(payload).eq("store_id", store.id) : await onlineSupabase.from("online_stores").insert(payload);
      if (result.error) throw new Error(result.error.message);

      const preparedHeroes: Array<{ store_id: string; image_url: string; title: string; subtitle: string; sort_order: number; is_active: boolean }> = [];
      for (let index = 0; index < heroes.length; index += 1) {
        const hero = heroes[index];
        const imageUrl = hero.file ? await uploadImage(hero.file, "hero-banners") : hero.image_url;
        preparedHeroes.push({ store_id: store.id, image_url: imageUrl, title: hero.title.trim(), subtitle: hero.subtitle.trim(), sort_order: index, is_active: true });
      }
      const remove = await onlineSupabase.from("store_hero_banners").delete().eq("store_id", store.id);
      if (remove.error) throw new Error(remove.error.message);
      if (preparedHeroes.length > 0) {
        const insert = await onlineSupabase.from("store_hero_banners").insert(preparedHeroes);
        if (insert.error) throw new Error(insert.error.message);
      }
      setForm((current) => ({ ...current, logoUrl }));
      setLogoFile(null);
      await loadStore();
      toast.success("Online storefront saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the storefront.");
    } finally { setSaving(false); }
  }

  if (!store) return null;
  return <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-10"><div className="mx-auto max-w-5xl"><header className="mb-8 flex items-center justify-between gap-4"><div><p className="text-label-caps text-accent-ink">Strap Online</p><h1 className="text-display-md mt-2">Customize your storefront</h1><p className="mt-2 text-sm text-muted-foreground">Edit your public store, add up to five rotating hero banners, and manage product media.</p></div><Button variant="outline" onClick={() => window.history.back()}><ArrowLeft className="mr-2 size-4" /> Back</Button></header>

<section className="space-y-6">
  <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-lift sm:p-8"><h2 className="font-display text-xl font-semibold">Store identity</h2><p className="mt-1 text-sm text-muted-foreground">This information appears on your public storefront.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Store name</span><input className="field" value={form.displayName} onChange={(e) => update("displayName", e.target.value)} /></label><label className="space-y-2"><span className="text-sm font-semibold">Store link</span><div className="flex overflow-hidden rounded-xl border border-border"><span className="px-3 py-3 text-sm text-muted-foreground">/store/</span><input className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm outline-none" value={form.slug} onChange={(e) => update("slug", slugify(e.target.value))} /></div></label><label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold">Description</span><textarea className="field min-h-28 resize-none" value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Tell customers what your store is about." /></label></div></div>

  <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-lift sm:p-8"><h2 className="font-display text-xl font-semibold">Logo & contact</h2><div className="mt-6 grid gap-6 sm:grid-cols-[160px_1fr]"><button type="button" onClick={() => logoRef.current?.click()} className="flex size-40 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border bg-secondary/50">{logoFile ? <img src={URL.createObjectURL(logoFile)} alt="Logo preview" className="h-full w-full object-cover" /> : form.logoUrl ? <img src={form.logoUrl} alt="Store logo" className="h-full w-full object-cover" /> : <span className="text-center"><ImagePlus className="mx-auto size-7 text-muted-foreground" /><span className="mt-2 block text-xs font-semibold text-muted-foreground">Add logo</span></span>}</button><input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={(e) => chooseLogo(e.target.files?.[0])} /><div className="grid gap-5 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Display email</span><input className="field" type="email" value={form.displayEmail} onChange={(e) => update("displayEmail", e.target.value)} /></label><label className="space-y-2"><span className="text-sm font-semibold">Display phone</span><input className="field" value={form.displayPhone} onChange={(e) => update("displayPhone", e.target.value)} /></label><label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold">Delivery note</span><textarea className="field min-h-24 resize-none" value={form.shippingNote} onChange={(e) => update("shippingNote", e.target.value)} /></label><label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold">Checkout note</span><textarea className="field min-h-24 resize-none" value={form.checkoutNote} onChange={(e) => update("checkoutNote", e.target.value)} placeholder="We'll contact you after your order." /></label></div></div></div>

  <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-lift sm:p-8"><div className="flex items-end justify-between gap-4"><div><h2 className="font-display text-xl font-semibold">Hero banners</h2><p className="mt-1 text-sm text-muted-foreground">Add up to 5 images. They automatically slide every 5 seconds on your storefront.</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{heroes.length}/5</span></div><div className="mt-6 grid gap-5">{heroes.map((hero, index) => <div key={hero.id ?? hero.image_url} className="grid gap-4 rounded-2xl border border-border p-4 sm:grid-cols-[220px_1fr]"><div className="relative aspect-video overflow-hidden rounded-xl bg-secondary"><img src={hero.image_url} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => removeHero(index)} className="absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-black/60 text-white" aria-label="Remove banner"><Trash2 className="size-4" /></button></div><div className="space-y-3"><p className="text-xs font-semibold text-muted-foreground">Banner {index + 1}</p><input className="field" value={hero.title} onChange={(e) => updateHero(index, "title", e.target.value)} placeholder="Banner headline" maxLength={120} /><textarea className="field min-h-20 resize-none" value={hero.subtitle} onChange={(e) => updateHero(index, "subtitle", e.target.value)} placeholder="Optional supporting text" maxLength={240} /></div></div>)}{heroes.length < 5 && <label className="flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border bg-secondary/30 hover:bg-secondary/60"><div className="text-center"><Upload className="mx-auto size-6 text-muted-foreground" /><p className="mt-2 text-sm font-semibold">Add hero images</p><p className="mt-1 text-xs text-muted-foreground">Select up to {5 - heroes.length} more</p></div><input ref={heroRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => chooseHeroes(e.target.files)} /></label>}</div></div>

  <div className="flex justify-end"><Button className="h-12 rounded-xl px-7" onClick={() => void save()} disabled={saving}>{saving ? "Saving storefront…" : <><Save className="mr-2 size-4" /> Save storefront</>}</Button></div>
</section></div></main>;
}
