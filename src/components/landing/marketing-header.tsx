"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heart, Menu, X } from "lucide-react";

const navLinks = [
  { hash: "#features", label: "Features" },
  { hash: "#about", label: "About" },
  { hash: "#faq", label: "FAQ" },
];

export function MarketingHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onHome) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setOpen(false);
  };

  const linkHref = (hash: string) => (onHome ? hash : `/${hash}`);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight hover:opacity-80 transition-opacity"
        >
          <Heart className="size-5 text-primary fill-primary/20" />
          <span>GetTogether</span>
        </Link>

        {/* Navigation links - desktop */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.hash}
              href={linkHref(link.hash)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <nav className="flex items-center gap-2">
          <ThemeToggle />

          <Button variant="ghost" asChild className="hidden sm:flex rounded-full">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button
            asChild
            className="hidden sm:flex rounded-full shadow-lg shadow-primary/20"
          >
            <Link href="/sign-up">Sign up</Link>
          </Button>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden size-9"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span
                  key="x"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex"
                >
                  <X className="size-5" />
                </motion.span>
              ) : (
                <motion.span
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex"
                >
                  <Menu className="size-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </nav>
      </div>

      {/* Mobile slide-down panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="sm:hidden absolute inset-x-0 top-16 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80"
          >
            <nav className="flex flex-col gap-1 p-4">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.hash}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.04, duration: 0.2 }}
                >
                  <Link
                    href={linkHref(link.hash)}
                    onClick={close}
                    className="block rounded-full px-5 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.05 + navLinks.length * 0.04 }}
                className="my-2 h-px bg-border"
              />
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + (navLinks.length + 1) * 0.04, duration: 0.2 }}
              >
                <Button
                  asChild
                  variant="ghost"
                  className="w-full rounded-full"
                  onClick={close}
                >
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + (navLinks.length + 2) * 0.04, duration: 0.2 }}
              >
                <Button
                  asChild
                  className="w-full rounded-full shadow-lg shadow-primary/20"
                  onClick={close}
                >
                  <Link href="/sign-up">Sign up</Link>
                </Button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
