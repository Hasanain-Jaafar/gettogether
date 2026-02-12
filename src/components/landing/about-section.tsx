"use client";

import { motion } from "framer-motion";
import { Heart, Coffee, Users, Sparkles } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Genuine Connection",
    description:
      "We believe in authentic relationships, not superficial interactions. Every feature is designed to foster real connections between people.",
  },
  {
    icon: Coffee,
    title: "Warm & Welcoming",
    description:
      "Like your favorite coffee shop on a rainy day, GetTogether is a cozy space where everyone feels at home and valued.",
  },
  {
    icon: Users,
    title: "Community First",
    description:
      "We're building a community, not a platform. Your voice matters, your experiences shape our future, and you belong here.",
  },
  {
    icon: Sparkles,
    title: "Spark Joy",
    description:
      "Life's too short for dull moments. We bring magic to everyday connections through thoughtful design and delightful experiences.",
  },
];

export function AboutSection() {
  return (
    <section id="about" className="border-t bg-muted/40 px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl">
        {/* Section header */}
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            More Than Just Another Social Platform
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            GetTogether was born from a simple belief: that everyone deserves a warm,
            welcoming space to connect with like-minded souls. We're tired of
            algorithm-driven feeds and manufactured engagement. We wanted something
            real.
          </p>
        </motion.div>

        {/* Mission statement */}
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
              Our mission is to create the world's most welcoming digital gathering
              place—where relationships bloom naturally, conversations flow freely, and
              everyone feels like they belong.
            </p>
          </div>
        </motion.div>

        {/* Values grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <motion.div
                key={value.title}
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
                      {value.title}
                    </h3>
                    <p className="mt-2 text-muted-foreground">
                      {value.description}
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
