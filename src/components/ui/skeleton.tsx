import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-lg bg-primary/[0.07]", className)} {...props} />;
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return <div className="space-y-3" aria-label="Loading table" role="status"><div className="rounded-2xl border border-border bg-surface p-4"><Skeleton className="h-5 w-40" /><div className="mt-5 space-y-4">{Array.from({ length: rows }).map((_, i) => <div key={i} className="flex items-center gap-4"><Skeleton className="size-9 rounded-xl" /><div className="min-w-0 flex-1 space-y-2"><Skeleton className="h-3 w-2/5" /><Skeleton className="h-3 w-1/4" /></div><Skeleton className="h-3 w-16" /></div>)}</div></div></div>;
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading cards" role="status">{Array.from({ length: count }).map((_, i) => <div key={i} className="rounded-2xl border border-border bg-surface p-5"><Skeleton className="size-10 rounded-xl" /><Skeleton className="mt-5 h-4 w-2/5" /><Skeleton className="mt-3 h-8 w-3/5" /><Skeleton className="mt-4 h-3 w-4/5" /></div>)}</div>;
}

export function DashboardSkeleton() {
  return <div className="space-y-5" aria-label="Loading dashboard" role="status"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl border border-border bg-surface p-5"><Skeleton className="h-3 w-20" /><Skeleton className="mt-4 h-8 w-28" /><Skeleton className="mt-3 h-3 w-24" /></div>)}</div><div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]"><div className="h-72 rounded-2xl border border-border bg-surface p-5"><Skeleton className="h-5 w-32" /><Skeleton className="mt-6 h-44 w-full rounded-xl" /></div><div className="h-72 rounded-2xl border border-border bg-surface p-5"><Skeleton className="h-5 w-32" /><div className="mt-6 space-y-5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex gap-3"><Skeleton className="size-8 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-3 w-3/4" /><Skeleton className="h-3 w-1/2" /></div></div>)}</div></div></div></div>;
}

export { Skeleton };
