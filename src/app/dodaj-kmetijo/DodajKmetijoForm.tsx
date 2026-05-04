"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  TreePine, MapPin, Phone, Globe, ChevronRight, ChevronLeft,
  Loader2, CheckCircle, Sparkles, Euro, Users, AtSign,
  Link as LinkIcon, Upload, X, Info,
} from "lucide-react";
import { ustvariKmetijo, posodobiNaslovnoSliko, posodobiSlikeKmetije } from "@/lib/actions/kmetije";
import { compressImage, formatBytes } from "@/lib/compress";
import type { Dozivetje, Regija, LastnostKey } from "@/types/database";
import { REGIJA_LABELS, REGIJE, LASTNOSTI, LASTNOSTI_LABELS } from "@/types/database";

// Lucide icon names stored in DB → emoji fallback
const IKONA_EMOJI: Record<string, string> = {
  Bed: "🛏️", UtensilsCrossed: "🍽️", Wine: "🍷", Horse: "🐴",
  Flower2: "🌸", Tractor: "🚜", Mountain: "⛰️", Baby: "👶",
  Fish: "🎣", Bike: "🚵", Tent: "⛺", Leaf: "🌿",
  Camera: "📷", Music: "🎶", Star: "⭐", Flame: "🔥",
};
function dozivetjeIkona(ikona: string): string {
  return IKONA_EMOJI[ikona] ?? ikona;
}

interface Props {
  dozivetja: Dozivetje[];
}

type Korak = 1 | 2 | 3 | 4 | 5;

const KORAKI: { n: Korak; label: string }[] = [
  { n: 1, label: "Osnovno" },
  { n: 2, label: "Lokacija" },
  { n: 3, label: "Ponudba" },
  { n: 4, label: "Slike" },
  { n: 5, label: "Kontakt" },
];

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-earth-800 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-earth-400 mt-1">{hint}</p>}
    </div>
  );
}

const INPUT = "w-full px-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors bg-white";
const INPUT_ICON = "w-full pl-10 pr-4 py-3 border border-earth-300 rounded-xl text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors bg-white";

interface ImageUploadSlotProps {
  preview: string;
  file: File | null;
  urlValue: string;
  onFile: (f: File) => void;
  onUrlChange: (v: string) => void;
  onRemove: () => void;
  placeholder: string;
}

function ImageUploadSlot({ preview, file, urlValue, onFile, onUrlChange, onRemove, placeholder }: ImageUploadSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showUrl, setShowUrl] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) onFile(f);
  }

  if (preview) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-earth-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Predogled" className="w-full h-44 object-cover" />
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center transition-colors"
          aria-label="Odstrani sliko"
        >
          <X size={14} />
        </button>
        {file && (
          <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-md">
            {formatBytes(file.size)}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-earth-300 rounded-xl h-44 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-forest-400 hover:bg-forest-50/60 transition-colors"
      >
        <Upload size={24} className="text-earth-400" />
        <p className="text-sm font-medium text-earth-600">{placeholder}</p>
        <p className="text-xs text-earth-400">PNG, JPG, WebP · klikni ali povleci</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      <button
        type="button"
        onClick={() => setShowUrl((v) => !v)}
        className="text-xs text-earth-400 hover:text-forest-700 underline decoration-dotted transition-colors"
      >
        {showUrl ? "Skrij URL polje" : "Ali vnesi URL slike"}
      </button>
      {showUrl && (
        <input
          type="url"
          value={urlValue}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://..."
          className="w-full px-3 py-2.5 border border-earth-300 rounded-xl text-sm bg-white focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400"
        />
      )}
    </div>
  );
}

