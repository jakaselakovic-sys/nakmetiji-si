"use client";

// =============================================================================
// NaKmetiji.si — Vendor Onboarding Checklist
// Auto-derives completion state from kmetija data and guides the owner
// through the steps that take a profile from "registered" to "ready".
// Hides itself once 100% complete (and the toggle on the kmetija is active).
// =============================================================================

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Sparkles, ArrowRight } from "lucide-react";
import type { Kmetija } from "@/types/database";

interface Props {
  kmetija: Kmetija | null;
  dozivetjaCount: number;
  onJumpToTab?: (tab: "uredi" | "ai-orodja" | "pregled") => void;
}

interface ChecklistItem {
  key: string;
  title: string;
  description: string;
  done: boolean;
  cta: string;
  action: () => void;
}

export function OnboardingChecklist({ kmetija, dozivetjaCount, onJumpToTab }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  const items: ChecklistItem[] = useMemo(() => {
    if (!kmetija) {
      return [{
        key: "create",
        title: "Ustvari profil kmetije",
        description: "Začni z osnovnim profilom — ime, regija, kontaktni podatki.",
        done: false,
        cta: "Ustvari kmetijo",
        action: () => { window.location.href = "/dodaj-kmetijo"; },
      }];
    }

    const hasOpis = !!kmetija.opis && kmetija.opis.length > 80;
    const hasKratki = !!kmetija.kratki_opis && kmetija.kratki_opis.length > 30;
    const slikeCount = (kmetija.slike?.length ?? 0) + (kmetija.naslovna_slika ? 1 : 0);
    const hasEnoughPhotos = slikeCount >= 5;
    const hasPrice = kmetija.cena_noc !== null && kmetija.cena_noc > 0;
    const hasGuests = kmetija.max_gostov !== null && kmetija.max_gostov > 0;
    const hasLocation = kmetija.lat !== null && kmetija.lng !== null;
    const hasDozivetja = dozivetjaCount > 0;
    const isActive = kmetija.aktivna;

    const goEdit = () => onJumpToTab?.("uredi");
    const goAI = () => onJumpToTab?.("ai-orodja");

    return [
      {
        key: "opis",
        title: "Napiši opis kmetije",
        description: "Daljši opis (najmanj 80 znakov) + kratki opis za predogled.",
        done: hasOpis && hasKratki,
        cta: hasOpis && hasKratki ? "Ureja v uredniku" : "Dopolni opis",
        action: goEdit,
      },
      {
        key: "photos",
        title: "Naloži vsaj 5 fotografij",
        description: `Trenutno: ${slikeCount} ${slikeCount === 1 ? "slika" : slikeCount < 5 ? "slike" : "slik"}. Profili z ≥5 slikami imajo 3× več obiskov.`,
        done: hasEnoughPhotos,
        cta: hasEnoughPhotos ? "Dodaj še" : "Naloži fotografije",
        action: goEdit,
      },
      {
        key: "doz",
        title: "Označi doživetja",
        description: "Vino, kulinarika, družine, živali, šport — pomaga gostom najti tvojo kmetijo.",
        done: hasDozivetja,
        cta: hasDozivetja ? "Uredi izbor" : "Izberi doživetja",
        action: goEdit,
      },
      {
        key: "price",
        title: "Nastavi ceno in zmogljivost",
        description: "Cena na noč in maksimalno število gostov.",
        done: hasPrice && hasGuests,
        cta: hasPrice && hasGuests ? "Posodobi" : "Nastavi cene",
        action: goEdit,
      },
      {
        key: "location",
        title: "Potrdi lokacijo",
        description: "Naslov in koordinate — gosti vidijo razdaljo do znamenitosti.",
        done: hasLocation,
        cta: hasLocation ? "Preveri" : "Vnesi naslov",
        action: goEdit,
      },
      {
        key: "ai",
        title: "Preizkusi AI Orodja",
        description: "Storyteller, Apple-ify za fotografije in Price Advisor — vse v enem.",
        done: false, // optional — never auto-completes
        cta: "Odpri AI Orodja",
        action: goAI,
      },
      {
        key: "active",
        title: "Aktiviraj kmetijo",
        description: "Ko je profil pripravljen, ga objavi za goste.",
        done: isActive,
        cta: isActive ? "Aktivna" : "Aktiviraj v Nastavitvah",
        action: () => onJumpToTab?.("pregled"),
      },
    ];
  }, [kmetija, dozivetjaCount, onJumpToTab]);

  const required = items.filter((i) => i.key !== "ai");
  const doneCount = required.filter((i) => i.done).length;
  const totalCount = required.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = doneCount === totalCount;

  // Once 100% done AND active, don't show
  if (allDone && kmetija?.aktivna) return null;

  // Find next pending item
  const nextItem = items.find((i) => !i.done && i.key !== "ai");

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50/50 border border-emerald-200/70 shadow-sm overflow-hidden mb-6"
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center gap-4 px-5 sm:px-6 py-5 hover:bg-white/40 transition-colors text-left"
      >
        <div className="flex-shrink-0 relative">
          <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
            <circle cx="24" cy="24" r="20" stroke="#d1fae5" strokeWidth="4" fill="none" />
            <circle
              cx="24" cy="24" r="20"
              stroke="#10b981"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 125.66} 125.66`}
              className="transition-all duration-700"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-forest-900">
            {pct}%
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Sparkles size={12} className="text-amber-600" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">
              Začetni vodnik
            </p>
          </div>
          <p className="font-display font-black text-forest-900 text-base sm:text-lg leading-tight">
            {allDone
              ? "Profil pripravljen — aktiviraj kmetijo, da je vidna gostom."
              : `${doneCount} / ${totalCount} korakov dokončanih`}
          </p>
          {!allDone && nextItem && !collapsed && (
            <p className="text-xs text-earth-600 mt-1 truncate">
              Naslednji korak: <strong className="text-forest-800">{nextItem.title}</strong>
            </p>
          )}
        </div>
        <div className="flex-shrink-0 text-earth-500">
          {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </button>

      {/* Items */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <ul className="px-5 sm:px-6 pb-5 space-y-2 border-t border-emerald-200/60 pt-4">
              {items.map((item) => (
                <li
                  key={item.key}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                    item.done
                      ? "bg-emerald-50/60 border-emerald-200"
                      : "bg-white border-earth-200 hover:border-forest-300"
                  }`}
                >
                  {item.done ? (
                    <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
                  ) : (
                    <Circle size={18} className="text-earth-300 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold ${item.done ? "text-forest-800" : "text-forest-900"}`}>
                      {item.title}
                    </p>
                    <p className="text-[11px] text-earth-500 truncate">{item.description}</p>
                  </div>
                  <button
                    onClick={item.action}
                    className={`flex-shrink-0 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                      item.done
                        ? "text-emerald-700 hover:bg-emerald-100"
                        : "bg-forest-700 text-white hover:bg-forest-600 shadow-sm"
                    }`}
                  >
                    {item.cta}
                    {!item.done && <ArrowRight size={11} />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="px-5 sm:px-6 pb-5 text-center">
              <Link
                href="/o-nas"
                className="text-[11px] text-earth-500 hover:text-forest-700 underline decoration-dotted"
              >
                Imaš vprašanje? Stopi v stik.
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
