import { Bell, Sparkles } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <Bell className="size-10 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold mb-3">Notifications Coming Soon</h1>
      <p className="text-muted-foreground max-w-md">
        Stay updated on what matters most. We're building notifications for likes,
        comments, follows, and more so you never miss a moment.
      </p>
      <div className="mt-8 p-4 rounded-xl border bg-muted/30 flex items-center gap-3">
        <Sparkles className="size-5 text-primary" />
        <p className="text-sm">
          Check back often to see new posts from your community in the feed!
        </p>
      </div>
    </div>
  );
}
