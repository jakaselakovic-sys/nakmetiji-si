// =============================================================================
// NaKmetiji.si — Znamenitosti (Landmarks/POI) Types
// =============================================================================

import type { Regija } from "./database";

export type ZnamenitostKategorija =
  | "slap"         // waterfall
  | "gora"         // mountain/peak
  | "pot"          // trail/path
  | "muzej"        // museum/castle/cultural
  | "jezero"       // lake
  | "jama";        // cave

export const ZNAMENITOST_KATEGORIJA_LABELS: Record<ZnamenitostKategorija, string> = {
  slap: "Slap",
  gora: "Gora / Vrh",
  pot: "Pot / Trail",
  muzej: "Muzej / Grad",
  jezero: "Jezero",
  jama: "Jama",
};

export const ZNAMENITOST_IKONE: Record<ZnamenitostKategorija, string> = {
  slap: "💧",
  gora: "⛰️",
  pot: "🥾",
  muzej: "🏛️",
  jezero: "🏞️",
  jama: "🕳️",
};

export interface Znamenitost {
  id: string;
  ime: string;
  opis: string | null;
  zanimivost?: string | null;   // interesting fact / "did you know"
  kategorija: ZnamenitostKategorija;
  lat: number;
  lng: number;
  slika_url: string | null;
  regija: Regija;
}
