// =============================================================================
// NaKmetiji.si — Green Passport Landing Page
// Server component: fetches real leaderboard + user stamp count from Supabase
// =============================================================================

import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Leaf, Award, MapPin, Search, Medal, ChevronRight, QrCode, Stamp } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Green Passport | Zbiraj spomine in nagrade",
  description:
    "Zeleni potni list NaKmetiji. Bivaj na eko kmetijah, skeniraj QR kodo in zbiraj virtualne štampiljke za posebne nagrade.",
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaderboardEntry {
  kmetija_id: string;
  stamp_count: number;
  kmetije: {
    ime: string;
    regija: string;
    naslovna_slika: string;
    slug: string;
  };
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function GreenPassportPage() {
  const supabase = await createSupabaseServer();

  // Who is logged in?
  const { data: { user } } = await supabase.auth.getUser();

  let profil: { ime: string } | null = null;
  let userStampCount = 0;

  if (user) {
    const [profilRes, stampsRes] = await Promise.all([
      supabase.from("profili").select("ime").eq("id", user.id).single(),
      supabase.from("green_stamps").select("id", { count: "exact" }).eq("gost_id", user.id),
    ]);
    profil = profilRes.data;
    userStampCount = stampsRes.count ?? 0;
  }

  // Real leaderboard — farms with most stamps
  const { data: leaderboardRaw } = await supabase
    .from("green_stamps")
    .select("kmetija_id, kmetije(ime, regija, naslovna_slika, slug)")
    .limit(300); // fetch enough to count in-app

  // Aggregate in-app (Supabase doesn't support GROUP BY in the client SDK)
  const countMap = new Map<string, LeaderboardEntry>();
  for (const row of leaderboardRaw ?? []) {
    if (!row.kmetija_id || !row.kmetije) continue;
    const entry = countMap.get(row.kmetija_id);
    if (entry) {
      entry.stamp_count++;
    } else {
      countMap.set(row.kmetija_id, {
        kmetija_id: row.kmetija_id,
        stamp_count: 1,
        kmetije: row.kmetije as unknown as LeaderboardEntry["kmetije"],
      });
    }
  }
  const leaderboard = [...countMap.values()]
    .sort((a, b) => b.stamp_count - a.stamp_count)
    .slice(0, 6);

  const TARGET = 3; // stamps needed for a reward
  const progress = Math.min(100, Math.round((userStampCount / TARGET) * 100));

  return (
    <main className="min-h-screen bg-earth-50">

      {/* ═══════════════════════════════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative px-6 lg:px-12 py-16 lg:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">

        {/* Left: copy */}
        <div className="flex-1 space-y-6 relative z-10 w-full text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-sm font-bold shadow-sm mx-auto md:mx-0">
            <Leaf size={16} /> Ponos naše dediščine
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-forest-900 leading-[1.1] tracking-tight text-balance">
            Stopite na pot.<br />
            <span className="text-emerald-600">Zbirajte</span> korenine.
          </h1>

          <p className="text-lg md:text-xl text-earth-600 max-w-xl mx-auto md:mx-0 leading-relaxed font-medium">
            Vsak žig je spomin na gostoljubnost, vonj po senu in tišino gore.
            Vaš potni list je kronika vaše poti po slovenski zemlji — od prve domačije do legende podeželja.
          </p>

          {/* User progress pill — only when logged in */}
          {user && (
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-white border border-emerald-200 shadow-sm mx-auto md:mx-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                <Stamp size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs text-earth-500 font-medium">Tvoji žigi</p>
                <p className="text-sm font-bold text-forest-900">
                  {userStampCount} / {TARGET} do nagrade
                </p>
              </div>
              <div className="w-24 h-2 rounded-full bg-earth-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
            <Link
              href="/kmetije"
              className="w-full sm:w-auto px-8 py-4 bg-forest-900 hover:bg-forest-800 text-white rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Search size={18} /> Poiščite kmetijo
            </Link>
            {user ? (
              <Link
                href="/moj-potni-list"
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-forest-900 hover:bg-forest-50 text-forest-900 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Moja pot <ChevronRight size={18} />
              </Link>
            ) : (
              <Link
                href="/prijava?redirect=/moj-potni-list"
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-forest-900 hover:bg-forest-50 text-forest-900 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Prijava &amp; začni <ChevronRight size={18} />
              </Link>
            )}
          </div>
        </div>

        {/* Right: passport mockup */}
        <div className="flex-1 relative w-full aspect-[4/5] md:aspect-square max-w-md mx-auto">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-forest-50 rounded-[40px] rotate-3 shadow-2xl overflow-hidden border border-emerald-200 group hover:rotate-0 transition-transform duration-700">
            <div className="absolute top-0 left-0 w-full h-1/3 bg-forest-900 p-8 text-white rounded-b-3xl">
              <p className="text-sm font-bold tracking-widest text-emerald-400 uppercase">Zeleni Potni List</p>
              <p className="text-2xl mt-1 font-serif opacity-90">
                {profil?.ime ?? "Gost"}
              </p>
              <div className="absolute top-6 right-6 opacity-20">
                <QrCode size={64} />
              </div>
            </div>

            <div className="absolute top-1/3 left-0 w-full h-2/3 p-8">
              <p className="text-sm font-bold text-earth-400 mb-4 uppercase">
                {userStampCount > 0 ? `${userStampCount} zbranih žigov` : "Zbrane štampiljke"}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-square bg-emerald-50 rounded-2xl flex flex-col items-center justify-center border-2 border-emerald-200 border-dashed text-emerald-500 shadow-sm relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <Medal size={80} />
                  </div>
                  <span className="font-bold relative z-10 text-lg font-serif text-center px-2">
                    {userStampCount > 0 ? "Tvoj 1. žig" : "Kmetija Pr' DomaK"}
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest mt-2 relative z-10">
                    {userStampCount > 0 ? "Zbran" : "Bled"}
                  </span>
                </div>
                <div className="aspect-square bg-white rounded-2xl flex items-center justify-center border-2 border-earth-200 border-dashed text-earth-300 text-2xl">
                  ?
                </div>
                <div className="aspect-square bg-white rounded-2xl flex items-center justify-center border-2 border-earth-200 border-dashed text-earth-300 text-2xl">
                  ?
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="bg-forest-900 text-white py-20 px-6 mt-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl lg:text-5xl font-black text-center mb-16 text-balance">Kako hodite po naši poti?</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0" />

            {[
              {
                icon: <MapPin className="text-emerald-400" size={32} />,
                step: "1. Poiščite kmetijo, ki vas kliče",
                text: "Preveč ste glav, preveč vas bo. Najdite kmetijo, ki diši po vaših sanjah.",
              },
              {
                icon: <QrCode className="text-emerald-400" size={32} />,
                step: "2. Skenirajte žig pri gostitelju",
                text: "Poiščite QR kodo pri gostitelju in jo skenirajte s telefonom — spomin se samodejno ohrani v vaši kroniki.",
              },
              {
                icon: <Award className="text-emerald-400" size={32} />,
                step: "3. Prejmite dar naše zemlje",
                text: `Za vsake ${TARGET} obiski prejmete darilo — košarica domačih dobrot, popust ali VIP povabilo.`,
              },
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
          REAL LEADERBOARD
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="px-6 py-24 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-forest-900 text-balance">
            Častna straža — varuhi naših kmetij
          </h2>
          <p className="text-earth-600 mt-3 font-medium">
            Kmetije, ki so letos prejele največ zelenih žigov. *Drevo se po sadu pozna.*
          </p>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-16 text-earth-400">
            <Stamp size={48} className="mx-auto mb-4 opacity-30" />
            <p className="font-medium">Bodite prvi! Pridobite žig na vaši naslednji kmetiji.</p>
            <Link
              href="/kmetije"
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-700 text-white font-semibold text-sm hover:bg-forest-600 transition-colors"
            >
              <Search size={16} /> Poišči kmetijo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaderboard.map((entry, i) => (
              <Link
                key={entry.kmetija_id}
                href={`/kmetije/${entry.kmetije.slug}`}
                className="group bg-white rounded-3xl p-4 border border-earth-200/80 shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-4"
              >
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                  <Image
                    src={entry.kmetije.naslovna_slika || "/images/bg-vineyards.webp"}
                    alt={entry.kmetije.ime}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="80px"
                  />
                  <div className="absolute top-0 left-0 bg-emerald-500 text-white w-6 h-6 flex items-center justify-center font-bold text-xs rounded-br-lg">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-forest-900 truncate pb-1 mb-1 border-b border-earth-100">
                    {entry.kmetije.ime}
                  </h4>
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                    <span className="flex items-center gap-1">
                      <Medal size={14} /> {entry.stamp_count} {entry.stamp_count === 1 ? "žig" : "žigov"}
                    </span>
                    <span className="text-earth-400 capitalize">{entry.kmetije.regija}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          CTA — bottom
          ═══════════════════════════════════════════════════════════════════ */}
      {!user && (
        <section className="bg-forest-900 py-16 px-6 text-center">
          <div className="max-w-xl mx-auto">
            <h2 className="text-2xl font-black text-white mb-3 text-balance">
              Stopite na pot danes
            </h2>
            <p className="text-forest-200 mb-8 text-sm">
              Ustvarite brezplačen račun in začnite svojo kroniko po slovenskem podeželju. *Kdor prej pride, prej melje.*
            </p>
            <Link
              href="/registracija"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Leaf size={18} /> Ustvari brezplačen račun
            </Link>
          </div>
        </section>
      )}

    </main>
  );
}
