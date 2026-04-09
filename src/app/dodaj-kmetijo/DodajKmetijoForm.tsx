"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TreePine, MapPin, Phone, Globe, ChevronRight, ChevronLeft,
  Loader2, CheckCircle,
} from "lucide-react";
import { ustvariKmetijo } from "@/lib/actions/kmetije";
import type { Dozivetje, Regija } from "@/types/database";
import { REGIJA_LABELS, REGIJE } from "@/types/database";

interface Props {
  dozivetja: Dozivetje[];
}

type Korak = 1 | 2 | 3;

const KORAKI = [
  { n: 1, label: "Osnovno" },
  { n: 2, label: "Lokacija" },
  { n: 3, label: "Kontakt" },
];

export function DodajKmetijoForm({ dozivetja }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [korak, setKorak] = useState<Korak>(1);
  const [napaka, setNapaka] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState<string | null>(null);

  // Korak 1 — osnovno
  const [ime, setIme] = useState("");
  const [kratkiOpis, setKratkiOpis] = useState("");
  const [opis, setOpis] = useState("");
  const [izbranaDozivja, setIzbranaDozivja] = useState<string[]>([]);

  // Korak 2 — lokacija
  const [regija, setRegija] = useState<Regija>("gorenjska");
  const [naslov, setNaslov] = useState("");
  const [obcina, setObcina] = useState("");
  const [postnaStevilka, setPostnaStevilka] = useState("");

  // Korak 3 — kontakt
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [spletnaStran, setSpletnaStan] = useState("");

  function toggleDozivje(id: string) {
    setIzbranaDozivja((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  function naslednji() {
    setNapaka(null);
    if (korak === 1) {
      if (!ime.trim()) { setNapaka("Vnesite ime kmetije."); return; }
      if (!opis.trim()) { setNapaka("Vnesite opis kmetije."); return; }
    }
    setKorak((k) => (Math.min(k + 1, 3) as Korak));
  }

  function prejsnji() {
    setNapaka(null);
    setKorak((k) => (Math.max(k - 1, 1) as Korak));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!ime.trim() || !opis.trim()) { setNapaka("Zapolnite obvezna polja."); return; }
    setNapaka(null);

    startTransition(async () => {
      const rezultat = await ustvariKmetijo({
        ime: ime.trim(),
        kratki_opis: kratkiOpis.trim(),
        opis: opis.trim(),
        regija,
        naslov: naslov.trim(),
        obcina: obcina.trim(),
        postna_stevilka: postnaStevilka.trim(),
        kontakt_telefon: telefon.trim(),
        kontakt_email: email.trim(),
        kontakt_spletna_stran: spletnaStran.trim(),
        dozivetja_ids: izbranaDozivja,
      });

      if (!rezultat.uspeh) {
        setNapaka(rezultat.napaka);
        return;
      }

      setUspeh(rezultat.slug);
    });
  }

  // ── Uspeh ────────────────────────────────────────────────────────────────────
  if (uspeh) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-forest-600" />
        </div>
        <h2 className="text-2xl font-bold text-forest-900 mb-3">Kmetija dodana!</h2>
        <p className="text-earth-600 mb-2">
          Vaša kmetija je bila uspešno oddana in čaka na pregled administratorja.
        </p>
        <p className="text-earth-500 text-sm mb-8">
          Ko bo odobrena, bo vidna vsem obiskovalcem. O tem vas bomo obvestili po e-pošti.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-forest-600 hover:bg-forest-500 text-white font-semibold rounded-xl transition-colors"
          >
            Na nadzorno ploščo
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10">
      {/* Glava */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center">
            <TreePine size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-forest-900">Dodaj kmetijo</h1>
            <p className="text-earth-500 text-sm">Registrirajte svojo kmetijo na NaKmetiji</p>
          </div>
        </div>

        {/* Napredek */}
        <div className="flex gap-2 mt-6">
          {KORAKI.map((k) => (
            <div key={k.n} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-colors ${
                  k.n <= korak ? "bg-forest-500" : "bg-earth-200"
                }`}
              />
              <p className={`text-xs mt-1.5 font-medium ${k.n === korak ? "text-forest-700" : "text-earth-400"}`}>
                {k.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Korak 1: Osnovno ──────────────────────────────────────────── */}
      {korak === 1 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              Ime kmetije <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={ime}
              onChange={(e) => setIme(e.target.value)}
              placeholder="npr. Kmetija pri Janežu"
              className="w-full px-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              Kratki opis (max 160 znakov)
            </label>
            <input
              type="text"
              value={kratkiOpis}
              onChange={(e) => setKratkiOpis(e.target.value.slice(0, 160))}
              placeholder="Ena stavčna predstavitev vaše kmetije"
              className="w-full px-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
            />
            <p className="text-xs text-earth-400 mt-1">{kratkiOpis.length}/160</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              Podrobni opis <span className="text-red-500">*</span>
            </label>
            <textarea
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              rows={5}
              placeholder="Opišite svojo kmetijo, ponudbo, zgodovino, posebnosti..."
              className="w-full px-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors resize-none"
            />
          </div>

          {/* Dozivetja */}
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-3">
              Vrsta doživetij (izberite vse, ki veljajo)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {dozivetja.map((d) => {
                const selected = izbranaDozivja.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDozivje(d.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      selected
                        ? "bg-forest-50 border-forest-400 text-forest-800"
                        : "bg-white border-earth-200 text-earth-600 hover:border-earth-300"
                    }`}
                  >
                    <span className="text-base">{d.ikona}</span>
                    <span className="truncate">{d.ime}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Korak 2: Lokacija ─────────────────────────────────────────── */}
      {korak === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              Regija <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" />
              <select
                value={regija}
                onChange={(e) => setRegija(e.target.value as Regija)}
                className="w-full pl-10 pr-4 py-3 border border-earth-300 rounded-xl text-earth-900 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors appearance-none bg-white"
              >
                {REGIJE.map((r) => (
                  <option key={r} value={r}>{REGIJA_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              Ulica in hišna številka
            </label>
            <input
              type="text"
              value={naslov}
              onChange={(e) => setNaslov(e.target.value)}
              placeholder="npr. Kmetijska cesta 5"
              className="w-full px-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">
                Poštna številka
              </label>
              <input
                type="text"
                value={postnaStevilka}
                onChange={(e) => setPostnaStevilka(e.target.value)}
                placeholder="1000"
                className="w-full px-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-1.5">
                Občina
              </label>
              <input
                type="text"
                value={obcina}
                onChange={(e) => setObcina(e.target.value)}
                placeholder="npr. Kranjska Gora"
                className="w-full px-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
              />
            </div>
          </div>

          <p className="text-xs text-earth-400 bg-earth-50 rounded-xl px-4 py-3">
            GPS koordinate bo administrator nastavil ob pregledu vaše vloge.
          </p>
        </div>
      )}

      {/* ── Korak 3: Kontakt ──────────────────────────────────────────── */}
      {korak === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              Telefonska številka
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" />
              <input
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="+386 31 000 000"
                className="w-full pl-10 pr-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              E-poštni naslov kmetije
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="kmetija@primer.si"
              className="w-full px-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5">
              Spletna stran
            </label>
            <div className="relative">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400" />
              <input
                type="url"
                value={spletnaStran}
                onChange={(e) => setSpletnaStan(e.target.value)}
                placeholder="https://www.vasa-kmetija.si"
                className="w-full pl-10 pr-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
              />
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            Po oddaji bo vaša kmetija pregledana v roku 1–3 delovnih dni. O statusu vas obvestimo po e-pošti.
          </div>
        </div>
      )}

      {/* Napaka */}
      {napaka && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {napaka}
        </div>
      )}

      {/* Gumbi */}
      <div className="flex items-center justify-between mt-8">
        {korak > 1 ? (
          <button
            type="button"
            onClick={prejsnji}
            className="flex items-center gap-2 px-5 py-3 border border-earth-300 text-earth-700 font-medium rounded-xl hover:bg-earth-50 transition-colors"
          >
            <ChevronLeft size={16} />
            Nazaj
          </button>
        ) : (
          <div />
        )}

        {korak < 3 ? (
          <button
            type="button"
            onClick={naslednji}
            className="flex items-center gap-2 px-6 py-3 bg-forest-600 hover:bg-forest-500 text-white font-semibold rounded-xl transition-colors"
          >
            Naprej
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 bg-forest-600 hover:bg-forest-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors"
          >
            {isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Pošiljanje...
              </>
            ) : (
              "Oddaj vlogo"
            )}
          </button>
        )}
      </div>
    </form>
  );
}
