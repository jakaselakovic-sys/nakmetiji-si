"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, LogOut, Shield, Users, TreePine, MessageSquare } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

type MnenjeStatus = "cakanje" | "odobreno" | "zavrnjeno";

interface Mnenje {
  id: string;
  uporabnik_ime: string;
  ocena: number;
  komentar: string | null;
  status: MnenjeStatus;
  datum: string;
  kmetije: { ime: string; slug: string } | null;
}

interface Kmetija {
  id: string;
  ime: string;
  slug: string;
  regija: string;
  aktivna: boolean;
  premium: boolean;
  ocena: number | null;
  stevilo_ocen: number;
  ustvarjeno: string;
  lastnik_id: string | null;
}

interface Profil {
  id: string;
  ime: string | null;
  vloga: string;
  email: string | null;
}

type AdminTab = "mnenja" | "kmetije" | "uporabniki";

interface Props {
  adminIme: string;
  mnenja: Mnenje[];
  kmetije: Kmetija[];
  profili: Profil[];
  skupajUporabnikov: number;
}

const STATUS_STYLE: Record<MnenjeStatus, string> = {
  cakanje: "bg-amber-50 text-amber-700 border-amber-200",
  odobreno: "bg-green-50 text-green-700 border-green-200",
  zavrnjeno: "bg-red-50 text-red-700 border-red-200",
};

