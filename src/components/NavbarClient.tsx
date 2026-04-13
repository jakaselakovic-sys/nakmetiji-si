"use client";

// =============================================================================
// NaKmetiji.si — NavbarClient
//
// Enhancements over the previous version:
//   1. Scroll progress bar — thin forest-green line across the top that fills
//      as the user reads the page. Communicates depth without taking up space.
//   2. Adaptive density — padding + font shrink slightly on scroll so the nav
//      "steps back" and gives content more room. Apple does this in Safari.
//   3. Green Passport shortcut — logged-in users see a Passport pill in both
//      the desktop dropdown and mobile menu. Drives engagement loop.
//   4. Active link detection — current page link gets a green underline dot,
//      not just a hover state.
// =============================================================================

import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence, useSpring, useMotionValueEvent, useScroll } from "framer-motion";
import {
  Menu, X, Plus, Leaf, User, Shield, LayoutDashboard,
  LogOut, Stamp, ChevronRight,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

interface Props {
  navLinks: { label: string; href: string }[];
  isPrijavljen: boolean;
  vloga: string | null;
}

export function NavbarClient({ navLinks, isPrijavljen, vloga }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [scrolled,      setScrolled]      = useState(false);
  const [mobileOpen,    setMobileOpen]    = useState(false);
  const [userMenuOpen,  setUserMenuOpen]  = useState(false);
  const [isPending,     startTransition]  = useTransition();

  // ── Scroll progress ────────────────────────────────────────────────────────
  const { scrollYProgress } = useScroll();
  const progressSpring = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  const [progressPct, setProgressPct] = useState(0);

  useMotionValueEvent(progressSpring, "change", (v) => {
    setProgressPct(Math.round(v * 100));
  });

  // ── Scroll state ───────────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Body scroll lock when mobile menu open ─────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // ── Close user menu on outside click ──────────────────────────────────────
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);

  // ── Close mobile menu on route change ─────────────────────────────────────
  useEffect(() => { startTransition(() => setMobileOpen(false)); }, [pathname]);

  function handleOdjava() {
    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    });
  }

  // Dynamic colour tokens — transparent backdrop fades to glass-nav on scroll
  const textColor      = scrolled ? "text-forest-800"     : "text-white";
  const textColorMuted = scrolled ? "text-forest-800/70"  : "text-white/75";
  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      style={{ zIndex: "var(--z-nav)" }}
      className={`fixed top-0 left-0 right-0 transition-all duration-500 ${
        scrolled ? "glass-nav shadow-sm" : "bg-transparent"
      }`}
    >
      {/* ── Scroll progress indicator ────────────────────────────────────── */}
      <div
        className="absolute top-0 left-0 h-[2px] bg-forest-500 origin-left transition-none pointer-events-none"
        style={{ width: `${progressPct}%`, opacity: scrolled ? 1 : 0 }}
        aria-hidden="true"
      />

      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 transition-all duration-500 ${
          scrolled ? "py-2.5" : "py-4"
        }`}
      >
        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div
            className={`flex items-center justify-center rounded-xl bg-forest-700 text-white shadow-md group-hover:bg-forest-600 transition-all duration-500 ${
              scrolled ? "h-8 w-8" : "h-10 w-10"
            }`}
          >
            <Leaf size={scrolled ? 16 : 20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className={`font-bold tracking-tight transition-all duration-500 ${textColor} ${
                scrolled ? "text-base" : "text-xl"
              }`}
            >
              NaKmetiji
            </span>
            <span
              className={`uppercase tracking-[0.2em] font-medium transition-all duration-500 ${textColorMuted} ${
                scrolled ? "text-[8px]" : "text-[10px]"
              }`}
            >
              Turistične kmetije
            </span>
          </div>
        </Link>

        {/* ── Desktop nav links ─────────────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-all duration-300 relative group ${
                isActive(link.href)
                  ? scrolled ? "text-forest-700" : "text-white"
                  : textColorMuted
              } hover:opacity-100`}
            >
              {link.label}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 rounded-full transition-all duration-300 bg-forest-500 ${
                  isActive(link.href) ? "w-full" : "w-0 group-hover:w-full"
                }`}
              />
            </Link>
          ))}

          {/* Dodaj kmetijo CTA */}
          <Link
            href="/dodaj-kmetijo"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.98] inline-flex items-center gap-1.5 ${
              scrolled
                ? "bg-forest-700 text-white hover:bg-forest-600"
                : "bg-white/90 text-forest-800 hover:bg-white"
            }`}
          >
            <Plus size={14} strokeWidth={2.5} />
            Dodaj kmetijo
          </Link>

          {/* ── Auth block ──────────────────────────────────────────────── */}
          {isPrijavljen ? (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all border ${
                  scrolled
                    ? "border-forest-300 text-forest-800 hover:bg-forest-50"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
              >
                {vloga === "super_admin" ? <Shield size={14} /> : <User size={14} />}
                {vloga === "super_admin" ? "Admin" : "Moj račun"}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-earth-200 overflow-hidden"
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-earth-700 hover:bg-earth-50 transition-colors"
                    >
                      <LayoutDashboard size={16} className="text-forest-600" />
                      Nadzorna plošča
                    </Link>

                    {/* Green Passport shortcut */}
                    <Link
                      href="/moj-potni-list"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <Stamp size={16} className="text-emerald-500" />
                        Zeleni Potni List
                      </span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                        Novo
                      </span>
                    </Link>

                    {vloga === "super_admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                      >
                        <Shield size={16} className="text-purple-600" />
                        Admin plošča
                      </Link>
                    )}

                    <div className="border-t border-earth-100" />
                    <button
                      onClick={handleOdjava}
                      disabled={isPending}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full disabled:opacity-50"
                    >
                      <LogOut size={16} />
                      {isPending ? "Odjavljam..." : "Odjava"}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/prijava"
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 border ${
                  scrolled
                    ? "border-forest-300 text-forest-800 hover:bg-forest-50"
                    : "border-white/30 text-white hover:bg-white/10"
                }`}
              >
                <User size={14} />
                Prijava
              </Link>
              <Link
                href="/registracija"
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.98] ${
                  scrolled
                    ? "bg-forest-700 text-white hover:bg-forest-600"
                    : "bg-white/90 text-forest-800 hover:bg-white"
                }`}
              >
                Registracija
              </Link>
            </div>
          )}
        </div>

        {/* ── Mobile: Passport pill + Hamburger ────────────────────────── */}
        <div className="md:hidden flex items-center gap-2">
          {isPrijavljen && (
            <Link
              href="/moj-potni-list"
              aria-label="Zeleni Potni List"
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition-all ${
                scrolled
                  ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                  : "border-white/20 text-white bg-white/10"
              }`}
            >
              <Stamp size={13} />
              Potni list
            </Link>
          )}
          <button
            className={`p-2 rounded-lg transition-colors ${
              scrolled ? "hover:bg-earth-100" : "hover:bg-white/10"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Zapri meni" : "Odpri meni"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen
              ? <X size={22} className={scrolled ? "text-forest-800" : "text-white"} />
              : <Menu size={22} className={scrolled ? "text-forest-800" : "text-white"} />
            }
          </button>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden"
          >
            <div className="glass mx-4 mb-4 rounded-2xl p-5 shadow-xl">
              {/* Nav links */}
              <div className="flex flex-col gap-0.5 mb-4">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.2 }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center justify-between py-3 px-3 rounded-xl text-sm font-medium transition-colors ${
                        isActive(link.href)
                          ? "bg-forest-50 text-forest-700"
                          : "text-forest-800 hover:bg-forest-50"
                      }`}
                    >
                      {link.label}
                      {isActive(link.href) && (
                        <ChevronRight size={14} className="text-forest-500" />
                      )}
                    </Link>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-earth-100 pt-4 flex flex-col gap-2">
                <Link
                  href="/dodaj-kmetijo"
                  className="rounded-xl bg-forest-700 text-white text-center py-3 font-semibold text-sm hover:bg-forest-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Dodaj kmetijo
                </Link>

                {isPrijavljen ? (
                  <>
                    <Link
                      href="/moj-potni-list"
                      className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-center py-3 font-semibold text-sm hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Stamp size={16} /> Zeleni Potni List
                    </Link>
                    <Link
                      href="/dashboard"
                      className="rounded-xl border border-forest-200 text-forest-800 text-center py-3 font-semibold text-sm hover:bg-forest-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard size={16} /> Nadzorna plošča
                    </Link>
                    {vloga === "super_admin" && (
                      <Link
                        href="/admin"
                        className="rounded-xl border border-purple-200 text-purple-700 text-center py-3 font-semibold text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Shield size={16} /> Admin plošča
                      </Link>
                    )}
                    <button
                      onClick={handleOdjava}
                      disabled={isPending}
                      className="rounded-xl border border-red-200 text-red-500 text-center py-3 font-semibold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <LogOut size={16} />
                      {isPending ? "Odjavljam..." : "Odjava"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/prijava"
                      className="rounded-xl border border-forest-200 text-forest-800 text-center py-3 font-semibold text-sm hover:bg-forest-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <User size={16} /> Prijava
                    </Link>
                    <Link
                      href="/registracija"
                      className="rounded-xl bg-forest-700 text-white text-center py-3 font-semibold text-sm hover:bg-forest-600 transition-colors flex items-center justify-center gap-2"
                    >
                      Registracija
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
