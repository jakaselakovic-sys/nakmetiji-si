"use client";

import Link from "next/link";
import { useState, useEffect, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Plus, Leaf, User, Shield, LayoutDashboard, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase/client";

interface Props {
  navLinks: { label: string; href: string }[];
  isPrijavljen: boolean;
  vloga: string | null;
}

export function NavbarClient({ navLinks, isPrijavljen, vloga }: Props) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Zapri user menu ob kliku zunaj
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [userMenuOpen]);

  function handleOdjava() {
    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    });
  }

  const textColor = scrolled ? "text-forest-800" : "text-white";
  const textColorMuted = scrolled ? "text-forest-800/70" : "text-white/80";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "glass-nav" : "bg-transparent"}`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white shadow-md group-hover:bg-forest-600 transition-colors">
            <Leaf size={20} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col">
            <span className={`text-xl font-bold tracking-tight transition-colors duration-500 ${textColor}`}>
              NaKmetiji
            </span>
            <span className={`text-[10px] uppercase tracking-[0.2em] font-medium transition-colors duration-500 ${textColorMuted}`}>
              Turistične kmetije
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-all duration-300 relative group ${textColorMuted} hover:opacity-100`}
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-forest-500 transition-all duration-300 group-hover:w-full rounded-full" />
            </Link>
          ))}

          {/* Dodaj kmetijo */}
          <Link
            href="/dodaj-kmetijo"
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] inline-flex items-center gap-1.5 ${
              scrolled ? "bg-forest-700 text-white hover:bg-forest-600" : "bg-white text-forest-800 hover:bg-forest-50"
            }`}
          >
            <Plus size={15} strokeWidth={2.5} />
            Dodaj kmetijo
          </Link>

          {/* Auth */}
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
                {vloga === "super_admin" ? <Shield size={15} /> : <User size={15} />}
                {vloga === "super_admin" ? "Admin" : "Moj račun"}
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-earth-200 overflow-hidden"
                  >
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-earth-700 hover:bg-earth-50 transition-colors"
                    >
                      <LayoutDashboard size={16} className="text-forest-600" />
                      Nadzorna plošča
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
                      {isPending ? "Odjava..." : "Odjava"}
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
                <User size={15} />
                Prijava
              </Link>
              <Link
                href="/registracija"
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] ${
                  scrolled
                    ? "bg-forest-700 text-white hover:bg-forest-600"
                    : "bg-white text-forest-800 hover:bg-forest-50"
                }`}
              >
                Registracija
              </Link>
            </div>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={`md:hidden p-2 rounded-lg transition-colors ${scrolled ? "hover:bg-earth-100" : "hover:bg-white/10"}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Zapri meni" : "Odpri meni"}
        >
          {mobileOpen
            ? <X size={24} className={scrolled ? "text-forest-800" : "text-white"} />
            : <Menu size={24} className={scrolled ? "text-forest-800" : "text-white"} />
          }
        </button>
      </nav>

      {/* Mobile menu */}
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
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
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

              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/dodaj-kmetijo"
                  className="rounded-xl bg-forest-700 text-white text-center py-3 font-semibold text-sm hover:bg-forest-600 transition-colors flex items-center justify-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <Plus size={16} /> Dodaj kmetijo
                </Link>

                {isPrijavljen ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="rounded-xl border border-forest-300 text-forest-800 text-center py-3 font-semibold text-sm hover:bg-forest-50 transition-colors flex items-center justify-center gap-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      <LayoutDashboard size={16} /> Nadzorna plošča
                    </Link>
                    {vloga === "super_admin" && (
                      <Link
                        href="/admin"
                        className="rounded-xl border border-purple-300 text-purple-700 text-center py-3 font-semibold text-sm hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Shield size={16} /> Admin plošča
                      </Link>
                    )}
                    <button
                      onClick={handleOdjava}
                      className="rounded-xl border border-red-300 text-red-500 text-center py-3 font-semibold text-sm hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <LogOut size={16} /> Odjava
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/prijava"
                      className="rounded-xl border border-forest-300 text-forest-800 text-center py-3 font-semibold text-sm hover:bg-forest-50 transition-colors flex items-center justify-center gap-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      <User size={16} /> Prijava
                    </Link>
                    <Link
                      href="/registracija"
                      className="rounded-xl bg-forest-700 text-white text-center py-3 font-semibold text-sm hover:bg-forest-600 transition-colors flex items-center justify-center gap-2"
                      onClick={() => setMobileOpen(false)}
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
