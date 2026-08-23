import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ExternalLink, Globe2, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { CardSection, Field, SelectField, SaveBar, Loading } from "@/components/settings/SettingsPrimitives";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";

export function OnlineStoreSettingsPage() {
  const { store, role } = useStoreContext();
  const [online, setOnline] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [initial, setInitial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const canManage = role === "owner" || role === "manager";
  useEffect(() => { if (!store?.id) return; void load(); }, [store?.id]);
  async function load() {
    if (!store?.id) return;
    setLoading(true);
    const [o, c] = await Promise.all([
      supabase.from("online_stores").select("*").eq("store_id", store.id).maybeSingle(),
      supabase.from("storefront_configs").select("*").eq("store_id", store.id).maybeSingle(),
    ]);
    if (o.error) toast.error(o.error.message); if (c.error) toast.error(c.error.message);
    setOnline(o.data); setConfig(c.data);
    const next = { status: o.data?.is_published ? "Online" : o.data?.setup_completed ? "Offline" : "Coming Soon", slug: o.data?.slug ?? "", homepage: "Storefront home", productVisibility: true, collectionVisibility: true, seoTitle: c.data?.seo?.title ?? "", metaDescription: c.data?.seo?.description ?? "", noIndex: Boolean(c.data?.seo?.noIndex), socialImage: c.data?.seo?.socialImage ?? "" };
    setForm(next); setInitial(next); setLoading(false);
  }
  if (loading || !form) return <Loading />;
  const dirty = JSON.stringify(form) !== JSON.stringify(initial); const update = (key: string, value: unknown) => setForm((current: any) => ({ ...current, [key]: value }));
  async function save() {
    if (!store?.id || !canManage) return; setSaving(true);
    try {
      const onlinePayload = { store_id: store.id, slug: form.slug || online?.slug || store.id.slice(0, 8), display_name: online?.display_name ?? store.name, logo_url: online?.logo_url ?? "", display_email: online?.display_email ?? "", display_phone: online?.display_phone ?? "", description: online?.description ?? "", shipping_note: online?.shipping_note ?? "", checkout_note: online?.checkout_note ?? "", is_published: form.status === "Online", setup_completed: form.status !== "Coming Soon", terms_version: online?.terms_version ?? "2026-08-18", privacy_version: online?.privacy_version ?? "2026-08-18", accepted_terms_at: online?.accepted_terms_at ?? null, accepted_privacy_at: online?.accepted_privacy_at ?? null, updated_at: new Date().toISOString() };
      const { error: oe } = await supabase.from("online_stores").upsert(onlinePayload, { onConflict: "store_id" }); if (oe) throw new Error(oe.message);
      const { error: ce } = await supabase.from("storefront_configs").upsert({ store_id: store.id, template: config?.template ?? "minimal-commerce", theme: config?.theme ?? {}, branding: config?.branding ?? {}, navigation: config?.navigation ?? {}, sections: config?.sections ?? [], seo: { ...(config?.seo ?? {}), title: form.seoTitle, description: form.metaDescription, noIndex: form.noIndex, socialImage: form.socialImage }, custom_css: config?.custom_css ?? "", is_published: config?.is_published ?? false, version: config?.version ?? 1, updated_at: new Date().toISOString() }, { onConflict: "store_id" }); if (ce) throw new Error(ce.message);
      setInitial(form); await load(); toast.success("Online store settings saved.");
    } catch (error) { toast.error(error instanceof Error ? error.message : "Could not save online store settings."); } finally { setSaving(false); }
  }
  const liveUrl = form.slug ? `/store/${form.slug}` : "/online-store";
  return <div className="space-y-5"><CardSection title="Store status" description="Control whether the customer-facing storefront is available."><SelectField label="Status" value={form.status} onChange={(v) => update("status", v)} options={["Online", "Offline", "Coming Soon"]} /></CardSection><CardSection title="Storefront"><div className="grid gap-4 sm:grid-cols-2"><Field label="Store URL slug" value={form.slug} onChange={(v) => update("slug", v)} placeholder="my-store" /><Field label="Homepage" value={form.homepage} onChange={(v) => update("homepage", v)} /></div><div className="mt-4 grid gap-3"><ToggleRow label="Product visibility" description="Keep products available to customers where supported." checked={form.productVisibility} onChange={(v) => update("productVisibility", v)} /><ToggleRow label="Collection visibility" description="Show collection navigation where supported." checked={form.collectionVisibility} onChange={(v) => update("collectionVisibility", v)} /></div></CardSection><CardSection title="SEO"><Field label="Page title" value={form.seoTitle} onChange={(v) => update("seoTitle", v)} /><div className="mt-4"><label className="text-sm font-medium">Meta description<Textarea className="mt-2" value={form.metaDescription} onChange={(e) => update("metaDescription", e.target.value)} /></label></div><div className="mt-4"><Field label="Social preview image" value={form.socialImage} onChange={(v) => update("socialImage", v)} placeholder="https://" /></div><div className="mt-4"><ToggleRow label="Search visibility" description="Allow search engines to index the storefront." checked={!form.noIndex} onChange={(v) => update("noIndex", !v)} /></div></CardSection><CardSection title="Storefront actions" description="These actions open the existing storefront. Strap no longer provides a separate visual store editor."><div className="flex flex-wrap gap-2"><Link to={liveUrl as any} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background"><ExternalLink className="size-4" />Open storefront</Link><Link to="/online-store" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold"><Globe2 className="size-4" />Store management</Link></div></CardSection>{!canManage && <p className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">You can view this setting, but only store owners and managers can save changes.</p>}<SaveBar dirty={dirty && canManage} saving={saving} discard={() => setForm(initial)} save={() => void save()} /></div>;
}
function ToggleRow({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (v: boolean) => void }) { return <div className="flex items-center justify-between gap-5 rounded-xl border border-border p-4"><div><p className="text-sm font-semibold">{label}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div><Switch checked={checked} onCheckedChange={onChange} /></div>; }
