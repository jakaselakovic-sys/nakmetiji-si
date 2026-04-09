"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { Loader2, Upload, CheckCircle, XCircle, Clock, CalendarDays, Users, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { potrdiRezervacijo, zavrniRezervacijo } from "@/lib/actions/rezervacije";
import { posodobiSlikeKmetije } from "@/lib/actions/kmetije";
import type { Rezervacija, RezervacijaStatus } from "@/types/database";
import { REZERVACIJA_STATUS_LABELS } from "@/types/database";

interface Props {
  kmetijaId: string | null;
  kmetijaIme: string;
  rezervacije: Rezervacija[];
  naslovnaSlika: string;
}

const STATUS_COLORS: Record<RezervacijaStatus, string> = {
  cakanje: "bg-amber-50 text-amber-700 border-amber-200",
  potrjena: "bg-green-50 text-green-700 border-green-200",
  zavrnjena: "bg-red-50 text-red-700 border-red-200",
  preklicana: "bg-earth-100 text-earth-600 border-earth-200",
  zakljucena: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_ICONS: Record<RezervacijaStatus, React.ReactNode> = {
  cakanje: <Clock size={12} />,
  potrjena: <CheckCircle size={12} />,
  zavrnjena: <XCircle size={12} />,
  preklicana: <XCircle size={12} />,
  zakljucena: <CheckCircle size={12} />,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("sl-SI", { day: "numeric", month: "short", year: "numeric" });
}

// ── Koledar zasedenosti ───────────────────────────────────────────────────────

const SL_MONTHS = [
  "Januar","Februar","Marec","April","Maj","Junij",
  "Julij","Avgust","September","Oktober","November","December",
];
const SL_DAYS = ["Po","To","Sr","Če","Pe","So","Ne"];

function OccupancyCalendar({ rezervacije }: { rezervacije: Rezervacija[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-based

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  // Dnevi v mesecu
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Kateri dan v tednu je 1. dan (0=ned → pretvorimo v 0=pon)
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;

  // Zberi zasedene intervale (samo potrjene)
  const zasedeni = rezervacije.filter(r => r.status === "potrjena");

  function isDayBooked(day: number): boolean {
    const d = new Date(year, month, day);
    return zasedeni.some(r => {
      const od = new Date(r.datum_od);
      const do_ = new Date(r.datum_do);
      return d >= od && d < do_;
    });
  }

  function isDayPending(day: number): boolean {
    const d = new Date(year, month, day);
    return rezervacije.some(r => {
      if (r.status !== "cakanje") return false;
      const od = new Date(r.datum_od);
      const do_ = new Date(r.datum_do);
      return d >= od && d < do_;
    });
  }

  function isToday(day: number): boolean {
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
  }

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm p-6">
      {/* Glava */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-forest-900">Zasedenost</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-500 transition-colors"
            aria-label="Prejšnji mesec"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold text-forest-900 w-36 text-center">
            {SL_MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-earth-100 text-earth-500 transition-colors"
            aria-label="Naslednji mesec"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Dnevi v tednu */}
      <div className="grid grid-cols-7 mb-1">
        {SL_DAYS.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-earth-400 py-1">{d}</div>
        ))}
      </div>

      {/* Celice */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const booked = isDayBooked(day);
          const pending = isDayPending(day);
          const todayCell = isToday(day);
          return (
            <div
              key={i}
              className={`
                relative flex items-center justify-center h-8 rounded-lg text-xs font-medium transition-colors
                ${booked ? "bg-forest-500 text-white" : ""}
                ${pending && !booked ? "bg-amber-100 text-amber-800" : ""}
                ${!booked && !pending ? "text-earth-700 hover:bg-earth-50" : ""}
                ${todayCell && !booked && !pending ? "ring-2 ring-forest-400 ring-offset-1" : ""}
                ${todayCell && (booked || pending) ? "ring-2 ring-forest-800 ring-offset-1" : ""}
              `}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-4 mt-4 text-xs text-earth-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-forest-500 flex-shrink-0" /> Zasedeno
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 flex-shrink-0" /> Čaka potrditev
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded ring-2 ring-forest-400 flex-shrink-0" /> Danes
        </span>
      </div>
    </div>
  );
}

export function PregledView({ kmetijaId, rezervacije: initialRez, naslovnaSlika }: Props) {
  const [rezervacije, setRezervacije] = useState(initialRez);
  const [activeFilter, setActiveFilter] = useState<RezervacijaStatus | "vse">("vse");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>(
    naslovnaSlika ? [naslovnaSlika] : []
  );
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [, startTransition] = useTransition();

  // ── Akcije rezervacij ──────────────────────────────────────────────────────
  async function handlePotrditev(id: string) {
    setActionLoading(id);
    setActionError(null);
    const rezultat = await potrdiRezervacijo(id);
    if (rezultat.ok) {
      setRezervacije((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: "potrjena" as RezervacijaStatus } : r)
      );
    } else {
      setActionError(rezultat.napaka ?? "Napaka pri potrditvi.");
    }
    setActionLoading(null);
  }

  async function handleZavrnitev(id: string) {
    setActionLoading(id);
    setActionError(null);
    const rezultat = await zavrniRezervacijo(id);
    if (rezultat.ok) {
      setRezervacije((prev) =>
        prev.map((r) => r.id === id ? { ...r, status: "zavrnjena" as RezervacijaStatus } : r)
      );
    } else {
      setActionError(rezultat.napaka ?? "Napaka pri zavrnitvi.");
    }
    setActionLoading(null);
  }

  // ── Upload slik ─────────────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !kmetijaId) return;
    setUploadError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) { setUploadError("Samo slikovne datoteke."); continue; }
      if (file.size > 5 * 1024 * 1024) { setUploadError("Max 5 MB na datoteko."); continue; }

      const form = new FormData();
      form.append("file", file);
      form.append("kmetija_id", kmetijaId);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: form });
        const json = await res.json() as { url?: string; error?: string };
        if (json.url) {
          setUploadedImages((prev) => [...prev, json.url!]);
          // Persistiraj URL v bazo (slike array kmetije)
          const rezultat = await posodobiSlikeKmetije(kmetijaId, json.url);
          if (!rezultat.ok) {
            setUploadError(rezultat.napaka ?? "Slika je naložena, a ni shranjena v bazi.");
          }
        } else {
          setUploadError(json.error ?? "Napaka pri nalaganju.");
        }
      } catch {
        setUploadError("Napaka pri nalaganju.");
      }
    }
    setUploading(false);
  }, [kmetijaId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    startTransition(() => { handleFileUpload(e.dataTransfer.files); });
  }, [handleFileUpload]);

  // ── Filtri ─────────────────────────────────────────────────────────────────
  const filteredRez = activeFilter === "vse"
    ? rezervacije
    : rezervacije.filter((r) => r.status === activeFilter);

  const pendingCount = rezervacije.filter((r) => r.status === "cakanje").length;
  const filters: (RezervacijaStatus | "vse")[] = ["vse", "cakanje", "potrjena", "zavrnjena", "zakljucena"];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Statistike ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Skupaj rezervacij", value: rezervacije.length, icon: "📋" },
          { label: "Čaka potrditev", value: pendingCount, icon: "⏳", urgent: pendingCount > 0 },
          { label: "Potrjenih", value: rezervacije.filter(r => r.status === "potrjena").length, icon: "✅" },
          { label: "Zaključenih", value: rezervacije.filter(r => r.status === "zakljucena").length, icon: "🏁" },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl bg-white border p-4 shadow-sm ${s.urgent ? "border-amber-300 bg-amber-50" : "border-earth-200/60"}`}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className={`text-2xl font-bold ${s.urgent ? "text-amber-700" : "text-forest-900"}`}>{s.value}</p>
            <p className="text-xs text-earth-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Rezervacije ───────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-forest-900">Rezervacije</h2>
            {pendingCount > 0 && (
              <p className="text-xs text-amber-600 font-medium">{pendingCount} čaka na vašo potrditev</p>
            )}
          </div>
          {/* Filter */}
          <div className="flex gap-1.5 flex-wrap">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                  activeFilter === f
                    ? "bg-forest-600 text-white border-forest-600"
                    : "bg-white text-earth-600 border-earth-200 hover:border-earth-300"
                }`}
              >
                {f === "vse" ? "Vse" : REZERVACIJA_STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {actionError && (
          <div className="mx-6 mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {actionError}
          </div>
        )}

        {filteredRez.length === 0 ? (
          <div className="px-6 py-12 text-center text-earth-400 text-sm">
            Ni rezervacij za izbrani filter.
          </div>
        ) : (
          <div className="divide-y divide-earth-100">
            {filteredRez.map((rez) => (
              <div key={rez.id} className="px-6 py-4">
                {/* Glava vrstice */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-bold text-forest-900">{rez.gost_ime}</p>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[rez.status]}`}>
                        {STATUS_ICONS[rez.status]}
                        {REZERVACIJA_STATUS_LABELS[rez.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-earth-500 flex-wrap">
                      <span className="flex items-center gap-1">
                        <CalendarDays size={12} />
                        {formatDate(rez.datum_od)} — {formatDate(rez.datum_do)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        {rez.stevilo_oseb} {rez.stevilo_oseb === 1 ? "oseba" : "oseb"}
                      </span>
                    </div>
                  </div>

                  {/* Gumbi za cakanje */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {rez.status === "cakanje" && (
                      <>
                        <button
                          onClick={() => handlePotrditev(rez.id)}
                          disabled={actionLoading === rez.id}
                          className="flex items-center gap-1 px-3 py-1.5 bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === rez.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                          Potrdi
                        </button>
                        <button
                          onClick={() => handleZavrnitev(rez.id)}
                          disabled={actionLoading === rez.id}
                          className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <XCircle size={12} />
                          Zavrni
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpandedId(expandedId === rez.id ? null : rez.id)}
                      className="p-1.5 text-earth-400 hover:text-earth-600 transition-colors"
                    >
                      {expandedId === rez.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Razširjeni podrobnosti */}
                {expandedId === rez.id && (
                  <div className="mt-3 pt-3 border-t border-earth-100 space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                      <div>
                        <span className="text-earth-400">E-pošta:</span>{" "}
                        <a href={`mailto:${rez.gost_email}`} className="text-forest-700 hover:underline font-medium">
                          {rez.gost_email}
                        </a>
                      </div>
                      {rez.gost_telefon && (
                        <div>
                          <span className="text-earth-400">Telefon:</span>{" "}
                          <a href={`tel:${rez.gost_telefon}`} className="text-forest-700 hover:underline font-medium">
                            {rez.gost_telefon}
                          </a>
                        </div>
                      )}
                      <div>
                        <span className="text-earth-400">Oddano:</span>{" "}
                        <span className="text-earth-600">{formatDate(rez.ustvarjeno)}</span>
                      </div>
                    </div>
                    {rez.opombe && (
                      <div className="bg-earth-50 rounded-xl px-4 py-3 text-xs text-earth-700">
                        <span className="font-semibold text-earth-500 block mb-1">Opomba gosta:</span>
                        {rez.opombe}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Koledar zasedenosti ───────────────────────────────────── */}
      <OccupancyCalendar rezervacije={rezervacije} />

      {/* ── Upload slik ───────────────────────────────────────────── */}
      {kmetijaId && (
        <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm p-6">
          <h2 className="text-base font-bold text-forest-900 mb-4">Slike kmetije</h2>

          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-forest-400 bg-forest-50"
                : "border-earth-300 hover:border-forest-300 hover:bg-forest-50/30"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-forest-600">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-sm font-medium">Nalaganje...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-earth-400">
                <Upload size={28} />
                <p className="text-sm font-medium text-earth-600">Povlecite slike sem ali kliknite</p>
                <p className="text-xs">JPG, PNG, WebP — max 5 MB</p>
              </div>
            )}
          </div>

          {uploadError && (
            <p className="mt-2 text-xs text-red-600">{uploadError}</p>
          )}

          {/* Galerija */}
          {uploadedImages.length > 0 && (
            <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {uploadedImages.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setUploadedImages((prev) => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 right-1 h-6 w-6 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Ni kmetije ────────────────────────────────────────────── */}
      {!kmetijaId && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center">
          <p className="text-amber-800 font-semibold mb-2">Nimate registrirane kmetije</p>
          <p className="text-amber-700 text-sm mb-4">Dodajte svojo kmetijo in začnite sprejemati rezervacije.</p>
          <a
            href="/dodaj-kmetijo"
            className="inline-block px-5 py-2.5 bg-forest-600 hover:bg-forest-500 text-white font-semibold rounded-xl text-sm transition-colors"
          >
            Dodaj kmetijo
          </a>
        </div>
      )}
    </div>
  );
}
