// =============================================================================
// NaKmetiji.si — Green Passport: Stamp Success Page
// Server component: fetches context after stamp claim, renders StampSuccess
// =============================================================================

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import { StampSuccess } from "@/components/StampSuccess";
import {
  getLevel,
  getNextLevel,
  getProgressToNext,
  calculateTotalPoints,
  POINTS_PER_STAMP,
  POINTS_BONUS_NEW_REGION,
} from "@/lib/greenPassport";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Žig zbran! | Green Passport | NaKmetiji",
  robots: { index: false },
};

export default async function PotrditivPage({
  searchParams,
}: {
  searchParams: Promise<{ farm?: string }>;
}) {
  const { farm: farmSlug } = await searchParams;

  if (!farmSlug) redirect("/green-passport");

  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/prijava?redirect=/green-passport/potrditev?farm=${farmSlug}`);

  // Fetch the farm
  const { data: kmetija } = await supabase
    .from("kmetije")
    .select("id, ime, regija, slug")
    .eq("slug", farmSlug)
    .single();

  if (!kmetija) redirect("/green-passport");

  // Fetch all user stamps (including the one just created)
  const { data: allStampsRaw } = await supabase
    .from("green_stamps")
    .select("id, kmetija_id, ustvarjeno, kmetije(regija)")
    .eq("gost_id", user.id)
    .order("ustvarjeno", { ascending: true });

  const allStamps = (allStampsRaw ?? []).map((s) => ({
    id: s.id,
    kmetija_id: s.kmetija_id,
    ustvarjeno: s.ustvarjeno,
    regija: (s.kmetije as unknown as { regija: string } | null)?.regija ?? "",
  }));

  const totalStamps = allStamps.length;

  // Unique regions across all stamps
  const allRegions = new Set(allStamps.map((s) => s.regija).filter(Boolean));
  const uniqueRegions = allRegions.size;

  // Stamps before the current one (to determine if this is a new region)
  const currentStampIdx = allStamps.findIndex((s) => s.kmetija_id === kmetija.id);
  const previousStamps = currentStampIdx >= 0 ? allStamps.slice(0, currentStampIdx) : allStamps;
  const prevRegions = new Set(previousStamps.map((s) => s.regija).filter(Boolean));
  const isNewRegion = !!kmetija.regija && !prevRegions.has(kmetija.regija);

  // Did user just level up?
  const prevLevel = getLevel(totalStamps - 1, prevRegions.size);
  const currentLevel = getLevel(totalStamps, uniqueRegions);
  const leveledUp = prevLevel.name !== currentLevel.name;

  // Points earned this stamp
  const pointsEarned = POINTS_PER_STAMP + (isNewRegion ? POINTS_BONUS_NEW_REGION : 0);

  // Total points (for display)
  const totalPoints = calculateTotalPoints(allStamps);
  void totalPoints; // available for future use

  // Progress to next level
  const nextLevel = getNextLevel(totalStamps, uniqueRegions);
  const progress = getProgressToNext(totalStamps, uniqueRegions);

  // Steps remaining to next level
  const stepsToNext = nextLevel
    ? nextLevel.minStamps - totalStamps
    : null;

  return (
    <StampSuccess
      farmName={kmetija.ime}
      farmRegion={kmetija.regija}
      farmSlug={kmetija.slug}
      pointsEarned={pointsEarned}
      isNewRegion={isNewRegion}
      leveledUp={leveledUp}
      currentLevel={currentLevel}
      totalStamps={totalStamps}
      progressPct={progress.pct}
      nextLevelName={nextLevel?.name ?? null}
      stepsToNext={stepsToNext}
    />
  );
}
