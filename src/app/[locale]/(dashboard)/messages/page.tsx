import { getTranslations, setRequestLocale } from "next-intl/server";
import { MessageSquare, Heart } from "lucide-react";

export default async function MessagesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("messages");
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 mb-6">
        <MessageSquare className="size-10 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold mb-3">{t("title")}</h1>
      <p className="text-muted-foreground max-w-md">{t("comingSoon")}</p>
      <div className="mt-8 p-4 rounded-xl border bg-muted/30 flex items-center gap-3">
        <Heart className="size-5 text-primary" />
      </div>
    </div>
  );
}
