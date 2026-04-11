"use client";

// =============================================================================
// NaKmetiji.si — UrediKmetijoView (Edit Farm Dashboard Tab)
//
// Validation: Zod schema with Slovenian field-level error messages
// Optimistic UI: price and guest count display updates instantly on submit
//               before the server round-trip confirms the change
// =============================================================================

import { useState, useTransition, useOptimistic } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, Euro, Users } from "lucide-react";
import { posodobiKmetijo } from "@/lib/actions/kmetije";
import {
  kmetijaEditSchema,
  type KmetijaEditFormData,
} from "@/lib/schemas/vendor";
import {
  REGIJE,
  REGIJA_LABELS,
  type Kmetija,
  type Dozivetje,
  type Regija,
} from "@/types/database";

interface Props {
  kmetija: Kmetija;
  vseDozivetja: Dozivetje[];
  izbranaDozivetjaIds: string[];
}

type FieldErrors = Partial<Record<keyof KmetijaEditFormData, string>>;

// ─── Shared input styles ─────────────────────────────────────────────────────

function inputCls(hasError: boolean) {
  return [
    "w-full px-4 py-2.5 border rounded-xl text-sm text-earth-900",
    "placeholder-earth-400 focus:outline-none transition-colors",
    hasError
      ? "border-red-400 ring-1 ring-red-400 focus:border-red-500 focus:ring-red-500"
      : "border-earth-300 focus:border-forest-400 focus:ring-1 focus:ring-forest-400",
  ].join(" ");
}

const labelCls = "block text-xs font-semibold text-earth-600 mb-1.5";

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-red-600 font-medium">{msg}</p>;
}

// ─── Optimistic price/capacity badge ─────────────────────────────────────────

interface OptimisticBadge {
  cena_noc: number | null;
  max_gostov: number | null;
}

