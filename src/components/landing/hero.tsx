"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export function Hero() {
  const t = useTranslations("marketing.hero");
  const tHeader = useTranslations("marketing.header");

  return (
    <section
      className="relative min-h-[calc(100vh-4rem)] w-full overflow-hidden font-[family-name:var(--font-zain)]"
    >
      {/* Background image: mobile-portrait on small screens, desktop on md+ */}
      <Image
        src="/Mobil bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center md:hidden"
      />
      <Image
        src="/Desktop bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hidden object-cover object-center md:block"
      />

      {/* Subtle bottom fade so the buttons stay legible */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center px-6 pt-6 pb-10 text-center sm:max-w-lg sm:pt-12 md:max-w-xl">
        {/* Heart logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto"
        >
          <Image
            src="/heart.png"
            alt=""
            width={140}
            height={140}
            priority
            className="size-24 sm:size-28 md:size-32"
          />
        </motion.div>

        {/* Headline + subheading */}
        <div className="mt-6 flex flex-col items-center sm:mt-auto">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-5xl font-extrabold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] sm:text-6xl md:text-7xl"
          >
            {t("title")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="mt-4 max-w-xs text-lg leading-relaxed text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:max-w-sm sm:text-xl"
          >
            {t("subtitle")}
          </motion.p>
        </div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="absolute inset-x-6 bottom-[15%] flex w-auto flex-col items-stretch gap-3 sm:inset-x-12"
        >
          <Button
            asChild
            size="lg"
            className="h-12 w-full rounded-full bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90"
          >
            <Link href="/sign-in">{tHeader("signIn")}</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
