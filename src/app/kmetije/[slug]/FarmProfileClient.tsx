"use client";

// =============================================================================
// NaKmetiji.si — FarmProfileClient
// Stran posamezne kmetije z:
//   1. Lightbox galerija slik
//   2. Digitalna tržnica (izdelki)
//   3. Komentarji z AI prevajanjem
//   4. Booking Calendar
//   5. SEO Schema.org (handled in page.tsx)
// =============================================================================

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  ShoppingBag,
  Plus,
  Minus,
  MessageSquare,
  Globe,
  CalendarDays,
  Users,
  Send,
  Check,
  Loader2,
  Phone,
  Mail,
  ExternalLink,
  Camera,
} from "lucide-react";
import { REGIJA_LABELS, IZDELEK_KATEGORIJA_LABELS } from "@/types/database";
import type { Kmetija, Dozivetje, Mnenje, Izdelek } from "@/types/database";
import { EXPERIENCE_LABELS } from "@/types/farm";
import type { ExperienceTag } from "@/types/farm";

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  kmetija: Kmetija & {
    dozivetja: Dozivetje[];
    mnenja: Mnenje[];
    izdelki: Izdelek[];
  };
  regionLabel: string;
}

// ─── Experience icons ───────────────────────────────────────────────────────

const EXPERIENCE_ICONS: Record<string, string> = {
  vino: "🍷", prenocisce: "🛏️", druzine: "👨‍👩‍👧‍👦", kulinarika: "🍽️",
  wellness: "🧖", sport: "🏔️", zivali: "🐄", delavnice: "🎨",
  ekologija: "🌿", prireditve: "🎉",
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function FarmProfileClient({ kmetija, regionLabel }: Props) {
  // ── Lightbox state ──
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // ── Inquiry basket state ──
  const [inquiryItems, setInquiryItems] = useState<Record<string, number>>({});

  // ── Booking calendar state ──
  const [bookingFrom, setBookingFrom] = useState("");
  const [bookingTo, setBookingTo] = useState("");
  const [bookingGuests, setBookingGuests] = useState(2);
  const [bookingName, setBookingName] = useState("");
  const [bookingEmail, setBookingEmail] = useState("");
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  // ── Comment translation state ──
  const [translatedComments, setTranslatedComments] = useState<Record<string, string>>({});
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  const allImages = [kmetija.naslovna_slika, ...kmetija.slike];

  // ── Inquiry item helpers ──
  const addToInquiry = (id: string) => {
    setInquiryItems((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };
  const removeFromInquiry = (id: string) => {
    setInquiryItems((prev) => {
      const next = { ...prev };
      if (next[id] > 1) next[id]--;
      else delete next[id];
      return next;
    });
  };
  const inquiryCount = Object.values(inquiryItems).reduce((a, b) => a + b, 0);

  // ── Mock AI translation ──
  const handleTranslate = async (mnenje: Mnenje) => {
    setTranslatingId(mnenje.id);
    // Simulate DeepL API call
    await new Promise((r) => setTimeout(r, 1200));
    // Simple mock translation (in production: call DeepL API)
    const mockTranslation = `[EN] ${mnenje.komentar}`;
    setTranslatedComments((prev) => ({ ...prev, [mnenje.id]: mockTranslation }));
    setTranslatingId(null);
  };

  // ── Booking submit ──
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSubmitted(true);
    setTimeout(() => setBookingSubmitted(false), 4000);
  };

  // ── Lightbox keyboard nav ──
  const handleLightboxKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft" && lightboxIndex > 0) setLightboxIndex((i) => i - 1);
    if (e.key === "ArrowRight" && lightboxIndex < allImages.length - 1) setLightboxIndex((i) => i + 1);
    if (e.key === "Escape") setLightboxOpen(false);
  };

  // Today's date for min-date
  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO — Cover photo
          ═══════════════════════════════════════════════════════════════════ */}
      <section id="farm-hero" className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] lg:h-[65vh] overflow-hidden">
        <Image
          src={kmetija.naslovna_slika}
          alt={kmetija.ime}
          fill
          sizes="100vw"
          className="object-cover"
          priority
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />

        {/* Gallery button */}
        <button
          onClick={() => { setLightboxIndex(0); setLightboxOpen(true); }}
          className="absolute bottom-6 right-6 z-10 flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/30 transition-all"
        >
          <Camera size={18} />
          Vse slike ({allImages.length})
        </button>

        {/* Bottom info bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
            <nav className="mb-4 flex items-center gap-2 text-sm text-white/60">
              <Link href="/" className="hover:text-white transition-colors">Domov</Link>
              <ChevronRight size={12} />
              <Link href="/kmetije" className="hover:text-white transition-colors">Kmetije</Link>
              <ChevronRight size={12} />
              <span className="text-white/80">{kmetija.ime}</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                {kmetija.premium && (
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-gold-500/90 backdrop-blur-sm px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg mb-3">
                    <Star size={14} fill="currentColor" />
                    Izpostavljena kmetija
                  </div>
                )}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
                  {kmetija.ime}
                </h1>
                <div className="mt-2 flex items-center gap-3 text-white/70 text-sm">
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    {regionLabel}{kmetija.obcina && `, ${kmetija.obcina}`}
                  </span>
                </div>
              </div>

              {kmetija.ocena && (
                <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={18} className={s <= Math.round(kmetija.ocena!) ? "text-gold-500 fill-gold-500" : "text-white/20"} />
                    ))}
                  </div>
                  <div className="text-white">
                    <span className="text-xl font-bold">{kmetija.ocena.toFixed(1)}</span>
                    <span className="text-sm text-white/50 ml-1">({kmetija.stevilo_ocen})</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          GALLERY STRIP
          ═══════════════════════════════════════════════════════════════════ */}
      {kmetija.slike.length > 0 && (
        <section className="bg-white border-b border-earth-200/60">
          <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  onClick={() => { setLightboxIndex(i); setLightboxOpen(true); }}
                  className="group relative flex-shrink-0 rounded-xl overflow-hidden h-20 w-28 sm:h-24 sm:w-36 hover:ring-2 hover:ring-forest-400 hover:ring-offset-2 transition-all duration-300"
                >
                  <Image
                    src={url}
                    alt={`${kmetija.ime} - slika ${i + 1}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="144px"
                  />
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          MAIN CONTENT + SIDEBAR
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8 lg:py-14">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          {/* ── Left: Main content ── */}
          <div className="flex-1 min-w-0">
            {/* Quick info pills */}
            <div className="flex flex-wrap gap-3 mb-8">
              <div className="flex items-center gap-2 rounded-full bg-forest-50 border border-forest-200/60 px-4 py-2 text-sm font-medium text-forest-700">
                <Star size={14} className="text-gold-500 fill-gold-500" />
                {kmetija.ocena?.toFixed(1)} ({kmetija.stevilo_ocen} ocen)
              </div>
              <div className="flex items-center gap-2 rounded-full bg-earth-100 border border-earth-200/60 px-4 py-2 text-sm font-medium text-earth-700">
                📍 {regionLabel}
              </div>
              {kmetija.naslov && (
                <div className="flex items-center gap-2 rounded-full bg-earth-100 border border-earth-200/60 px-4 py-2 text-sm font-medium text-earth-700">
                  🏠 {kmetija.naslov}, {kmetija.postna_stevilka} {kmetija.obcina}
                </div>
              )}
            </div>

            {/* Tagline */}
            {kmetija.kratki_opis && (
              <p className="text-xl sm:text-2xl font-semibold text-forest-800 italic leading-relaxed mb-6 pl-4 border-l-4 border-forest-400">
                &ldquo;{kmetija.kratki_opis}&rdquo;
              </p>
            )}

            {/* ── Description ── */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-forest-900 mb-4">O kmetiji</h2>
              <div className="prose prose-lg max-w-none text-earth-700 leading-relaxed">
                {kmetija.opis.split("\n\n").map((p, i) => (
                  <p key={i} className="mb-4 last:mb-0">{p}</p>
                ))}
              </div>
            </div>

            {/* ── Experiences ── */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-forest-900 mb-6">Doživetja in ponudba</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {kmetija.dozivetja.map((doz) => (
                  <div key={doz.id} className="group flex items-start gap-4 rounded-2xl bg-white border border-earth-200/60 p-5 shadow-sm hover:shadow-md hover:border-forest-200 hover:-translate-y-0.5 transition-all duration-300">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-forest-50 text-2xl group-hover:bg-forest-100 group-hover:scale-110 transition-all duration-300">
                      {EXPERIENCE_ICONS[doz.slug] || "🌾"}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-forest-900">{doz.ime}</h3>
                      {doz.opis && <p className="mt-1 text-sm text-earth-600 leading-relaxed">{doz.opis}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ═════════════════════════════════════════════════════════════
                2. DIGITALNA TRŽNICA (Products)
                ═════════════════════════════════════════════════════════════ */}
            {kmetija.izdelki.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-forest-900 flex items-center gap-2">
                    <ShoppingBag size={24} className="text-forest-600" />
                    Digitalna tržnica
                  </h2>
                  {inquiryCount > 0 && (
                    <div className="flex items-center gap-2 rounded-full bg-forest-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
                      <ShoppingBag size={16} />
                      {inquiryCount} {inquiryCount === 1 ? "izdelek" : inquiryCount < 5 ? "izdelki" : "izdelkov"}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {kmetija.izdelki.map((izdelek) => {
                    const qty = inquiryItems[izdelek.id] || 0;
                    return (
                      <div key={izdelek.id} className="group rounded-2xl bg-white border border-earth-200/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                        {/* Product image */}
                        <div className="relative h-36 bg-earth-100 overflow-hidden">
                          {izdelek.slika_url ? (
                            <Image
                              src={izdelek.slika_url}
                              alt={izdelek.ime}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 100vw, 33vw"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-4xl text-earth-300">
                              🧺
                            </div>
                          )}
                          {/* Category badge */}
                          <div className="absolute top-2 left-2 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold text-forest-700 uppercase tracking-wider">
                            {IZDELEK_KATEGORIJA_LABELS[izdelek.kategorija]}
                          </div>
                        </div>

                        {/* Product info */}
                        <div className="p-4">
                          <h3 className="font-bold text-forest-900 mb-1 line-clamp-1">{izdelek.ime}</h3>
                          {izdelek.opis && (
                            <p className="text-xs text-earth-600 mb-3 line-clamp-2">{izdelek.opis}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-lg font-bold text-forest-800">{izdelek.cena.toFixed(2)} €</span>
                              <span className="text-xs text-earth-500 ml-1">/ {izdelek.enota}</span>
                            </div>

                            {/* Add/remove buttons */}
                            {qty === 0 ? (
                              <button
                                onClick={() => addToInquiry(izdelek.id)}
                                className="flex items-center gap-1.5 rounded-lg bg-forest-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-forest-500 active:scale-95 transition-all"
                              >
                                <Plus size={14} />
                                Povpraševanje
                              </button>
                            ) : (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => removeFromInquiry(izdelek.id)}
                                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-earth-100 text-earth-600 hover:bg-red-100 hover:text-red-600 transition-colors"
                                >
                                  <Minus size={14} />
                                </button>
                                <span className="text-sm font-bold text-forest-800 w-5 text-center">{qty}</span>
                                <button
                                  onClick={() => addToInquiry(izdelek.id)}
                                  className="flex items-center justify-center w-7 h-7 rounded-lg bg-forest-100 text-forest-700 hover:bg-forest-200 transition-colors"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Inquiry summary */}
                {inquiryCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 rounded-2xl bg-forest-50 border border-forest-200 p-5"
                  >
                    <h4 className="font-bold text-forest-900 mb-3">Vaše povpraševanje</h4>
                    <ul className="space-y-2 mb-4">
                      {Object.entries(inquiryItems).map(([id, qty]) => {
                        const item = kmetija.izdelki.find((i) => i.id === id);
                        if (!item) return null;
                        return (
                          <li key={id} className="flex items-center justify-between text-sm">
                            <span className="text-forest-800">{qty}× {item.ime}</span>
                            <span className="font-semibold text-forest-900">{(item.cena * qty).toFixed(2)} €</span>
                          </li>
                        );
                      })}
                    </ul>
                    <div className="flex items-center justify-between pt-3 border-t border-forest-200">
                      <span className="font-bold text-forest-900">Skupaj (orientacijska cena)</span>
                      <span className="text-lg font-bold text-forest-800">
                        {Object.entries(inquiryItems).reduce((sum, [id, qty]) => {
                          const item = kmetija.izdelki.find((i) => i.id === id);
                          return sum + (item ? item.cena * qty : 0);
                        }, 0).toFixed(2)} €
                      </span>
                    </div>
                    <button className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-forest-700 text-white font-semibold py-3 text-sm hover:bg-forest-600 transition-colors">
                      <Send size={16} />
                      Pošlji povpraševanje kmetiji
                    </button>
                  </motion.div>
                )}
              </div>
            )}

            {/* ═════════════════════════════════════════════════════════════
                3. MNENJA / KOMENTARJI z AI prevajanjem
                ═════════════════════════════════════════════════════════════ */}
            {kmetija.mnenja.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-forest-900 mb-6 flex items-center gap-2">
                  <MessageSquare size={24} className="text-forest-600" />
                  Mnenja gostov ({kmetija.mnenja.length})
                </h2>
                <div className="space-y-4">
                  {kmetija.mnenja.map((mnenje) => (
                    <div key={mnenje.id} className="rounded-2xl bg-white border border-earth-200/60 p-5 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-100 text-forest-700 font-bold text-sm">
                            {mnenje.uporabnik_ime.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <span className="font-semibold text-forest-900 text-sm">{mnenje.uporabnik_ime}</span>
                            <div className="flex items-center gap-1 mt-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} size={12} className={s <= mnenje.ocena ? "text-gold-500 fill-gold-500" : "text-earth-300"} />
                              ))}
                              <span className="text-xs text-earth-400 ml-1">
                                {new Date(mnenje.datum).toLocaleDateString("sl-SI")}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Translate button */}
                        <button
                          onClick={() => handleTranslate(mnenje)}
                          disabled={translatingId === mnenje.id || !!translatedComments[mnenje.id]}
                          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                            translatedComments[mnenje.id]
                              ? "bg-forest-50 text-forest-600 cursor-default"
                              : "bg-earth-100 text-earth-600 hover:bg-forest-100 hover:text-forest-700"
                          }`}
                        >
                          {translatingId === mnenje.id ? (
                            <><Loader2 size={12} className="animate-spin" /> Prevajam...</>
                          ) : translatedComments[mnenje.id] ? (
                            <><Check size={12} /> Prevedeno</>
                          ) : (
                            <><Globe size={12} /> Prevedi</>
                          )}
                        </button>
                      </div>

                      {/* Comment text */}
                      <p className="text-sm text-earth-700 leading-relaxed">{mnenje.komentar}</p>

                      {/* Translated text */}
                      <AnimatePresence>
                        {translatedComments[mnenje.id] && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-earth-100"
                          >
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold text-forest-600 uppercase tracking-wider mb-1.5">
                              <Globe size={10} />
                              English (AI translation)
                            </div>
                            <p className="text-sm text-earth-600 leading-relaxed italic">
                              {translatedComments[mnenje.id]}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Location ── */}
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-forest-900 mb-4 flex items-center gap-2">
                <MapPin size={24} className="text-forest-600" />
                Lokacija
              </h2>
              <div className="rounded-2xl overflow-hidden border border-earth-200/60 shadow-sm">
                <div className="relative h-64 bg-earth-100">
                  {kmetija.lat && kmetija.lng ? (
                    <iframe
                      title="Zemljevid"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${kmetija.lng - 0.02},${kmetija.lat - 0.01},${kmetija.lng + 0.02},${kmetija.lat + 0.01}&layer=mapnik&marker=${kmetija.lat},${kmetija.lng}`}
                      className="absolute inset-0 w-full h-full border-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-earth-400">
                      <MapPin size={32} className="mb-2" />
                      <p className="text-sm">Zemljevid ni na voljo</p>
                    </div>
                  )}
                </div>
                <div className="bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-sm text-earth-700">
                    <span className="font-semibold text-forest-900">{kmetija.naslov}</span>
                    {kmetija.obcina && `, ${kmetija.postna_stevilka} ${kmetija.obcina}`}
                    <span className="text-earth-400 ml-2">· {regionLabel}</span>
                  </div>
                  {kmetija.lat && kmetija.lng && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${kmetija.lat},${kmetija.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-600 transition-colors"
                    >
                      <ExternalLink size={14} />
                      Navodila za pot
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Right: Sticky sidebar ── */}
          <aside className="w-full lg:w-[380px] lg:flex-shrink-0">
            <div className="sticky top-24 flex flex-col gap-6">

              {/* ═════════════════════════════════════════════════════════
                  4. BOOKING CALENDAR
                  ═════════════════════════════════════════════════════════ */}
              <div className="rounded-2xl bg-white border border-earth-200/60 shadow-md p-6">
                <h3 className="text-lg font-bold text-forest-900 mb-1 flex items-center gap-2">
                  <CalendarDays size={20} className="text-forest-600" />
                  Rezervacija
                </h3>
                <p className="text-xs text-earth-500 mb-5">Izberite datume in pošljite povpraševanje</p>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  {/* Date range */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1.5">Prihod</label>
                      <input
                        type="date"
                        value={bookingFrom}
                        min={today}
                        onChange={(e) => setBookingFrom(e.target.value)}
                        required
                        className="w-full rounded-lg border border-earth-200 px-3 py-2.5 text-sm text-forest-900 focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1.5">Odhod</label>
                      <input
                        type="date"
                        value={bookingTo}
                        min={bookingFrom || today}
                        onChange={(e) => setBookingTo(e.target.value)}
                        required
                        className="w-full rounded-lg border border-earth-200 px-3 py-2.5 text-sm text-forest-900 focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1.5">Število gostov</label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setBookingGuests(Math.max(1, bookingGuests - 1))}
                        className="flex items-center justify-center w-9 h-9 rounded-lg border border-earth-200 text-earth-600 hover:bg-earth-50 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <div className="flex items-center gap-2 text-forest-900">
                        <Users size={16} className="text-forest-600" />
                        <span className="font-bold">{bookingGuests}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setBookingGuests(Math.min(20, bookingGuests + 1))}
                        className="flex items-center justify-center w-9 h-9 rounded-lg border border-earth-200 text-earth-600 hover:bg-earth-50 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Name + Email */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1.5">Ime in priimek</label>
                    <input
                      type="text"
                      value={bookingName}
                      onChange={(e) => setBookingName(e.target.value)}
                      required
                      placeholder="Janez Novak"
                      className="w-full rounded-lg border border-earth-200 px-3 py-2.5 text-sm text-forest-900 placeholder:text-earth-400 focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1.5">E-pošta</label>
                    <input
                      type="email"
                      value={bookingEmail}
                      onChange={(e) => setBookingEmail(e.target.value)}
                      required
                      placeholder="janez@primer.si"
                      className="w-full rounded-lg border border-earth-200 px-3 py-2.5 text-sm text-forest-900 placeholder:text-earth-400 focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
                    />
                  </div>

                  {/* Night count info */}
                  {bookingFrom && bookingTo && (
                    <div className="rounded-lg bg-forest-50 border border-forest-200/60 px-4 py-3 text-sm">
                      <div className="flex justify-between text-forest-800">
                        <span>Število nočitev</span>
                        <span className="font-bold">
                          {Math.max(0, Math.ceil((new Date(bookingTo).getTime() - new Date(bookingFrom).getTime()) / (1000 * 60 * 60 * 24)))}
                        </span>
                      </div>
                      <div className="flex justify-between text-forest-800 mt-1">
                        <span>Število gostov</span>
                        <span className="font-bold">{bookingGuests}</span>
                      </div>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={bookingSubmitted}
                    className={`w-full flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-300 ${
                      bookingSubmitted
                        ? "bg-forest-100 text-forest-700 cursor-default"
                        : "bg-forest-700 text-white hover:bg-forest-600 hover:shadow-lg active:scale-[0.98]"
                    }`}
                  >
                    {bookingSubmitted ? (
                      <><Check size={18} /> Povpraševanje poslano!</>
                    ) : (
                      <><Send size={16} /> Pošlji povpraševanje</>
                    )}
                  </button>
                </form>
              </div>

              {/* Contact info card */}
              <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm p-5">
                <h4 className="text-sm font-bold text-forest-900 mb-4 flex items-center gap-2">
                  <Mail size={16} className="text-forest-600" />
                  Kontaktni podatki
                </h4>
                <ul className="space-y-3">
                  {kmetija.kontaktni_podatki?.telefon && (
                    <li className="flex items-center gap-3 text-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-600">
                        <Phone size={16} />
                      </div>
                      <a href={`tel:${kmetija.kontaktni_podatki.telefon}`} className="text-forest-800 hover:text-forest-600 font-medium transition-colors">
                        {kmetija.kontaktni_podatki.telefon}
                      </a>
                    </li>
                  )}
                  {kmetija.kontaktni_podatki?.email && (
                    <li className="flex items-center gap-3 text-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-600">
                        <Mail size={16} />
                      </div>
                      <a href={`mailto:${kmetija.kontaktni_podatki.email}`} className="text-forest-800 hover:text-forest-600 font-medium transition-colors truncate">
                        {kmetija.kontaktni_podatki.email}
                      </a>
                    </li>
                  )}
                  {kmetija.kontaktni_podatki?.spletna_stran && (
                    <li className="flex items-center gap-3 text-sm">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-50 text-forest-600">
                        <Globe size={16} />
                      </div>
                      <a href={kmetija.kontaktni_podatki.spletna_stran} target="_blank" rel="noopener noreferrer" className="text-forest-800 hover:text-forest-600 font-medium transition-colors truncate">
                        {kmetija.kontaktni_podatki.spletna_stran.replace(/^https?:\/\//, "")}
                      </a>
                    </li>
                  )}
                </ul>
              </div>

              {/* Share */}
              <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm p-5">
                <h4 className="text-sm font-bold text-forest-900 mb-3">Delite to kmetijo</h4>
                <div className="flex gap-2">
                  {[
                    { label: "Facebook", icon: "f", bg: "bg-[#1877F2]" },
                    { label: "Twitter", icon: "𝕏", bg: "bg-black" },
                    { label: "WhatsApp", icon: "💬", bg: "bg-[#25D366]" },
                    { label: "Kopiraj", icon: "🔗", bg: "bg-earth-500" },
                  ].map((social) => (
                    <button
                      key={social.label}
                      title={social.label}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${social.bg} text-white text-sm font-bold hover:opacity-80 hover:scale-105 active:scale-95 transition-all duration-200`}
                    >
                      {social.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          1. LIGHTBOX GALERIJA
          ═══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={() => setLightboxOpen(false)}
            onKeyDown={handleLightboxKey}
            tabIndex={0}
          >
            {/* Close */}
            <button
              className="absolute top-6 right-6 z-10 text-white/60 hover:text-white transition-colors"
              onClick={() => setLightboxOpen(false)}
            >
              <X size={28} />
            </button>

            {/* Image */}
            <motion.div
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="relative w-[90vw] h-[80vh] max-w-5xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={allImages[lightboxIndex]}
                alt={`${kmetija.ime} - slika ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
                quality={95}
              />
            </motion.div>

            {/* Prev */}
            {lightboxIndex > 0 && (
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i - 1); }}
              >
                <ChevronLeft size={24} />
              </button>
            )}

            {/* Next */}
            {lightboxIndex < allImages.length - 1 && (
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i + 1); }}
              >
                <ChevronRight size={24} />
              </button>
            )}

            {/* Thumbnails strip */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {allImages.map((url, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`relative w-12 h-8 rounded-md overflow-hidden border-2 transition-all ${i === lightboxIndex ? "border-white scale-110" : "border-transparent opacity-50 hover:opacity-80"}`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="48px" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
