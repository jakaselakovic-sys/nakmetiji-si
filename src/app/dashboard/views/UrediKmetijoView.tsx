"use client";

// =============================================================================
// NaKmetiji.si — UrediKmetijoView
// Dashboard tab: lastnik ureja obstoječe podatke kmetije
// =============================================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
import { posodobiKmetijo } from "@/lib/actions/kmetije";
import { REGIJE, REGIJA_LABELS, type Kmetija, type Dozivetje, type Regija } from "@/types/database";

interface Props {
  kmetija: Kmetija;
  vseDozivetja: Dozivetje[];
  izbranaDozivetjaIds: string[];
}

export function UrediKmetijoView({ kmetija, vseDozivetja, izbranaDozivetjaIds }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [napaka, setNapaka] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState(false);

  // ── Form state — inicializirano iz obstoječih podatkov ──
  const [ime, setIme] = useState(kmetija.ime);
  const [kratki_opis, setKratkiOpis] = useState(kmetija.kratki_opis ?? "");
  const [opis, setOpis] = useState(kmetija.opis);
  const [regija, setRegija] = useState<Regija>(kmetija.regija);
  const [naslov, setNaslov] = useState(kmetija.naslov ?? "");
  const [obcina, setObcina] = useState(kmetija.obcina ?? "");
  const [postna_stevilka, setPostnaStevilka] = useState(kmetija.postna_stevilka ?? "");
  const [kontakt_telefon, setKontaktTelefon] = useState(kmetija.kontaktni_podatki?.telefon ?? "");
  const [kontakt_email, setKontaktEmail] = useState(kmetija.kontaktni_podatki?.email ?? "");
  const [kontakt_spletna_stran, setKontaktSpletna] = useState(kmetija.kontaktni_podatki?.spletna_stran ?? "");
  const [dozivetja_ids, setDozivetjaIds] = useState<string[]>(izbranaDozivetjaIds);

  function toggleDozivetje(id: string) {
    setDozivetjaIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNapaka(null);
    setUspeh(false);

    if (!ime.trim()) { setNapaka("Ime kmetije je obvezno."); return; }
    if (!opis.trim()) { setNapaka("Opis je obvezen."); return; }

    startTransition(async () => {
      const rezultat = await posodobiKmetijo(kmetija.id, {
        ime: ime.trim(),
        kratki_opis: kratki_opis.trim(),
        opis: opis.trim(),
        regija,
        naslov: naslov.trim(),
        obcina: obcina.trim(),
        postna_stevilka: postna_stevilka.trim(),
        kontakt_telefon: kontakt_telefon.trim(),
        kontakt_email: kontakt_email.trim(),
        kontakt_spletna_stran: kontakt_spletna_stran.trim(),
        dozivetja_ids,
      });

      if (rezultat.ok) {
        setUspeh(true);
        router.refresh();
        setTimeout(() => setUspeh(false), 4000);
      } else {
        setNapaka(rezultat.napaka ?? "Napaka pri shranjevanju.");
      }
    });
  }

  const inputClass =
    "w-full px-4 py-2.5 border border-earth-300 rounded-xl text-sm text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors";
  const labelClass = "block text-xs font-semibold text-earth-600 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Osnovna info ─────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Osnovni podatki</h3>
        </div>
        <div className="px-6 py-5 space-y-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ime kmetije *</label>
              <input
                type="text"
                value={ime}
                onChange={(e) => setIme(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Regija *</label>
              <select
                value={regija}
                onChange={(e) => setRegija(e.target.value as Regija)}
                className={inputClass}
              >
                {REGIJE.map((r) => (
                  <option key={r} value={r}>{REGIJA_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>Kratki opis (slogan)</label>
            <input
              type="text"
              value={kratki_opis}
              onChange={(e) => setKratkiOpis(e.target.value)}
              placeholder="Npr. Ekološka kmetija z razgledom na Triglav"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Podroben opis *</label>
            <textarea
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              rows={6}
              required
              className={`${inputClass} resize-y`}
              placeholder="Opišite svojo kmetijo, ponudbo, okolico..."
            />
          </div>
        </div>
      </div>

      {/* ── Lokacija ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Lokacija</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelClass}>Naslov</label>
            <input
              type="text"
              value={naslov}
              onChange={(e) => setNaslov(e.target.value)}
              placeholder="Npr. Planinska cesta 12"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Občina</label>
              <input
                type="text"
                value={obcina}
                onChange={(e) => setObcina(e.target.value)}
                placeholder="Npr. Bled"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Poštna številka</label>
              <input
                type="text"
                value={postna_stevilka}
                onChange={(e) => setPostnaStevilka(e.target.value)}
                placeholder="Npr. 4260"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Kontakt ───────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Kontaktni podatki</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelClass}>Telefon</label>
            <input
              type="tel"
              value={kontakt_telefon}
              onChange={(e) => setKontaktTelefon(e.target.value)}
              placeholder="+386 40 123 456"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>E-pošta</label>
            <input
              type="email"
              value={kontakt_email}
              onChange={(e) => setKontaktEmail(e.target.value)}
              placeholder="kmetija@primer.si"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Spletna stran</label>
            <input
              type="url"
              value={kontakt_spletna_stran}
              onChange={(e) => setKontaktSpletna(e.target.value)}
              placeholder="https://www.moja-kmetija.si"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ── Dozivetja ────────────────────────────────────────────── */}
      {vseDozivetja.length > 0 && (
        <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-earth-200/60">
            <h3 className="text-base font-bold text-forest-900">Doživetja in ponudba</h3>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {vseDozivetja.map((doz) => {
                const checked = dozivetja_ids.includes(doz.id);
                return (
                  <label
                    key={doz.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      checked
                        ? "bg-forest-50 border-forest-300 text-forest-800"
                        : "bg-white border-earth-200 text-earth-600 hover:border-forest-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-earth-300 text-forest-600 focus:ring-forest-500 w-4 h-4"
                      checked={checked}
                      onChange={() => toggleDozivetje(doz.id)}
                    />
                    <span className="text-sm font-medium">{doz.ime}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Napake / uspeh / submit ───────────────────────────────── */}
      {napaka && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {napaka}
        </div>
      )}

      {uspeh && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700 font-medium">
          <CheckCircle size={16} />
          Spremembe so bile uspešno shranjene.
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          Shrani spremembe
        </button>
        <span className="text-xs text-earth-400">
          Spremembe so vidne po administrativni odobritvi.
        </span>
      </div>
    </form>
  );
}
