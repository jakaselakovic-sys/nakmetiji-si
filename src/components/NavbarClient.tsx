"use client";

import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence, useSpring, useMotionValueEvent, useScroll } from "framer-motion";
import {
  Menu, X, Plus, User, Shield, LayoutDashboard,
  LogOut, Stamp, Leaf, TreePine, Map, BookOpen,
  Home, Sprout, Mountain,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Logo } from "./Logo";

interface Props {
  navLinks: { label: string; href: string }[];
  isPrijavljen: boolean;
  vloga: string | null;
}

const SPRING_ENTER = { type: "spring" as const, stiffness: 120, damping: 20, mass: 0.8 };

// Nature icon per nav link
const NAV_ICONS: Record<string, React.ElementType> = {
  "/":          Home,
  "/kmetije":   TreePine,
  "/zemljevid": Map,
  "/paketi":    Sprout,
  "/blog":      BookOpen,
  "/o-nas":     Leaf,
};

export function NavbarClient({ navLinks, isPrijavljen, vloga }: Props) {
  const router   = useRouter();
  const pathname = usePathname();

  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPending,    startTransition] = useTransition();

  const { scrollYProgress } = useScroll();
  const progressSpring = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  const [progressPct, setProgressPct] = useState(0);
  useMotionValueEvent(progressSpring, "change", (v) => setProgressPct(Math.round(v * 100)));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);

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

  const isMapPage = pathname?.startsWith("/zemljevid") ?? false;

  const mobileTabs = [
    { label: "Domov",    href: "/",          icon: Leaf },
    { label: "Kmetije",  href: "/kmetije",   icon: TreePine },
    { label: "Zemljevid",href: "/zemljevid", icon: Mountain },
    ...(isPrijavljen
      ? [{ label: "Račun",   href: "/moj-racun",      icon: User }]
      : [{ label: "Prijava", href: "/prijava",          icon: User }]),
  ];

  return (
    <>
      {/* ══════════════════════════════════════════════════════════════════════
          DESKTOP — Floating Nature Pill
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -44, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING_ENTER}
        style={{ zIndex: "var(--z-nav)" }}
        className="fixed top-0 left-0 right-0 hidden md:block"
      >
        {/* Scroll progress — bark→gold gradient */}
        <div
          className="absolute top-0 left-0 h-[2px] origin-left pointer-events-none"
          style={{
            width: `${progressPct}%`,
            opacity: scrolled ? 1 : 0,
            background: "linear-gradient(90deg, #6b3f24, #a67c5b, #D4AF37)",
            transition: "opacity 0.3s ease",
          }}
          aria-hidden="true"
        />

        <div className={
          isMapPage
            ? "w-full"
            : `mx-auto max-w-5xl px-4 transition-all duration-700 ${scrolled ? "pt-2" : "pt-4"}`
        }>
          <nav
            aria-label="Glavna navigacija"
            className={
              isMapPage
                ? "relative flex items-center justify-between px-6 h-[60px] bg-white/90 backdrop-blur-xl border-b border-earth-200/50"
                : `flex items-center justify-between gap-3 transition-all duration-500 ${scrolled ? "px-4 py-2" : "px-5 py-2.5"}`
            }
            style={!isMapPage ? {
              background: "rgba(247, 244, 238, 0.95)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              borderRadius: "999px",
              border: "1px solid rgba(166, 124, 91, 0.22)",
              boxShadow: scrolled
                ? "0 6px 32px rgba(106,63,36,0.14), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.95)"
                : "0 2px 16px rgba(106,63,36,0.08), 0 1px 4px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.95)",
              transition: "box-shadow 0.4s ease",
            } : undefined}
          >
            {/* Logo — čist, brez ikone */}
            <Link href="/" className="flex-shrink-0" aria-label="NaKmetiji — domača stran">
              <Logo size={scrolled ? "sm" : "md"} variant="dark" href={null} />
            </Link>

            {/* Separator */}
            {!isMapPage && (
              <div className="h-4 w-px bg-bark-200/70 flex-shrink-0" aria-hidden="true" />
            )}

            {/* Nav links */}
            <div className="flex items-center gap-0.5 flex-1">
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200 ${
                      isMapPage
                        ? active
                          ? "text-forest-800 bg-forest-100/60"
                          : "text-forest-700/70 hover:text-forest-800 hover:bg-forest-50/60"
                        : active
                          ? "bg-bark-100/90 text-bark-800"
                          : "text-earth-700/75 hover:text-earth-900 hover:bg-bark-50/90"
                    }`}
                  >
                    {link.label}
                    {/* Active dot */}
                    {!isMapPage && active && (
                      <span
                        className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-bark-500"
                        aria-hidden="true"
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right: CTA + Auth */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Dodaj kmetijo — forest green, ne zlata */}
              <Link
                href="/dodaj-kmetijo"
                className="relative overflow-hidden rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm hover:shadow-md hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 inline-flex items-center gap-1.5"
                style={{ background: "linear-gradient(135deg, #2D5A27 0%, #38a169 100%)" }}
              >
                <span
                  className="absolute inset-0 pointer-events-none animate-shimmer rounded-full"
                  style={{
                    backgroundImage: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.12) 50%, transparent 80%)",
                    backgroundSize: "200% 100%",
                  }}
                  aria-hidden="true"
                />
                <Plus size={13} strokeWidth={2.8} className="relative" />
                <span className="relative">Dodaj</span>
              </Link>

              {/* Auth */}
              {isPrijavljen ? (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setUserMenuOpen(!userMenuOpen); }}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                    className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold border transition-all duration-200 ${
                      isMapPage
                        ? "border-forest-200/60 text-forest-800 hover:bg-forest-50/60"
                        : "text-earth-700/80 hover:text-earth-900 hover:bg-bark-50 border-bark-200/60"
                    }`}
                  >
                    {vloga === "super_admin"
                      ? <Shield size={14} className="text-bark-600" />
                      : <User size={14} className="text-bark-500" />}
                    <span>{vloga === "super_admin" ? "Admin" : "Račun"}</span>
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.16, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-full mt-2.5 w-56 rounded-3xl overflow-hidden"
                        style={{
                          background: "#FDFBF7",
                          border: "1px solid rgba(166, 124, 91, 0.18)",
                          boxShadow: "0 16px 48px rgba(106,63,36,0.16), 0 4px 12px rgba(0,0,0,0.08)",
                        }}
                      >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-bark-100/80">
                          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-bark-400">Moj račun</p>
                        </div>

                        <div className="py-1.5">
                          <Link
                            href="/moj-racun"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-earth-700 hover:bg-bark-50 transition-colors"
                          >
                            <User size={15} className="text-bark-500" />
                            Pregled računa
                          </Link>

                          {vloga === "lastnik" && (
                            <Link
                              href="/dashboard"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-earth-700 hover:bg-bark-50 transition-colors"
                            >
                              <LayoutDashboard size={15} className="text-forest-600" />
                              Vodstvo kmetije
                            </Link>
                          )}

                          <Link
                            href="/moj-racun?tab=passport"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-forest-700 hover:bg-forest-50 transition-colors"
                          >
                            <Stamp size={15} className="text-forest-500" />
                            Zeleni potni list
                          </Link>

                          {vloga === "super_admin" && (
                            <Link
                              href="/admin"
                              onClick={() => setUserMenuOpen(false)}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-purple-700 hover:bg-purple-50 transition-colors"
                            >
                              <Shield size={15} className="text-purple-500" />
                              Admin plošča
                            </Link>
                          )}
                        </div>

                        <div className="border-t border-bark-100/80" />
                        <button
                          onClick={handleOdjava}
                          disabled={isPending}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full disabled:opacity-50"
                        >
                          <LogOut size={15} />
                          {isPending ? "Odjavljam..." : "Odjava"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/prijava"
                  className={`rounded-full px-3 py-2 text-sm font-semibold transition-all duration-200 border ${
                    isMapPage
                      ? "text-forest-700 border-transparent hover:bg-forest-50/60"
                      : "text-earth-700 border-bark-200/60 hover:bg-bark-50 hover:text-earth-900"
                  }`}
                >
                  Prijava
                </Link>
              )}
            </div>
          </nav>
        </div>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE — Top bar: logo + user/menu
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING_ENTER}
        style={{ zIndex: "var(--z-nav)" }}
        className="fixed top-0 left-0 right-0 md:hidden glass-nav"
      >
        <nav className="flex items-center justify-between px-4 h-14">
          <Logo size="sm" variant="dark" href="/" />

          <div className="flex items-center gap-1.5">
            {isPrijavljen ? (
              <Link
                href="/moj-racun"
                className="flex items-center justify-center h-9 w-9 rounded-full bg-bark-100/80 text-bark-700 hover:bg-bark-200/80 transition-colors"
                aria-label="Moj račun"
              >
                {vloga === "super_admin" ? <Shield size={15} /> : <User size={15} />}
              </Link>
            ) : (
              <Link
                href="/prijava"
                className="rounded-full px-3.5 py-1.5 text-xs font-bold text-white transition-colors"
                style={{ background: "linear-gradient(135deg, #2D5A27, #38a169)" }}
              >
                Prijava
              </Link>
            )}
            <button
              className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-bark-100/80 text-earth-700 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Zapri meni" : "Odpri meni"}
              aria-expanded={mobileOpen}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={mobileOpen ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center"
                >
                  {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </nav>
      </motion.header>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE — Bottom Tab Bar
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="fixed bottom-0 left-0 right-0 md:hidden mobile-bottom-nav"
        style={{ zIndex: "var(--z-nav)" }}
      >
        <div className="flex items-stretch justify-around px-1 pt-1.5 pb-[max(10px,env(safe-area-inset-bottom))]">
          {mobileTabs.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-1 flex-1 py-1 min-h-[52px] transition-all duration-200"
              >
                {/* Icon pill */}
                <div className={`flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-250 ${
                  active ? "bg-bark-100/90" : "bg-transparent"
                }`}>
                  <Icon
                    size={active ? 22 : 20}
                    strokeWidth={active ? 2.2 : 1.7}
                    className={`transition-colors duration-200 ${active ? "text-bark-700" : "text-earth-400"}`}
                  />
                </div>
                {/* Label */}
                <span className={`text-[10px] font-semibold leading-none tracking-tight transition-colors duration-200 ${
                  active ? "text-bark-700" : "text-earth-400"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MOBILE — Slide-down drawer
          ══════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/35 backdrop-blur-sm md:hidden"
              style={{ zIndex: 39 }}
              onClick={() => setMobileOpen(false)}
            />

            <motion.aside
              key="drawer"
              initial={{ opacity: 0, y: -12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={SPRING_ENTER}
              className="fixed top-16 left-3 right-3 md:hidden rounded-3xl overflow-hidden"
              style={{
                zIndex: "var(--z-nav)",
                background: "rgba(253, 251, 247, 0.97)",
                backdropFilter: "blur(28px) saturate(160%)",
                WebkitBackdropFilter: "blur(28px) saturate(160%)",
                border: "1px solid rgba(166, 124, 91, 0.18)",
                boxShadow: "0 24px 64px rgba(106,63,36,0.18), 0 8px 24px rgba(0,0,0,0.08)",
              }}
            >
              {/* Sekcija: Odkrivaj */}
              <div className="p-3 pb-2">
                <p className="px-3 pt-2 pb-2 text-[9px] font-bold uppercase tracking-[0.22em] text-bark-400/80">
                  Odkrivaj
                </p>
                <div className="flex flex-col gap-0.5">
                  {navLinks.map((link, i) => {
                    const Icon = NAV_ICONS[link.href] ?? Leaf;
                    const active = isActive(link.href);
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.035, ...SPRING_ENTER }}
                      >
                        <Link
                          href={link.href}
                          className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl text-sm font-medium transition-all duration-200 ${
                            active
                              ? "bg-bark-100/90 text-bark-800"
                              : "text-earth-800 hover:bg-bark-50/80"
                          }`}
                        >
                          <Icon
                            size={16}
                            strokeWidth={active ? 2.2 : 1.8}
                            className={active ? "text-bark-600" : "text-earth-400"}
                          />
                          <span className="flex-1">{link.label}</span>
                          {active && (
                            <span className="w-1.5 h-1.5 rounded-full bg-bark-500 flex-shrink-0" />
                          )}
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-3 border-t border-bark-100/70" />

              {/* Sekcija: Akcije */}
              <div className="p-3 pt-2 flex flex-col gap-2">
                <Link
                  href="/dodaj-kmetijo"
                  className="rounded-2xl flex items-center justify-center gap-2 py-3 text-sm font-bold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #2D5A27, #38a169)" }}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  Dodaj kmetijo
                </Link>

                {isPrijavljen ? (
                  <>
                    <Link
                      href="/moj-racun?tab=passport"
                      className="rounded-2xl border border-forest-200/80 text-forest-700 text-center py-2.5 text-sm font-semibold hover:bg-forest-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <Stamp size={15} /> Zeleni potni list
                    </Link>

                    {vloga === "lastnik" && (
                      <Link
                        href="/dashboard"
                        className="rounded-2xl border border-bark-200/80 text-bark-700 text-center py-2.5 text-sm font-semibold hover:bg-bark-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <LayoutDashboard size={15} /> Vodstvo kmetije
                      </Link>
                    )}

                    {vloga === "super_admin" && (
                      <Link
                        href="/admin"
                        className="rounded-2xl border border-purple-200 text-purple-700 text-center py-2.5 text-sm font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <Shield size={15} /> Admin plošča
                      </Link>
                    )}

                    <button
                      onClick={handleOdjava}
                      disabled={isPending}
                      className="rounded-2xl border border-red-200/80 text-red-500 text-center py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 w-full"
                    >
                      <LogOut size={15} />
                      {isPending ? "Odjavljam..." : "Odjava"}
                    </button>
                  </>
                ) : (
                  <Link
                    href="/registracija"
                    className="rounded-2xl border border-bark-200/80 text-bark-700 text-center py-2.5 text-sm font-semibold hover:bg-bark-50 transition-colors"
                  >
                    Registracija
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
