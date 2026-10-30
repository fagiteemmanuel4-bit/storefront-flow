import { useCallback, useEffect, useState, type FormEvent } from "react";
import { BellRing, LoaderCircle, Megaphone, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type Announcement = { id: string; title: string; body: string; kind: "maintenance" | "warning" | "info" | "success"; is_published: boolean; starts_at: string; ends_at: string | null; created_at: string };
const kindLabels: Record<Announcement["kind"], string> = { maintenance: "Maintenance", warning: "Important notice", info: "General update", success: "Service update" };

export function PlatformAnnouncementsPanel() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<Announcement["kind"]>("maintenance");
  const [publishNow, setPublishNow] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).from("platform_announcements").select("id,title,body,kind,is_published,starts_at,ends_at,created_at").order("created_at", { ascending: false }).limit(50);
    if (error) toast.error(error.message || "Could not load announcements.");
    else setItems((data ?? []) as Announcement[]);
    setLoading(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  async function createAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length < 3 || body.trim().length < 3) { toast.error("Add a clear title and message before publishing."); return; }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { toast.error("Your admin session has expired. Sign in again."); setSaving(false); return; }
    const { error } = await (supabase as any).from("platform_announcements").insert({ title: title.trim(), body: body.trim(), kind, is_published: publishNow, starts_at: new Date().toISOString(), created_by: auth.user.id });
    if (error) toast.error(error.message || "Could not create announcement.");
    else { toast.success(publishNow ? "Announcement published to all signed-in users." : "Announcement saved as a draft."); setTitle(""); setBody(""); await load(); }
    setSaving(false);
  }
  async function togglePublished(item: Announcement) {
    const { error } = await (supabase as any).from("platform_announcements").update({ is_published: !item.is_published, updated_at: new Date().toISOString() }).eq("id", item.id);
    if (error) toast.error(error.message || "Could not update announcement.");
    else { toast.success(item.is_published ? "Announcement unpublished." : "Announcement published."); await load(); }
  }

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent-ink">Platform communications</p><h2 className="mt-1 text-2xl font-bold tracking-tight">Announcements</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Publish maintenance notices and important updates to every signed-in Strap user. They appear in the global notification menu.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold hover:bg-secondary disabled:opacity-60"><RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />Refresh</button></div>
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5"><div className="mb-4 flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><Megaphone className="size-5" /></span><div><h3 className="font-semibold">Create an announcement</h3><p className="text-xs text-muted-foreground">Published announcements become visible across all workspaces.</p></div></div>
      <form onSubmit={createAnnouncement} className="space-y-3"><label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Title</span><input required minLength={3} maxLength={140} value={title} onChange={event => setTitle(event.target.value)} placeholder="Scheduled maintenance" className="field h-11" /></label><label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Message</span><textarea required minLength={3} maxLength={5000} rows={4} value={body} onChange={event => setBody(event.target.value)} placeholder="Some Strap features may be temporarily unavailable while we carry out maintenance…" className="field min-h-28 resize-y" /></label>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"><label className="block space-y-1.5"><span className="text-xs font-semibold text-muted-foreground">Announcement type</span><select value={kind} onChange={event => setKind(event.target.value as Announcement["kind"])} className="field h-11"><option value="maintenance">Maintenance</option><option value="warning">Important notice</option><option value="info">General update</option><option value="success">Service update</option></select></label><label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={publishNow} onChange={event => setPublishNow(event.target.checked)} className="size-4 accent-current" />Publish immediately</label></div>
        <button disabled={saving} className="inline-flex h-11 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-semibold text-background disabled:opacity-50">{saving ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}{publishNow ? "Publish to all users" : "Save draft"}</button></form>
    </section>
    <section className="rounded-2xl border border-border bg-surface p-4 sm:p-5"><div className="mb-4 flex items-center gap-2"><BellRing className="size-4 text-muted-foreground" /><h3 className="font-semibold">Recent announcements</h3></div>
      {loading ? <div className="space-y-3">{[1, 2, 3].map(value => <div key={value} className="h-20 animate-pulse rounded-xl bg-secondary/60" />)}</div> : items.length === 0 ? <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No announcements have been created yet.</p> : <div className="space-y-3">{items.map(item => <article key={item.id} className="rounded-xl border border-border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-wide">{kindLabels[item.kind]}</span><span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.is_published ? "bg-emerald-50 text-emerald-700" : "bg-secondary text-muted-foreground"}`}>{item.is_published ? "Published" : "Draft"}</span></div><h4 className="mt-2 font-semibold">{item.title}</h4><p className="mt-1 whitespace-pre-wrap text-sm leading-5 text-muted-foreground">{item.body}</p><p className="mt-2 text-[11px] text-muted-foreground">Created {new Date(item.created_at).toLocaleString()}</p></div><button type="button" onClick={() => void togglePublished(item)} className="h-9 shrink-0 rounded-lg border border-border px-3 text-xs font-semibold hover:bg-secondary">{item.is_published ? "Unpublish" : "Publish"}</button></div></article>)}</div>}
    </section>
  </div>;
}
