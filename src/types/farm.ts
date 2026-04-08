// =============================================================================
// NaKmetiji — Database Schema Types
// Tourist Farm Directory Platform for Slovenia
// =============================================================================

/**
 * Slovenian statistical regions used to categorize farm locations.
 * These correspond to the traditional geographic regions of Slovenia.
 */
export enum Region {
  Gorenjska = "gorenjska",
  Primorska = "primorska",
  Stajerska = "stajerska",       // Štajerska
  Dolenjska = "dolenjska",
  Koroska = "koroska",           // Koroška
  Savinjska = "savinjska",
  Pomurska = "pomurska",
  Notranjska = "notranjska",
  Zasavska = "zasavska",
  Posavska = "posavska",
  JugovzhodnaSlovenija = "jugovzhodna_slovenija",
  OsrednjeSlovenska = "osrednjeslovenska",
}

/**
 * Display labels for regions (Slovenian names with diacritics).
 */
export const REGION_LABELS: Record<Region, string> = {
  [Region.Gorenjska]: "Gorenjska",
  [Region.Primorska]: "Primorska",
  [Region.Stajerska]: "Štajerska",
  [Region.Dolenjska]: "Dolenjska",
  [Region.Koroska]: "Koroška",
  [Region.Savinjska]: "Savinjska",
  [Region.Pomurska]: "Pomurska",
  [Region.Notranjska]: "Notranjska",
  [Region.Zasavska]: "Zasavska",
  [Region.Posavska]: "Posavska",
  [Region.JugovzhodnaSlovenija]: "Jugovzhodna Slovenija",
  [Region.OsrednjeSlovenska]: "Osrednjeslovenska",
};

/**
 * Pre-defined experience categories offered by tourist farms.
 * Using string literal union for type-safety while keeping
 * the values as human-readable Slovenian slugs.
 */
export type ExperienceTag =
  | "vino"            // Wine tasting & vineyard tours
  | "prenocisce"      // Overnight accommodation (prenočišče)
  | "druzine"         // Family-friendly activities (družine)
  | "kulinarika"      // Culinary / gastronomy experiences
  | "wellness"        // Spa & wellness
  | "sport"           // Sport & adventure activities
  | "zivali"          // Farm animals / petting zoo (živali)
  | "delavnice"       // Workshops & crafts (delavnice)
  | "ekologija"       // Eco / organic farming
  | "prireditve";     // Events & celebrations (prireditve)

/**
 * Display labels for experience tags (Slovenian).
 */
export const EXPERIENCE_LABELS: Record<ExperienceTag, string> = {
  vino: "Vino & Degustacija",
  prenocisce: "Prenočišče",
  druzine: "Za družine",
  kulinarika: "Kulinarika",
  wellness: "Wellness & Spa",
  sport: "Šport & Avantura",
  zivali: "Živali na kmetiji",
  delavnice: "Delavnice",
  ekologija: "Ekološka kmetija",
  prireditve: "Prireditve & Dogodki",
};

// =============================================================================
// Core Schema: Farm
// =============================================================================

/**
 * Geographic coordinates for map placement.
 */
export interface GeoLocation {
  latitude: number;
  longitude: number;
}

/**
 * Contact information for a farm.
 */
export interface FarmContact {
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
}

/**
 * 🏡 Primary Farm entity — the central table of the platform.
 *
 * This represents a single tourist farm listing in the NaKmetiji directory.
 */
export interface Farm {
  // ── Identity ────────────────────────────────────────────────────────
  /** Unique identifier (UUID v4 recommended) */
  id: string;

  /** URL-safe slug derived from the farm name, e.g. "kmetija-pri-janezu" */
  slug: string;

  // ── Content ─────────────────────────────────────────────────────────
  /** Farm display name */
  name: string;

  /** Rich-text description of the farm (Markdown supported) */
  description: string;

  /** Short tagline shown on cards, max ~120 chars */
  tagline?: string;

  // ── Location ────────────────────────────────────────────────────────
  /** Slovenian region the farm belongs to */
  region: Region;

  /** Full street address */
  address?: string;

  /** Municipality / town */
  municipality?: string;

  /** Postal code */
  postalCode?: string;

  /** GPS coordinates for map display */
  location?: GeoLocation;

  // ── Media ───────────────────────────────────────────────────────────
  /** Primary hero / cover image URL */
  coverImageUrl: string;

  /** Additional gallery image URLs */
  galleryImageUrls?: string[];

  /** Optional promotional or tour video URL (YouTube, Vimeo, or direct) */
  videoUrl?: string;

  // ── Categorization ──────────────────────────────────────────────────
  /** Array of experience tags describing what the farm offers */
  experiencesOffered: ExperienceTag[];

  // ── Ratings & Status ────────────────────────────────────────────────
  /** Average user rating (1.0 – 5.0), null if unrated */
  rating: number | null;

  /** Total number of reviews */
  reviewCount: number;

  /** Whether this is a premium/featured listing */
  isPremium: boolean;

  /** Whether this is a medium/standard-plus tier listing (visible at zoom 8+, vs standard zoom 10+) */
  isMedium?: boolean;

  /** Whether the listing is currently published and visible */
  isActive: boolean;

  // ── Contact ─────────────────────────────────────────────────────────
  /** Contact details */
  contact?: FarmContact;

  // ── Metadata ────────────────────────────────────────────────────────
  /** ISO 8601 timestamp of when the listing was created */
  createdAt: string;

  /** ISO 8601 timestamp of the last update */
  updatedAt: string;

  /** User/owner ID who manages this listing */
  ownerId?: string;
}

