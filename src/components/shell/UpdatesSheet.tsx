import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, CircleAlert, Info, PackageCheck, ShieldAlert, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Notice = { id: string; type: string; title: string; body: string; data: { order_id?: string; order_number?: string; status?: string }; read_at: string | null; created_at: string };
type Announcement = { id: string; title: string; body: string; kind: "maintenance" | "warning" | "info" | "success"; starts_at: string; created_at: string };
const announcementIcon = (kind: Announcement["kind"]) => kind === "maintenance" ? ShieldAlert : kind === "warning" ? CircleAlert : kind === "success" ? Sparkles : Info;
const announcementTone = (kind: Announcement["kind"]) => kind === "maintenance" || kind === "warning" ? "border-amber-500/30 bg-amber-500/5" : kind === "success" ? "border-emerald-500/25 bg-emerald-500/5" : "border-border bg-background";

export function UpdatesSheet() {
  const { store } = useStoreContext();
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const unread = useMemo(() => items.filter(item => !item.read_at).length + announcements.filter(item => !readAnnouncementIds.includes(item.id)).length, [items, announcements, readAnnouncementIds]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!store?.id) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const [{ data: auth }, { data: notices }] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from("notifications").select("id,type,title,body,data,read_at,created_at").eq("store_id", store.id).order("created_at", { ascending: false }).limit(50),
      ]);
      const currentUserId = auth.user?.id ?? null;
      if (mounted) setUserId(currentUserId);
      if (currentUserId) {
        const [{ data: activeAnnouncements }, { data: reads }] = await Promise.all([
          (supabase as any).from("platform_announcements").select("id,title,body,kind,starts_at,created_at").order("created_at", { ascending: false }).limit(30),
          (supabase as any).from("platform_announcement_reads").select("announcement_id").eq("user_id", currentUserId),
        ]);
        if (mounted) {
          setAnnouncements((activeAnnouncements ?? []) as Announcement[]);
          setReadAnnouncementIds((reads ?? []).map((row: { announcement_id: string }) => row.announcement_id));
        }
      }
      if (mounted) setItems((notices ?? []) as Notice[]);
      if (mounted) setLoading(false);
    };
    void load();
    const channel = supabase.channel(`strap-notifications-${store.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `store_id=eq.${store.id}` }, payload => {
        const notice = payload.new as Notice;
        setItems(current => [notice, ...current.filter(item => item.id !== notice.id)].slice(0, 50));
        try { navigator.vibrate?.([40, 25, 40]); } catch { /* vibration is optional */ }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `store_id=eq.${store.id}` }, payload => {
        const notice = payload.new as Notice;
        setItems(current => current.map(item => item.id === notice.id ? notice : item));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "platform_announcements" }, () => { void load(); })
      .subscribe();
    return () => { mounted = false; void supabase.removeChannel(channel); };
  }, [store?.id]);

  const markNoticeRead = async (id: string) => {
    if (!userId) return;
    const now = new Date().toISOString();
    setItems(current => current.map(item => item.id === id ? { ...item, read_at: now } : item));
    const { error } = await supabase.from("notifications").update({ read_at: now }).eq("id", id).eq("user_id", userId);
    if (error) setItems(current => current.map(item => item.id === id ? { ...item, read_at: null } : item));
  };
  const markAnnouncementRead = async (id: string) => {
    if (!userId || readAnnouncementIds.includes(id)) return;
    setReadAnnouncementIds(current => [...current, id]);
    const { error } = await (supabase as any).from("platform_announcement_reads").insert({ announcement_id: id, user_id: userId });
    if (error && error.code !== "23505") setReadAnnouncementIds(current => current.filter(value => value !== id));
  };
  const markAllRead = async () => {
    const now = new Date().toISOString();
    const unreadNoticeIds = items.filter(item => !item.read_at).map(item => item.id);
    const unreadAnnouncements = announcements.filter(item => !readAnnouncementIds.includes(item.id));
    setItems(current => current.map(item => item.read_at ? item : { ...item, read_at: now }));
    setReadAnnouncementIds(current => [...new Set([...current, ...unreadAnnouncements.map(item => item.id)])]);
    const tasks: Promise<unknown>[] = [];
    if (unreadNoticeIds.length && userId) tasks.push(supabase.from("notifications").update({ read_at: now }).in("id", unreadNoticeIds).eq("user_id", userId));
    if (unreadAnnouncements.length && userId) tasks.push((supabase as any).from("platform_announcement_reads").upsert(unreadAnnouncements.map(item => ({ announcement_id: item.id, user_id: userId })), { onConflict: "announcement_id,user_id", ignoreDuplicates: true }));
    await Promise.all(tasks);
  };

  const content = <div className="flex max-h-[min(72vh,620px)] min-h-0 flex-col">
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
      <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">Live activity</p><h2 className="mt-0.5 font-display text-lg font-bold">Notifications</h2></div>
      <button type="button" onClick={() => void markAllRead()} disabled={!unread} className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-40"><CheckCheck className="size-3.5"/>Mark all read</button>
    </div>
    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
      {loading ? <div className="space-y-2">{[1, 2, 3].map(value => <div key={value} className="h-16 animate-pulse rounded-xl bg-secondary/60" />)}</div> : announcements.length === 0 && items.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center"><span className="flex size-11 items-center justify-center rounded-xl bg-secondary"><Bell className="size-5 text-muted-foreground"/></span><p className="mt-3 text-sm font-semibold">You're all caught up</p><p className="mt-1 text-xs text-muted-foreground">Important Strap updates and store activity will appear here.</p></div> : <>
        {announcements.map(item => {
          const Icon = announcementIcon(item.kind);
          const isRead = readAnnouncementIds.includes(item.id);
          return <article key={`announcement-${item.id}`} className={cn("rounded-xl border p-3", announcementTone(item.kind), !isRead && "ring-1 ring-inset ring-accent/20")}>
            <div className="flex items-start gap-2.5"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/80"><Icon className="size-4"/></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5"><span className="text-[9px] font-bold uppercase tracking-[.12em] text-muted-foreground">{item.kind === "maintenance" ? "Maintenance" : item.kind === "warning" ? "Important" : item.kind === "success" ? "Service update" : "Platform update"}</span>{!isRead && <span className="size-1.5 rounded-full bg-accent"/>}</div><h3 className="mt-1 text-sm font-semibold">{item.title}</h3><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{item.body}</p><div className="mt-2 flex items-center justify-between gap-2"><time className="text-[10px] text-muted-foreground">{formatDateTime(item.created_at)}</time>{!isRead && <button type="button" onClick={() => void markAnnouncementRead(item.id)} className="text-[10px] font-semibold text-accent-ink hover:underline">Mark read</button>}</div></div></div>
          </article>;
        })}
        {items.map(item => <article key={`notice-${item.id}`} className={cn("rounded-xl border p-3", item.read_at ? "border-border bg-background" : "border-accent/30 bg-accent-soft/30")}><div className="flex items-start gap-2.5"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary"><PackageCheck className="size-4"/></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold">{item.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p><div className="mt-2 flex items-center justify-between gap-2"><time className="text-[10px] text-muted-foreground">{formatDateTime(item.created_at)}</time>{!item.read_at && <button type="button" onClick={() => void markNoticeRead(item.id)} className="text-[10px] font-semibold text-accent-ink hover:underline">Mark read</button>}</div></div></div></article>)}
      </>}
    </div>
  </div>;

  return <>
    {mobile ? <>
      <button type="button" onClick={() => setOpen(true)} aria-label={unread ? `${unread} unread notifications` : "Notifications"} className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Bell className="size-[18px]"/>{unread > 0 && <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-bold leading-4 text-background">{unread > 9 ? "9+" : unread}</span>}</button>
      <BottomSheet open={open} onOpenChange={setOpen}><BottomSheetContent className="h-[88dvh] max-h-[88dvh] w-full max-w-none rounded-t-[1.5rem] p-0"><div className="flex min-h-0 flex-1 flex-col"><BottomSheetHeader className="sr-only"><BottomSheetTitle>Notifications</BottomSheetTitle></BottomSheetHeader>{content}</div></BottomSheetContent></BottomSheet>
    </> : <Popover open={open} onOpenChange={setOpen}><PopoverTrigger asChild><button type="button" aria-label={unread ? `${unread} unread notifications` : "Notifications"} aria-expanded={open} className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground"><Bell className="size-[18px]"/>{unread > 0 && <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-bold leading-4 text-background">{unread > 9 ? "9+" : unread}</span>}</button></PopoverTrigger><PopoverContent align="end" side="bottom" sideOffset={10} className="w-[min(390px,calc(100vw-2rem))] overflow-hidden rounded-2xl border-border p-0 shadow-float">{content}</PopoverContent></Popover>}
  </>;
}
