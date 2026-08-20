import { useEffect, useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

type NoticeTone = "info" | "success" | "warning";

type NoticeDetail = {
  message: string;
  tone?: NoticeTone;
  title?: string;
};

const EVENT_NAME = "kudi-smart-notice";

export function emitKudiNotice(detail: NoticeDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NoticeDetail>(EVENT_NAME, { detail }));
}

export function SmartNoticeHost() {
  const [notice, setNotice] = useState<NoticeDetail | null>(null);

  useEffect(() => {
    const onNotice = (event: Event) => {
      const detail = (event as CustomEvent<NoticeDetail>).detail;
      if (!detail?.message) return;
      setNotice(detail);
      window.setTimeout(() => setNotice((current) => (current === detail ? null : current)), 5000);
    };

    window.addEventListener(EVENT_NAME, onNotice);
    return () => window.removeEventListener(EVENT_NAME, onNotice);
  }, []);

  if (!notice) return null;

  const tone = notice.tone ?? "info";
  const Icon = tone === "success" ? CheckCircle2 : tone === "warning" ? TriangleAlert : Info;

  return (
    <div className="pointer-events-none fixed inset-x-4 top-[calc(env(safe-area-inset-top)+4.5rem)] z-[70] flex justify-center sm:left-auto sm:right-5 sm:w-[min(24rem,calc(100vw-2rem))] sm:justify-end">
      <div className="pointer-events-auto flex w-full items-start gap-3 rounded-2xl border border-border bg-surface/95 p-3.5 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2">
        <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full", tone === "success" ? "bg-emerald-100 text-emerald-700" : tone === "warning" ? "bg-amber-100 text-amber-700" : "bg-secondary text-foreground")}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          {notice.title && <p className="text-sm font-semibold">{notice.title}</p>}
          <p className={cn("text-sm leading-5", notice.title ? "mt-0.5 text-muted-foreground" : "text-foreground")}>{notice.message}</p>
        </div>
        <button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)} className="touch-target -mr-1 -mt-1 flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
