"use client";

// =============================================================================
// NaKmetiji.si — NavbarClient (Handcrafted Luxury Redesign)
//
// Desktop: Floating glassmorphic island (32px radius) centered with spring
//          entrance animation. Shrinks on scroll. Progress bar integrated.
// Mobile:  Bottom-anchored tab bar for thumb reachability + slide-up drawer
//          for expanded menu. No more hamburger at top.
// =============================================================================

import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence, useSpring, useMotionValueEvent, useScroll } from "framer-motion";
import {
  Menu, X, Plus, Search, User, Shield, LayoutDashboard,
  LogOut, Stamp, ChevronRight, Home, Map, BookOpen,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Logo } from "./Logo";

interface Props {
  navLinks: { label: string; href: string }[];
  isPrijavljen: boolean;
  vloga: string | null;
}

// Spring config for lazy, organic entrance
const SPRING_ENTER = { type: "spring" as const, stiffness: 120, damping: 20, mass: 0.8 };

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

  const isActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(href));

  // /zemljevid uses an edge-to-edge app-bar layout instead of the floating pill,
  // so the nav blends with the sidebar + map seams instead of hovering over them.
  const isMapPage = pathname?.startsWith("/zemljevid") ?? false;

  // Mobile bottom nav items
  const mobileNavItems = [
    { label: "Domov", href: "/", icon: Home },
    { label: "Kmetije", href: "/kmetije", icon: Map },
    { label: "Blog", href: "/blog", icon: BookOpen },
    ...(isPrijavljen
      ? [{ label: "Potni list", href: "/moj-potni-list", icon: Stamp }]
      : [{ label: "Prijava", href: "/prijava", icon: User }]),
  ];

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          DESKTOP — Floating Glassmorphic Island
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING_ENTER}
        style={{ zIndex: "var(--z-nav)" }}
        className="fixed top-0 left-0 right-0 hidden md:block"
      >
        {/* Scroll progress indicator */}
        <div
          className="absolute top-0 left-0 h-[2px] bg-forest-500 origin-left pointer-events-none rounded-full"
          style={{ width: `${progressPct}%`, opacity: scrolled ? 0.8 : 0 }}
          aria-hidden="true"
        />

        <div
          className={
            isMapPage
              ? "w-full"
              : `mx-auto max-w-5xl px-4 transition-all duration-700 ${scrolled ? "pt-2" : "pt-4"}`
          }
        >
          <nav
            className={
              isMapPage
                ? "relative flex items-center justify-between px-6 h-[60px] bg-white/85 backdrop-blur-xl border-b border-earth-200/60 shadow-[0_1px_0_rgba(0,0,0,0.03),0_8px_24px_-16px_rgba(45,90,39,0.18)]"
                : `nav-pill flex items-center justify-between gap-3 transition-all duration-500 ${scrolled ? "px-3 py-2" : "px-4 py-2.5"}`
            }
            style={!isMapPage ? {
              background: "linear-gradient(180deg, #1f4d35 0%, #1a3a2a 100%)",
              borderRadius: "999px",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow: "0 12px 36px rgba(15,35,24,0.34), 0 2px 6px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
            } : undefined}
          >
            {/* Search-bubble + logo cluster */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <span
                className={`flex items-center justify-center rounded-full bg-white text-forest-800 shadow-sm transition-all duration-500 ${
                  scrolled ? "h-8 w-8" : "h-9 w-9"
                }`}
                aria-hidden="true"
              >
                <Search size={scrolled ? 13 : 15} strokeWidth={2.5} />
              </span>
              {!isMapPage ? (
                <Logo size={scrolled ? "sm" : "md"} variant="light" href={null} />
              ) : (
                <Logo size="sm" variant="dark" href={null} />
              )}
            </Link>

            {/* Nav links */}
            <div className="flex items-center gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-300 ${
                    isMapPage
                      ? isActive(link.href)
                        ? "text-forest-800 bg-forest-100/60"
                        : "text-forest-700/70 hover:text-forest-800 hover:bg-forest-50/60"
                      : isActive(link.href)
                        ? "text-white bg-white/15"
                        : "text-cream/80 hover:text-white hover:bg-white/10"
                  }`}
                  style={!isMapPage ? { color: isActive(link.href) ? "#fff" : "rgba(244,241,234,0.78)" } : undefined}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Dodaj kmetijo CTA */}
              <Link
                href="/dodaj-kmetijo"
                className="rounded-full px-4 py-2 text-sm font-bold text-white shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 inline-flex items-center gap-1.5"
                style={{ background: "linear-gradient(180deg, #2d8a56 0%, #2D5A27 100%)" }}
              >
                <Plus size={14} strokeWidth={2.8} />
                Dodaj
              </Link>

              {/* Auth block */}
              {isPrijavljen ? (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-all ${
                      isMapPage
                        ? "border border-forest-200/60 text-forest-800 hover:bg-forest-50/60"
                        : "text-cream/90 hover:text-white hover:bg-white/10 border border-white/15"
                    }`}
                  >
                    {vloga === "super_admin" ? <Shield size={14} /> : <User size={14} />}
                    {vloga === "super_admin" ? "Admin" : "Račun"}
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-3 w-56 bg-white rounded-3xl shadow-xl border border-earth-200/60 overflow-hidden"
                      >
                        <Link
                          href="/moj-racun"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-earth-700 hover:bg-earth-50 transition-colors"
                        >
                          <LayoutDashboard size={16} className="text-forest-600" />
                          Moj račun
                        </Link>

                        {vloga === "lastnik" && (
                          <Link
                            href="/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-earth-700 hover:bg-earth-50 transition-colors"
                          >
                            <LayoutDashboard size={16} className="text-forest-600" />
                            Vodstvo kmetije
                          </Link>
                        )}

                        <Link
                          href="/moj-racun?tab=passport"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
                        >
                          <Stamp size={16} className="text-emerald-500" />
                          Zeleni potni list
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
                <div className="flex items-center gap-1.5">
                  <Link
                    href="/prijava"
                    className={`rounded-full px-3 py-2 text-sm font-semibold transition-all duration-300 ${
                      isMapPage
                        ? "text-forest-700 hover:bg-forest-50/60"
                        : "text-cream/85 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    Prijava
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE — Bottom-Anchored Tab Navigation
          ══════════════════════════════════════════════════════════════════════ */}

      {/* Top bar — minimal: logo + expand button */}
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING_ENTER}
        style={{ zIndex: "var(--z-nav)" }}
        className={`fixed top-0 left-0 right-0 md:hidden transition-all duration-500 ${
          scrolled ? "glass-nav shadow-sm" : "bg-transparent"
        }`}
      >
        <nav className="flex items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-white text-forest-800 shadow-sm">
              <Search size={14} strokeWidth={2.5} />
            </span>
            <Logo size="sm" variant={scrolled ? "dark" : "light"} href={null} />
          </Link>

          <button
            className={`p-2 rounded-2xl transition-colors ${
              scrolled ? "hover:bg-earth-100 text-forest-800" : "hover:bg-white/10 text-white"
            }`}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Zapri meni" : "Odpri meni"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
      </motion.header>

      {/* Bottom tab bar */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden mobile-bottom-nav"
        style={{ zIndex: "var(--z-nav)" }}
      >
        <div className="flex items-center justify-around px-2 pt-1 pb-[env(safe-area-inset-bottom)]">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 min-h-[44px] min-w-[44px] px-3 py-2 rounded-2xl transition-all duration-300 ${
                  active
                    ? "text-forest-700"
                    : "text-earth-500 hover:text-forest-600"
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all duration-300 ${
                  active ? "bg-forest-100" : ""
                }`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Mobile expanded drawer ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="mobile-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm md:hidden"
              style={{ zIndex: 39 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="mobile-drawer"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={SPRING_ENTER}
              className="fixed top-16 left-4 right-4 md:hidden glass-island p-5 shadow-2xl"
              style={{ zIndex: "var(--z-nav)" }}
            >
              {/* Nav links */}
              <div className="flex flex-col gap-0.5 mb-4">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, ...SPRING_ENTER }}
                  >
                    <Link
                      href={link.href}
                      className={`flex items-center justify-between py-3 px-3 rounded-2xl text-sm font-medium transition-colors ${
                        isActive(link.href)
                          ? "bg-forest-100/60 text-forest-700"
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
                  className="rounded-2xl bg-forest-700 text-white text-center py-3 font-semibold text-sm hover:bg-forest-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Dodaj kmetijo
                </Link>

                {isPrijavljen ? (
                  <>
                    <Link
                      href="/moj-racun"
                      className="rounded-2xl border border-forest-200 text-forest-800 text-center py-3 font-semibold text-sm hover:bg-forest-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard size={16} /> Moj račun
                    </Link>
                    {vloga === "lastnik" && (
                      <Link
                        href="/dashboard"
                        className="rounded-2xl border border-forest-200 text-forest-800 text-center py-3 font-semibold text-sm hover:bg-forest-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <LayoutDashboard size={16} /> Vodstvo kmetije
                      </Link>
                    )}
                    <Link
                      href="/moj-racun?tab=passport"
                      className="rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-center py-3 font-semibold text-sm hover:bg-emerald-100 transition-colors flex items-center justify-center gap-2"
                    >
                      <Stamp size={16} /> Zeleni potni list
                    </Link>
                    {vloga === "super_admin" && (
                      <Link
                        href="/admin"
                        className="rounded-2xl border border-purple-200 text-purple-700 text-center py-3 font-semibold text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Shield size={16} /> Admin plošča
                      </Link>
                    )}
                    <button
                      onClick={handleOdjava}
                      disabled={isPending}
                      className="rounded-2xl border border-red-200 text-red-500 text-center py-3 font-semibold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <LogOut size={16} />
                      {isPending ? "Odjavljam..." : "Odjava"}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/prijava"
                      className="rounded-2xl border border-forest-200 text-forest-800 text-center py-3 font-semibold text-sm hover:bg-forest-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <User size={16} /> Prijava
                    </Link>
                    <Link
                      href="/registracija"
                      className="rounded-2xl bg-forest-700 text-white text-center py-3 font-semibold text-sm hover:bg-forest-600 transition-colors flex items-center justify-center gap-2"
                    >
                      Registracija
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
