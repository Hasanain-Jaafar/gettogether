import { Skeleton } from "@/components/ui/skeleton";
import { PostSkeleton } from "@/components/feed/post-skeleton";

export default function PostLoading() {
  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-5 w-16" />
      <PostSkeleton />
    </div>
  );
}
