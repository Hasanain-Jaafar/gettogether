"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getOrCreateConversation } from "@/app/[locale]/(dashboard)/actions/messages";

export function MessageButton({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const t = useTranslations("messages");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    const result = await getOrCreateConversation(targetUserId);
    setLoading(false);
    if (!result.success) {
      const msg = /can only message/i.test(result.error)
        ? t("followGateError")
        : result.error;
      toast.error(msg);
      return;
    }
    router.push(`/messages/${result.conversationId}`);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="rounded-full"
      onClick={handleClick}
      disabled={loading}
    >
      <MessageCircle className="size-4 me-1.5" />
      {t("message")}
    </Button>
  );
}
