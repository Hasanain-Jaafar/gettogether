"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Heart, MessageCircle, Repeat2, User2, Hash, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/utils";
import { markAsRead } from "@/app/[locale]/(dashboard)/actions/notifications";
import { toast } from "sonner";

type NotificationItemProps = {
  notification: {
    id: string;
    type: "like" | "comment" | "follow" | "repost" | "mention" | "poll";
    read: boolean;
    created_at: string;
    actor?: {
      id: string;
      name: string | null;
      avatar_url: string | null;
    } | null;
    post_id?: string | null;
    comment_id?: string | null;
    data?: any;
  };
  onMarkAsRead?: (id: string) => void;
  className?: string;
};

function getNotificationIcon(type: string) {
  switch (type) {
    case "like":
      return <Heart className="size-4 text-rose-500 fill-rose-500/20" />;
    case "comment":
      return <MessageCircle className="size-4 text-blue-500" />;
    case "follow":
      return <User2 className="size-4 text-primary" />;
    case "repost":
      return <Repeat2 className="size-4 text-green-500" />;
    case "mention":
      return <Hash className="size-4 text-purple-500" />;
    case "poll":
      return <BarChart3 className="size-4 text-amber-500" />;
    default:
      return null;
  }
}


function getInitials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  className,
}: NotificationItemProps) {
  const router = useRouter();
  const t = useTranslations("notifications");
  const locale = useLocale();
  const [isRead, setIsRead] = useState(notification.read);
  const [marking, setMarking] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    // Let the actor avatar/name link navigate normally
    if ((e.target as HTMLElement).closest("a[href*='/u/']")) return;

    const target = (e.currentTarget as HTMLElement).querySelector<HTMLAnchorElement>(
      "a[data-nav-target]"
    );
    const href = target?.getAttribute("href");

    e.preventDefault();

    if (!isRead && !marking) {
      setMarking(true);
      const result = await markAsRead(notification.id);
      if (result.success) {
        setIsRead(true);
        onMarkAsRead?.(notification.id);
      } else {
        toast.error(result.error || t("failedToMark"));
      }
      setMarking(false);
    }

    if (href && href !== "#") {
      router.push(href);
    }
  };

  const icon = getNotificationIcon(notification.type);
  const someone = t("text.someone");
  const actorName = notification.actor?.name ?? someone;
  const textKey = `text.${notification.type}` as const;
  let text: string;
  try {
    text = t(textKey, { name: actorName });
  } catch {
    text = t("text.fallback");
  }
  const postLink = notification.post_id ? `/post/${notification.post_id}` : null;
  const commentLink = notification.comment_id ? `#comment-${notification.comment_id}` : "";
  const actorLink = notification.actor ? `/u/${notification.actor.id}` : null;

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-4 rounded-xl transition-all",
        isRead
          ? "bg-muted/20 hover:bg-muted/40"
          : "bg-card border border-primary/20 hover:border-primary/50",
        className
      )}
    >
      <Link
        href={postLink ? `${postLink}${commentLink}` : "#"}
        data-nav-target
        onClick={(e) => e.preventDefault()}
        className="flex items-start gap-3 flex-1"
      >
      <div className="mt-0.5 shrink-0">
        {icon || <div className="size-4 rounded-full bg-primary/20" />}
      </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground">
            {actorLink ? (
              <Link
                href={actorLink}
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-foreground hover:text-primary transition-colors"
              >
                {actorName}
              </Link>
            ) : (
              <span className="font-semibold">{actorName}</span>
            )}{" "}
            <span className="text-muted-foreground">{text.replace(actorName, "").trim()}</span>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {relativeTime(notification.created_at, locale)}
          </p>
        </div>

        {/* Unread indicator */}
        {!isRead && (
          <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
        )}
      </Link>
    </div>
  );
}
