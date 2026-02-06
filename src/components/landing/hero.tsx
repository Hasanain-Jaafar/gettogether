"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <motion.section
      className="relative overflow-hidden px-4 py-24 sm:py-32"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-3xl text-center">
        <motion.h1
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          Get together, <span className="text-primary">ship faster</span>
        </motion.h1>
        <motion.p
          className="mt-6 text-lg text-muted-foreground sm:text-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          A modern platform to manage your profile and collaborate. Secure,
          fast, and built for scale.
        </motion.p>
        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/sign-up">Get started</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto"
          >
            <Link href="/sign-in">Sign in</Link>
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
