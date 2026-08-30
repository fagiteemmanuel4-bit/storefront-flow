import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function EmptyState({ title, description, action, icon, className }: { title: string; description: string; action?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-64 flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="relative mb-5 flex size-20 items-center justify-center rounded-2xl border border-border bg-[var(--brand-100)] text-[var(--brand-700)]">
        <span className="absolute inset-3 rounded-xl border border-[var(--brand-600)]/15 bg-surface" />
        <span className="relative z-10">{icon}</span>
      </div>
      <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
