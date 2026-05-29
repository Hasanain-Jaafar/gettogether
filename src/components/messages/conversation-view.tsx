"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useLocale } from "next-intl";
import { ArrowLeft, ArrowRight, Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn, relativeTime } from "@/lib/utils";
import {
  markConversationRead,
  sendMessage,
} from "@/app/[locale]/(dashboard)/actions/messages";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Other = {
  id: string;
  name: string | null;
  avatar_url: string | null;
  last_read_at: string;
};

type Labels = {
  back: string;
  placeholder: string;
  send: string;
  seen: string;
  typing: string;
  empty: string;
};

type Props = {
  conversationId: string;
  currentUserId: string;
  other: Other;
  initialMessages: Message[];
  labels: Labels;
};

function initials(name: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const TYPING_TIMEOUT = 3500;
const TYPING_THROTTLE = 1500;

export function ConversationView({
  conversationId,
  currentUserId,
  other,
  initialMessages,
  labels,
}: Props) {
  const locale = useLocale();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [otherLastRead, setOtherLastRead] = useState(other.last_read_at);
  const [otherTyping, setOtherTyping] = useState(false);
  const otherTypingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingBroadcast = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const supabase = useMemo(() => createClient(), []);

  // Scroll to bottom on mount and new message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Mark conversation as read on mount and whenever a new message arrives.
  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId, messages.length]);

  // Realtime: new messages and read-receipt updates.
  useEffect(() => {
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== currentUserId) {
            setOtherTyping(false);
            if (otherTypingTimer.current) clearTimeout(otherTypingTimer.current);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_participants",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as { user_id: string; last_read_at: string };
          if (row.user_id === other.id) setOtherLastRead(row.last_read_at);
        },
      )
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload?.user_id && payload.payload.user_id !== currentUserId) {
          setOtherTyping(true);
          if (otherTypingTimer.current) clearTimeout(otherTypingTimer.current);
          otherTypingTimer.current = setTimeout(
            () => setOtherTyping(false),
            TYPING_TIMEOUT,
          );
        }
      })
      .subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
      if (otherTypingTimer.current) clearTimeout(otherTypingTimer.current);
    };
  }, [supabase, conversationId, currentUserId, other.id]);

  function broadcastTyping() {
    const now = Date.now();
    if (now - lastTypingBroadcast.current < TYPING_THROTTLE) return;
    lastTypingBroadcast.current = now;
    void channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { user_id: currentUserId },
    });
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: `tmp-${crypto.randomUUID()}`,
      sender_id: currentUserId,
      content: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setContent("");
    const result = await sendMessage(conversationId, trimmed);
    setSending(false);
    if (!result.success) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(result.error);
    }
  }

  const lastMineIndex = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender_id === currentUserId) return i;
    }
    return -1;
  })();
  const lastMineSeen =
    lastMineIndex >= 0 && messages[lastMineIndex].created_at <= otherLastRead;

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col">
      <header className="flex items-center gap-3 border-b border-border/80 pb-3">
        <Link
          href="/messages"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          aria-label={labels.back}
        >
          <ArrowLeft className="size-5 rtl:hidden" />
          <ArrowRight className="size-5 ltr:hidden" />
        </Link>
        <Link
          href={`/u/${other.id}`}
          className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-90"
        >
          <Avatar className="size-10 shrink-0">
            <AvatarImage src={other.avatar_url ?? undefined} />
            <AvatarFallback>{initials(other.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold truncate">{other.name ?? "—"}</p>
            {otherTyping && (
              <p className="text-xs text-muted-foreground">{labels.typing}</p>
            )}
          </div>
        </Link>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto py-4 space-y-2"
      >
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            {labels.empty}
          </p>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={cn("flex", mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-lg whitespace-pre-wrap wrap-break-word",
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground",
                  )}
                >
                  <p>{m.content}</p>
                  <p
                    className={cn(
                      "mt-1 text-sm opacity-70",
                      mine ? "text-end" : "text-start",
                    )}
                  >
                    {relativeTime(m.created_at, locale)}
                    {mine && i === lastMineIndex && lastMineSeen && (
                      <span className="ms-2">· {labels.seen}</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-end gap-2 border-t border-border/80 pt-3"
      >
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            broadcastTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend(e as unknown as React.FormEvent);
            }
          }}
          placeholder={labels.placeholder}
          className="min-h-[44px] max-h-32 flex-1 resize-y rounded-2xl border-border bg-muted/30 text-lg"
          maxLength={2000}
          disabled={sending}
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-full"
          disabled={sending || !content.trim()}
          aria-label={labels.send}
        >
          <Send className="size-4 rtl:-scale-x-100" />
        </Button>
      </form>
    </div>
  );
}
