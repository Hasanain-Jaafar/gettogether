import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getNotifications, markAllAsRead } from "@/app/[locale]/(dashboard)/actions/notifications";
import { NotificationItem } from "@/components/notifications/notification-item";
import { Button } from "@/components/ui/button";
import { CheckCheck, Bell } from "lucide-react";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const t = await getTranslations("notifications");
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
        <h1 className="text-2xl font-semibold mb-3">{t("emptyTitle")}</h1>
        <p className="text-muted-foreground max-w-md">{t("emptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {t("unread", { count: unreadCount })}
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
                {t("markAllAsRead")}
              </Button>
            </form>
          )}
        </div>
      </div>

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
