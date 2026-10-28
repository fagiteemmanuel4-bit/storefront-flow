import { useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, PackageCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle } from "@/components/ui/bottom-sheet";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

type Notice = { id: string; type: string; title: string; body: string; data: { order_id?: string; order_number?: string; status?: string }; read_at: string | null; created_at: string };
export function UpdatesSheet() {
  const { store } = useStoreContext();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const unread = useMemo(() => items.filter((item) => !item.read_at).length, [items]);

  useEffect(() => {
    if (!store?.id) return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("notifications").select("id,type,title,body,data,read_at,created_at").eq("store_id", store.id).order("created_at", { ascending: false }).limit(50);
      if (mounted && data) setItems(data as Notice[]);
      if (mounted) setLoading(false);
    };
    void load();
    const channel = supabase.channel(`strap-notifications-${store.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `store_id=eq.${store.id}` }, (payload) => {
      const notice = payload.new as Notice;
      setItems((current) => [notice, ...current.filter((item) => item.id !== notice.id)].slice(0, 50));
      try { navigator.vibrate?.([40, 25, 40]); } catch {}
      if (typeof Notification !== "undefined" && Notification.permission === "granted") new Notification(notice.title, { body: notice.body, tag: notice.id });
    }).on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `store_id=eq.${store.id}` }, (payload) => {
      const notice = payload.new as Notice;
      setItems((current) => current.map((item) => item.id === notice.id ? notice : item));
    }).subscribe();
    return () => { mounted = false; void supabase.removeChannel(channel); };
  }, [store?.id]);

  const markAllRead = async () => {
    if (!store?.id || !items.some((item) => !item.read_at)) return;
    const ids = items.filter((item) => !item.read_at).map((item) => item.id);
    const now = new Date().toISOString();
    setItems((current) => current.map((item) => ids.includes(item.id) ? { ...item, read_at: now } : item));
    await supabase.from("notifications").update({ read_at: now }).in("id", ids);
  };
  const openCenter = async () => { setOpen(true); if (unread) await markAllRead(); };
  return <>
    <button type="button" onClick={() => void openCenter()} aria-label={unread ? `${unread} unread notifications` : "Notifications"} className="relative flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition hover:bg-secondary hover:text-foreground">
      <Bell className="size-[18px]" />{unread > 0 && <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[9px] font-bold leading-4 text-background">{unread > 9 ? "9+" : unread}</span>}
    </button>
    <BottomSheet open={open} onOpenChange={setOpen}><BottomSheetContent className="h-[100dvh] max-h-[100dvh] w-full rounded-none p-0 sm:h-auto sm:max-h-[88vh] sm:rounded-t-[2rem]"><div className="mx-auto flex h-full max-w-3xl flex-col"><BottomSheetHeader className="border-b border-border px-5 py-5 sm:px-7"><div className="flex items-center justify-between gap-4"><div><p className="text-label-caps text-muted-foreground">Live activity</p><BottomSheetTitle className="mt-1 text-2xl">Notifications</BottomSheetTitle></div><button type="button" onClick={() => void markAllRead()} disabled={!unread} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-40"><CheckCheck className="size-4"/>Mark all read</button></div></BottomSheetHeader><div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">{loading ? <div className="space-y-3">{[1,2,3].map((item)=><div key={item} className="h-20 animate-pulse rounded-2xl bg-secondary/60"/> )}</div> : items.length === 0 ? <div className="flex min-h-[45vh] flex-col items-center justify-center text-center"><span className="flex size-14 items-center justify-center rounded-2xl bg-secondary"><Bell className="size-6 text-muted-foreground"/></span><h3 className="mt-4 font-semibold">You're all caught up</h3><p className="mt-1 max-w-xs text-sm text-muted-foreground">New orders and important store activity appear here instantly.</p></div> : <div className="space-y-2">{items.map((item)=><div key={item.id} className={cn("flex gap-3 rounded-2xl border p-4 transition",item.read_at?"border-border bg-background":"border-accent/30 bg-accent-soft/40")}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><PackageCheck className="size-5"/></span><div className="min-w-0 flex-1"><p className="font-semibold">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.body}</p><p className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.created_at)}</p></div></div>)}</div>}</div></div></BottomSheetContent></BottomSheet>
  </>;
}
