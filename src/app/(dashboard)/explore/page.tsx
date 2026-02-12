import { Search, Users } from "lucide-react";

export default function ExplorePage() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <Search className="size-10 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold mb-3">Explore Coming Soon</h1>
      <p className="text-muted-foreground max-w-md">
        Discover new people and connections coming soon. In the meantime, check out the
        feed to see what the community is sharing.
      </p>
      <div className="mt-8 p-4 rounded-xl border bg-muted/30 flex items-center gap-3">
        <Users className="size-5 text-primary" />
        <p className="text-sm">
          Found someone interesting? Follow their posts and start a conversation!
        </p>
      </div>
    </div>
  );
}