export function DodajKmetijoForm({ dozivetja }: Props) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [korak, setKorak] = useState<Korak>(1);
  const [napaka, setNapaka] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState<string | null>(null);

  // Korak 1 — osnovno
  const [ime, setIme] = useState("");
  const [kratkiOpis, setKratkiOpis] = useState("");
  const [opis, setOpis] = useState("");
  const [izbranaDozivja, setIzbranaDozivja] = useState<string[]>([]);
  const [drugoDozivje, setDrugoDozivje] = useState(false);
  const [drugoDozivjeTekst, setDrugoDozivjeTekst] = useState("");

  // Korak 2 — lokacija
  const [regija, setRegija] = useState<Regija>("gorenjska");
  const [naslov, setNaslov] = useState("");
  const [obcina, setObcina] = useState("");
  const [postnaStevilka, setPostnaStevilka] = useState("");
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");

  // Korak 3 — ponudba & cene
  const [cenaNoc, setCenaNoc] = useState("");
  const [maxGostov, setMaxGostov] = useState("4");
  const [lastnosti, setLastnosti] = useState<LastnostKey[]>([]);
  const [drugoLastnost, setDrugoLastnost] = useState(false);
  const [drugoLastnostTekst, setDrugoLastnostTekst] = useState("");
  const [posebnePonudbe, setPosebnePonudbe] = useState("");

  // Korak 4 — slike (file takes priority over URL)
  const [naslovnaFile, setNaslovnaFile] = useState<File | null>(null);
  const [naslovnaPreview, setNaslovnaPreview] = useState<string>("");
  const [naslovnaUrl, setNaslovnaUrl] = useState("");
  const [dodatneFiles, setDodatneFiles] = useState<(File | null)[]>([null, null, null]);
  const [dodatnePreviews, setDodatnePreviews] = useState<string[]>(["", "", ""]);
  const [dodatneUrls, setDodatneUrls] = useState(["", "", ""]);

  // Korak 5 — kontakt
  const [telefon, setTelefon] = useState("");
  const [email, setEmail] = useState("");
  const [spletnaStran, setSpletnaStran] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

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
      if (!opis.trim()) { setNapaka("Vnesite podrobni opis kmetije."); return; }
      if (kratkiOpis.trim().length === 0) { setNapaka("Vnesite kratki opis (prikazuje se na kartici kmetije)."); return; }
    }
    if (korak === 2) {
      if (!naslov.trim()) { setNapaka("Vnesite ulico in hišno številko."); return; }
      if (!obcina.trim()) { setNapaka("Vnesite občino."); return; }
      const hasLat = latStr.trim().length > 0;
      const hasLng = lngStr.trim().length > 0;
      if (hasLat !== hasLng) {
        setNapaka("Vnesite obe koordinati ali pustite obe prazni.");
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
    if (korak === 3) {
      if (!cenaNoc.trim()) { setNapaka("Vnesite ceno na noč."); return; }
      const cena = parseFloat(cenaNoc);
      if (Number.isNaN(cena) || cena <= 0) { setNapaka("Cena mora biti pozitivno število."); return; }
      const max = parseInt(maxGostov);
      if (Number.isNaN(max) || max < 1 || max > 100) { setNapaka("Max. gostov mora biti med 1 in 100."); return; }
    }
    if (korak === 4) {
      if (!naslovnaFile && !naslovnaUrl.trim()) {
        setNapaka("Naslovna fotografija je obvezna. Kmetija brez slike ne bo vidna na portalu.");
        return;
      }
      if (!naslovnaFile && naslovnaUrl.trim() && !naslovnaUrl.startsWith("https://")) {
        setNapaka("URL naslovne fotografije mora začeti z https://");
        return;
      }
    }
    setKorak((k) => (Math.min(k + 1, 5) as Korak));
  }

  function prejsnji() {
    setNapaka(null);
    setKorak((k) => (Math.max(k - 1, 1) as Korak));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNapaka(null);

    if (!naslovnaFile && !naslovnaUrl.trim()) {
      setNapaka("Naslovna fotografija je obvezna.");
      return;
    }

    setIsPending(true);
    try {
      const lat = latStr.trim() ? parseFloat(latStr) : null;
      const lng = lngStr.trim() ? parseFloat(lngStr) : null;

      // Step 1 — create farm (no images yet)
      setUploadStatus("Ustvarjam kmetijo…");
      const rezultat = await ustvariKmetijo({
        ime: ime.trim(),
        kratki_opis: kratkiOpis.trim(),
        opis: opis.trim(),
        regija,
        naslov: naslov.trim(),
        obcina: obcina.trim(),
        postna_stevilka: postnaStevilka.trim(),
        cena_noc: parseFloat(cenaNoc),
        max_gostov: parseInt(maxGostov),
        kontakt_telefon: telefon.trim(),
        kontakt_email: email.trim(),
        kontakt_spletna_stran: spletnaStran.trim(),
        kontakt_instagram: instagram.trim() || undefined,
        kontakt_facebook: facebook.trim() || undefined,
        dozivetja_ids: izbranaDozivja,
        lastnosti,
        posebne_ponudbe: [
          posebnePonudbe.trim(),
          drugoDozivje && drugoDozivjeTekst.trim() ? `Drugo doživetje: ${drugoDozivjeTekst.trim()}` : "",
          drugoLastnost && drugoLastnostTekst.trim() ? `Druga lastnost: ${drugoLastnostTekst.trim()}` : "",
        ].filter(Boolean).join(" | ") || undefined,
        lat: lat !== null && !Number.isNaN(lat) ? lat : null,
        lng: lng !== null && !Number.isNaN(lng) ? lng : null,
      });

      if (!rezultat.uspeh) { setNapaka(rezultat.napaka); return; }

      const farmId = rezultat.id;
      let naslovnaFinalUrl = naslovnaUrl.trim();

      // Step 2 — upload cover image
      if (naslovnaFile) {
        setUploadStatus("Nalagam naslovno fotografijo…");
        const { file: compressed } = await compressImage(naslovnaFile, { maxWidth: 1600, maxHeight: 1200 });
        const fd = new FormData();
        fd.append("file", compressed);
        fd.append("kmetija_id", farmId);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json() as { url?: string; napaka?: string };
        if (data.url) {
          naslovnaFinalUrl = data.url;
        } else {
          setNapaka(data.napaka ?? "Napaka pri nalaganju naslovne slike.");
          return;
        }
      }

      if (naslovnaFinalUrl) {
        await posodobiNaslovnoSliko(farmId, naslovnaFinalUrl);
        await posodobiSlikeKmetije(farmId, naslovnaFinalUrl);
      }

      // Step 3 — upload additional images
      for (let i = 0; i < 3; i++) {
        const file = dodatneFiles[i];
        const url = dodatneUrls[i].trim();
        if (file) {
          setUploadStatus(`Nalagam fotografijo ${i + 2} od 4…`);
          const { file: compressed } = await compressImage(file, { maxWidth: 1600, maxHeight: 1200 });
          const fd = new FormData();
          fd.append("file", compressed);
          fd.append("kmetija_id", farmId);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json() as { url?: string };
          if (data.url) await posodobiSlikeKmetije(farmId, data.url);
        } else if (url.startsWith("https://")) {
          await posodobiSlikeKmetije(farmId, url);
        }
      }

      setUspeh(rezultat.slug);
    } catch (err) {
      setNapaka("Prišlo je do napake. Poskusite znova.");
      console.error(err);
    } finally {
      setIsPending(false);
      setUploadStatus(null);
    }
  }

  if (uspeh) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <div className="w-20 h-20 rounded-full bg-forest-100 flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-forest-600" />
        </div>
        <h2 className="text-2xl font-bold text-forest-900 mb-3">Vloga oddana!</h2>
        <p className="text-earth-600 mb-2">
          Vaša kmetija je oddana in čaka na pregled administratorja.
        </p>
        <p className="text-earth-500 text-sm mb-8">
          Pregled traja 1–3 delovne dni. Po odobritvi bo kmetija vidna vsem obiskovalcem.
          Obvestilo bo prišlo na vaš e-poštni naslov.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="px-6 py-3 bg-forest-600 hover:bg-forest-500 text-white font-semibold rounded-xl transition-colors"
        >
          Na nadzorno ploščo
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-10">
      {/* Glava */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-forest-600 flex items-center justify-center flex-shrink-0">
            <TreePine size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-forest-900">Dodaj kmetijo</h1>
            <p className="text-earth-500 text-sm">Registrirajte svojo kmetijo na NaKmetiji.si</p>
          </div>
        </div>

        {/* Napredek */}
        <div className="flex gap-1.5 mt-6">
          {KORAKI.map((k) => (
            <div key={k.n} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${k.n <= korak ? "bg-forest-500" : "bg-earth-200"}`} />
              <p className={`text-[11px] mt-1.5 font-medium ${k.n === korak ? "text-forest-700" : "text-earth-400"}`}>
                {k.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Korak 1: Osnovno ─────────────────────────────────────────── */}
      {korak === 1 && (
        <div className="space-y-5">
          <Field label="Ime kmetije" required>
            <input
              type="text"
              value={ime}
              onChange={(e) => setIme(e.target.value)}
              placeholder="npr. Kmetija pri Janežu"
              className={INPUT}
            />
          </Field>

          <Field
            label="Kratki opis"
            required
            hint={`${kratkiOpis.length}/160 znakov — prikazuje se na kartici kmetije`}
          >
            <input
              type="text"
              value={kratkiOpis}
              onChange={(e) => setKratkiOpis(e.target.value.slice(0, 160))}
              placeholder="Gorenjska idila z razgledom na Triglav"
              className={INPUT}
            />
          </Field>

          <Field label="Podrobni opis" required hint="Opišite kmetijo, ponudbo, zgodovino in posebnosti. Min. 100 znakov.">
            <textarea
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              rows={6}
              placeholder="Naša kmetija leži v mirni dolini pod Triglavom. Ponujamo pristno slovensko gostoljubje: domači sir, med, vino in prenočišča v senovitu okolju..."
              className={`${INPUT} resize-none`}
            />
            <p className="text-xs text-earth-400 mt-1">{opis.length} znakov</p>
          </Field>

          <Field label="Vrsta doživetij" hint="Izberite vse, ki veljajo — Jože AI jih uporablja pri priporočilih.">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
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
                        : "bg-white border-earth-200 text-earth-600 hover:border-forest-300"
                    }`}
                  >
                    <span className="text-base leading-none">{dozivetjeIkona(d.ikona)}</span>
                    <span className="truncate">{d.ime}</span>
                  </button>
                );
              })}
              {/* Drugo */}
              <button
                type="button"
                onClick={() => setDrugoDozivje((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  drugoDozivje
                    ? "bg-forest-50 border-forest-400 text-forest-800"
                    : "bg-white border-earth-200 text-earth-600 hover:border-forest-300"
                }`}
              >
                <span className="text-base leading-none">✏️</span>
                <span>Drugo</span>
              </button>
            </div>
            {drugoDozivje && (
              <div className="mt-2">
                <input
                  type="text"
                  value={drugoDozivjeTekst}
                  onChange={(e) => setDrugoDozivjeTekst(e.target.value)}
                  placeholder="Opišite doživetje, ki ga ponujate…"
                  className="w-full px-4 py-2.5 border border-forest-300 rounded-xl text-sm text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 bg-white"
                  maxLength={120}
                />
                <p className="text-xs text-earth-400 mt-1">{drugoDozivjeTekst.length}/120</p>
              </div>
            )}
          </Field>
        </div>
      )}

      {/* ─── Korak 2: Lokacija ────────────────────────────────────────── */}
      {korak === 2 && (
        <div className="space-y-5">
          <Field label="Regija" required>
            <div className="relative">
              <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
              <select
                value={regija}
                onChange={(e) => setRegija(e.target.value as Regija)}
                className={`${INPUT_ICON} appearance-none`}
              >
                {REGIJE.map((r) => (
                  <option key={r} value={r}>{REGIJA_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </Field>

          <Field label="Ulica in hišna številka" required>
            <input
              type="text"
              value={naslov}
              onChange={(e) => setNaslov(e.target.value)}
              placeholder="npr. Kmetijska cesta 5"
              className={INPUT}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Poštna številka">
              <input
                type="text"
                value={postnaStevilka}
                onChange={(e) => setPostnaStevilka(e.target.value)}
                placeholder="4260"
                className={INPUT}
              />
            </Field>
            <Field label="Občina" required>
              <input
                type="text"
                value={obcina}
                onChange={(e) => setObcina(e.target.value)}
                placeholder="npr. Bled"
                className={INPUT}
              />
            </Field>
          </div>

          <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-4 space-y-3">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-emerald-700 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-forest-900">GPS koordinate — priporočeno</p>
                <p className="text-xs text-earth-600 mt-0.5">
                  Odprite{" "}
                  <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-forest-700 underline decoration-dotted">
                    Google Maps
                  </a>
                  , desni klik na lokacijo kmetije → kliknite koordinate, da jih kopirate.
                  Primer: <span className="font-mono">46.3842, 13.9738</span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1">Geografska širina (lat)</label>
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
                <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1">Geografska dolžina (lng)</label>
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
              Brez koordinat kmetija ne bo prikazana na zemljevidu in v road-trip načrtih.
            </p>
          </div>
        </div>
      )}

      {/* ─── Korak 3: Ponudba & Cene ──────────────────────────────────── */}
      {korak === 3 && (
        <div className="space-y-6">
          {/* Cena in kapaciteta */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-4">
            <p className="text-sm font-bold text-amber-900 flex items-center gap-2">
              <Euro size={15} />
              Cena in kapaciteta — prikazujeta se na kartici kmetije
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cena na noč (€)" required hint="Osnovna cena za 1 nočitev">
                <div className="relative">
                  <Euro size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={cenaNoc}
                    onChange={(e) => setCenaNoc(e.target.value)}
                    placeholder="75"
                    className={INPUT_ICON}
                  />
                </div>
              </Field>
              <Field label="Maks. število gostov" required hint="Skupna kapaciteta kmetije">
                <div className="relative">
                  <Users size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={maxGostov}
                    onChange={(e) => setMaxGostov(e.target.value)}
                    placeholder="4"
                    className={INPUT_ICON}
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Lastnosti */}
          <Field label="Lastnosti kmetije" hint="Označite vse, kar ponujate. Jože AI jih upošteva pri priporočilih.">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
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
                    <span className="font-medium leading-tight truncate">{meta.label}</span>
                  </label>
                );
              })}
              {/* Drugo */}
              <label
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-sm ${
                  drugoLastnost
                    ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                    : "bg-white border-earth-200 text-earth-700 hover:border-emerald-200"
                }`}
              >
                <input
                  type="checkbox"
                  className="rounded border-earth-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 flex-shrink-0"
                  checked={drugoLastnost}
                  onChange={() => setDrugoLastnost((v) => !v)}
                />
                <span className="text-base leading-none">✏️</span>
                <span className="font-medium leading-tight">Drugo</span>
              </label>
            </div>
            {drugoLastnost && (
              <div className="mt-2">
                <input
                  type="text"
                  value={drugoLastnostTekst}
                  onChange={(e) => setDrugoLastnostTekst(e.target.value)}
                  placeholder="Opišite lastnost, ki je ni na seznamu…"
                  className="w-full px-4 py-2.5 border border-emerald-300 rounded-xl text-sm text-earth-900 placeholder-earth-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 bg-white"
                  maxLength={120}
                />
                <p className="text-xs text-earth-400 mt-1">{drugoLastnostTekst.length}/120</p>
              </div>
            )}
          </Field>

          {/* Posebna ponudba */}
          <Field
            label="Trenutna posebna ponudba"
            hint={`${posebnePonudbe.length}/400 znakov · Spremenite kadarkoli iz nadzorne plošče.`}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={13} className="text-amber-600" />
              <span className="text-xs text-earth-500">neobvezno</span>
            </div>
            <textarea
              value={posebnePonudbe}
              onChange={(e) => setPosebnePonudbe(e.target.value)}
              placeholder="Npr. Ta teden 10 % popust na nočitev s polpenzionom za pare…"
              rows={3}
              maxLength={400}
              className={`${INPUT} resize-none`}
            />
          </Field>
        </div>
      )}

      {/* ─── Korak 4: Slike ───────────────────────────────────────────── */}
      {korak === 4 && (
        <div className="space-y-5">
          <div className="rounded-xl bg-forest-50 border border-forest-200 px-4 py-3 flex items-start gap-2.5">
            <Info size={14} className="text-forest-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-forest-800">
              Naložite fotografije s svojega računalnika ali telefona. Slike se samodejno stisnejo.
              Kmetija brez naslovne fotografije <span className="font-semibold">ne bo vidna</span> na portalu.
            </p>
          </div>

          {/* Naslovna slika */}
          <Field label="Naslovna fotografija" required hint="Prikazuje se na kartici kmetije — naredi prvi vtis.">
            <ImageUploadSlot
              preview={naslovnaPreview}
              file={naslovnaFile}
              urlValue={naslovnaUrl}
              onFile={(f) => {
                setNaslovnaFile(f);
                setNaslovnaPreview(URL.createObjectURL(f));
              }}
              onUrlChange={setNaslovnaUrl}
              onRemove={() => {
                setNaslovnaFile(null);
                setNaslovnaPreview("");
              }}
              placeholder="Fotografija 1 (naslovna) *"
            />
          </Field>

          {/* Dodatne slike */}
          <Field label="Dodatne fotografije" hint="Neobvezno — do 3 fotografije za galerijo.">
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <ImageUploadSlot
                  key={i}
                  preview={dodatnePreviews[i]}
                  file={dodatneFiles[i]}
                  urlValue={dodatneUrls[i]}
                  onFile={(f) => {
                    const nf = [...dodatneFiles]; nf[i] = f; setDodatneFiles(nf);
                    const np = [...dodatnePreviews]; np[i] = URL.createObjectURL(f); setDodatnePreviews(np);
                  }}
                  onUrlChange={(v) => { const n = [...dodatneUrls]; n[i] = v; setDodatneUrls(n); }}
                  onRemove={() => {
                    const nf = [...dodatneFiles]; nf[i] = null; setDodatneFiles(nf);
                    const np = [...dodatnePreviews]; np[i] = ""; setDodatnePreviews(np);
                  }}
                  placeholder={`Fotografija ${i + 2} (neobvezno)`}
                />
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* ─── Korak 5: Kontakt ─────────────────────────────────────────── */}
      {korak === 5 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Telefonska številka">
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
                <input
                  type="tel"
                  value={telefon}
                  onChange={(e) => setTelefon(e.target.value)}
                  placeholder="+386 31 000 000"
                  className={INPUT_ICON}
                />
              </div>
            </Field>
            <Field label="E-poštni naslov kmetije">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kmetija@primer.si"
                className={INPUT}
              />
            </Field>
          </div>

          <Field label="Spletna stran">
            <div className="relative">
              <Globe size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
              <input
                type="url"
                value={spletnaStran}
                onChange={(e) => setSpletnaStran(e.target.value)}
                placeholder="https://www.vasa-kmetija.si"
                className={INPUT_ICON}
              />
            </div>
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Instagram" hint="npr. @kmetija_janez">
              <div className="relative">
                <AtSign size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@kmetija_ime"
                  className={INPUT_ICON}
                />
              </div>
            </Field>
            <Field label="Facebook stran">
              <div className="relative">
                <LinkIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-earth-400 pointer-events-none" />
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="facebook.com/kmetija-ime"
                  className={INPUT_ICON}
                />
              </div>
            </Field>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            <p className="font-bold mb-1">Kaj se zgodi po oddaji?</p>
            <ol className="list-decimal list-inside space-y-1 text-amber-700">
              <li>Administrator pregleda vlogo v roku 1–3 delovnih dni.</li>
              <li>Po odobritvi kmetija postane vidna vsem obiskovalcem.</li>
              <li>Prejmete e-mail s potrditvijo in dostopom do nadzorne plošče.</li>
              <li>Iz nadzorne plošče upravljate rezervacije, slike in ponudbo.</li>
            </ol>
          </div>
        </div>
      )}

      {/* Napaka */}
      {napaka && (
        <div className="mt-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {napaka}
        </div>
      )}

      {/* Navigacija */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-earth-200">
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

        <div className="text-xs text-earth-400">Korak {korak} od 5</div>

        {korak < 5 ? (
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
                {uploadStatus ?? "Pošiljanje…"}
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
