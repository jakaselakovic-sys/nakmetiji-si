// =============================================================================
// NaKmetiji.si — Admin · Znamenitosti (curated landmark import)
// Server component — fetches all landmarks (including unverified + flagged +
// removed) and hands them to the client form for review/edit.
// =============================================================================

import { createSupabaseServer } from "@/lib/supabase/server";
import { issueCsrfToken } from "@/lib/titan/action";
import { ZnamenitostiAdminClient } from "./ZnamenitostiAdminClient";

interface LandmarkRow {
  id: string;
  ime: string;
  kategorija: string;
  lat: number | null;
  lng: number | null;
  regija: string | null;
  opis: string | null;
  zanimivost: string | null;
  verification_status: string | null;
  verification_source: string | null;
  verification_distance_m: number | null;
  verified_at: string | null;
}

export default async function ZnamenitostiAdminPage() {
  const sb = await createSupabaseServer();
  const [{ data }, csrf] = await Promise.all([
    sb
      .from("znamenitosti")
      .select(
        "id, ime, kategorija, lat, lng, regija, opis, zanimivost, verification_status, verification_source, verification_distance_m, verified_at",
      )
      .order("ime", { ascending: true }),
    issueCsrfToken(),
  ]);

  const rows = (data as LandmarkRow[] | null) ?? [];

  // Group counts for the header
  const byStatus = rows.reduce<Record<string, number>>((acc, r) => {
    const k = r.verification_status ?? "unverified";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-600/70 mb-2">
          Titan · Znamenitosti
        </p>
        <h1 className="font-display font-black text-3xl text-forest-900 tracking-tight">
          Kurirana baza znamenitosti
        </h1>
        <p className="text-earth-600 mt-2 text-sm max-w-2xl">
          Vsako znamenitost dodaj z URL-jem viru (vNaravo.si, Slovenia.info, Burger.si …).
          URL se shrani kot citacija, status se postavi na <strong>preverjeno</strong>.
          Brez URL-ja: status ostane <em>unverified</em> in se v aplikaciji pojavi šele
          po potrditvi prek <code>scripts/grounding-audit.mjs</code>.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Skupaj" value={rows.length} accent="#2D5A27" />
        <StatCard
          label="Preverjeno"
          value={byStatus.verified ?? 0}
          accent="#2D5A27"
        />
        <StatCard
          label="Še nepreverjeno"
          value={byStatus.unverified ?? 0}
          accent="#d97706"
        />
        <StatCard
          label="Označeno / odstranjeno"
          value={(byStatus.flagged ?? 0) + (byStatus.removed ?? 0)}
          accent="#9c2c2c"
        />
      </div>

      <ZnamenitostiAdminClient initialRows={rows} csrf={csrf} />
    </div>
  );
}

function StatCard({
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

export type { LandmarkRow };
