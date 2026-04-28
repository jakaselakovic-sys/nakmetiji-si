"use client";

// =============================================================================
// NaKmetiji.si — Farm Rewards Display (public)
// Shows guests the rewards a specific farm offers and (if logged in) their
// progress toward each tier.
// =============================================================================

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Gift, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { listFarmRewards, countMyStampsAtFarm, type FarmReward } from "@/lib/actions/farm-rewards";

interface Props {
  kmetijaId: string;
  kmetijaIme: string;
}

export function FarmRewardsDisplay({ kmetijaId, kmetijaIme }: Props) {
  const [rewards, setRewards] = useState<FarmReward[]>([]);
  const [stampCount, setStampCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([listFarmRewards(kmetijaId), countMyStampsAtFarm(kmetijaId)]).then(([r, c]) => {
      if (!active) return;
      if (r.ok && r.rewards) setRewards(r.rewards.filter((x) => x.aktivna));
      setStampCount(c.count);
      setLoggedIn(c.loggedIn);
      setLoading(false);
    });
    return () => { active = false; };
  }, [kmetijaId]);

  if (loading) return null;
  if (rewards.length === 0) return null;

  const nextReward = rewards.find((r) => r.min_zigi > stampCount);
  const unlockedCount = rewards.filter((r) => r.min_zigi <= stampCount).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-amber-50/40 border border-emerald-200/70 shadow-sm p-5"
    >
      <div className="flex items-center gap-2 mb-1">
        <Gift size={16} className="text-emerald-600" />
        <h3 className="font-display font-bold text-forest-900 text-sm">
          Nagrade za stalne goste pri {kmetijaIme}
        </h3>
      </div>
      <p className="text-[11px] text-earth-600 mb-4 leading-relaxed">
        Z vsakim obiskom zberete žig (max 1 na teden). Več žigov = boljše ugodnosti.
      </p>

      {loggedIn && (
        <div className="rounded-xl bg-white border border-emerald-200/60 p-3 mb-3 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-base">
            {stampCount}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-forest-900">
              Tvoji žigi pri tej kmetiji: {stampCount}
            </p>
            {nextReward ? (
              <p className="text-[11px] text-earth-500">
                Še <strong className="text-emerald-700">{nextReward.min_zigi - stampCount}</strong> do <em>{nextReward.ime}</em>
              </p>
            ) : (
              <p className="text-[11px] text-emerald-700 font-bold">Vse nagrade odklenjene 🎉</p>
            )}
          </div>
          {unlockedCount > 0 && (
            <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold px-2 py-1">
              <Sparkles size={10} /> {unlockedCount}
            </span>
          )}
        </div>
      )}

      {!loggedIn && (
        <Link
          href="/prijava?redirect=/green-passport"
          className="block rounded-xl bg-white hover:bg-emerald-50 border border-earth-200 hover:border-emerald-300 px-3 py-2.5 text-center text-xs font-bold text-forest-700 transition-colors mb-3"
        >
          Prijavi se in spremljaj svoj napredek →
        </Link>
      )}

      <ul className="space-y-2">
        {rewards.map((r) => {
          const unlocked = loggedIn && stampCount >= r.min_zigi;
          return (
            <li
              key={r.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                unlocked
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-white border-earth-200"
              }`}
            >
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex flex-col items-center justify-center font-black ${
                  unlocked
                    ? "bg-emerald-500 text-white"
                    : "bg-earth-100 text-earth-500"
                }`}
              >
                <span className="text-sm leading-none">{r.min_zigi}</span>
                <span className="text-[7px] uppercase tracking-wider mt-0.5">žig.</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${unlocked ? "text-emerald-900" : "text-forest-900"}`}>
                  {r.ime}
                </p>
                {r.opis && <p className="text-[11px] text-earth-600 mt-0.5 line-clamp-2">{r.opis}</p>}
              </div>
              <span className="flex-shrink-0">
                {unlocked ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <Lock size={14} className="text-earth-300" />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
