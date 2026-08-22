import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Package, ShoppingBag, Users, AlertTriangle, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({ component: NotificationsPage });

const iconFor = (type: string) => type === "low_stock" || type === "inventory" ? Package : type === "order" ? ShoppingBag : type === "customer" ? Users : type === "warning" ? AlertTriangle : type === "system" ? Settings2 : Bell;

function NotificationsPage() {
  const { store } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id;
  const query = useQuery({ queryKey: ["store-notifications", storeId], enabled: Boolean(storeId), queryFn: async () => { const { data, error } = await supabase.from("store_notifications").select("id,type,title,message,action_url,read_at,created_at").eq("store_id", storeId as string).order("created_at", { ascending: false }).limit(100); if (error) throw new Error(error.message); return data ?? []; } });
  const items = query.data ?? [];
  const unread = items.filter((item) => !item.read_at).length;
  async function markAllRead() { if (!storeId || !unread) return; await supabase.from("store_notifications").update({ read_at: new Date().toISOString() }).eq("store_id", storeId).is("read_at", null); await queryClient.invalidateQueries({ queryKey: ["store-notifications", storeId] }); }
  async function markRead(id: string) { await supabase.from("store_notifications").update({ read_at: new Date().toISOString() }).eq("id", id); await queryClient.invalidateQueries({ queryKey: ["store-notifications", storeId] }); }
  return <AppShell title="Notifications"><div className="mx-auto max-w-4xl space-y-5"><section className="surface-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-5 sm:px-6"><div><p className="text-label-caps text-muted-foreground">Business alerts</p><h2 className="mt-1 font-display text-xl font-semibold">Notifications</h2><p className="mt-1 text-sm text-muted-foreground">Important activity from your store, team and customers.</p></div><button type="button" onClick={() => void markAllRead()} disabled={!unread} className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-semibold disabled:opacity-40"><CheckCheck className="size-4" /> Mark all read</button></div>{query.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div> : items.length === 0 ? <div className="p-12 text-center"><Bell className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 text-sm font-semibold">You're all caught up</p><p className="mt-1 text-xs text-muted-foreground">Kudi will surface important business events here.</p></div> : <ul className="divide-y divide-border">{items.map((item) => { const Icon = iconFor(item.type); return <li key={item.id} className={cn("flex gap-4 px-5 py-4 sm:px-6", !item.read_at && "bg-accent-soft/40")}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><Icon className="size-4" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-sm leading-5 text-muted-foreground">{item.message}</p></div>{!item.read_at && <button type="button" onClick={() => void markRead(item.id)} className="shrink-0 text-xs font-semibold text-accent-ink hover:underline">Mark read</button>}</div><p className="mt-2 text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p></div></li>; })}</ul>}</section></div></AppShell>;
}
