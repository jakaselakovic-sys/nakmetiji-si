"use client";

// =============================================================================
// NaKmetiji.si — MockBookingForm (Handcrafted Luxury Redesign)
//
// Boutique booking form with 32px radius, illustrative add-on cards,
// serif headings, and spring animations.
// =============================================================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Users, MessageSquare, CheckCircle, Loader2, ArrowRight, ShoppingBag } from "lucide-react";
import { MOCK_BOOKING } from "@/lib/config/demo";
import { DemoBadge, DemoBookingNotice } from "@/components/DemoDisclaimer";

export interface BookingFormProps {
  kmetijaId: string;
  kmetijaIme: string;
  cenaNoc: number | null;
  maxGostov: number | null;
}

interface MockConfirmation {
  id: string;
  kmetijaIme: string;
  datumOd: string;
  datumDo: string;
  steviloOseb: number;
  skupajCena: number;
  gostIme: string;
  gostEmail: string;
  dodatki?: { label: string; price: number }[];
}

const DODATKI_MOCK = [
  { id: "piknik", label: "Domača piknik košarica", price: 25, emoji: "🧺" },
  { id: "kolo", label: "Najem kolesa (cel dan)", price: 15, emoji: "🚲" },
];

function mockReservationId() {
  return "DEMO-" + Math.random().toString(36).slice(2, 9).toUpperCase();
}

function nocitve(od: string, do_: string): number {
  if (!od || !do_) return 0;
  return Math.max(1, Math.round(
    (new Date(do_).getTime() - new Date(od).getTime()) / 86_400_000
  ));
}

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.8 };

export function MockBookingForm({ kmetijaIme, cenaNoc, maxGostov }: BookingFormProps) {
  if (!MOCK_BOOKING) {
    return (
      <div className="card-boutique p-8 text-center text-sm text-amber-800 bg-amber-50 border border-amber-200">
        Pravo rezervacijsko okno bo tukaj v komercialni različici.
      </div>
    );
  }

  return <MockFormInner kmetijaIme={kmetijaIme} cenaNoc={cenaNoc} maxGostov={maxGostov} />;
}

