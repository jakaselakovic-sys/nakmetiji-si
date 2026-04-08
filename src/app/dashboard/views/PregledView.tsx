"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Farm,
  REZERVACIJA_STATUS_LABELS,
  type RezervacijaStatus,
  type Rezervacija,
} from "@/types";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { notifyGuest } from "@/lib/edge-functions";

// ─── Mock rezervacije ──────────────────────────────────────────────────────

const MOCK_REZERVACIJE: Rezervacija[] = [
  {
    id: "r1",
    kmetija_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    gost_ime: "Ana Kovač",
    gost_email: "ana.kovac@email.si",
    gost_telefon: "+386 41 123 456",
    stevilo_oseb: 4,
    datum_od: "2026-04-10",
    datum_do: "2026-04-13",
    opombe: "Imamo majhnega otroka (2 leti). Ali imate otroško posteljico?",
    status: "cakanje",
    ustvarjeno: "2026-04-03T14:22:00Z",
    posodobljeno: "2026-04-03T14:22:00Z",
  },
  {
    id: "r2",
    kmetija_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    gost_ime: "Marko Novak",
    gost_email: "marko.novak@email.si",
    gost_telefon: "+386 40 987 654",
    stevilo_oseb: 2,
    datum_od: "2026-04-18",
    datum_do: "2026-04-20",
    opombe: null,
    status: "cakanje",
    ustvarjeno: "2026-04-04T09:10:00Z",
    posodobljeno: "2026-04-04T09:10:00Z",
  },
  {
    id: "r3",
    kmetija_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    gost_ime: "Petra Zupan",
    gost_email: "petra.z@email.si",
    gost_telefon: null,
    stevilo_oseb: 6,
    datum_od: "2026-04-25",
    datum_do: "2026-04-27",
    opombe: "Skupina prijateljev, zanima nas tudi degustacija.",
    status: "potrjena",
    ustvarjeno: "2026-03-28T16:45:00Z",
    posodobljeno: "2026-03-29T08:00:00Z",
  },
  {
    id: "r4",
    kmetija_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    gost_ime: "Tomaž Krajnc",
    gost_email: "tomaz@krajnc.si",
    gost_telefon: "+386 31 555 777",
    stevilo_oseb: 3,
    datum_od: "2026-04-05",
    datum_do: "2026-04-06",
    opombe: null,
    status: "zakljucena",
    ustvarjeno: "2026-03-20T11:30:00Z",
    posodobljeno: "2026-04-06T18:00:00Z",
  },
  {
    id: "r5",
    kmetija_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    gost_ime: "Maja Horvat",
    gost_email: "maja.h@email.si",
    gost_telefon: null,
    stevilo_oseb: 2,
    datum_od: "2026-04-12",
    datum_do: "2026-04-14",
    opombe: "Vegetarijansko prehrano prosim.",
    status: "zavrnjena",
    ustvarjeno: "2026-04-01T13:00:00Z",
    posodobljeno: "2026-04-02T09:15:00Z",
  },
];

// ─── Status badge barve ────────────────────────────────────────────────────

const STATUS_COLORS: Record<RezervacijaStatus, string> = {
  cakanje: "bg-amber-50 text-amber-700 border-amber-200",
  potrjena: "bg-green-50 text-green-700 border-green-200",
  zavrnjena: "bg-red-50 text-red-600 border-red-200",
  preklicana: "bg-earth-100 text-earth-600 border-earth-200",
  zakljucena: "bg-forest-50 text-forest-700 border-forest-200",
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "short",
  });
}

