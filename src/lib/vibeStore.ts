// =============================================================================
// NaKmetiji.si — Vibe Engine (Predictive Personalization)
//
// Zustand store with localStorage persistence that tracks user behavior
// and builds a "vibe profile" for personalized content injection.
//
// How it works:
//   1. User views a farm page → trackView() called
//   2. Farm's vibe_tags and dozivetja are mapped to 6 high-level VibeTag
//   3. Scores accumulate with recency weighting
//   4. dominantVibe = highest-scoring tag (min threshold: 3)
//   5. Hero section, map markers, and AI recommendations adapt accordingly
// =============================================================================

"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ──────────────────────────────────────────────────────────────────

export type VibeTag =
  | "organic"
  | "luxury"
  | "adventure"
  | "family"
  | "wine"
  | "quiet";

export const VIBE_TAGS: VibeTag[] = [
  "organic",
  "luxury",
  "adventure",
  "family",
  "wine",
  "quiet",
];

/** Human-readable Slovenian labels for each vibe */
export const VIBE_LABELS: Record<VibeTag, string> = {
  organic: "Eko ljubitelj",
  luxury: "Luksuz",
  adventure: "Pustolovščina",
  family: "Družina",
  wine: "Vino",
  quiet: "Miroljubni",
};

/** Human-readable Slovenian hero subtitles per vibe */
export const VIBE_HERO_SUBTITLES: Record<VibeTag, string> = {
  wine: "Kjer se grozdje in zgodbe prepletajo",
  family: "Kjer se otroci igrajo med kozolci",
  quiet: "Kjer je tišina še vedno zlata",
  organic: "Kjer narava kuha in zemlja peče",
  luxury: "Kjer je vsak dan lep kot razglednica",
  adventure: "Kjer se gorski veter sreča s travnikom",
};

/** Maps farm vibe_tags / dozivetja slugs to our 6 VibeTag categories */
const TAG_MAPPING: Record<string, VibeTag[]> = {
  // From vibe_tags (database)
  eko: ["organic"],
  rusticna: ["quiet"],
  tiha: ["quiet"],
  moderna: ["luxury"],
  luksuzna: ["luxury"],
  romanticna: ["wine", "quiet"],
  druzinska: ["family"],
  pustolovska: ["adventure"],

  // From dozivetja slugs
  ekologija: ["organic"],
  wellness: ["luxury"],
  sport: ["adventure"],
  druzine: ["family"],
  vino: ["wine"],
  kulinarika: ["organic", "wine"],
  delavnice: ["family", "adventure"],
  zivali: ["family"],
  prireditve: ["adventure"],
  prenocisce: [],
};

// ─── Store interface ────────────────────────────────────────────────────────

interface VibeState {
  /** Scores per vibe category (0+, higher = stronger signal) */
  scores: Record<VibeTag, number>;

  /** Last N farm slugs viewed (for deduplication) */
  viewHistory: string[];

  /** Computed dominant vibe (null if no strong signal yet) */
  dominantVibe: VibeTag | null;

  /** Pioneer level from Green Passport (0 = not tracked, 3+ = gold) */
  pioneerLevel: number;

  /** Track a farm view — called from FarmProfileClient on mount */
  trackView: (farmData: {
    slug: string;
    vibeTags?: string[];
    dozivetkaSlugs?: string[];
  }) => void;

  /** Set Pioneer level from Green Passport data */
  setPioneerLevel: (level: number) => void;

  /** Reset all tracking data */
  reset: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const MAX_HISTORY = 30;
const DOMINANCE_THRESHOLD = 3; // Min score before a vibe can become dominant
const RECENCY_BOOST = 1.5; // Score per tag match for most recent view
// BASE_SCORE = 1 (implicit default weight for older views)

// ─── Helpers ────────────────────────────────────────────────────────────────

function createEmptyScores(): Record<VibeTag, number> {
  return {
    organic: 0,
    luxury: 0,
    adventure: 0,
    family: 0,
    wine: 0,
    quiet: 0,
  };
}

function computeDominant(
  scores: Record<VibeTag, number>
): VibeTag | null {
  let maxTag: VibeTag | null = null;
  let maxScore = 0;

  for (const tag of VIBE_TAGS) {
    if (scores[tag] > maxScore && scores[tag] >= DOMINANCE_THRESHOLD) {
      maxScore = scores[tag];
      maxTag = tag;
    }
  }

  return maxTag;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useVibeStore = create<VibeState>()(
  persist(
    (set, get) => ({
      scores: createEmptyScores(),
      viewHistory: [],
      dominantVibe: null,
      pioneerLevel: 0,

      trackView: ({ slug, vibeTags = [], dozivetkaSlugs = [] }) => {
        const state = get();

        // Deduplicate — don't double-count the same farm view within last 5
        const recentViews = state.viewHistory.slice(-5);
        if (recentViews.includes(slug)) return;

        // Collect all tags from both sources
        const allTags = [...vibeTags, ...dozivetkaSlugs];

        // Map to VibeTag and accumulate scores
        const newScores = { ...state.scores };
        for (const tag of allTags) {
          const mapped = TAG_MAPPING[tag.toLowerCase()];
          if (mapped) {
            for (const vibeTag of mapped) {
              newScores[vibeTag] += RECENCY_BOOST;
            }
          }
        }

        // Apply light decay to all scores (keeps recency relevant)
        for (const tag of VIBE_TAGS) {
          newScores[tag] = Math.round(newScores[tag] * 100) / 100;
        }

        // Update history
        const newHistory = [...state.viewHistory, slug].slice(-MAX_HISTORY);

        set({
          scores: newScores,
          viewHistory: newHistory,
          dominantVibe: computeDominant(newScores),
        });
      },

      setPioneerLevel: (level) => set({ pioneerLevel: level }),

      reset: () =>
        set({
          scores: createEmptyScores(),
          viewHistory: [],
          dominantVibe: null,
          pioneerLevel: 0,
        }),
    }),
    {
      name: "nakmetiji-vibe",
      version: 1,
      // Only persist scores, history, and pioneer level — not actions
      partialize: (state) => ({
        scores: state.scores,
        viewHistory: state.viewHistory,
        dominantVibe: state.dominantVibe,
        pioneerLevel: state.pioneerLevel,
      }),
    }
  )
);
