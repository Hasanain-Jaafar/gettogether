"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const container =
      document.getElementById("dashboard-scroll-container") ?? window;

    function onScroll() {
      const scrollTop =
        container === window
          ? window.scrollY
          : (container as HTMLElement).scrollTop;
      if (scrollTop > 400) {
        setLeaving(false);
        setVisible(true);
      } else {
        setLeaving(true);
        timeout = setTimeout(() => {
          setVisible(false);
          setLeaving(false);
        }, 300);
      }
    }

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      clearTimeout(timeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => {
        const container = document.getElementById("dashboard-scroll-container");
        if (container) {
          container.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }}
      aria-label="Scroll to top"
      className={cn(
        "fixed bottom-6 right-6 z-50 group",
        "flex items-center justify-center rounded-full size-11",
        "bg-primary text-primary-foreground",
        "shadow-lg shadow-primary/30",
        "hover:shadow-xl hover:shadow-primary/40 hover:scale-105",
        "active:scale-95",
        "transition-all duration-200",
        leaving
          ? "animate-[slide-down_0.3s_ease-in_forwards]"
          : "animate-[slide-up_0.3s_ease-out_forwards]"
      )}
    >
      <ArrowUp
        className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5"
        strokeWidth={2.5}
      />
    </button>
  );
}
