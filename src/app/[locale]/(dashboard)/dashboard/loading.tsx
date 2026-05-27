import { Skeleton } from "@/components/ui/skeleton";
import { PostSkeleton } from "@/components/feed/post-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-sm">
        <div className="space-y-4">
          <Skeleton className="h-5 w-24 rounded-md" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
