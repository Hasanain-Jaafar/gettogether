"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function Hero() {
  const t = useTranslations("marketing.hero");
  const tHeader = useTranslations("marketing.header");

  return (
    <section
      className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden font-[family-name:var(--font-zain)]"
    >
      {/* Background image (the site is mobile-only, so there's no desktop variant) */}
      <Image
        src="/Mobil bg.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Subtle bottom fade so the buttons stay legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center px-6 pt-6 pb-10 text-center sm:max-w-lg sm:pt-12 md:max-w-xl">
        {/* Heart logo */}
        <div className="mx-auto animate-[scaleIn_0.5s_ease-out_both]">
          <Image
            src="/heart.png"
            alt=""
            width={140}
            height={140}
            priority
            className="size-24 sm:size-28 md:size-32"
          />
        </div>

        {/* Headline + subheading */}
        <div className="mt-6 flex flex-col items-center sm:mt-auto">
          <h1
            className="animate-[slide-up_0.5s_ease-out_0.15s_both] text-5xl font-extrabold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl"
          >
            {t("title")}
          </h1>
          <p
            className="animate-[slide-up_0.5s_ease-out_0.25s_both] mt-4 max-w-xs text-lg leading-relaxed text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:max-w-sm sm:text-xl"
          >
            {t("subtitle")}
          </p>
        </div>

        {/* CTAs */}
        <div
          className="animate-[slide-up_0.5s_ease-out_0.35s_both] absolute inset-x-6 bottom-[15%] flex w-auto flex-col items-stretch gap-3 sm:inset-x-12"
        >
          <Button
            asChild
            size="lg"
            className="h-12 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
          >
            <Link href="/sign-in">{tHeader("signIn")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