function MockFormInner({
  kmetijaIme,
  cenaNoc,
  maxGostov,
}: Omit<BookingFormProps, "kmetijaId">) {
  const [datumOd, setDatumOd]         = useState("");
  const [datumDo, setDatumDo]         = useState("");
  const [steviloOseb, setSteviloOseb] = useState(2);
  const [gostIme, setGostIme]         = useState("");
  const [gostEmail, setGostEmail]     = useState("");
  const [opombe, setOpombe]           = useState("");
  const [loading, setLoading]         = useState(false);
  const [confirmed, setConfirmed]     = useState<MockConfirmation | null>(null);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [izbraniDodatki, setIzbraniDodatki] = useState<string[]>([]);

  const noci        = nocitve(datumOd, datumDo);
  const dodatkiCena = izbraniDodatki.reduce((sum, id) => sum + DODATKI_MOCK.find(d => d.id === id)!.price, 0);
  const skupajCena  = (cenaNoc ? noci * cenaNoc : 0) + dodatkiCena;
  const today       = new Date().toISOString().split("T")[0];

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!datumOd)               e.datumOd     = "Izberite datum prihoda.";
    if (!datumDo)               e.datumDo     = "Izberite datum odhoda.";
    if (datumDo <= datumOd)     e.datumDo     = "Datum odhoda mora biti po prihodu.";
    if (!gostIme.trim())        e.gostIme     = "Vnesite ime.";
    if (!gostEmail.includes("@")) e.gostEmail = "Vnesite veljavni e-poštni naslov.";
    if (maxGostov && steviloOseb > maxGostov) e.steviloOseb = `Kmetija sprejme največ ${maxGostov} gostov.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    await new Promise(r => setTimeout(r, 1_400 + Math.random() * 600));

    setConfirmed({
      id: mockReservationId(),
      kmetijaIme,
      datumOd,
      datumDo,
      steviloOseb,
      skupajCena,
      gostIme: gostIme.trim(),
      gostEmail: gostEmail.trim(),
      dodatki: izbraniDodatki.map(id => DODATKI_MOCK.find(d => d.id === id)!),
    });
    setLoading(false);
  }

  const inputCls = (field: string) => [
    "w-full px-4 py-3 rounded-2xl border text-sm transition-all duration-300",
    "focus:outline-none focus:ring-2 focus:ring-offset-1",
    errors[field]
      ? "border-red-300 ring-red-300 bg-red-50"
      : "border-earth-200 bg-paper focus:border-forest-400 focus:ring-forest-400/30",
  ].join(" ");

  const labelCls = "block text-xs font-semibold text-earth-600 mb-2";

  // ── Confirmation screen ───────────────────────────────────────────────────

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={SPRING}
        className="card-boutique overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-forest-700 to-forest-800 px-6 py-6 text-white text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, stiffness: 200 }}
            className="flex justify-center mb-3"
          >
            <CheckCircle size={44} className="text-white" />
          </motion.div>
          <h3 className="text-lg font-bold font-display">Rezervacija sprejeta! <DemoBadge className="align-middle ml-1" /></h3>
          <p className="text-sm text-forest-200 mt-1 font-mono">{confirmed.id}</p>
        </div>

        {/* Details */}
        <div className="px-6 py-6 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Kmetija",     value: confirmed.kmetijaIme },
              { label: "Gost",        value: confirmed.gostIme },
              { label: "Prihod",      value: new Date(confirmed.datumOd).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" }) },
              { label: "Odhod",       value: new Date(confirmed.datumDo).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" }) },
              { label: "Noči",        value: String(noci) },
              { label: "Osebe",       value: String(confirmed.steviloOseb) },
            ].map(r => (
              <div key={r.label}>
                <p className="text-[11px] uppercase tracking-wider text-earth-400 font-semibold">{r.label}</p>
                <p className="font-semibold text-earth-900">{r.value}</p>
              </div>
            ))}
          </div>

          {confirmed.skupajCena > 0 && (
            <div className="rounded-2xl bg-forest-50 border border-forest-200 px-5 py-4 flex items-center justify-between">
              <span className="text-xs font-bold text-forest-700 uppercase tracking-wider">Skupaj</span>
              <span className="text-2xl font-black text-forest-900 font-display">{confirmed.skupajCena} €</span>
            </div>
          )}

          {confirmed.dodatki && confirmed.dodatki.length > 0 && (
            <div className="rounded-2xl border border-earth-200 p-4 space-y-1.5">
              <p className="text-xs font-bold text-earth-500 uppercase">Dodatki</p>
              {confirmed.dodatki.map((d, i) => (
                <div key={i} className="flex justify-between text-xs text-earth-700">
                  <span>{d.label}</span>
                  <span className="font-semibold text-earth-900">{d.price} €</span>
                </div>
              ))}
            </div>
          )}

          {/* Simulated vendor link */}
          <div className="bg-forest-900 text-white rounded-2xl p-5 mt-4 shadow-inner">
            <p className="text-xs text-forest-300 mb-2 font-semibold">SIMULACIJA (GAP Analiza)</p>
            <p className="text-[13px] leading-snug mb-3 text-forest-100">
              V komercialni verziji lastnik tukaj prejme SMS na aparat.
              Do takrat pa lahko stestirate <strong>One-Tap Approval</strong> sistem:
            </p>
            <a
              href={`/potrdi?token=${btoa(JSON.stringify(confirmed))}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white text-forest-900 text-sm font-bold rounded-2xl hover:bg-forest-50 transition-colors w-full justify-center"
            >
              Odpri »Potrdi« okno <ArrowRight size={14} />
            </a>
          </div>

          <DemoBookingNotice />

          <button
            onClick={() => {
              setConfirmed(null);
              setDatumOd(""); setDatumDo(""); setGostIme(""); setGostEmail(""); setOpombe("");
            }}
            className="w-full py-3 text-sm font-semibold text-earth-600 border border-earth-200 rounded-2xl hover:bg-earth-50 transition-colors"
          >
            Novo iskanje
          </button>
        </div>
      </motion.div>
    );
  }

  // ── Booking form ──────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="card-boutique overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-earth-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-forest-900 font-display">Dogovorite se za obisk</h3>
          {cenaNoc && (
            <p className="text-sm text-earth-500 mt-0.5">
              <span className="font-bold text-forest-900 text-lg">{cenaNoc} €</span>
              <span className="text-earth-400 ml-1">/ noč</span>
            </p>
          )}
        </div>
        <DemoBadge />
      </div>

      <div className="px-6 py-6 space-y-5">
        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>
              <Calendar size={11} className="inline mr-1" />Prihod
            </label>
            <input
              type="date"
              value={datumOd}
              min={today}
              onChange={e => setDatumOd(e.target.value)}
              className={inputCls("datumOd")}
            />
            {errors.datumOd && <p className="text-xs text-red-600 mt-1">{errors.datumOd}</p>}
          </div>
          <div>
            <label className={labelCls}>
              <Calendar size={11} className="inline mr-1" />Odhod
            </label>
            <input
              type="date"
              value={datumDo}
              min={datumOd || today}
              onChange={e => setDatumDo(e.target.value)}
              className={inputCls("datumDo")}
            />
            {errors.datumDo && <p className="text-xs text-red-600 mt-1">{errors.datumDo}</p>}
          </div>
        </div>

        {/* Price summary */}
        <AnimatePresence>
          {noci > 0 && cenaNoc && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-forest-50 border border-forest-200 rounded-2xl px-5 py-3.5 flex items-center justify-between text-sm">
                <span className="text-earth-600">{cenaNoc} € × {noci} noči</span>
                <span className="font-bold text-forest-900 text-lg">{skupajCena} €</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guests */}
        <div>
          <label className={labelCls}>
            <Users size={11} className="inline mr-1" />Število gostov
          </label>
          <div className="flex items-center gap-3">
            <button type="button"
              onClick={() => setSteviloOseb(Math.max(1, steviloOseb - 1))}
              className="w-10 h-10 rounded-2xl border border-earth-200 text-lg font-bold text-earth-600 hover:bg-earth-50 transition-colors flex items-center justify-center bg-paper"
            >−</button>
            <span className="text-xl font-bold text-forest-900 w-8 text-center font-display">{steviloOseb}</span>
            <button type="button"
              onClick={() => setSteviloOseb(Math.min(maxGostov ?? 20, steviloOseb + 1))}
              className="w-10 h-10 rounded-2xl border border-earth-200 text-lg font-bold text-earth-600 hover:bg-earth-50 transition-colors flex items-center justify-center bg-paper"
            >+</button>
            {maxGostov && <span className="text-xs text-earth-400 ml-1">max {maxGostov}</span>}
          </div>
          {errors.steviloOseb && <p className="text-xs text-red-600 mt-1">{errors.steviloOseb}</p>}
        </div>

        {/* Guest info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Ime in priimek</label>
            <input
              type="text"
              value={gostIme}
              onChange={e => setGostIme(e.target.value)}
              placeholder="Janez Novak"
              className={inputCls("gostIme")}
            />
            {errors.gostIme && <p className="text-xs text-red-600 mt-1">{errors.gostIme}</p>}
          </div>
          <div>
            <label className={labelCls}>E-pošta</label>
            <input
              type="email"
              value={gostEmail}
              onChange={e => setGostEmail(e.target.value)}
              placeholder="janez@email.com"
              className={inputCls("gostEmail")}
            />
            {errors.gostEmail && <p className="text-xs text-red-600 mt-1">{errors.gostEmail}</p>}
          </div>
        </div>

        {/* Illustrative add-on cards */}
        <div className="pt-3 border-t border-earth-100">
          <label className={labelCls}>
            <ShoppingBag size={11} className="inline mr-1" />Dodatki iz shrambe
          </label>
          <div className="grid grid-cols-1 gap-3 mt-2">
            {DODATKI_MOCK.map((dodatek) => {
              const selected = izbraniDodatki.includes(dodatek.id);
              return (
                <motion.label
                  key={dodatek.id}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                    selected
                      ? "border-forest-500 bg-forest-50/60 shadow-sm"
                      : "border-earth-200 bg-paper hover:border-forest-300 hover:bg-forest-50/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => {
                      if (e.target.checked) setIzbraniDodatki(prev => [...prev, dodatek.id]);
                      else setIzbraniDodatki(prev => prev.filter(id => id !== dodatek.id));
                    }}
                    className="sr-only"
                  />
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 ${
                    selected ? "bg-forest-200" : "bg-earth-100"
                  }`}>
                    {dodatek.emoji}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-forest-900">{dodatek.label}</p>
                    <p className="text-xs text-earth-500 mt-0.5">Priljubljena izbira gostov</p>
                  </div>
                  <div className={`text-sm font-bold transition-colors ${
                    selected ? "text-forest-700" : "text-earth-500"
                  }`}>
                    +{dodatek.price} €
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected
                      ? "border-forest-600 bg-forest-600"
                      : "border-earth-300"
                  }`}>
                    {selected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </motion.label>
              );
            })}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>
            <MessageSquare size={11} className="inline mr-1" />Posebne želje
            <span className="text-earth-400 font-normal ml-1">(neobvezno)</span>
          </label>
          <textarea
            value={opombe}
            onChange={e => setOpombe(e.target.value)}
            rows={2}
            placeholder="Alergije, posebne zahteve, čas prihoda..."
            className="w-full px-4 py-3 rounded-2xl border border-earth-200 bg-paper text-sm resize-none focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-400/30 focus:ring-offset-1 transition-all duration-300"
          />
        </div>

        <DemoBookingNotice />

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.97 }}
          className="w-full py-4 bg-forest-700 hover:bg-forest-600 disabled:opacity-50 text-white font-bold rounded-2xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-forest-700/20 hover:shadow-xl hover:shadow-forest-700/30"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Pripravljamo...</>
          ) : (
            <>Rezervirajte svoj košček miru <ArrowRight size={16} /></>
          )}
        </motion.button>
      </div>
    </form>
  );
}
