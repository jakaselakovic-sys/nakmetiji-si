"use client";

// =============================================================================
// NaKmetiji.si — StickyHeader
// Lightweight scroll-aware header: starts fully transparent over a hero image
// and transitions to solid Forest Green (#064E3B) as the user scrolls down.
// Designed for use on standalone landing pages (/paketi, /video, /o-nas) that
// don't need the full NavbarClient session logic.
//
// For the main app, the transition is wired directly into NavbarClient.tsx.
// =============================================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Logo } from "./Logo";

interface StickyHeaderProps {
  /** Show the "+ Dodaj kmetijo" CTA. Default true. */
  showCta?: boolean;
  /** Scroll threshold in px before the header solidifies. Default 64. */
  threshold?: number;
  links?: { label: string; href: string }[];
}

const DEFAULT_LINKS = [
  { label: "Kmetije", href: "/kmetije" },
  { label: "Paketi", href: "/paketi" },
  { label: "Video", href: "/video" },
  { label: "Blog", href: "/blog" },
];

export function StickyHeader({
  showCta = true,
  threshold = 64,
  links = DEFAULT_LINKS,
}: StickyHeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return (
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 20, mass: 0.8 }}
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled
          ? "#064E3B"
          : "transparent",
        borderBottom: scrolled
          ? "1px solid rgba(255,255,255,0.07)"
          : "1px solid transparent",
        boxShadow: scrolled
          ? "0 4px 24px rgba(4,37,25,0.35)"
          : "none",
      }}
    >
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4v6M4 7h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <Logo size="sm" variant="light" href={null} />
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-0.5">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-full text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-all"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        {showCta && (
          <Link
            href="/dodaj-kmetijo"
            className="relative overflow-hidden inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: "linear-gradient(135deg, #0a6b51 0%, #064E3B 100%)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            {/* Shimmer sweep */}
            <span
              className="absolute inset-0 pointer-events-none animate-shimmer rounded-full"
              style={{
                backgroundImage: "linear-gradient(90deg, transparent 25%, rgba(255,255,255,0.16) 50%, transparent 75%)",
                backgroundSize: "200% 100%",
              }}
              aria-hidden="true"
            />
            <span className="relative">+ Dodaj kmetijo</span>
          </Link>
        )}
      </div>
    </motion.header>
  );
}