function PriceBadge({ cena, gostov, pending }: { cena: number | null; gostov: number | null; pending: boolean }) {
  return (
    <div className={`flex flex-wrap gap-3 transition-opacity ${pending ? "opacity-60" : ""}`}>
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-forest-50 border border-forest-200 text-forest-800 text-sm font-semibold">
        <Euro size={14} className="text-forest-500" />
        {cena != null ? `${cena} € / noč` : "Cena ni nastavljena"}
        {pending && <Loader2 size={12} className="animate-spin text-forest-400 ml-1" />}
      </div>
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-earth-50 border border-earth-200 text-earth-700 text-sm font-semibold">
        <Users size={14} className="text-earth-400" />
        {gostov != null ? `max ${gostov} gostov` : "Zmogljivost ni nastavljena"}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UrediKmetijoView({ kmetija, vseDozivetja, izbranaDozivetjaIds }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [napaka, setNapaka] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // ── Optimistic pricing — updates instantly when form is submitted ──────────
  const [optimisticPricing, updateOptimisticPricing] = useOptimistic(
    { cena_noc: kmetija.cena_noc, max_gostov: kmetija.max_gostov } satisfies OptimisticBadge,
    (_: OptimisticBadge, next: OptimisticBadge) => next
  );

  // ── Form state ────────────────────────────────────────────────────────────
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
  const [cena_noc_str, setCenaNocStr] = useState(kmetija.cena_noc != null ? String(kmetija.cena_noc) : "");
  const [max_gostov_str, setMaxGostovStr] = useState(kmetija.max_gostov != null ? String(kmetija.max_gostov) : "");
  const [iban, setIban] = useState(kmetija.iban ?? "");
  const [bic, setBic] = useState(kmetija.bic ?? "");
  const [dozivetja_ids, setDozivetjaIds] = useState<string[]>(izbranaDozivetjaIds);

  function toggleDozivetje(id: string) {
    setDozivetjaIds((prev) => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNapaka(null);
    setUspeh(false);
    setFieldErrors({});

    // Build raw form object — coerce numeric strings
    const raw: KmetijaEditFormData = {
      ime:                    ime.trim(),
      kratki_opis:            kratki_opis.trim(),
      opis:                   opis.trim(),
      regija,
      naslov:                 naslov.trim(),
      obcina:                 obcina.trim(),
      postna_stevilka:        postna_stevilka.trim(),
      kontakt_telefon:        kontakt_telefon.trim(),
      kontakt_email:          kontakt_email.trim(),
      kontakt_spletna_stran:  kontakt_spletna_stran.trim(),
      cena_noc:               cena_noc_str !== "" ? Number(cena_noc_str) : null,
      max_gostov:             max_gostov_str !== "" ? Number(max_gostov_str) : null,
      iban:                   iban.trim().replace(/\s/g, ""),
      bic:                    bic.trim().toUpperCase(),
      dozivetja_ids,
    };

    // ── Zod validation ───────────────────────────────────────────────────────
    const result = kmetijaEditSchema.safeParse(raw);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof KmetijaEditFormData;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      // Scroll to first error
      setTimeout(() => {
        document.querySelector("[data-field-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }

    const parsed = result.data;

    startTransition(async () => {
      // ── Optimistic update: price badge changes immediately ────────────────
      updateOptimisticPricing({
        cena_noc:   parsed.cena_noc  ?? null,
        max_gostov: parsed.max_gostov ?? null,
      });

      const rezultat = await posodobiKmetijo(kmetija.id, {
        ime:                   parsed.ime,
        kratki_opis:           parsed.kratki_opis ?? "",
        opis:                  parsed.opis,
        regija:                parsed.regija as Regija,
        naslov:                parsed.naslov ?? "",
        obcina:                parsed.obcina ?? "",
        postna_stevilka:       parsed.postna_stevilka ?? "",
        kontakt_telefon:       parsed.kontakt_telefon ?? "",
        kontakt_email:         parsed.kontakt_email ?? "",
        kontakt_spletna_stran: parsed.kontakt_spletna_stran ?? "",
        cena_noc:              parsed.cena_noc  ?? null,
        max_gostov:            parsed.max_gostov ?? null,
        iban:                  parsed.iban ?? "",
        bic:                   parsed.bic ?? "",
        dozivetja_ids,
      });

      if (rezultat.ok) {
        setUspeh(true);
        router.refresh();
        setTimeout(() => setUspeh(false), 4_000);
      } else {
        setNapaka(rezultat.napaka ?? "Napaka pri shranjevanju.");
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>

      {/* ── Live price badge (optimistic) ──────────────────────────────── */}
      <PriceBadge
        cena={optimisticPricing.cena_noc}
        gostov={optimisticPricing.max_gostov}
        pending={isPending}
      />

      {/* ── Osnovni podatki ────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Osnovni podatki</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Ime kmetije *</label>
              <input
                type="text"
                value={ime}
                onChange={(e) => setIme(e.target.value)}
                className={inputCls(!!fieldErrors.ime)}
                aria-describedby={fieldErrors.ime ? "err-ime" : undefined}
              />
              <FieldError msg={fieldErrors.ime} />
            </div>
            <div>
              <label className={labelCls}>Regija *</label>
              <select
                value={regija}
                onChange={(e) => setRegija(e.target.value as Regija)}
                className={inputCls(!!fieldErrors.regija)}
              >
                {REGIJE.map((r) => (
                  <option key={r} value={r}>{REGIJA_LABELS[r]}</option>
                ))}
              </select>
              <FieldError msg={fieldErrors.regija} />
            </div>
          </div>

          <div>
            <label className={labelCls}>
              Kratki opis
              <span className="text-earth-400 font-normal ml-1">— slogan (max 200 znakov)</span>
            </label>
            <input
              type="text"
              value={kratki_opis}
              onChange={(e) => setKratkiOpis(e.target.value)}
              placeholder="Npr. Ekološka kmetija z razgledom na Triglav"
              maxLength={200}
              className={inputCls(!!fieldErrors.kratki_opis)}
            />
            <div className="mt-1 flex justify-between">
              <FieldError msg={fieldErrors.kratki_opis} />
              <span className="text-[11px] text-earth-400 ml-auto">{kratki_opis.length}/200</span>
            </div>
          </div>

          <div>
            <label className={labelCls}>Podroben opis * <span className="text-earth-400 font-normal">(min 50 znakov)</span></label>
            <textarea
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              rows={6}
              className={`${inputCls(!!fieldErrors.opis)} resize-y`}
              placeholder="Opišite svojo kmetijo, ponudbo, okolico..."
            />
            <div className="mt-1 flex justify-between">
              <FieldError msg={fieldErrors.opis} />
              <span className={`text-[11px] ml-auto ${opis.length < 50 ? "text-amber-500" : "text-earth-400"}`}>
                {opis.length}/5000
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cene & zmogljivost ─────────────────────────────────────────── */}
      <section className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Cene & zmogljivost</h3>
          <p className="text-xs text-earth-500 mt-0.5">
            Spremembe se prikažejo takoj — potrditev v ozadju.
          </p>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>
              <Euro size={12} className="inline mr-1 mb-0.5" />
              Cena na noč (EUR)
            </label>
            <input
              type="number"
              min="0"
              max="10000"
              step="0.01"
              value={cena_noc_str}
              onChange={(e) => setCenaNocStr(e.target.value)}
              placeholder="npr. 89"
              className={inputCls(!!fieldErrors.cena_noc)}
            />
            <FieldError msg={fieldErrors.cena_noc} />
          </div>
          <div>
            <label className={labelCls}>
              <Users size={12} className="inline mr-1 mb-0.5" />
              Največje število gostov
            </label>
            <input
              type="number"
              min="1"
              max="500"
              step="1"
              value={max_gostov_str}
              onChange={(e) => setMaxGostovStr(e.target.value)}
              placeholder="npr. 10"
              className={inputCls(!!fieldErrors.max_gostov)}
            />
            <FieldError msg={fieldErrors.max_gostov} />
          </div>
        </div>
      </section>

      {/* ── Lokacija ───────────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Lokacija</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Naslov</label>
            <input
              type="text"
              value={naslov}
              onChange={(e) => setNaslov(e.target.value)}
              placeholder="Npr. Planinska cesta 12"
              className={inputCls(!!fieldErrors.naslov)}
            />
            <FieldError msg={fieldErrors.naslov} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Občina</label>
              <input
                type="text"
                value={obcina}
                onChange={(e) => setObcina(e.target.value)}
                placeholder="Npr. Bled"
                className={inputCls(!!fieldErrors.obcina)}
              />
              <FieldError msg={fieldErrors.obcina} />
            </div>
            <div>
              <label className={labelCls}>Poštna številka</label>
              <input
                type="text"
                value={postna_stevilka}
                onChange={(e) => setPostnaStevilka(e.target.value)}
                placeholder="4-mestna koda"
                maxLength={4}
                className={inputCls(!!fieldErrors.postna_stevilka)}
              />
              <FieldError msg={fieldErrors.postna_stevilka} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Kontakt ────────────────────────────────────────────────────── */}
      <section className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Kontaktni podatki</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className={labelCls}>Telefon</label>
            <input
              type="tel"
              value={kontakt_telefon}
              onChange={(e) => setKontaktTelefon(e.target.value)}
              placeholder="+386 40 123 456"
              className={inputCls(!!fieldErrors.kontakt_telefon)}
            />
            <FieldError msg={fieldErrors.kontakt_telefon} />
          </div>
          <div>
            <label className={labelCls}>E-pošta</label>
            <input
              type="email"
              value={kontakt_email}
              onChange={(e) => setKontaktEmail(e.target.value)}
              placeholder="kmetija@primer.si"
              className={inputCls(!!fieldErrors.kontakt_email)}
            />
            <FieldError msg={fieldErrors.kontakt_email} />
          </div>
          <div>
            <label className={labelCls}>Spletna stran</label>
            <input
              type="url"
              value={kontakt_spletna_stran}
              onChange={(e) => setKontaktSpletna(e.target.value)}
              placeholder="https://www.moja-kmetija.si"
              className={inputCls(!!fieldErrors.kontakt_spletna_stran)}
            />
            <FieldError msg={fieldErrors.kontakt_spletna_stran} />
          </div>
        </div>
      </section>

      {/* ── Bančni podatki (za UPN) ────────────────────────────────────── */}
      <section className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Bančni podatki</h3>
          <p className="text-xs text-earth-500 mt-0.5">
            Gostje prejmejo UPN plačilni nalog z vašim IBAN-om po potrditvi rezervacije.
          </p>
        </div>
        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>IBAN</label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value.replace(/\s/g, "").toUpperCase())}
              placeholder="SI56xxxxxxxxxxxxxxx"
              className={`${inputCls(!!fieldErrors.iban)} font-mono`}
              maxLength={19}
            />
            <FieldError msg={fieldErrors.iban} />
          </div>
          <div>
            <label className={labelCls}>BIC / SWIFT</label>
            <input
              type="text"
              value={bic}
              onChange={(e) => setBic(e.target.value.toUpperCase())}
              placeholder="LJBASI2X"
              className={`${inputCls(!!fieldErrors.bic)} font-mono`}
              maxLength={11}
            />
            <FieldError msg={fieldErrors.bic} />
          </div>
        </div>
      </section>

      {/* ── Dozivetja ──────────────────────────────────────────────────── */}
      {vseDozivetja.length > 0 && (
        <section className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
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
                      className="rounded border-earth-300 text-forest-600 focus:ring-forest-500 w-4 h-4 flex-shrink-0"
                      checked={checked}
                      onChange={() => toggleDozivetje(doz.id)}
                    />
                    <span className="text-sm font-medium">{doz.ime}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Global error / success ─────────────────────────────────────── */}
      {Object.keys(fieldErrors).length > 0 && (
        <div
          data-field-error
          className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
        >
          <strong>Prosimo, popravite napake v obrazcu:</strong>
          <ul className="mt-1.5 list-disc list-inside space-y-0.5">
            {Object.values(fieldErrors).map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

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

      {/* ── Submit ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />}
          {isPending ? "Shranjujem..." : "Shrani spremembe"}
        </button>
        <span className="text-xs text-earth-400">
          Po administrativni odobritvi postanejo spremembe javno vidne.
        </span>
      </div>
    </form>
  );
}
