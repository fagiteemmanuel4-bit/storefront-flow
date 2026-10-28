import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Box, CircleDollarSign, Package, ShieldCheck, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/activity")({ component: ActivityPage });

const iconFor = (action: string) => action.includes("sale") ? CircleDollarSign : action.includes("product") || action.includes("stock") ? Package : action.includes("staff") || action.includes("member") ? UserPlus : action.includes("security") ? ShieldCheck : Box;

function ActivityPage() {
  const { store } = useStoreContext();
  const storeId = store?.id;
  const query = useQuery({ queryKey: ["store-activity", storeId], enabled: Boolean(storeId), queryFn: async () => { const { data, error } = await supabase.from("store_activity_log").select("id,action,entity_type,summary,created_at,actor_user_id,actor_staff_id").eq("store_id", storeId as string).order("created_at", { ascending: false }).limit(150); if (error) throw new Error(error.message); return data ?? []; } });
  const items = query.data ?? [];
  return <AppShell title="Activity"><div className="mx-auto max-w-4xl"><section className="surface-card overflow-hidden"><div className="border-b border-border px-5 py-5 sm:px-6"><p className="text-label-caps text-muted-foreground">Audit trail</p><h2 className="mt-1 font-display text-xl font-semibold">Store activity</h2><p className="mt-1 text-sm text-muted-foreground">A clear timeline of important changes and business actions.</p></div>{query.isLoading ? <div className="space-y-3 p-5"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div> : items.length === 0 ? <div className="p-12 text-center"><Activity className="mx-auto size-8 text-muted-foreground" /><p className="mt-4 text-sm font-semibold">No activity yet</p><p className="mt-1 text-xs text-muted-foreground">Important store actions will appear here as your team works.</p></div> : <ol className="divide-y divide-border">{items.map((item) => { const Icon = iconFor(item.action); return <li key={item.id} className="flex gap-4 px-5 py-4 sm:px-6"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary"><Icon className="size-4" /></span><div className="min-w-0"><p className="text-sm font-semibold">{item.summary}</p><p className="mt-1 text-xs text-muted-foreground">{item.entity_type ? `${item.entity_type} · ` : ""}{new Date(item.created_at).toLocaleString()}</p></div></li>; })}</ol>}</section></div></AppShell>;
}
