"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    question: "Is GetTogether free to use?",
    answer:
      "Yes! GetTogether is completely free to use. We believe that meaningful connections should be accessible to everyone. Sign up, post, connect, and build relationships at no cost.",
  },
  {
    question: "How do I find people to connect with?",
    answer:
      "We offer multiple ways to discover kindred spirits: explore the feed to see posts from everyone, use the Explore page to discover new people, and engage with posts that resonate with you. Genuine interactions often lead to meaningful connections.",
  },
  {
    question: "Is my data and privacy protected?",
    answer:
      "Absolutely. Your privacy and safety are our top priorities. We use industry-standard encryption, never sell your data, and give you full control over your profile and posts. You can delete your account at any time.",
  },
  {
    question: "Can I share photos and media?",
    answer:
      "Yes! You can share images with your posts. Our platform supports various image formats, and we optimize them for a great viewing experience across all devices.",
  },
  {
    question: "How is GetTogether different from other social platforms?",
    answer:
      "Unlike algorithm-driven platforms that prioritize engagement over connection, GetTogether focuses on authentic, meaningful interactions. We've designed our cozy, welcoming atmosphere to foster genuine relationships rather than endless scrolling.",
  },
  {
    question: "Can I control who sees my posts?",
    answer:
      "Your posts are visible to the entire GetTogether community, which is part of what makes our warm, open atmosphere special. You can always edit or delete your posts, and block anyone who makes you uncomfortable.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section id="faq" className="border-t bg-background px-4 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl">
        {/* Section header */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Got questions? We've got answers.
          </p>
        </motion.div>

        {/* FAQ items */}
        <div className="mt-12 space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.05, duration: 0.5 }}
            >
              <div
                className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
              >
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between gap-4 p-6 text-left transition-colors hover:bg-muted/50"
                  aria-expanded={openIndex === index}
                >
                  <span className="font-medium text-foreground">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="size-5 shrink-0 text-muted-foreground" />
                  </motion.div>
                </button>

                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 pt-0 text-muted-foreground">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <p className="text-muted-foreground">
            Still have questions? We'd love to hear from you.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
