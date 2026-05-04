"use client";

// =============================================================================
// NaKmetiji.si — OceniKmetijoForm
// Ocenjevalni obrazec za gosta (zahteva prijavo).
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Loader2, CheckCircle, LogIn, PenLine } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { oddajMnenje } from "@/lib/actions/mnenja";

const OZNAKE = ["", "Slabo", "Sprejemljivo", "Dobro", "Odlično", "Izvrstno!"];

interface Props {
  kmetijaId: string;
}

export function OceniKmetijoForm({ kmetijaId }: Props) {
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const [ocena, setOcena] = useState(0);
  const [hoverOcena, setHoverOcena] = useState(0);
  const [ime, setIme] = useState("");
  const [komentar, setKomentar] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [napaka, setNapaka] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email ?? "");
        // Use email prefix as default display name
        const defaultIme = user.user_metadata?.full_name
          || user.user_metadata?.name
          || user.email?.split("@")[0]
          || "";
        setIme(defaultIme);
      }
      setAuthLoading(false);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ocena === 0) { setNapaka("Izberite oceno (1–5 zvezdic)."); return; }
    if (!ime.trim()) { setNapaka("Vnesite ime."); return; }
    setSubmitting(true);
    setNapaka(null);

    const result = await oddajMnenje({
      kmetija_id: kmetijaId,
      uporabnik_ime: ime.trim(),
      uporabnik_email: userEmail || null,
      ocena,
      komentar: komentar.trim() || null,
    });

    setSubmitting(false);
    if (result.uspeh) {
      setSuccess(true);
    } else {
      setNapaka(result.napaka ?? "Napaka pri oddaji mnenja.");
    }
  }

  if (authLoading) return null;

  // ── Niste prijavljeni ────────────────────────────────────────────────────
  if (!userId) {
    return (
      <div className="rounded-2xl bg-forest-50 border border-forest-200 p-6 flex flex-col sm:flex-row items-center gap-5">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-forest-100 flex items-center justify-center">
          <PenLine size={22} className="text-forest-600" />
        </div>
        <div className="text-center sm:text-left flex-1">
          <p className="font-semibold text-forest-900 mb-1">Ocenite to kmetijo</p>
          <p className="text-sm text-earth-500">
            Prijavite se, da oddate svojo oceno in pomagate ostalim gostom pri izbiri.
          </p>
        </div>
        <Link
          href={`/prijava?redirect=/kmetije`}
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-forest-600 hover:bg-forest-500 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          <LogIn size={14} />
          Prijava
        </Link>
      </div>
    );
  }

  // ── Uspešna oddaja ───────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-6 flex items-start gap-4">
        <CheckCircle size={24} className="text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-900 mb-1">Hvala za vaše mnenje!</p>
          <p className="text-sm text-emerald-700">
            Vaše mnenje čaka na pregled moderatorja. Po odobritvi bo vidno vsem obiskovalcem — navadno 1–2 delovna dneva.
          </p>
        </div>
      </div>
    );
  }

  // ── Obrazec ──────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-earth-200 p-5 sm:p-6 shadow-sm">
      <h3 className="font-bold text-forest-900 mb-5 flex items-center gap-2">
        <PenLine size={16} className="text-forest-600" />
        Napišite mnenje
      </h3>

      {/* Zvezdice */}
      <div className="mb-5">
        <p className="text-sm font-semibold text-earth-700 mb-2.5">Vaša ocena *</p>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setOcena(s)}
              onMouseEnter={() => setHoverOcena(s)}
              onMouseLeave={() => setHoverOcena(0)}
              aria-label={`${s} zvezdic`}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                size={30}
                className={`transition-colors ${
                  s <= (hoverOcena || ocena)
                    ? "text-amber-400 fill-amber-400"
                    : "text-earth-200 fill-earth-100"
                }`}
              />
            </button>
          ))}
          {(hoverOcena || ocena) > 0 && (
            <span className="ml-2 text-sm font-medium text-amber-700">
              {OZNAKE[hoverOcena || ocena]}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Ime */}
        <div>
          <label className="block text-sm font-semibold text-earth-700 mb-1.5">
            Ime *
          </label>
          <input
            type="text"
            value={ime}
            onChange={(e) => setIme(e.target.value)}
            placeholder="npr. Janez Novak"
            maxLength={80}
            className="w-full px-4 py-2.5 border border-earth-300 rounded-xl text-sm bg-white focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
          />
        </div>

        {/* E-pošta (read-only, from session) */}
        <div>
          <label className="block text-sm font-semibold text-earth-700 mb-1.5">
            E-pošta <span className="text-earth-400 font-normal">(ni javna)</span>
          </label>
          <input
            type="email"
            value={userEmail}
            readOnly
            className="w-full px-4 py-2.5 border border-earth-200 rounded-xl text-sm bg-earth-50 text-earth-500 cursor-not-allowed"
          />
        </div>
      </div>

      {/* Komentar */}
      <div className="mb-5">
        <label className="block text-sm font-semibold text-earth-700 mb-1.5">
          Komentar <span className="text-earth-400 font-normal">(neobvezno)</span>
        </label>
        <textarea
          value={komentar}
          onChange={(e) => setKomentar(e.target.value.slice(0, 1000))}
          rows={3}
          placeholder="Opišite svojo izkušnjo na tej kmetiji…"
          maxLength={1000}
          className="w-full px-4 py-2.5 border border-earth-300 rounded-xl text-sm bg-white focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors resize-none"
        />
        <p className="text-xs text-earth-400 mt-1 text-right">{komentar.length}/1000</p>
      </div>

      {napaka && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-700">
          {napaka}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || ocena === 0}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors text-sm"
      >
        {submitting ? (
          <><Loader2 size={14} className="animate-spin" /> Oddajam…</>
        ) : (
          "Oddaj mnenje"
        )}
      </button>

      <p className="text-xs text-earth-400 mt-3 text-center">
        Mnenje bo javno vidno po pregledu moderatorja.
      </p>
    </form>
  );
}
