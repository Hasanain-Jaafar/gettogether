import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function PostSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border border-border/80 shadow-sm">
      <div className="flex items-start gap-3 p-4 pb-2">
        <Skeleton className="size-10 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32 rounded-md" />
          <Skeleton className="h-4 w-24 rounded-md" />
        </div>
      </div>
      <div className="space-y-3 p-4 pb-3">
        <div className="space-y-2">
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <Skeleton className="h-4 w-4/6 rounded-md" />
        </div>
        <Skeleton className="aspect-video w-full rounded-xl sm:h-80" />
      </div>
      <div className="flex gap-2 border-t border-border/60 px-4 py-3">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </Card>
  );
}
