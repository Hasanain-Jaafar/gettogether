import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { ConversationView } from "@/components/messages/conversation-view";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ locale: string; conversationId: string }>;
}) {
  const { locale, conversationId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("messages");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: me } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!me) notFound();

  const { data: parts } = await supabase
    .from("conversation_participants")
    .select("user_id, last_read_at")
    .eq("conversation_id", conversationId);
  const other = parts?.find((p) => p.user_id !== user.id);
  if (!other) notFound();

  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("id, name, avatar_url")
    .eq("id", other.user_id)
    .maybeSingle();

  const { data: messages } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return (
    <ConversationView
      conversationId={conversationId}
      currentUserId={user.id}
      other={{
        id: other.user_id,
        name: otherProfile?.name ?? null,
        avatar_url: otherProfile?.avatar_url ?? null,
        last_read_at: other.last_read_at,
      }}
      initialMessages={messages ?? []}
      labels={{
        back: t("back"),
        placeholder: t("placeholder"),
        send: t("send"),
        seen: t("seen"),
        typing: t("typing"),
        empty: t("startConversation"),
      }}
    />
  );
}
