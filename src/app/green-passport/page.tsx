// =============================================================================
// NaKmetiji.si — Green Passport Landing
// Server component: real leaderboard + user progress + recent activity feed
// + personalized "next regions to stamp" CTA.
// =============================================================================

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Leaf, Award, MapPin, Search, Medal, ChevronRight, Stamp,
  Sparkles, ArrowRight, Compass, CheckCircle2,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { REGIJA_LABELS, REGIJE, type Regija } from "@/types/database";
import { LEVELS, getLevel, getNextLevel } from "@/lib/greenPassport";

export const metadata: Metadata = {
  title: "Green Passport | Zbiraj spomine in nagrade",
  description:
    "Zeleni potni list NaKmetiji. Bivaj na slovenskih kmetijah, zberi žige iz vseh 12 regij in odkleni nagrade.",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  kmetija_id: string;
  stamp_count: number;
  kmetije: { ime: string; regija: string; naslovna_slika: string; slug: string };
}

interface ActivityRow {
  id: string;
  ustvarjeno: string;
  kmetije: { ime: string; regija: string; slug: string } | null;
  profili: { ime: string } | null;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function GreenPassportPage() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();

  let profil: { ime: string } | null = null;
  let userStampCount = 0;
  let userStampedRegions: Set<string> = new Set();

  if (user) {
    const [profilRes, userStampsRes] = await Promise.all([
      supabase.from("profili").select("ime").eq("id", user.id).single(),
      supabase.from("green_stamps")
        .select("id, kmetije(regija)")
        .eq("gost_id", user.id),
    ]);
    profil = profilRes.data;
    const userStamps = (userStampsRes.data ?? []) as unknown as { id: string; kmetije: { regija: string } | null }[];
    userStampCount = userStamps.length;
    userStampedRegions = new Set(
      userStamps.map((s) => s.kmetije?.regija).filter((r): r is string => !!r)
    );
  }

  // Real leaderboard + recent activity in parallel
  const [leaderboardRaw, recentRaw] = await Promise.all([
    supabase.from("green_stamps")
      .select("kmetija_id, kmetije(ime, regija, naslovna_slika, slug)")
      .limit(300),
    supabase.from("green_stamps")
      .select("id, ustvarjeno, kmetije(ime, regija, slug), profili(ime)")
      .order("ustvarjeno", { ascending: false })
      .limit(10),
  ]);

  // Aggregate leaderboard
  const countMap = new Map<string, LeaderboardEntry>();
  for (const row of leaderboardRaw.data ?? []) {
    if (!row.kmetija_id || !row.kmetije) continue;
    const entry = countMap.get(row.kmetija_id);
    if (entry) entry.stamp_count++;
    else countMap.set(row.kmetija_id, {
      kmetija_id: row.kmetija_id,
      stamp_count: 1,
      kmetije: row.kmetije as unknown as LeaderboardEntry["kmetije"],
    });
  }
  const leaderboard = [...countMap.values()]
    .sort((a, b) => b.stamp_count - a.stamp_count)
    .slice(0, 6);

  const recent = (recentRaw.data ?? []) as unknown as ActivityRow[];

  // User progression
  const currentLevel = user ? getLevel(userStampCount, userStampedRegions.size) : null;
  const nextLevel = user ? getNextLevel(userStampCount, userStampedRegions.size) : null;
  const stepsToNext = nextLevel ? nextLevel.minStamps - userStampCount : null;
  const missingRegions: Regija[] = REGIJE.filter((r) => !userStampedRegions.has(r));

  return (
    <main className="min-h-screen bg-earth-50">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO — personal progress for logged-in, regions preview otherwise
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-6 lg:px-12 py-16 lg:py-20 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">

        {/* Left: copy */}
        <div className="flex-1 space-y-6 relative z-10 w-full text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-sm font-bold shadow-sm mx-auto lg:mx-0">
            <Leaf size={16} /> Ponos naše dediščine
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-forest-900 leading-[1.1] tracking-tight">
            {user
              ? <>Pozdravljen, <span className="text-emerald-600">{profil?.ime ?? "popotnik"}</span>.</>
              : <>Stopite na pot.<br /><span className="text-emerald-600">Zbirajte</span> korenine.</>
            }
          </h1>

          <p className="text-lg text-earth-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {user
              ? `Zbral si ${userStampCount} ${userStampCount === 1 ? "žig" : userStampCount < 5 ? "žige" : "žigov"} v ${userStampedRegions.size} ${userStampedRegions.size === 1 ? "regiji" : "regijah"}. Še ${12 - userStampedRegions.size} regij do naziva Legenda.`
              : "Vsak žig je spomin na gostoljubnost, vonj po senu in tišino gore. Tvoj potni list je kronika poti po slovenski zemlji."
            }
          </p>

