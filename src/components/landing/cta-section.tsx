"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Coffee, MessageCircle } from "lucide-react";

export function CtaSection() {
  return (
    <motion.section
      className="relative overflow-hidden border-t bg-muted/40 px-4 py-20 sm:py-24"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background to-transparent" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] translate-y-1/2 translate-x-1/2 bg-accent/10 rounded-full blur-3xl" />

      <div className="mx-auto max-w-3xl text-center">
        {/* Icon */}
        <motion.div
          className="mx-auto mb-6 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          <div className="relative">
            <Heart className="size-16 text-primary fill-primary/10" />
            <Coffee className="absolute -bottom-1 -right-1 size-6 text-accent bg-background rounded-full p-0.5" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h2
          className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          Ready to find your people?
        </motion.h2>

        {/* Description */}
        <motion.p
          className="mt-4 text-lg text-muted-foreground"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          Join our warm community in seconds. No credit card required — just bring
          your authentic self and let the connections begin.
        </motion.p>

        {/* Features */}
        <motion.div
          className="mt-8 flex flex-wrap items-center justify-center gap-8"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MessageCircle className="size-6" />
            </div>
            <span className="text-sm font-medium">Share & Connect</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Heart className="size-6" />
            </div>
            <span className="text-sm font-medium">Find Kindred Spirits</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Coffee className="size-6" />
            </div>
            <span className="text-sm font-medium">Grow Together</span>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
        >
          <Button
            asChild
            size="lg"
            className="rounded-full shadow-lg shadow-primary/30 px-10 text-base"
          >
            <Link href="/sign-up">Start your journey</Link>
          </Button>
        </motion.div>

        {/* Footer note */}
        <motion.p
          className="mt-6 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 }}
        >
          Join thousands who've already found their place
        </motion.p>
      </div>
    </motion.section>
  );
}
