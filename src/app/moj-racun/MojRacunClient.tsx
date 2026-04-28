"use client";

// =============================================================================
// NaKmetiji.si — /moj-racun client
// Tabbed traveler dashboard — Rezervacije · Green Passport · Wishlist ·
// Roadtripi · Nastavitve. Server component handed us normalized rows.
// =============================================================================

import { useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Leaf,
  Heart,
  Route,
  Settings as SettingsIcon,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin,
  ArrowRight,
} from "lucide-react";
import type { Rezervacija, StampRow, WishlistRow, RoadtripRow } from "./page";
import { MfaSetupClient } from "./MfaSetupClient";

const TABS = [
  { key: "rezervacije", label: "Rezervacije", icon: CalendarDays },
  { key: "passport", label: "Zeleni potni list", icon: Leaf },
  { key: "wishlist", label: "Shranjene", icon: Heart },
  { key: "roadtripi", label: "Road tripi", icon: Route },
  { key: "nastavitve", label: "Nastavitve", icon: SettingsIcon },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const REGION_LABELS_SHORT: Record<string, string> = {
  gorenjska: "Gorenjska",
  primorska: "Primorska",
  stajerska: "Štajerska",
  dolenjska: "Dolenjska",
  koroska: "Koroška",
  savinjska: "Savinjska",
  pomurska: "Pomurska",
  notranjska: "Notranjska",
  zasavska: "Zasavska",
  posavska: "Posavska",
  jugovzhodna_slovenija: "JV Slovenija",
  osrednjeslovenska: "Osrednjeslovenska",
};

function slDate(iso: string): string {
  return new Date(iso).toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function MojRacunClient({
  profilIme,
  email,
  rezervacije,
  stamps,
  wishlist,
  roadtripi,
}: {
  profilIme: string;
  email: string;
  rezervacije: Rezervacija[];
  stamps: StampRow[];
  wishlist: WishlistRow[];
  roadtripi: RoadtripRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL is the SOLE source of truth — `?tab=passport` deep-links + survives
  // reloads, bookmarks, and back/forward navigation without any state-sync
  // useEffect (which would have caused cascading renders).
  const urlTab = searchParams.get("tab");
  const active: TabKey = TABS.some((t) => t.key === urlTab)
    ? (urlTab as TabKey)
    : "rezervacije";

  const switchTab = useCallback(
    (next: TabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "rezervacije") params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `/moj-racun?${qs}` : "/moj-racun", { scroll: false });
    },
    [router, searchParams],
  );

  const greeting =
    profilIme && profilIme.trim().length > 0
      ? `Dobrodošli, ${profilIme.split(" ")[0]}.`
      : "Dobrodošli.";

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-10 lg:py-14">
        {/* Heading */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600/70 mb-2">
            Moj račun
          </p>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-forest-900 tracking-tight">
            {greeting}
          </h1>
          <p className="handwritten text-2xl text-forest-700/80 mt-2">
            Tukaj so vaše kmetije, žigi in poti.
          </p>
        </div>

        {/* Quick stats strip — unified palette: forest for the primary
            counts, amber for "engagement" counts (saved + roadtripi). */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <QuickStat label="Rezervacije" value={rezervacije.length} accent="#2D5A27" />
          <QuickStat label="Zbranih žigov" value={stamps.length} accent="#2D5A27" />
          <QuickStat label="Shranjene" value={wishlist.length} accent="#d97706" />
          <QuickStat label="Road tripi" value={roadtripi.length} accent="#d97706" />
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.key === active;
            return (
              <button
                key={tab.key}
                onClick={() => switchTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-all ${
                  isActive
                    ? "bg-forest-700 text-white border-forest-700 shadow-md"
                    : "bg-white text-forest-800 border-earth-200 hover:border-forest-400"
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Panels */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {active === "rezervacije" && (
              <RezervacijePanel rezervacije={rezervacije} />
            )}
            {active === "passport" && <PassportPanel stamps={stamps} />}
            {active === "wishlist" && <WishlistPanel wishlist={wishlist} />}
            {active === "roadtripi" && (
              <RoadtripiPanel roadtripi={roadtripi} />
            )}
            {active === "nastavitve" && (
              <NastavitvePanel email={email} profilIme={profilIme} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function QuickStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-earth-200 p-4 relative overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20"
        style={{ background: accent }}
      />
      <p className="font-display text-3xl font-black text-forest-900 leading-none">
        {value}
      </p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-earth-500 mt-2">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: Rezervacija["status"] }) {
  const map: Record<
    Rezervacija["status"],
    { label: string; bg: string; fg: string; Icon: typeof CheckCircle2 }
  > = {
    cakanje:   { label: "V obravnavi",  bg: "bg-amber-50",   fg: "text-amber-700",   Icon: Clock },
    potrjena:  { label: "Potrjena",     bg: "bg-forest-50",  fg: "text-forest-700",  Icon: CheckCircle2 },
    zavrnjena: { label: "Zavrnjena",    bg: "bg-red-50",     fg: "text-red-700",     Icon: XCircle },
    preklicana:{ label: "Preklicana",   bg: "bg-earth-100",  fg: "text-earth-600",   Icon: XCircle },
    zakljucena:{ label: "Zaključena",   bg: "bg-earth-50",   fg: "text-earth-700",   Icon: CheckCircle2 },
  };
  const v = map[status];
  const Icon = v.Icon;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${v.bg} ${v.fg}`}>
      <Icon size={11} /> {v.label}
    </span>
  );
}

function RezervacijePanel({ rezervacije }: { rezervacije: Rezervacija[] }) {
  if (rezervacije.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays size={28} />}
        title="Ni rezervacij."
        note="Ko rezerviraš bivanje, se prikaže tukaj."
        cta={{ href: "/kmetije", label: "Razišči kmetije" }}
      />
    );
  }
  return (
    <ul className="space-y-3">
      {rezervacije.map((r) => (
        <li
          key={r.id}
          className="rounded-2xl bg-white border border-earth-200 p-5 hover:shadow-md transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-forest-900 text-base">
                {r.kmetija_ime ?? "Kmetija"}
              </h3>
              <p className="text-sm text-earth-600 mt-0.5">
                {slDate(r.datum_od)} — {slDate(r.datum_do)} · {r.stevilo_oseb}{" "}
                {r.stevilo_oseb === 1 ? "oseba" : r.stevilo_oseb < 5 ? "osebe" : "oseb"}
              </p>
              {r.skupaj_cena !== null && (
                <p className="text-sm text-forest-800 font-semibold mt-1">
                  {r.skupaj_cena.toFixed(2)} €
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={r.status} />
              {r.kmetija_slug && (
                <Link
                  href={`/kmetije/${r.kmetija_slug}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-500"
                >
                  Profil <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PassportPanel({ stamps }: { stamps: StampRow[] }) {
  const regionsCovered = new Set(stamps.map((s) => s.regija).filter(Boolean));
  const progress = Math.min(12, regionsCovered.size);
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-forest-900 text-white p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-emerald-300 blur-3xl opacity-20" aria-hidden />
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-300/70 mb-1">
              Napredek
            </p>
            <p className="font-display text-2xl font-black">
              {progress} / 12 regij
            </p>
            <p className="text-sm text-white/70 mt-1">
              {progress === 12
                ? "Zeleni Ambasador Slovenije — vse regije obiskane."
                : `Še ${12 - progress} regij do pečata Ambasadorja.`}
            </p>
          </div>
          <Link
            href="/green-passport"
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-4 py-2.5 text-sm"
          >
            <Leaf size={14} /> Odpri potni list
          </Link>
        </div>
      </div>

      {stamps.length === 0 ? (
        <EmptyState
          icon={<Leaf size={28} />}
          title="Še noben žig."
          note="Obišči kmetijo in skeniraj QR kodo, da pridobiš prvi žig."
          cta={{ href: "/zemljevid", label: "Odpri zemljevid" }}
        />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stamps.map((s, i) => (
            <li
              key={`${s.kmetija_id}-${i}`}
              className="rounded-2xl bg-white border border-earth-200 p-4 flex items-center gap-3"
            >
              <div className="w-11 h-11 rounded-full flex items-center justify-center bg-emerald-100 text-emerald-800 flex-shrink-0">
                <Leaf size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-forest-900 truncate">
                  {s.kmetija_ime}
                </p>
                <p className="text-xs text-earth-500">
                  {REGION_LABELS_SHORT[s.regija] ?? s.regija} · {slDate(s.ustvarjeno)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WishlistPanel({ wishlist }: { wishlist: WishlistRow[] }) {
  if (wishlist.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={28} />}
        title="Ni shranjenih kmetij."
        note="Tapni srčke, ki jih najdeš na profilih kmetij, da jih shraniš."
        cta={{ href: "/kmetije", label: "Razišči kmetije" }}
      />
    );
  }
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {wishlist.map((w) => (
        <li
          key={w.kmetija_id}
          className="rounded-2xl bg-white border border-earth-200 overflow-hidden hover:shadow-md transition-all"
        >
          <Link href={`/kmetije/${w.slug}`} className="block">
            <div className="relative h-32 bg-earth-100">
              <Image
                src={w.naslovna_slika || "/images/placeholder-farm.jpg"}
                alt={w.ime}
                fill
                className="object-cover"
                sizes="(min-width: 640px) 300px, 100vw"
              />
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-0.5 flex items-center gap-1">
                <MapPin size={10} />
                {REGION_LABELS_SHORT[w.regija] ?? w.regija}
              </p>
              <h3 className="font-display font-bold text-forest-900 leading-tight">
                {w.ime}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {w.ocena !== null && (
                  <span className="text-xs text-gold-600 font-semibold flex items-center gap-0.5">
                    <Star size={11} className="fill-gold-500 text-gold-500" />
                    {w.ocena.toFixed(1)}
                  </span>
                )}
                {w.cena_noc !== null && (
                  <span className="text-xs text-earth-600">
                    od {w.cena_noc} €/noč
                  </span>
                )}
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function RoadtripiPanel({ roadtripi }: { roadtripi: RoadtripRow[] }) {
  if (roadtripi.length === 0) {
    return (
      <EmptyState
        icon={<Route size={28} />}
        title="Ni shranjenih poti."
        note="Sestavi večdnevni izlet z Jožetom in ga shrani."
        cta={{ href: "/pot", label: "Sestavi road trip" }}
      />
    );
  }
  return (
    <ul className="space-y-3">
      {roadtripi.map((t) => (
        <li
          key={t.id}
          className="rounded-2xl bg-white border border-earth-200 p-5 hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-bold text-forest-900">{t.naslov}</h3>
              <p className="text-sm text-earth-600 mt-0.5">
                {t.regije.map((r) => REGION_LABELS_SHORT[r] ?? r).join(" → ")}
                {t.days ? ` · ${t.days} dni` : ""} · {t.stops_count} postankov
              </p>
              <p className="text-xs text-earth-400 mt-1">
                Shranjeno {slDate(t.ustvarjeno)}
              </p>
            </div>
            {t.share_slug && (
              <Link
                href={`/pot?id=${t.share_slug}`}
                className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:text-forest-500"
              >
                Odpri <ArrowRight size={12} />
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function NastavitvePanel({
  email,
  profilIme,
}: {
  email: string;
  profilIme: string;
}) {
  return (
    <div className="rounded-2xl bg-white border border-earth-200 p-6 max-w-xl space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-earth-500 mb-1">
          Ime
        </p>
        <p className="text-base text-forest-900">{profilIme || "—"}</p>
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-earth-500 mb-1">
          E-pošta
        </p>
        <p className="text-base text-forest-900">{email}</p>
      </div>
      <div className="pt-3 border-t border-earth-100 text-sm text-earth-600 leading-relaxed">
        Spremembe imena, gesla in nastavitve obvestil so v pripravi.
        Če potrebuješ pomoč, nam piši na{" "}
        <a href="mailto:info@nakmetiji.si" className="text-forest-700 underline underline-offset-2">
          info@nakmetiji.si
        </a>.
      </div>
      <div className="pt-4 border-t border-earth-100">
        <h4 className="text-sm font-bold text-forest-900 mb-2">Varnost računa</h4>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-earth-200 bg-earth-50 gap-4">
          <div>
            <p className="font-semibold text-forest-900 text-sm">Dvostopenjska avtentikacija (MFA)</p>
            <p className="text-xs text-earth-600 mt-1">Zavarujte svoj račun z aplikacijo Google Authenticator ali Authy.</p>
          </div>
          <MfaSetupClient />
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  note,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  note: string;
  cta?: { href: string; label: string };
}) {
  return (
    <div className="rounded-3xl bg-white border border-earth-200 p-10 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-earth-50 text-forest-700 mb-4">
        {icon}
      </div>
      <h3 className="font-display text-xl font-bold text-forest-900 mb-2">
        {title}
      </h3>
      <p className="text-sm text-earth-600 mb-5 max-w-sm mx-auto">{note}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-flex items-center gap-1.5 rounded-2xl bg-forest-700 hover:bg-forest-600 text-white font-bold px-5 py-2.5 text-sm"
        >
          {cta.label} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
