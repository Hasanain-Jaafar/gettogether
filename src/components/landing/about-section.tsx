"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Heart, Coffee, Users, Sparkles } from "lucide-react";

const valueKeys = ["genuine", "warm", "community", "spark"] as const;
const valueIcons = {
  genuine: Heart,
  warm: Coffee,
  community: Users,
  spark: Sparkles,
};

export function AboutSection() {
  const t = useTranslations("marketing.about");

  return (
    <section id="about" className="border-t bg-muted/40 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
        </motion.div>

        <motion.div
          className="mt-12 rounded-2xl border border-border/80 bg-card p-8 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="mx-auto max-w-3xl text-center">
            <Heart className="mx-auto mb-4 size-12 text-primary fill-primary/20" />
            <p className="text-xl font-medium leading-relaxed text-foreground">
              {t("mission")}
            </p>
          </div>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {valueKeys.map((key, index) => {
            const Icon = valueIcons[key];
            return (
              <motion.div
                key={key}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t(`values.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {t(`values.${key}.description`)}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
