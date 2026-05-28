import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageSquare } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NewMessageDialog } from "@/components/messages/new-message-dialog";

function initials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("messages");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: myParts } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", user.id);
  const conversationIds = myParts?.map((p) => p.conversation_id) ?? [];
  const lastReadByConv = new Map(
    myParts?.map((p) => [p.conversation_id, p.last_read_at]) ?? [],
  );

  if (conversationIds.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <NewMessageDialog />
        </div>
        <EmptyState title={t("title")} hint={t("empty")} />
      </div>
    );
  }

  const { data: convs } = await supabase
    .from("conversations")
    .select("id, last_message_at")
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false });

  const { data: otherParts } = await supabase
    .from("conversation_participants")
    .select("conversation_id, user_id")
    .in("conversation_id", conversationIds)
    .neq("user_id", user.id);
  const otherByConv = new Map(
    otherParts?.map((p) => [p.conversation_id, p.user_id]) ?? [],
  );

  const otherUserIds = [...new Set(otherParts?.map((p) => p.user_id) ?? [])];
  const { data: profiles } = otherUserIds.length
    ? await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", otherUserIds)
    : { data: [] };
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

  const { data: lastMessages } = await supabase
    .from("messages")
    .select("conversation_id, content, created_at, sender_id")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false });
  const lastByConv = new Map<
    string,
    { content: string; created_at: string; sender_id: string }
  >();
  lastMessages?.forEach((m) => {
    if (!lastByConv.has(m.conversation_id)) lastByConv.set(m.conversation_id, m);
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
        <NewMessageDialog />
      </div>
      <ul className="divide-y divide-border/60 rounded-2xl border border-border/80 bg-card">
        {convs?.map((c) => {
          const otherId = otherByConv.get(c.id);
          const other = otherId ? profileMap.get(otherId) : null;
          const last = lastByConv.get(c.id);
          const lastRead = lastReadByConv.get(c.id) ?? "1970-01-01";
          const unread =
            !!last && last.sender_id !== user.id && last.created_at > lastRead;
          return (
            <li key={c.id}>
              <Link
                href={`/messages/${c.id}`}
                className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors"
              >
                <Avatar className="size-12 shrink-0">
                  <AvatarImage src={other?.avatar_url ?? undefined} />
                  <AvatarFallback>{initials(other?.name ?? null)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold truncate">{other?.name ?? t("unknownUser")}</p>
                    {unread && <span className="size-2 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p
                    className={
                      unread
                        ? "text-sm text-foreground truncate"
                        : "text-sm text-muted-foreground truncate"
                    }
                  >
                    {last?.content ?? t("noMessagesYet")}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <MessageSquare className="size-10 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold mb-3">{title}</h1>
      <p className="text-muted-foreground max-w-md">{hint}</p>
    </div>
  );
}
