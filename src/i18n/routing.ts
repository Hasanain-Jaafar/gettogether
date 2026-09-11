import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar"] as const,
  defaultLocale: "ar",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
