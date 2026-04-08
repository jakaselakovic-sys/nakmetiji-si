"use client";

import { Farm } from "@/types";

/* ── Mock analytics data ─────────────────────────────────────────────── */

const STATS = [
  { label: "Ogledi profila", value: "1.247", change: "+12%", up: true, icon: "👁️" },
  { label: "Povpraševanja", value: "38", change: "+23%", up: true, icon: "✉️" },
  { label: "Kliki na telefon", value: "84", change: "+5%", up: true, icon: "📞" },
  { label: "Povprečna ocena", value: "4.8", change: "0%", up: true, icon: "⭐" },
];

const MONTHLY_VIEWS = [
  { month: "Okt", value: 145 },
  { month: "Nov", value: 198 },
  { month: "Dec", value: 87 },
  { month: "Jan", value: 120 },
  { month: "Feb", value: 210 },
  { month: "Mar", value: 287 },
];

const RECENT_INQUIRIES = [
  { name: "Ana Kovač", date: "28. mar 2026", msg: "Zanima me prenočitev za 4 osebe...", read: true },
  { name: "Marko Novak", date: "27. mar 2026", msg: "Ali je mogoče organizirati degustacijo...", read: true },
  { name: "Petra Zupan", date: "26. mar 2026", msg: "Pozdravljeni, iščemo lokacijo za...", read: false },
  { name: "Tomaž Krajnc", date: "25. mar 2026", msg: "Imamo skupino 12 ljudi in bi radi...", read: false },
];

/* ══════════════════════════════════════════════════════════════════════ */

export function AnalyticsView({ farm }: { farm: Farm }) {
  const maxView = Math.max(...MONTHLY_VIEWS.map((m) => m.value));

  return (
    <div className="space-y-8">
      {/* ── Stat cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl bg-white border border-earth-200/60 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{stat.icon}</span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  stat.up
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-600"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-forest-900">{stat.value}</p>
            <p className="text-xs text-earth-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Chart placeholder ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-forest-900">Ogledi profila</h3>
            <p className="text-xs text-earth-500">Zadnjih 6 mesecev</p>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-earth-100">
            {["6M", "1L", "Vse"].map((period, i) => (
              <button
                key={period}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                  i === 0
                    ? "bg-white text-forest-800 shadow-sm"
                    : "text-earth-500 hover:text-forest-700"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Simple bar chart */}
        <div className="flex items-end gap-4 h-44">
          {MONTHLY_VIEWS.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-[11px] font-semibold text-forest-800">
                {m.value}
              </span>
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-forest-600 to-forest-400 transition-all duration-500 hover:from-forest-500 hover:to-forest-300"
                style={{ height: `${(m.value / maxView) * 100}%` }}
              />
              <span className="text-[11px] text-earth-500 font-medium">
                {m.month}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Recent inquiries ──────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-forest-900">Zadnja povpraševanja</h3>
            <p className="text-xs text-earth-500">
              {RECENT_INQUIRIES.filter((i) => !i.read).length} neprebranih
            </p>
          </div>
          <button className="text-xs font-semibold text-forest-600 hover:text-forest-800 transition-colors">
            Prikaži vsa
          </button>
        </div>
        <div className="divide-y divide-earth-100">
          {RECENT_INQUIRIES.map((inquiry, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-6 py-4 hover:bg-earth-50/50 transition-colors ${
                !inquiry.read ? "bg-forest-50/30" : ""
              }`}
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${
                !inquiry.read
                  ? "bg-forest-200 text-forest-800"
                  : "bg-earth-100 text-earth-600"
              }`}>
                {inquiry.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-semibold truncate ${!inquiry.read ? "text-forest-900" : "text-earth-700"}`}>
                    {inquiry.name}
                  </p>
                  {!inquiry.read && (
                    <span className="flex-shrink-0 h-2 w-2 rounded-full bg-forest-500" />
                  )}
                </div>
                <p className="text-xs text-earth-500 truncate mt-0.5">{inquiry.msg}</p>
              </div>
              <span className="text-[10px] text-earth-400 flex-shrink-0 mt-1">{inquiry.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
