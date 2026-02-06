"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export function CtaSection() {
  return (
    <motion.section
      className="border-t bg-muted/40 px-4 py-20 sm:py-24"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Ready to get started?
        </h2>
        <p className="mt-4 text-muted-foreground">
          Create your account in seconds. No credit card required.
        </p>
        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Button asChild size="lg">
            <Link href="/sign-up">Create account</Link>
          </Button>
        </motion.div>
      </div>
    </motion.section>
  );
}
