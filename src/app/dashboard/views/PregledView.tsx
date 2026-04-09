"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { Loader2, Upload, CheckCircle, XCircle, Clock, CalendarDays, Users, ChevronDown, ChevronUp } from "lucide-react";
import { potrdiRezervacijo, zavrniRezervacijo } from "@/lib/actions/rezervacije";
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
