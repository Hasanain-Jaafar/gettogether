import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Namespaces actually read by client components (useTranslations). Everything
// else in messages/ar.json is only ever read server-side (getTranslations) and
// doesn't need to be serialized into the client bundle on every page.
const CLIENT_NAMESPACES = [
  "auth",
  "calendar",
  "feed",
  "level",
  "marketing",
  "nav",
  "notifications",
  "poll",
  "profile",
  "sidebar",
  "verified",
] as const;

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();

  setRequestLocale(locale);

  const messages = await getMessages();
  const clientMessages = Object.fromEntries(
    CLIENT_NAMESPACES.map((ns) => [ns, messages[ns]]).filter(([, value]) => value !== undefined)
  );

  return (
    <NextIntlClientProvider messages={clientMessages}>
      {children}
    </NextIntlClientProvider>
  );
}
