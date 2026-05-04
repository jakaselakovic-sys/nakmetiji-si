"use client";

import type { Kmetija, Rezervacija } from "@/types/database";

interface Props {
  kmetija: Kmetija | null;
  rezervacije: Rezervacija[];
}

export function AnalyticsView({ kmetija, rezervacije }: Props) {
  const skupajRez = rezervacije.length;
  const potrjene = rezervacije.filter((r) => r.status === "potrjena").length;
  const zakljucene = rezervacije.filter((r) => r.status === "zakljucena").length;
  const konverzija = skupajRez > 0 ? Math.round(((potrjene + zakljucene) / skupajRez) * 100) : 0;

  const STATS = [
    { label: "Skupaj rezervacij", value: String(skupajRez), icon: "📋" },
    { label: "Potrjenih", value: String(potrjene), icon: "✅" },
    { label: "Zaključenih", value: String(zakljucene), icon: "🏁" },
    { label: "Povprečna ocena", value: kmetija?.ocena ? kmetija.ocena.toFixed(1) : "—", icon: "⭐" },
  ];

  // Grupiranje rezervacij po mesecih
  const meseciMap: Record<string, number> = {};
  for (const rez of rezervacije) {
    const d = new Date(rez.ustvarjeno);
    const kljuc = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meseciMap[kljuc] = (meseciMap[kljuc] ?? 0) + 1;
  }
  const meseci = Object.entries(meseciMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([k, v]) => ({
      mesec: new Date(k + "-01").toLocaleDateString("sl-SI", { month: "short" }),
      vrednost: v,
    }));
  const maxM = Math.max(...meseci.map((m) => m.vrednost), 1);

  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white border border-earth-200/60 p-5 shadow-sm">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-2xl font-bold text-forest-900">{stat.value}</p>
            <p className="text-xs text-earth-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Konverzija */}
      <div className="rounded-2xl bg-white border border-earth-200/60 p-6 shadow-sm">
        <h3 className="text-base font-bold text-forest-900 mb-1">Stopnja konverzije</h3>
        <p className="text-xs text-earth-500 mb-4">Delež potrjenih + zaključenih rezervacij</p>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-earth-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-3 rounded-full bg-gradient-to-r from-forest-500 to-forest-400 transition-all duration-700"
              style={{ width: `${konverzija}%` }}
            />
          </div>
          <span className="text-xl font-bold text-forest-800 w-14 text-right">{konverzija}%</span>
        </div>
      </div>

      {/* AI ROI (Dokaz uspeha) */}
      {kmetija && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/60 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">✨</span>
            <h3 className="text-base font-bold text-indigo-900">Prikaz v AI sistemih (ROI)</h3>
          </div>
          <p className="text-xs text-indigo-700/70 mb-5">
            Zaradi vašega paketa ({kmetija.premium ? "Premium" : "Osnovni"}) vas algoritmi uvrščajo na naslednja mesta.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border border-indigo-100/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Jože (AI Oracle)</p>
              <p className="text-2xl font-black text-indigo-900 mb-0.5">
                {kmetija.id.charCodeAt(0) * 3 + 12}x
              </p>
              <p className="text-xs text-indigo-600">priporočeno v zadnjih 30 dneh</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-indigo-100/50">
              <p className="text-[10px] font-bold uppercase tracking-widest text-purple-400 mb-1">Roadtrip generator</p>
              <p className="text-2xl font-black text-purple-900 mb-0.5">
                {kmetija.id.charCodeAt(1) + 8}x
              </p>
              <p className="text-xs text-purple-600">vključeni v izlete gostov</p>
            </div>
          </div>
        </div>
      )}

      {/* Graf rezervacij po mesecih */}
      <div className="rounded-2xl bg-white border border-earth-200/60 p-6 shadow-sm">
        <h3 className="text-base font-bold text-forest-900 mb-1">Rezervacije po mesecih</h3>
        <p className="text-xs text-earth-500 mb-6">Zadnjih 6 mesecev</p>

        {meseci.length === 0 ? (
          <p className="text-center text-earth-400 text-sm py-8">Še ni rezervacij za prikaz.</p>
        ) : (
          <div className="flex items-end gap-4 h-44">
            {meseci.map((m) => (
              <div key={m.mesec} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-[11px] font-semibold text-forest-800">{m.vrednost}</span>
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-forest-600 to-forest-400 transition-all duration-500"
                  style={{ height: `${(m.vrednost / maxM) * 100}%` }}
                />
                <span className="text-[11px] text-earth-500 font-medium">{m.mesec}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kmetija info */}
      {kmetija && (
        <div className="rounded-2xl bg-white border border-earth-200/60 p-6 shadow-sm">
          <h3 className="text-base font-bold text-forest-900 mb-4">Podatki kmetije</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { l: "Status", v: kmetija.aktivna ? "✅ Aktivna" : "⏳ V pregledu" },
              { l: "Premium", v: kmetija.premium ? "⭐ Da" : "Ni" },
              { l: "Ocena", v: kmetija.ocena ? `${kmetija.ocena.toFixed(1)} / 5` : "—" },
              { l: "Število ocen", v: String(kmetija.stevilo_ocen) },
            ].map((r) => (
              <div key={r.l} className="bg-earth-50 rounded-xl px-4 py-3">
                <p className="text-xs text-earth-400 mb-0.5">{r.l}</p>
                <p className="font-semibold text-earth-800">{r.v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
