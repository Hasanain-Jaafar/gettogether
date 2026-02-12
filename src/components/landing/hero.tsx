"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Users, Flame, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <motion.section
      className="relative overflow-hidden px-4 py-24 sm:py-32 md:py-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Warm gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background to-muted/30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] -translate-y-1/2 bg-primary/10 rounded-full blur-3xl" />

      <div className="mx-auto max-w-4xl text-center">
        {/* Heart icon with animation */}
        <motion.div
          className="mx-auto mb-8 flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5, type: "spring" }}
        >
          <div className="relative">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Heart className="size-20 text-primary fill-primary/20" />
            </motion.div>
            <Sparkles className="absolute -top-2 -right-2 size-6 text-[#e85a91]" />
          </div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Where <span className="text-primary">hearts connect</span>{" "}
          <br className="hidden sm:block" />
          in <span className="text-[#c73c7c]">warm embrace</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          className="mt-6 text-lg leading-relaxed text-muted-foreground sm:text-xl md:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          A cozy gathering place where love blossoms and relationships grow.
          Share your journey, connect with kindred spirits, and build meaningful
          connections in a warm, welcoming space.
        </motion.p>

        {/* Feature highlights */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Users className="size-5 text-primary" />
            <span>Find your community</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Flame className="size-5 text-[#e85a91]" />
            <span>Ignite connections</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Heart className="size-5 text-primary" />
            <span>Build lasting bonds</span>
          </div>
        </motion.div>

        {/* CTA buttons */}
        <motion.div
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto rounded-full shadow-lg shadow-primary/30 px-8 text-base"
          >
            <Link href="/sign-up">Join our gathering</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto rounded-full text-base"
          >
            <Link href="/sign-in">Welcome back</Link>
          </Button>
        </motion.div>

        {/* Trust indicator */}
        <motion.p
          className="mt-6 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          ✓ Free to join • ✓ Safe & welcoming • ✓ Built with ❤️
        </motion.p>
      </div>
    </motion.section>
  );
}