          {/* User progress card — logged in */}
          {user && currentLevel && (
            <div className="rounded-2xl bg-white border border-emerald-200 shadow-sm p-5 max-w-md mx-auto lg:mx-0 text-left">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{currentLevel.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Tvoj nivo</p>
                  <p className="font-bold text-forest-900 truncate">{currentLevel.name}</p>
                </div>
                <Link
                  href="/moj-potni-list"
                  className="text-xs font-bold text-forest-700 hover:text-forest-500 inline-flex items-center gap-0.5"
                >
                  Odpri <ChevronRight size={12} />
                </Link>
              </div>
              {nextLevel && stepsToNext !== null && stepsToNext > 0 && (
                <>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-earth-600">Do <strong className="text-forest-900">{nextLevel.name}</strong></span>
                    <span className="font-bold text-emerald-700">{stepsToNext} {stepsToNext === 1 ? "žig" : "žige"}</span>
                  </div>
                  <div className="w-full h-2 bg-earth-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, (userStampCount / nextLevel.minStamps) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-earth-500 mt-1.5">
                    Nagrada: <strong className="text-forest-700">{nextLevel.rewardShort}</strong>
                  </p>
                </>
              )}
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
            <Link
              href="/kmetije"
              className="w-full sm:w-auto px-7 py-3.5 bg-forest-900 hover:bg-forest-800 text-white rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 inline-flex items-center justify-center gap-2"
            >
              <Search size={17} /> Poišči kmetijo
            </Link>
            {user ? (
              <Link
                href="/moj-potni-list"
                className="w-full sm:w-auto px-7 py-3.5 bg-white border-2 border-forest-900 hover:bg-forest-50 text-forest-900 rounded-2xl font-bold transition-all inline-flex items-center justify-center gap-2"
              >
                Moj potni list <ChevronRight size={17} />
              </Link>
            ) : (
              <Link
                href="/prijava?redirect=/green-passport"
                className="w-full sm:w-auto px-7 py-3.5 bg-white border-2 border-forest-900 hover:bg-forest-50 text-forest-900 rounded-2xl font-bold transition-all inline-flex items-center justify-center gap-2"
              >
                Prijava & začni <ChevronRight size={17} />
              </Link>
            )}
          </div>
        </div>

        {/* Right: 12-region progress mosaic — replaces the old decorative mockup */}
        <RegionMosaic stampedRegions={userStampedRegions} loggedIn={!!user} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          REGIONS YOU HAVEN'T STAMPED YET — personalized engagement
          ═══════════════════════════════════════════════════════════════════ */}
      {user && missingRegions.length > 0 && missingRegions.length < 12 && (
        <section className="bg-white py-12 px-6 border-y border-earth-200/60">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 mb-1">
                  Tvoja kronika · {userStampedRegions.size} / 12 regij
                </p>
                <h2 className="text-2xl sm:text-3xl font-black text-forest-900">
                  Še {missingRegions.length} {missingRegions.length === 1 ? "regija" : missingRegions.length < 5 ? "regije" : "regij"}, pa si Legenda
                </h2>
              </div>
              <Link
                href="/regije"
                className="text-sm font-bold text-forest-700 hover:text-forest-500 inline-flex items-center gap-1"
              >
                Vse regije <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {missingRegions.slice(0, 8).map((r) => (
                <Link
                  key={r}
                  href={`/kmetije?regija=${r}`}
                  className="group flex items-center gap-3 rounded-2xl bg-earth-50 hover:bg-emerald-50 border border-earth-200 hover:border-emerald-300 px-4 py-3 transition-all"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-full bg-white border-2 border-earth-200 group-hover:border-emerald-400 flex items-center justify-center transition-colors">
                    <MapPin size={14} className="text-earth-400 group-hover:text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-forest-900 truncate">{REGIJA_LABELS[r]}</p>
                    <p className="text-[10px] text-earth-500">Še brez žiga</p>
                  </div>
                  <ChevronRight size={14} className="text-earth-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-forest-900 text-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl lg:text-5xl font-black text-center mb-16 text-balance">
            Kako hodite po naši poti?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />
            {[
              { icon: <MapPin className="text-emerald-400" size={32} />, step: "1. Najdite kmetijo", text: "Izberite kmetijo, ki vas kliče — bodisi zaradi vibe-a, doživetja ali bližine." },
              { icon: <Stamp className="text-emerald-400" size={32} />, step: "2. Pridobite žig", text: "Ob obisku skenirajte QR kodo pri gostitelju — žig se shrani v vaš potni list." },
              { icon: <Award className="text-emerald-400" size={32} />, step: "3. Odklenite nagrade", text: "Vsak nivo prinese realno nagrado — zgodnji prihod, košarico domačih dobrot, VIP povabilo." },
            ].map(({ icon, step, text }) => (
              <div key={step} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-forest-800 rounded-full flex items-center justify-center border-4 border-emerald-500 mb-6 drop-shadow-xl">
                  {icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{step}</h3>
                <p className="text-forest-200 text-base">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          RECENT ACTIVITY — social proof
          ═══════════════════════════════════════════════════════════════════ */}
      {recent.length > 0 && (
        <section className="px-6 py-16 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 mb-1">
                Sveža kronika
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-forest-900">
                Pravkar zbrani žigi
              </h2>
              <p className="text-sm text-earth-500 mt-1">Zadnjih {recent.length} žigov iz cele Slovenije</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              V živo
            </span>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2">
            {recent.map((s) => (
              <li
                key={s.id}
                className="flex items-center gap-3 rounded-2xl bg-white border border-earth-200/60 px-4 py-3 hover:shadow-sm hover:border-emerald-200 transition-all"
              >
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Stamp size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-forest-900 truncate">
                    <strong>{s.profili?.ime ?? "Popotnik"}</strong>
                    {" · "}
                    {s.kmetije ? (
                      <Link href={`/kmetije/${s.kmetije.slug}`} className="text-forest-700 hover:text-emerald-600 underline decoration-dotted">
                        {s.kmetije.ime}
                      </Link>
                    ) : "—"}
                  </p>
                  <p className="text-[11px] text-earth-500 capitalize">
                    {s.kmetije?.regija?.replace(/_/g, " ") ?? ""}
                    {" · "}
                    {timeAgo(s.ustvarjeno)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          REWARDS PREVIEW — clearer value
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-gradient-to-br from-emerald-50 via-amber-50/30 to-emerald-50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700 mb-2">
              Realne nagrade, ne samo značke
            </p>
            <h2 className="text-3xl font-black text-forest-900">
              Kaj odklenete s svojimi žigi
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {LEVELS.slice(0, 4).map((lvl) => {
              const unlocked = user && userStampCount >= lvl.minStamps;
              return (
                <div
                  key={lvl.name}
                  className={`relative rounded-2xl p-5 border-2 transition-all ${
                    unlocked
                      ? "bg-white border-emerald-300 shadow-md"
                      : "bg-white/70 border-earth-200"
                  }`}
                >
                  {unlocked && (
                    <span className="absolute -top-2 -right-2 inline-flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-1 shadow-sm">
                      <CheckCircle2 size={11} /> Imaš
                    </span>
                  )}
                  <div className="text-3xl mb-2">{lvl.icon}</div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-1">
                    Od {lvl.minStamps} {lvl.minStamps === 1 ? "žiga" : "žigov"}
                  </p>
                  <p className="font-display font-bold text-forest-900 text-sm leading-tight mb-1.5">
                    {lvl.name}
                  </p>
                  <p className="text-xs text-earth-700 leading-relaxed">
                    {lvl.rewardShort}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          REAL LEADERBOARD
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700 mb-2">
            Najbolj zaželene
          </p>
          <h2 className="text-3xl font-black text-forest-900">
            Častna straža — varuhi naših kmetij
          </h2>
          <p className="text-sm text-earth-500 mt-2">
            Kmetije, ki so prejele največ zelenih žigov.
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-earth-400">
            <Stamp size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Bodi prvi! Pridobi žig na svoji naslednji kmetiji.</p>
            <Link
              href="/kmetije"
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 text-white font-semibold text-sm hover:bg-forest-600 transition-colors"
            >
              <Search size={15} /> Poišči kmetijo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaderboard.map((entry, i) => (
              <Link
                key={entry.kmetija_id}
                href={`/kmetije/${entry.kmetije.slug}`}
                className="group bg-white rounded-2xl p-3 border border-earth-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3"
              >
                <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
                  <Image
                    src={entry.kmetije.naslovna_slika || "/images/bg-vineyards.webp"}
                    alt={entry.kmetije.ime}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="64px"
                  />
                  <div className="absolute top-0 left-0 bg-emerald-500 text-white w-5 h-5 flex items-center justify-center font-bold text-[10px] rounded-br-md">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-forest-900 truncate text-sm">
                    {entry.kmetije.ime}
                  </h4>
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Medal size={12} /> {entry.stamp_count} {entry.stamp_count === 1 ? "žig" : "žigov"}
                    </span>
                    <span className="text-earth-400 capitalize text-[11px]">{entry.kmetije.regija}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA — only for logged-out
          ═══════════════════════════════════════════════════════════════════ */}
      {!user && (
        <section className="bg-forest-900 py-16 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <Sparkles size={32} className="text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-3 text-balance">
              Stopi na pot danes
            </h2>
            <p className="text-forest-200 mb-8 text-sm">
              Brezplačen račun. Žigi se ohranjajo. Nagrade se kopičijo.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/registracija?redirect=/green-passport"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg transition-all hover:-translate-y-0.5"
              >
                <Leaf size={16} /> Ustvari račun
              </Link>
              <Link
                href="/prijava?redirect=/green-passport"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-all"
              >
                Že imam račun
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

// ─── Region mosaic — 12-region grid showing user's progress ─────────────────

function RegionMosaic({ stampedRegions, loggedIn }: { stampedRegions: Set<string>; loggedIn: boolean }) {
  return (
    <div className="flex-1 w-full max-w-md mx-auto lg:mx-0">
      <div className="rounded-3xl bg-white border border-emerald-200 shadow-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Compass size={16} className="text-emerald-600" />
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
            12 regij Slovenije
          </p>
          <span className="ml-auto text-xs font-bold text-forest-900">
            {stampedRegions.size} / 12
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {REGIJE.map((r) => {
            const stamped = stampedRegions.has(r);
            return (
              <div
                key={r}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-center text-center p-1.5 border-2 transition-all ${
                  stamped
                    ? "bg-emerald-50 border-emerald-300 shadow-sm"
                    : "bg-earth-50 border-earth-200 border-dashed"
                }`}
              >
                {stamped ? (
                  <>
                    <Stamp size={20} className="text-emerald-600 mb-1" />
                    <p className="text-[9px] font-bold text-forest-900 leading-tight">
                      {REGIJA_LABELS[r]}
                    </p>
                  </>
                ) : (
                  <>
                    <MapPin size={16} className="text-earth-300 mb-1" />
                    <p className="text-[9px] text-earth-400 leading-tight">
                      {REGIJA_LABELS[r]}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {!loggedIn && (
          <p className="text-[11px] text-earth-500 text-center mt-4 leading-relaxed">
            Prijavi se in tvoja kronika regij oživi.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Time-ago helper ─────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const diff = Date.now() - t;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "pravkar";
  if (min < 60) return `pred ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `pred ${h} ${h === 1 ? "uro" : h < 5 ? "urama" : "urami"}`;
  const d = Math.floor(h / 24);
  if (d < 7) return `pred ${d} ${d === 1 ? "dnevom" : "dnevi"}`;
  return new Date(iso).toLocaleDateString("sl-SI", { day: "numeric", month: "long" });
}
