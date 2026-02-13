import { createClient } from "@/lib/supabase/server";
import { getNotifications, markAllAsRead } from "@/app/(dashboard)/actions/notifications";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell } from "lucide-react";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { notifications, unreadCount } = await getNotifications(user.id);

  async function handleMarkAllAsRead() {
    "use server";
    await markAllAsRead();
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mb-6">
          <Bell className="size-10 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold mb-3">No notifications yet</h1>
        <p className="text-muted-foreground max-w-md">
          Stay updated on what matters most. We'll notify you about likes,
          comments, follows, and more so you never miss a moment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <form action={handleMarkAllAsRead}>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 rounded-full"
              >
                <CheckCheck className="size-4" />
                Mark all as read
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>
    </div>
  );
}
