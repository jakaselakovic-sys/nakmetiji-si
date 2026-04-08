"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MOCK_FARMS } from "@/data/mock-farms";
import { REGION_LABELS, Region } from "@/types";
import { PregledView } from "./views/PregledView";
import { ProfileView } from "./views/ProfileView";
import { AnalyticsView } from "./views/AnalyticsView";
import { SettingsView } from "./views/SettingsView";

/* ── Simulated auth — use the first premium mock farm ────────────────── */
const CURRENT_FARM = MOCK_FARMS[0]; // Kmetija pri Janežu

type DashboardTab = "pregled" | "profil" | "analitika" | "nastavitve";

const SIDEBAR_ITEMS: { key: DashboardTab; label: string; icon: React.ReactNode }[] = [
  {
    key: "pregled",
    label: "Pregled",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    key: "profil",
    label: "Moj Profil",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    key: "analitika",
    label: "Analitika",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    key: "nastavitve",
    label: "Nastavitve",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

/* ══════════════════════════════════════════════════════════════════════ */

export function DashboardClient() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("pregled");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const regionLabel = REGION_LABELS[CURRENT_FARM.region as Region] ?? CURRENT_FARM.region;

  return (
    <div className="flex min-h-[calc(100dvh-72px)] mt-[72px] bg-earth-50">
      {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[280px] min-w-[280px] bg-white border-r border-earth-200/70 shadow-sm">
        {/* Owner card */}
        <div className="p-6 border-b border-earth-200/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative h-12 w-12 rounded-xl overflow-hidden shadow-md ring-2 ring-forest-200">
              <Image
                src={CURRENT_FARM.coverImageUrl}
                alt={CURRENT_FARM.name}
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-forest-900 truncate">
                {CURRENT_FARM.name}
              </p>
              <p className="text-xs text-earth-500 truncate">
                📍 {regionLabel}
              </p>
            </div>
          </div>

          {/* Premium badge */}
          {CURRENT_FARM.isPremium ? (
            <div className="flex items-center gap-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/70 px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-gold-500 to-amber-600 shadow-md shadow-amber-300/30">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">Premium Partner</p>
                <p className="text-[10px] text-amber-700/70">Aktivno do dec. 2026</p>
              </div>
            </div>
          ) : (
            <Link
              href="/premium"
              className="flex items-center gap-2.5 rounded-xl bg-forest-50 border border-forest-200/70 px-4 py-3 hover:bg-forest-100 transition-colors group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-200 text-forest-700 group-hover:bg-forest-300 transition-colors">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-forest-800">Nadgradite na Premium</p>
                <p className="text-[10px] text-forest-600/70">Povečajte vidnost</p>
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              id={`nav-${item.key}`}
              onClick={() => setActiveTab(item.key)}
              className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                activeTab === item.key
                  ? "bg-forest-50 text-forest-800 border border-forest-200/60 shadow-sm"
                  : "text-earth-600 hover:bg-earth-50 hover:text-forest-800 border border-transparent"
              }`}
            >
              <span className={activeTab === item.key ? "text-forest-600" : "text-earth-400"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="p-4 border-t border-earth-200/60 space-y-2">
          <Link
            href={`/kmetije/${CURRENT_FARM.slug}`}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-earth-600 hover:bg-earth-50 hover:text-forest-800 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ogled javnega profila
          </Link>
          <button className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Odjava
          </button>
        </div>
      </aside>

      {/* ── MOBILE NAV BAR ─────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-earth-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 py-2">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setActiveTab(item.key); setMobileNavOpen(false); }}
              className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
                activeTab === item.key
                  ? "text-forest-700"
                  : "text-earth-400"
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {/* Top bar */}
        <div className="sticky top-[72px] z-20 bg-earth-50/90 backdrop-blur-md border-b border-earth-200/60">
          <div className="flex items-center justify-between px-6 lg:px-10 py-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-forest-900">
                {activeTab === "pregled" && "Pregled"}
                {activeTab === "profil" && "Moj Profil"}
                {activeTab === "analitika" && "Analitika"}
                {activeTab === "nastavitve" && "Nastavitve"}
              </h1>
              <p className="text-sm text-earth-500 mt-0.5">
                {activeTab === "pregled" && "Status, rezervacije in slike"}
                {activeTab === "profil" && "Urejajte podatke vaše kmetije"}
                {activeTab === "analitika" && "Pregled obiskov in statistik"}
                {activeTab === "nastavitve" && "Upravljajte nastavitve računa"}
              </p>
            </div>

            {/* Mobile: Premium badge */}
            {CURRENT_FARM.isPremium && (
              <div className="lg:hidden flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200/70 px-3 py-1.5">
                <svg className="h-4 w-4 text-gold-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-xs font-bold text-amber-900">Premium</span>
              </div>
            )}
          </div>
        </div>

        {/* View content */}
        <div className="px-6 lg:px-10 py-8 max-w-4xl">
          {activeTab === "pregled" && <PregledView farm={CURRENT_FARM} />}
          {activeTab === "profil" && <ProfileView farm={CURRENT_FARM} />}
          {activeTab === "analitika" && <AnalyticsView farm={CURRENT_FARM} />}
          {activeTab === "nastavitve" && <SettingsView farm={CURRENT_FARM} />}
        </div>
      </main>
    </div>
  );
}
