"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  TreePine, MapPin, Phone, Globe, ChevronRight, ChevronLeft,
  Loader2, CheckCircle, Sparkles,
} from "lucide-react";
import { ustvariKmetijo } from "@/lib/actions/kmetije";
import type { Dozivetje, Regija, LastnostKey } from "@/types/database";
import { REGIJA_LABELS, REGIJE, LASTNOSTI, LASTNOSTI_LABELS } from "@/types/database";

interface Props {
  dozivetja: Dozivetje[];
}

type Korak = 1 | 2 | 3 | 4;

const KORAKI = [
  { n: 1, label: "Osnovno" },
  { n: 2, label: "Lokacija" },
  { n: 3, label: "Lastnosti" },
  { n: 4, label: "Kontakt" },
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
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");

  // Korak 3 — lastnosti & posebna ponudba
  const [lastnosti, setLastnosti] = useState<LastnostKey[]>([]);
  const [posebnePonudbe, setPosebnePonudbe] = useState("");

  // Korak 4 — kontakt
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [spletnaStran, setSpletnaStan] = useState("");

  function toggleDozivje(id: string) {
    setIzbranaDozivja((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  }

  function toggleLastnost(key: LastnostKey) {
    setLastnosti((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function naslednji() {
    setNapaka(null);
    if (korak === 1) {
      if (!ime.trim()) { setNapaka("Vnesite ime kmetije."); return; }
      if (!opis.trim()) { setNapaka("Vnesite opis kmetije."); return; }
    }
    if (korak === 2) {
      // Validate coords if provided (both or neither)
      const hasLat = latStr.trim().length > 0;
      const hasLng = lngStr.trim().length > 0;
      if (hasLat !== hasLng) {
        setNapaka("Vnesite obe koordinati (širina + dolžina) ali pustite obe prazni.");
        return;
      }
      if (hasLat && hasLng) {
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (Number.isNaN(lat) || lat < 45 || lat > 47) {
          setNapaka("Geografska širina mora biti med 45 in 47 (Slovenija).");
          return;
        }
        if (Number.isNaN(lng) || lng < 13 || lng > 17) {
          setNapaka("Geografska dolžina mora biti med 13 in 17 (Slovenija).");
          return;
        }
      }
    }
    setKorak((k) => (Math.min(k + 1, 4) as Korak));
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
      const lat = latStr.trim() ? parseFloat(latStr) : null;
      const lng = lngStr.trim() ? parseFloat(lngStr) : null;

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
        lastnosti,
        posebne_ponudbe: posebnePonudbe.trim() || undefined,
        lat: lat !== null && !Number.isNaN(lat) ? lat : null,
        lng: lng !== null && !Number.isNaN(lng) ? lng : null,
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

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 space-y-3">
            <div>
              <p className="text-sm font-bold text-forest-900 mb-1">GPS koordinate (priporočeno)</p>
              <p className="text-xs text-earth-600">
                Najdite svoj naslov na <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-forest-700 underline decoration-dotted">Google Maps</a>,
                desni klik na pin → kliknite koordinate, da jih kopirate. Format: 46.3842, 13.9738
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1">
                  Geografska širina (lat)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={latStr}
                  onChange={(e) => setLatStr(e.target.value)}
                  placeholder="46.3842"
                  className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm bg-white focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1">
                  Geografska dolžina (lng)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={lngStr}
                  onChange={(e) => setLngStr(e.target.value)}
                  placeholder="13.9738"
                  className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm bg-white focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400"
                />
              </div>
            </div>
            <p className="text-[11px] text-earth-500">
              Brez koordinat: kmetija se ne bo prikazala na zemljevidu in v road-trip načrtih.
            </p>
          </div>
        </div>
      )}

      {/* ── Korak 3: Lastnosti & posebna ponudba ──────────────────────── */}
      {korak === 3 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-earth-700 mb-2">
              Lastnosti kmetije
            </label>
            <p className="text-xs text-earth-500 mb-3">
              Označite, kar ponujate. Te lastnosti Jože uporablja pri priporočilih.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {LASTNOSTI.map((key) => {
                const meta = LASTNOSTI_LABELS[key];
                const checked = lastnosti.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                      checked
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                        : "bg-white border-earth-200 text-earth-700 hover:border-emerald-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="rounded border-earth-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 flex-shrink-0"
                      checked={checked}
                      onChange={() => toggleLastnost(key)}
                    />
                    <span className="text-base leading-none">{meta.icon}</span>
                    <span className="font-medium leading-tight">{meta.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-earth-700 mb-1.5 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-600" />
              Trenutna posebna ponudba <span className="text-earth-400 font-normal">(neobvezno)</span>
            </label>
            <textarea
              value={posebnePonudbe}
              onChange={(e) => setPosebnePonudbe(e.target.value)}
              placeholder="Npr. Ta teden 10 % popust na nočitev s polpenzionom za pare …"
              rows={3}
              maxLength={400}
              className="w-full px-4 py-3 border border-earth-300 rounded-xl text-sm bg-white focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 resize-none"
            />
            <p className="text-[10px] text-earth-400 mt-1">
              {posebnePonudbe.length} / 400 znakov · Lahko spremenite kadarkoli iz nadzorne plošče.
            </p>
          </div>
        </div>
      )}

      {/* ── Korak 4: Kontakt ──────────────────────────────────────────── */}
      {korak === 4 && (
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

        {korak < 4 ? (
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
