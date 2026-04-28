"use client";

// =============================================================================
// NaKmetiji.si — Admin · Znamenitosti (client)
// List + filter + add/edit form. Uses server actions from landmark-actions.ts.
// =============================================================================

import { useState, useTransition, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Search,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { upsertLandmark, removeLandmark } from "@/lib/titan/landmark-actions";
import type { LandmarkRow } from "./page";

const KATEGORIJE = [
  { value: "slap", label: "Slap" },
  { value: "gora", label: "Gora / Vrh" },
  { value: "pot", label: "Pot / Trail" },
  { value: "muzej", label: "Muzej / Grad" },
  { value: "jezero", label: "Jezero" },
  { value: "jama", label: "Jama" },
] as const;

type Kategorija = (typeof KATEGORIJE)[number]["value"];

const STATUS_FILTERS = [
  { value: "all", label: "Vse" },
  { value: "verified", label: "Preverjeno" },
  { value: "unverified", label: "Nepreverjeno" },
  { value: "flagged", label: "Označeno" },
  { value: "removed", label: "Odstranjeno" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

export function ZnamenitostiAdminClient({
  initialRows,
  csrf,
}: {
  initialRows: LandmarkRow[];
  csrf: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<LandmarkRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const status = r.verification_status ?? "unverified";
      if (filter !== "all" && status !== filter) return false;
      if (!q) return true;
      return (
        r.ime.toLowerCase().includes(q) ||
        (r.regija ?? "").toLowerCase().includes(q) ||
        (r.opis ?? "").toLowerCase().includes(q)
      );
    });
  }, [rows, filter, search]);

  function applyResult(r: LandmarkRow) {
    setRows((prev) => {
      const idx = prev.findIndex((x) => x.id === r.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = r;
        return next;
      }
      return [r, ...prev].sort((a, b) => a.ime.localeCompare(b.ime, "sl"));
    });
  }

  function handleSaved(saved: LandmarkRow) {
    applyResult(saved);
    setEditing(null);
    setCreating(false);
    setFeedback(`Shranjeno: ${saved.ime}`);
    setTimeout(() => setFeedback(null), 3000);
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFilter(s.value)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-all ${
                filter === s.value
                  ? "bg-forest-700 text-white border-forest-700 shadow-sm"
                  : "bg-white text-forest-800 border-earth-200 hover:border-forest-400"
              }`}
              type="button"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Iskanje po imenu / regiji / opisu"
              className="rounded-full bg-white border border-earth-200 pl-9 pr-3 py-1.5 text-sm w-72 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
            />
          </div>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-forest-700 hover:bg-forest-600 text-white text-sm font-semibold px-4 py-1.5 shadow-sm"
            type="button"
          >
            <Plus size={14} /> Nova
          </button>
        </div>
      </div>

      {feedback && (
        <p className="rounded-xl bg-forest-50 border border-forest-200 px-4 py-2 text-sm text-forest-800">
          {feedback}
        </p>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-earth-200 overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-earth-50 text-earth-500 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Ime</th>
              <th className="px-4 py-3 text-left">Kategorija</th>
              <th className="px-4 py-3 text-left">Regija</th>
              <th className="px-4 py-3 text-left">Citacija</th>
              <th className="px-4 py-3 text-right">—</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-earth-500 italic">
                  Nobena znamenitost ne ustreza filtru.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <Row
                  key={r.id}
                  row={r}
                  onEdit={() => setEditing(r)}
                  csrf={csrf}
                  onRemoved={() =>
                    setRows((prev) =>
                      prev.map((x) =>
                        x.id === r.id
                          ? { ...x, verification_status: "removed" }
                          : x,
                      ),
                    )
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit / create dialog */}
      <AnimatePresence>
        {(editing || creating) && (
          <EditDialog
            row={editing}
            csrf={csrf}
            onClose={() => {
              setEditing(null);
              setCreating(false);
            }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row
// ---------------------------------------------------------------------------

function Row({
  row,
  onEdit,
  onRemoved,
  csrf,
}: {
  row: LandmarkRow;
  onEdit: () => void;
  onRemoved: () => void;
  csrf: string;
}) {
  const [isPending, startTransition] = useTransition();

  const remove = () => {
    if (!confirm(`Označim "${row.ime}" kot odstranjeno?`)) return;
    startTransition(async () => {
      const r = await removeLandmark({ id: row.id, _csrf: csrf });
      if (r.ok) onRemoved();
    });
  };

  return (
    <tr className="border-t border-earth-100 hover:bg-earth-50/40">
      <td className="px-4 py-3">
        <StatusBadge status={row.verification_status ?? "unverified"} />
      </td>
      <td className="px-4 py-3">
        <p className="font-semibold text-forest-900">{row.ime}</p>
        {row.lat !== null && row.lng !== null && (
          <p className="text-[10px] text-earth-400 mt-0.5">
            {row.lat.toFixed(4)}, {row.lng.toFixed(4)}
          </p>
        )}
      </td>
      <td className="px-4 py-3 text-earth-700">{row.kategorija}</td>
      <td className="px-4 py-3 text-earth-700">{row.regija ?? "—"}</td>
      <td className="px-4 py-3 text-earth-700">
        {row.verification_source ? (
          <span className="text-xs">{row.verification_source}</span>
        ) : (
          <span className="text-earth-400 text-xs italic">brez</span>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg text-earth-600 hover:bg-forest-100 hover:text-forest-800 transition-colors"
            type="button"
            aria-label="Uredi"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={remove}
            disabled={isPending || row.verification_status === "removed"}
            className="p-1.5 rounded-lg text-earth-600 hover:bg-red-100 hover:text-red-700 disabled:opacity-30 transition-colors"
            type="button"
            aria-label="Odstrani"
          >
            {isPending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<
    string,
    { label: string; bg: string; fg: string; Icon: typeof CheckCircle2 }
  > = {
    verified:   { label: "Preverjeno",  bg: "bg-forest-50",  fg: "text-forest-700",  Icon: CheckCircle2 },
    unverified: { label: "Nepreverjeno", bg: "bg-amber-50",   fg: "text-amber-700",   Icon: AlertTriangle },
    flagged:    { label: "Označeno",     bg: "bg-amber-100",  fg: "text-amber-800",   Icon: AlertTriangle },
    removed:    { label: "Odstranjeno",  bg: "bg-earth-100",  fg: "text-earth-600",   Icon: XCircle },
  };
  const v = map[status] ?? map.unverified;
  const Icon = v.Icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${v.bg} ${v.fg}`}
    >
      <Icon size={10} /> {v.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Edit dialog
// ---------------------------------------------------------------------------

function EditDialog({
  row,
  csrf,
  onClose,
  onSaved,
}: {
  row: LandmarkRow | null;
  csrf: string;
  onClose: () => void;
  onSaved: (saved: LandmarkRow) => void;
}) {
  const [ime, setIme] = useState(row?.ime ?? "");
  const [kategorija, setKategorija] = useState<Kategorija>(
    (KATEGORIJE.some((k) => k.value === row?.kategorija)
      ? row?.kategorija
      : "slap") as Kategorija,
  );
  const [lat, setLat] = useState(row?.lat?.toString() ?? "");
  const [lng, setLng] = useState(row?.lng?.toString() ?? "");
  const [regija, setRegija] = useState(row?.regija ?? "");
  const [opis, setOpis] = useState(row?.opis ?? "");
  const [zanimivost, setZanimivost] = useState(row?.zanimivost ?? "");
  const [sourceUrl, setSourceUrl] = useState(
    row?.verification_source && /^https?:\/\//.test(row.verification_source)
      ? row.verification_source
      : "",
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    setError(null);
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
      setError("Vnesite veljavna lat/lng (npr. 46.3712).");
      return;
    }
    startTransition(async () => {
      const r = await upsertLandmark({
        id: row?.id ?? null,
        ime: ime.trim(),
        kategorija,
        lat: latNum,
        lng: lngNum,
        regija: regija.trim() || null,
        opis: opis.trim() || null,
        zanimivost: zanimivost.trim() || null,
        source_url: sourceUrl.trim() || null,
        _csrf: csrf,
      });
      if (!r.ok) {
        setError(r.message);
        return;
      }
      onSaved({
        id: r.data.id,
        ime: ime.trim(),
        kategorija,
        lat: latNum,
        lng: lngNum,
        regija: regija.trim() || null,
        opis: opis.trim() || null,
        zanimivost: zanimivost.trim() || null,
        verification_status: sourceUrl.trim() ? "verified" : "unverified",
        verification_source: sourceUrl.trim()
          ? new URL(sourceUrl.trim()).hostname.replace(/^www\./, "")
          : null,
        verification_distance_m: null,
        verified_at: sourceUrl.trim() ? new Date().toISOString() : null,
      });
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 max-h-[92vh] overflow-y-auto"
      >
        <h2 className="font-display font-bold text-2xl text-forest-900 mb-1">
          {row ? "Uredi znamenitost" : "Nova znamenitost"}
        </h2>
        <p className="text-sm text-earth-600 mb-5">
          Z URL-jem viru se status avtomatsko nastavi na <strong>preverjeno</strong>.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth-500 mb-1.5">
              Ime
            </label>
            <input
              value={ime}
              onChange={(e) => setIme(e.target.value)}
              className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm text-forest-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-earth-500 mb-1.5">
                Kategorija
              </label>
              <select
                value={kategorija}
                onChange={(e) => setKategorija(e.target.value as Kategorija)}
                className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm text-forest-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
              >
                {KATEGORIJE.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-earth-500 mb-1.5">
                Regija (slug)
              </label>
              <input
                value={regija}
                onChange={(e) => setRegija(e.target.value)}
                placeholder="gorenjska, primorska …"
                className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm text-forest-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-earth-500 mb-1.5">
                Lat
              </label>
              <input
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="46.3712"
                inputMode="decimal"
                className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm text-forest-900 font-mono focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-earth-500 mb-1.5">
                Lng
              </label>
              <input
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="14.1010"
                inputMode="decimal"
                className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm text-forest-900 font-mono focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth-500 mb-1.5">
              URL viru (vNaravo.si, Slovenia.info, Burger.si …)
            </label>
            <input
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://www.vnaravo.si/…"
              type="url"
              className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm text-forest-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20"
            />
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-forest-700 mt-1.5 hover:text-forest-500"
              >
                Odpri vir <ExternalLink size={11} />
              </a>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth-500 mb-1.5">
              Opis
            </label>
            <textarea
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm text-forest-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-earth-500 mb-1.5">
              Zanimivost (kratka)
            </label>
            <textarea
              value={zanimivost}
              onChange={(e) => setZanimivost(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-earth-200 px-3 py-2.5 text-sm text-forest-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/20 resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={pending}
            className="px-5 py-2.5 rounded-2xl text-sm font-semibold text-earth-700 hover:bg-earth-100 transition-colors"
            type="button"
          >
            Prekliči
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-forest-700 hover:bg-forest-600 text-white text-sm font-bold disabled:opacity-50 transition-all"
            type="button"
          >
            {pending ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Shranjujem…
              </>
            ) : (
              "Shrani"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
