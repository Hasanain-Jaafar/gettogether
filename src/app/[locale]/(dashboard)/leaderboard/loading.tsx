import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-52" />
        </div>
      </div>
      <Card className="rounded-2xl">
        <CardContent className="p-2 sm:p-3">
          <ul className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl px-3 py-3">
                <Skeleton className="size-6 shrink-0 rounded-md" />
                <Skeleton className="size-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-12" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