export function AdminClient({ adminIme, mnenja: initialMnenja, kmetije, profili, skupajUporabnikov }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>("mnenja");
  const [mnenja, setMnenja] = useState(initialMnenja);
  const [mnenjaFilter, setMnenjaFilter] = useState<MnenjeStatus | "vse">("cakanje");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [napaka, setNapaka] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleOdjava() {
    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    });
  }

  async function handleMnenje(id: string, status: "odobreno" | "zavrnjeno") {
    setActionLoading(id);
    setNapaka(null);
    const res = await fetch("/api/admin/mnenja", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json() as { ok?: boolean; napaka?: string };
    if (json.ok) {
      setMnenja((prev) => prev.map((m) => m.id === id ? { ...m, status } : m));
    } else {
      setNapaka(json.napaka ?? "Napaka.");
    }
    setActionLoading(null);
  }

  async function handleAktivacijaKmetije(id: string, aktivna: boolean) {
    setNapaka(null);
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.from("kmetije").update({ aktivna }).eq("id", id);
    if (error) { setNapaka(error.message); return; }
    router.refresh();
  }

  const filteredMnenja = mnenjaFilter === "vse" ? mnenja : mnenja.filter((m) => m.status === mnenjaFilter);
  const cakajocaMnenja = mnenja.filter((m) => m.status === "cakanje").length;
  const aktivneKmetije = kmetije.filter((k) => k.aktivna).length;

  const TABS: { key: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: "mnenja", label: "Moderacija mnenj", icon: <MessageSquare size={16} />, badge: cakajocaMnenja },
    { key: "kmetije", label: "Kmetije", icon: <TreePine size={16} /> },
    { key: "uporabniki", label: "Uporabniki", icon: <Users size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-earth-50 pt-[72px]">
      {/* Header */}
      <div className="bg-white border-b border-earth-200 px-6 lg:px-10 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
              <Shield size={18} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-forest-900">Admin plošča</h1>
              <p className="text-xs text-earth-500">Prijavljen kot {adminIme}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-earth-600 hover:text-forest-800 font-medium transition-colors">
              Dashboard
            </Link>
            <button
              onClick={handleOdjava}
              disabled={isPending}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              <LogOut size={14} />
              Odjava
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Skupaj kmetij", value: kmetije.length, icon: "🌾" },
            { label: "Aktivnih kmetij", value: aktivneKmetije, icon: "✅" },
            { label: "Čaka moderacijo", value: cakajocaMnenja, icon: "⏳", urgent: cakajocaMnenja > 0 },
            { label: "Skupaj uporabnikov", value: skupajUporabnikov, icon: "👥" },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl bg-white border p-4 shadow-sm ${s.urgent ? "border-amber-300" : "border-earth-200/60"}`}>
              <div className="text-xl mb-1">{s.icon}</div>
              <p className={`text-2xl font-bold ${s.urgent ? "text-amber-700" : "text-forest-900"}`}>{s.value}</p>
              <p className="text-xs text-earth-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-earth-200 rounded-2xl mb-6 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-forest-600 text-white shadow"
                  : "text-earth-600 hover:text-forest-800"
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge ? (
                <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === tab.key ? "bg-white/20 text-white" : "bg-amber-100 text-amber-700"}`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {napaka && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {napaka}
          </div>
        )}

        {/* ── MNENJA ──────────────────────────────────────────────────── */}
        {activeTab === "mnenja" && (
          <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-earth-200/60 flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-base font-bold text-forest-900">Moderacija mnenj</h2>
              <div className="flex gap-1.5">
                {(["cakanje", "odobreno", "zavrnjeno", "vse"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setMnenjaFilter(f)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      mnenjaFilter === f ? "bg-forest-600 text-white border-forest-600" : "bg-white text-earth-600 border-earth-200"
                    }`}
                  >
                    {f === "vse" ? "Vse" : f === "cakanje" ? "Čaka" : f === "odobreno" ? "Odobreno" : "Zavrnjeno"}
                  </button>
                ))}
              </div>
            </div>

            {filteredMnenja.length === 0 ? (
              <p className="px-6 py-12 text-center text-earth-400 text-sm">Ni mnenj za ta filter.</p>
            ) : (
              <div className="divide-y divide-earth-100">
                {filteredMnenja.map((m) => (
                  <div key={m.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <p className="text-sm font-bold text-forest-900">{m.uporabnik_ime}</p>
                          <span className="text-xs text-amber-500">{"★".repeat(m.ocena)}{"☆".repeat(5 - m.ocena)}</span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[m.status]}`}>
                            {m.status === "cakanje" ? "Čaka" : m.status === "odobreno" ? "Odobreno" : "Zavrnjeno"}
                          </span>
                        </div>
                        {m.kmetije && (
                          <Link href={`/kmetije/${m.kmetije.slug}`} className="text-xs text-forest-600 hover:underline">
                            {m.kmetije.ime}
                          </Link>
                        )}
                        {m.komentar && (
                          <p className="text-sm text-earth-700 mt-2 leading-relaxed">{m.komentar}</p>
                        )}
                        <p className="text-xs text-earth-400 mt-1">
                          {new Date(m.datum).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>

                      {m.status === "cakanje" && (
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleMnenje(m.id, "odobreno")}
                            disabled={actionLoading === m.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} /> Odobri
                          </button>
                          <button
                            onClick={() => handleMnenje(m.id, "zavrnjeno")}
                            disabled={actionLoading === m.id}
                            className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} /> Zavrni
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── KMETIJE ─────────────────────────────────────────────────── */}
        {activeTab === "kmetije" && (
          <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-earth-200/60">
              <h2 className="text-base font-bold text-forest-900">Vse kmetije ({kmetije.length})</h2>
            </div>
            <div className="divide-y divide-earth-100">
              {kmetije.map((k) => (
                <div key={k.id} className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Link href={`/kmetije/${k.slug}`} className="text-sm font-bold text-forest-900 hover:underline">
                        {k.ime}
                      </Link>
                      {k.premium && <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">Premium</span>}
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${k.aktivna ? "bg-green-50 text-green-700 border-green-200" : "bg-earth-50 text-earth-600 border-earth-200"}`}>
                        {k.aktivna ? "Aktivna" : "V pregledu"}
                      </span>
                    </div>
                    <p className="text-xs text-earth-500">
                      {k.regija} · {k.ocena ? `⭐ ${k.ocena.toFixed(1)}` : "Brez ocene"} · {k.stevilo_ocen} ocen
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAktivacijaKmetije(k.id, !k.aktivna)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                        k.aktivna
                          ? "border-red-300 text-red-600 hover:bg-red-50"
                          : "border-green-300 text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {k.aktivna ? "Deaktiviraj" : "Aktiviraj"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── UPORABNIKI ──────────────────────────────────────────────── */}
        {activeTab === "uporabniki" && (
          <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-earth-200/60">
              <h2 className="text-base font-bold text-forest-900">
                Zadnji uporabniki ({skupajUporabnikov} skupaj)
              </h2>
            </div>
            <div className="divide-y divide-earth-100">
              {profili.map((p) => (
                <div key={p.id} className="px-6 py-3 flex items-center gap-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-100 text-forest-700 font-bold text-sm flex-shrink-0">
                    {(p.ime || p.email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-earth-800 truncate">{p.ime || "—"}</p>
                    <p className="text-xs text-earth-400 truncate">{p.email || p.id}</p>
                  </div>
                  <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border flex-shrink-0 ${
                    p.vloga === "super_admin" ? "bg-purple-50 text-purple-700 border-purple-200" :
                    p.vloga === "lastnik" ? "bg-forest-50 text-forest-700 border-forest-200" :
                    "bg-earth-50 text-earth-600 border-earth-200"
                  }`}>
                    {p.vloga === "super_admin" ? "Admin" : p.vloga === "lastnik" ? "Lastnik" : "Gost"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
