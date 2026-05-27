"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Heart, Shield, Sparkles, Gift } from "lucide-react";

const featureKeys = ["connections", "safety", "cozy", "share"] as const;
const featureIcons = {
  connections: Heart,
  safety: Shield,
  cozy: Sparkles,
  share: Gift,
};

export function FeaturesSection() {
  const t = useTranslations("marketing.features");

  return (
    <section id="features" className="border-t bg-background px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        <motion.div
          className="mx-auto max-w-2xl text-center"
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

        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {featureKeys.map((key, index) => {
            const Icon = featureIcons[key];
            return (
              <motion.div
                key={key}
                className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="size-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">
                      {t(`items.${key}.title`)}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {t(`items.${key}.description`)}
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
