"use client";

import { motion } from "framer-motion";
import { Heart, Shield, Sparkles, Gift } from "lucide-react";

const features = [
  {
    icon: Heart,
    title: "Meaningful Connections",
    description:
      "Find people who truly get you. Our community is built on genuine interactions and shared values.",
  },
  {
    icon: Shield,
    title: "Safe & Welcoming",
    description:
      "Your safety is our priority. We've created a warm space where you can be your authentic self.",
  },
  {
    icon: Sparkles,
    title: "Cozy Atmosphere",
    description:
      "Experience the comfort of a welcoming gathering. No pressure, just authentic human connection.",
  },
  {
    icon: Gift,
    title: "Share Your Journey",
    description:
      "Express yourself freely through posts, images, and conversations. Your story matters here.",
  },
];

export function FeaturesSection() {
  return (
    <section className="border-t bg-background px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <motion.div
          className="mx-auto max-w-2xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Why GetTogether?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            We've created a space where relationships can flourish and hearts can
            truly connect.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
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
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {feature.description}
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
