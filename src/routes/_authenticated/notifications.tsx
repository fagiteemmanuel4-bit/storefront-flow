import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  CircleAlert,
  Info,
  PackageCheck,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/shell/AppShell";
import { useStoreContext } from "@/components/shell/StoreProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/notifications")({
  component: NotificationsPage,
});

type Notice = {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

type Announcement = {
  id: string;
  title: string;
  body: string;
  kind: "maintenance" | "warning" | "info" | "success";
  created_at: string;
};

const announcementIcon = (kind: Announcement["kind"]) =>
  kind === "maintenance"
    ? ShieldAlert
    : kind === "warning"
      ? CircleAlert
      : kind === "success"
        ? Sparkles
        : Info;

function NotificationsPage() {
  const { store } = useStoreContext();
  const queryClient = useQueryClient();
  const storeId = store?.id;
  const queryKey = ["mobile-notifications", storeId] as const;

  const query = useQuery({
    queryKey,
    enabled: Boolean(storeId),
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id ?? null;

      if (!userId || !storeId) {
        return {
          notices: [] as Notice[],
          announcements: [] as Announcement[],
          readIds: [] as string[],
        };
      }

      const [
        { data: notices, error: noticesError },
        { data: announcements },
        { data: reads },
      ] = await Promise.all([
        supabase
          .from("notifications")
          .select("id,type,title,body,read_at,created_at")
          .eq("store_id", storeId)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50),
        (supabase as any)
          .from("platform_announcements")
          .select("id,title,body,kind,created_at")
          .order("created_at", { ascending: false })
          .limit(30),
        (supabase as any)
          .from("platform_announcement_reads")
          .select("announcement_id")
          .eq("user_id", userId),
      ]);

      if (noticesError) throw new Error(noticesError.message);

      return {
        notices: (notices ?? []) as Notice[],
        announcements: (announcements ?? []) as Announcement[],
        readIds: (reads ?? []).map(
          (row: { announcement_id: string }) => row.announcement_id,
        ),
      };
    },
  });

  useEffect(() => {
    if (!storeId) return;

    const channel = supabase
      .channel(`strap-mobile-notifications-${storeId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `store_id=eq.${storeId}`,
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "platform_announcements",
        },
        () => {
          void queryClient.invalidateQueries({ queryKey });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);

  const notices = query.data?.notices ?? [];
  const announcements = query.data?.announcements ?? [];
  const readIds = query.data?.readIds ?? [];
  const unread =
    notices.filter((item) => !item.read_at).length +
    announcements.filter((item) => !readIds.includes(item.id)).length;

  async function markNoticeRead(id: string) {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    await queryClient.invalidateQueries({ queryKey });
  }

  async function markAnnouncementRead(id: string) {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    await (supabase as any)
      .from("platform_announcement_reads")
      .upsert(
        { announcement_id: id, user_id: userId },
        { onConflict: "announcement_id,user_id", ignoreDuplicates: true },
      );

    await queryClient.invalidateQueries({ queryKey });
  }

  async function markAllRead() {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return;

    const now = new Date().toISOString();
    const unreadIds = notices
      .filter((item) => !item.read_at)
      .map((item) => item.id);
    const unreadAnnouncements = announcements.filter(
      (item) => !readIds.includes(item.id),
    );

    await Promise.all([
      unreadIds.length
        ? supabase
            .from("notifications")
            .update({ read_at: now })
            .in("id", unreadIds)
            .eq("user_id", userId)
        : Promise.resolve(),
      unreadAnnouncements.length
        ? (supabase as any)
            .from("platform_announcement_reads")
            .upsert(
              unreadAnnouncements.map((item) => ({
                announcement_id: item.id,
                user_id: userId,
              })),
              {
                onConflict: "announcement_id,user_id",
                ignoreDuplicates: true,
              },
            )
        : Promise.resolve(),
    ]);

    await queryClient.invalidateQueries({ queryKey });
  }

  return (
    <AppShell title="Notifications">
      <div className="mx-auto max-w-4xl space-y-5">
        <section className="surface-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-5 sm:px-6">
            <div className="min-w-0">
              <p className="text-label-caps text-muted-foreground">Live activity</p>
              <h2 className="mt-1 font-display text-xl font-semibold">
                Notifications
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Store alerts and important Strap updates.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={!unread}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-border bg-secondary px-3 py-2 text-sm font-semibold disabled:opacity-40"
            >
              <CheckCheck className="size-4" /> Mark all read
            </button>
          </div>

          {query.isLoading ? (
            <div className="space-y-3 p-5">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : notices.length === 0 && announcements.length === 0 ? (
            <div className="p-12 text-center">
              <Bell className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-4 text-sm font-semibold">
                You're all caught up
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Important Strap updates and store activity will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {announcements.map((item) => {
                const Icon = announcementIcon(item.kind);
                const isRead = readIds.includes(item.id);

                return (
                  <li
                    key={`announcement-${item.id}`}
                    className={cn(
                      "flex min-w-0 gap-3 px-4 py-4 sm:px-6",
                      !isRead && "bg-accent-soft/40",
                    )}
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{item.title}</p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-muted-foreground">
                        {item.body}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <time className="text-[11px] text-muted-foreground">
                          {formatDateTime(item.created_at)}
                        </time>
                        {!isRead && (
                          <button
                            type="button"
                            onClick={() => void markAnnouncementRead(item.id)}
                            className="text-xs font-semibold text-accent-ink hover:underline"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}

              {notices.map((item) => (
                <li
                  key={`notice-${item.id}`}
                  className={cn(
                    "flex min-w-0 gap-3 px-4 py-4 sm:px-6",
                    !item.read_at && "bg-accent-soft/40",
                  )}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                    <PackageCheck className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 break-words text-sm leading-5 text-muted-foreground">
                      {item.body}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                      <time className="text-[11px] text-muted-foreground">
                        {formatDateTime(item.created_at)}
                      </time>
                      {!item.read_at && (
                        <button
                          type="button"
                          onClick={() => void markNoticeRead(item.id)}
                          className="text-xs font-semibold text-accent-ink hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
