import { Skeleton } from "@/components/ui/skeleton";

export default function PublicProfileLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-sm" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-[200px] w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
