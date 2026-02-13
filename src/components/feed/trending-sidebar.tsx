import { Hash, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

type TrendingTopic = {
  name: string;
  count: number;
  last_trending_at: string;
};

type TrendingSidebarProps = {
  trending: TrendingTopic[];
  className?: string;
};

export function TrendingSidebar({ trending, className }: TrendingSidebarProps) {
  return (
    <Card className={className}>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="size-5 text-primary" />
          <h2 className="font-semibold">Trending Topics</h2>
        </div>
        {trending.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No trending topics yet
          </p>
        ) : (
          <ul className="space-y-3">
            {trending.map((topic, index) => (
              <li key={topic.name}>
                <a
                  href={`?hashtag=${topic.name}`}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-sm text-muted-foreground w-6 shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Hash className="size-3.5 text-muted-foreground shrink-0" />
                      <p className="font-medium text-sm truncate text-foreground group-hover:text-primary transition-colors">
                        {topic.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {topic.count} {topic.count === 1 ? "post" : "posts"}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