function formatDateRange(od: string, do_: string): string {
  return `${formatDate(od)} — ${formatDate(do_)}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function PregledView({ farm }: { farm: Farm }) {
  // ── Quick Actions state ──
  const [isAvailable, setIsAvailable] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);

  // ── Rezervacije state ──
  const [rezervacije, setRezervacije] = useState(MOCK_REZERVACIJE);
  const [activeFilter, setActiveFilter] = useState<RezervacijaStatus | "vse">("vse");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── Image upload state ──
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // ── Toggle Zasedeno/Prosto ──
  const handleStatusToggle = async () => {
    setStatusLoading(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 600));
    setIsAvailable((prev) => !prev);
    setStatusLoading(false);
  };

  // ── Rezervacija akcije ──
  const handleReservationAction = async (id: string, newStatus: RezervacijaStatus) => {
    setRezervacije((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status: newStatus, posodobljeno: new Date().toISOString() } : r
      )
    );

    // Pošlji email gostu ob potrditvi/zavrnitvi
    const rez = rezervacije.find((r) => r.id === id);
    if (rez && (newStatus === "potrjena" || newStatus === "zavrnjena")) {
      notifyGuest({
        type: newStatus === "potrjena" ? "potrditev" : "zavrnitev",
        farmName: farm.name,
        farmOwnerEmail: farm.contact?.email || "",
        guestName: rez.gost_ime,
        guestEmail: rez.gost_email,
        dateFrom: rez.datum_od,
        dateTo: rez.datum_do,
        reservationId: rez.id,
      });
    }
  };

  // ── Image Upload ──
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadError(null);
    setUploading(true);

    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      // Validate
      if (!file.type.startsWith("image/")) {
        setUploadError("Dovoljene so samo slikovne datoteke (JPG, PNG, WebP).");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Največja dovoljena velikost je 5 MB.");
        continue;
      }

      try {
        const supabase = createSupabaseBrowser();
        const ext = file.name.split(".").pop() || "jpg";
        const fileName = `${farm.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error } = await supabase.storage
          .from("farm-images")
          .upload(fileName, file, { cacheControl: "3600", upsert: false });

        if (error) {
          // In mock/demo mode, create a local preview instead
          const url = URL.createObjectURL(file);
          newImages.push(url);
        } else {
          const { data: urlData } = supabase.storage
            .from("farm-images")
            .getPublicUrl(fileName);
          newImages.push(urlData.publicUrl);
        }
      } catch {
        // Fallback: create local preview for demo
        const url = URL.createObjectURL(file);
        newImages.push(url);
      }
    }

    setUploadedImages((prev) => [...prev, ...newImages]);
    setUploading(false);
  }, [farm.id]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const removeUploadedImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Filtered rezervacije ──
  const filteredRezervacije =
    activeFilter === "vse"
      ? rezervacije
      : rezervacije.filter((r) => r.status === activeFilter);

  const pendingCount = rezervacije.filter((r) => r.status === "cakanje").length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ════════════════════════════════════════════════════════════════════
          QUICK ACTIONS
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-start gap-3 pb-4 border-b border-earth-200/60 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-50 text-forest-600 flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-forest-900">Hitre akcije</h2>
            <p className="text-sm text-earth-500">Upravljajte status vaše kmetije</p>
          </div>
        </div>

        {/* Status toggle — velik, touch-friendly */}
        <button
          onClick={handleStatusToggle}
          disabled={statusLoading}
          className={`w-full rounded-2xl p-6 transition-all duration-500 active:scale-[0.98] border-2 ${
            isAvailable
              ? "bg-gradient-to-br from-green-50 to-forest-50 border-green-300 shadow-green-100/50"
              : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 shadow-amber-100/50"
          } shadow-lg`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Animated status indicator */}
              <div className={`relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-500 ${
                isAvailable
                  ? "bg-green-500 shadow-lg shadow-green-300/40"
                  : "bg-amber-500 shadow-lg shadow-amber-300/40"
              }`}>
                {isAvailable ? (
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                {/* Pulse animation when available */}
                {isAvailable && (
                  <span className="absolute inset-0 rounded-2xl bg-green-400 animate-ping opacity-20" />
                )}
              </div>

              <div className="text-left">
                <p className={`text-xl font-bold ${isAvailable ? "text-green-800" : "text-amber-800"}`}>
                  {statusLoading ? "Posodabljam..." : isAvailable ? "Prosto" : "Zasedeno"}
                </p>
                <p className={`text-sm mt-0.5 ${isAvailable ? "text-green-600/70" : "text-amber-600/70"}`}>
                  {isAvailable
                    ? "Vaša kmetija sprejema goste"
                    : "Trenutno ne sprejemate novih gostov"}
                </p>
              </div>
            </div>

            {/* Toggle indicator */}
            <div className={`flex-shrink-0 relative w-16 h-9 rounded-full transition-colors duration-500 ${
              isAvailable ? "bg-green-500" : "bg-amber-500"
            }`}>
              <span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-500 ${
                isAvailable ? "translate-x-8" : "translate-x-1"
              }`} />
            </div>
          </div>
        </button>

        {/* Quick stat cards */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="rounded-xl bg-white border border-earth-200/60 p-4 shadow-sm">
            <p className="text-2xl font-bold text-forest-900">{pendingCount}</p>
            <p className="text-xs text-earth-500 mt-0.5">Čaka na potrditev</p>
          </div>
          <div className="rounded-xl bg-white border border-earth-200/60 p-4 shadow-sm">
            <p className="text-2xl font-bold text-forest-900">
              {rezervacije.filter((r) => r.status === "potrjena").length}
            </p>
            <p className="text-xs text-earth-500 mt-0.5">Potrjene rezervacije</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          REZERVACIJE
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-start gap-3 pb-4 border-b border-earth-200/60 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-50 text-forest-600 flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-forest-900">Rezervacije</h2>
              {pendingCount > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-bold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </div>
            <p className="text-sm text-earth-500">Upravljajte prihajajočih gostov</p>
          </div>
        </div>

        {/* Filter tabs — horizontal scroll on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1 scrollbar-none">
          {(["vse", "cakanje", "potrjena", "zavrnjena", "zakljucena"] as const).map((filter) => {
            const count =
              filter === "vse"
                ? rezervacije.length
                : rezervacije.filter((r) => r.status === filter).length;
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeFilter === filter
                    ? "bg-forest-700 text-white shadow-md"
                    : "bg-white text-earth-600 border border-earth-200 hover:border-forest-300"
                }`}
              >
                {filter === "vse" ? "Vse" : REZERVACIJA_STATUS_LABELS[filter]}
                <span className={`text-xs ${activeFilter === filter ? "text-white/70" : "text-earth-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reservation cards */}
        <div className="space-y-3 mt-3">
          {filteredRezervacije.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-earth-200/60">
              <div className="mx-auto w-12 h-12 bg-earth-100 rounded-full flex items-center justify-center mb-3">
                <svg className="h-6 w-6 text-earth-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-earth-600">Ni rezervacij za prikaz</p>
            </div>
          ) : (
            filteredRezervacije.map((rez) => {
              const isExpanded = expandedId === rez.id;
              const isPending = rez.status === "cakanje";

              return (
                <div
                  key={rez.id}
                  className={`rounded-2xl bg-white border shadow-sm overflow-hidden transition-all ${
                    isPending ? "border-amber-200 ring-1 ring-amber-100" : "border-earth-200/60"
                  }`}
                >
                  {/* Card header — tap to expand */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : rez.id)}
                    className="w-full text-left px-5 py-4 flex items-center gap-4"
                  >
                    {/* Avatar */}
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold flex-shrink-0 ${
                      isPending
                        ? "bg-amber-100 text-amber-700"
                        : "bg-forest-100 text-forest-700"
                    }`}>
                      {rez.gost_ime.split(" ").map((n) => n[0]).join("")}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-forest-900 truncate">
                          {rez.gost_ime}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STATUS_COLORS[rez.status]}`}>
                          {REZERVACIJA_STATUS_LABELS[rez.status]}
                        </span>
                      </div>
                      <p className="text-xs text-earth-500 mt-0.5">
                        {formatDateRange(rez.datum_od, rez.datum_do)} &middot; {rez.stevilo_oseb} {rez.stevilo_oseb === 1 ? "oseba" : rez.stevilo_oseb < 5 ? "osebe" : "oseb"}
                      </p>
                    </div>

                    {/* Expand chevron */}
                    <svg
                      className={`h-5 w-5 text-earth-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-earth-100 pt-4 space-y-4 animate-fade-in">
                      {/* Contact info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-2 text-sm text-earth-600">
                          <svg className="h-4 w-4 text-earth-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a href={`mailto:${rez.gost_email}`} className="text-forest-600 hover:underline truncate">
                            {rez.gost_email}
                          </a>
                        </div>
                        {rez.gost_telefon && (
                          <div className="flex items-center gap-2 text-sm text-earth-600">
                            <svg className="h-4 w-4 text-earth-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <a href={`tel:${rez.gost_telefon}`} className="text-forest-600 hover:underline">
                              {rez.gost_telefon}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Notes */}
                      {rez.opombe && (
                        <div className="rounded-xl bg-earth-50 p-3 border border-earth-200/60">
                          <p className="text-xs font-semibold text-earth-500 mb-1">Opombe gosta:</p>
                          <p className="text-sm text-earth-700">{rez.opombe}</p>
                        </div>
                      )}

                      {/* Action buttons — only for pending */}
                      {isPending && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleReservationAction(rez.id, "potrjena")}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white font-semibold py-3.5 text-sm shadow-md shadow-green-200/50 hover:bg-green-500 active:scale-[0.97] transition-all"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Potrdi
                          </button>
                          <button
                            onClick={() => handleReservationAction(rez.id, "zavrnjena")}
                            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white text-red-600 font-semibold py-3.5 text-sm border-2 border-red-200 hover:bg-red-50 active:scale-[0.97] transition-all"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Zavrni
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          IMAGE UPLOAD
          ════════════════════════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-start gap-3 pb-4 border-b border-earth-200/60 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-50 text-forest-600 flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-forest-900">Hitri upload slik</h2>
            <p className="text-sm text-earth-500">Dodajte fotografije neposredno v galerijo</p>
          </div>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 ${
            dragActive
              ? "border-forest-500 bg-forest-50 scale-[1.02]"
              : "border-earth-300 bg-white hover:border-forest-400 hover:bg-forest-50/30"
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

          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all ${
            dragActive ? "bg-forest-200 text-forest-700" : "bg-earth-100 text-earth-400"
          }`}>
            {uploading ? (
              <svg className="animate-spin h-7 w-7" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            )}
          </div>

          <p className="text-sm font-semibold text-forest-900 mb-1">
            {uploading ? "Nalagam slike..." : dragActive ? "Spustite slike tukaj" : "Tapnite ali povlecite slike"}
          </p>
          <p className="text-xs text-earth-500">
            JPG, PNG ali WebP &middot; Največ 5 MB na sliko
          </p>
        </div>

        {/* Error */}
        {uploadError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {uploadError}
          </div>
        )}

        {/* Uploaded images preview */}
        {uploadedImages.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-semibold text-forest-900 mb-3">
              Naložene slike ({uploadedImages.length})
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {uploadedImages.map((url, i) => (
                <div key={i} className="group relative aspect-square rounded-xl overflow-hidden border border-earth-200 shadow-sm">
                  <Image
                    src={url}
                    alt={`Naložena ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="150px"
                    unoptimized
                  />
                  <button
                    onClick={(e) => { e.stopPropagation(); removeUploadedImage(i); }}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
