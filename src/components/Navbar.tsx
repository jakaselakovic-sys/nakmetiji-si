// =============================================================================
// NaKmetiji.si — Navbar
// Glassmorphism navigacija z lucide ikonami in framer-motion animacijami
// =============================================================================

"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus, Leaf } from "lucide-react";

const NAV_LINKS = [
  { label: "Domov", href: "/" },
  { label: "Kmetije", href: "/kmetije" },
  { label: "Zemljevid", href: "/zemljevid" },
  { label: "O nas", href: "/o-nas" },
] as const;

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Zakleni scroll ko je mobile meni odprt
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "glass-nav"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white shadow-md group-hover:bg-forest-600 transition-colors duration-300">
            <Leaf size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span
              className={`text-xl font-bold tracking-tight transition-colors duration-500 ${
                scrolled ? "text-forest-900" : "text-white"
              }`}
            >
              NaKmetiji
            </span>
            <span
              className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-500 ${
                scrolled ? "text-earth-500" : "text-white/60"
              }`}
            >
              Turistične kmetije
            </span>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-all duration-300 hover:opacity-100 relative group ${
                scrolled
                  ? "text-forest-800 hover:text-forest-600"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-forest-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
          ))}
          <Link
            href="/dodaj-kmetijo"
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] inline-flex items-center gap-2 ${
              scrolled
                ? "bg-forest-700 text-white hover:bg-forest-600"
                : "bg-white text-forest-800 hover:bg-forest-50"
            }`}
          >
            <Plus size={16} strokeWidth={2.5} />
            Dodaj kmetijo
          </Link>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className={`md:hidden p-2 rounded-lg transition-colors duration-300 ${
            scrolled ? "hover:bg-earth-100" : "hover:bg-white/10"
          }`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Zapri meni" : "Odpri meni"}
          id="mobile-menu-button"
        >
          {mobileOpen ? (
            <X
              size={24}
              className={scrolled ? "text-forest-800" : "text-white"}
            />
          ) : (
            <Menu
              size={24}
              className={scrolled ? "text-forest-800" : "text-white"}
            />
          )}
        </button>
      </nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden overflow-hidden"
          >
            <div className="glass mx-4 mb-4 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                  >
                    <Link
                      href={link.href}
                      className="text-forest-800 font-medium text-base py-3 px-3 rounded-xl hover:bg-forest-50 transition-colors block"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.25 }}
              >
                <Link
                  href="/dodaj-kmetijo"
                  className="mt-4 rounded-xl bg-forest-700 text-white text-center py-3.5 font-semibold text-sm hover:bg-forest-600 transition-colors flex items-center justify-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <Plus size={16} strokeWidth={2.5} />
                  Dodaj kmetijo
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
