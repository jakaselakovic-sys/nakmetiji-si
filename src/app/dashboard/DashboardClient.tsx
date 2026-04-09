"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TreePine, LogOut, Plus } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { REGIJA_LABELS } from "@/types/database";
import type { Kmetija, Rezervacija } from "@/types/database";
import { PregledView } from "./views/PregledView";
import { AnalyticsView } from "./views/AnalyticsView";
import { SettingsView } from "./views/SettingsView";

type DashboardTab = "pregled" | "analitika" | "nastavitve";

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

interface Props {
  userEmail: string;
  userId: string;
  profilIme: string;
  vloga: string;
  kmetija: Kmetija | null;
  rezervacije: Rezervacija[];
}

export function DashboardClient({ userEmail, profilIme, vloga, kmetija, rezervacije }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("pregled");
  const [isPending, startTransition] = useTransition();

  const regionLabel = kmetija ? (REGIJA_LABELS[kmetija.regija] ?? kmetija.regija) : "";

  async function handleOdjava() {
    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    });
  }

  const TAB_TITLES: Record<DashboardTab, { title: string; sub: string }> = {
    pregled: { title: "Pregled", sub: "Rezervacije, status in slike" },
    analitika: { title: "Analitika", sub: "Pregled obiskov in statistik" },
    nastavitve: { title: "Nastavitve", sub: "Upravljajte nastavitve računa" },
  };

  return (
    <div className="flex min-h-[calc(100dvh-72px)] mt-[72px] bg-earth-50">
      {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-[280px] min-w-[280px] bg-white border-r border-earth-200/70 shadow-sm">
        {/* Lastnik info */}
        <div className="p-6 border-b border-earth-200/60">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-100 text-forest-700 font-bold text-lg flex-shrink-0">
              {(profilIme || userEmail).charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-forest-900 truncate">
                {profilIme || userEmail}
              </p>
              <p className="text-xs text-earth-500 truncate">
                {vloga === "super_admin" ? "Super Admin" : vloga === "lastnik" ? "Lastnik kmetije" : "Gost"}
              </p>
            </div>
          </div>

          {/* Kmetija info ali CTA */}
          {kmetija ? (
            <div className="rounded-xl bg-forest-50 border border-forest-200/60 px-4 py-3">
              <div className="flex items-center gap-2 mb-1">
                <TreePine size={14} className="text-forest-600" />
                <p className="text-xs font-bold text-forest-800 truncate">{kmetija.ime}</p>
              </div>
              <p className="text-[11px] text-forest-600">
                📍 {regionLabel}
                {kmetija.aktivna
                  ? <span className="ml-2 text-green-600 font-semibold">● Aktivna</span>
                  : <span className="ml-2 text-amber-600 font-semibold">● V pregledu</span>}
              </p>
            </div>
          ) : (
            <Link
              href="/dodaj-kmetijo"
              className="flex items-center gap-2 rounded-xl bg-forest-50 border border-forest-200/60 px-4 py-3 hover:bg-forest-100 transition-colors group"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-200 text-forest-700 group-hover:bg-forest-300 transition-colors">
                <Plus size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-forest-800">Dodaj kmetijo</p>
                <p className="text-[10px] text-forest-600/70">Registrirajte svojo kmetijo</p>
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
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

        {/* Bottom */}
        <div className="p-4 border-t border-earth-200/60 space-y-2">
          {kmetija && (
            <Link
              href={`/kmetije/${kmetija.slug}`}
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-earth-600 hover:bg-earth-50 hover:text-forest-800 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Ogled javnega profila
            </Link>
          )}
          {vloga === "super_admin" && (
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Admin plošča
            </Link>
          )}
          <button
            onClick={handleOdjava}
            disabled={isPending}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full disabled:opacity-50"
          >
            <LogOut size={16} />
            {isPending ? "Odjava..." : "Odjava"}
          </button>
        </div>
      </aside>

      {/* ── MOBILE NAV BAR ─────────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-earth-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-around px-2 py-2">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all ${
                activeTab === item.key ? "text-forest-700" : "text-earth-400"
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
                {TAB_TITLES[activeTab].title}
              </h1>
              <p className="text-sm text-earth-500 mt-0.5">
                {TAB_TITLES[activeTab].sub}
              </p>
            </div>
          </div>
        </div>

        {/* View content */}
        <div className="px-6 lg:px-10 py-8 max-w-4xl">
          {activeTab === "pregled" && (
            <PregledView
              kmetijaId={kmetija?.id ?? null}
              kmetijaIme={kmetija?.ime ?? ""}
              rezervacije={rezervacije}
              naslovnaSlika={kmetija?.naslovna_slika ?? ""}
            />
          )}
          {activeTab === "analitika" && (
            <AnalyticsView
              kmetija={kmetija}
              rezervacije={rezervacije}
            />
          )}
          {activeTab === "nastavitve" && (
            <SettingsView
              userEmail={userEmail}
              profilIme={profilIme}
            />
          )}
        </div>
      </main>
    </div>
  );
}
