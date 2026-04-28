// =============================================================================
// NaKmetiji.si — Custom Mapbox Marker Factories
// DOM element creators for premium, standard, POI, user, pulse, rich, and gold markers
// =============================================================================

import type { ZnamenitostKategorija } from "@/types/landmarks";
import { ZNAMENITOST_IKONE } from "@/types/landmarks";

// ─── Activity type for Pulse markers ────────────────────────────────────────

export type ActivityType = "stamp" | "booking";

// ─── Farm live status ───────────────────────────────────────────────────────

export type FarmLiveStatus = "open" | "event" | "closed";

const STATUS_LABELS: Record<FarmLiveStatus, string> = {
  open: "Odprto",
  event: "Dogodek",
  closed: "Zaprto",
};

// ─── Existing markers ──────────────────────────────────────────────────────

// Cross-OS consistent vector glyphs. Emoji rendered inconsistently between
// Windows/Android and iOS — a map full of dancing style variants felt cheap.
const STAR_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2.5l2.9 6.25 6.85.59-5.2 4.56 1.55 6.7L12 17.1 5.9 20.6l1.55-6.7-5.2-4.56 6.85-.59z" fill="currentColor" stroke="none"/></svg>`;
const FARM_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10.5V20h13V10.5"/><path d="M10 20v-4.5h4V20"/></svg>`;

/** Premium farm marker — gold with pulse animation */
export function createPremiumMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-premium";
  el.innerHTML = `
    <div class="marker-premium-pulse"></div>
    <div class="marker-premium-core">${STAR_SVG}</div>
  `;
  return el;
}

/** Medium tier farm marker — sage silver-green with subtle shine */
export function createMediumMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-medium";
  el.innerHTML = `<div class="marker-medium-core">${FARM_SVG}</div>`;
  return el;
}

/** Standard farm marker — forest green */
export function createStandardMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-standard";
  el.innerHTML = `<div class="marker-standard-core">${FARM_SVG}</div>`;
  return el;
}

/** POI marker — themed by category */
export function createPOIMarker(kategorija: ZnamenitostKategorija): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-poi";
  el.innerHTML = `<div class="marker-poi-core">${ZNAMENITOST_IKONE[kategorija]}</div>`;
  return el;
}

/** User location marker — blue pulsing dot */
export function createUserMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-user";
  el.innerHTML = `
    <div class="marker-user-pulse"></div>
    <div class="marker-user-dot"></div>
  `;
  return el;
}

/** Cluster marker — circle with count */
export function createClusterElement(count: number): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-cluster";
  const size = count < 10 ? 40 : count < 50 ? 48 : 56;
  el.style.width = `${size}px`;
  el.style.height = `${size}px`;
  el.innerHTML = `<span>${count}</span>`;
  return el;
}

// ─── NEW: Pulse Activity Marker (Social Proof) ─────────────────────────────

/**
 * Creates a pulsing marker for farms with recent activity (booking/stamp).
 * The "breathing" animation creates social proof — the map feels alive.
 */
export function createPulseActivityMarker(
  activityType: ActivityType,
  emoji = "🏡"
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-pulse-activity";

  const ringClass =
    activityType === "stamp"
      ? "marker-pulse-activity-ring--stamp"
      : "marker-pulse-activity-ring--booking";

  el.innerHTML = `
    <div class="marker-pulse-activity-ring ${ringClass}"></div>
    <div class="marker-pulse-activity-ring ${ringClass}" style="animation-delay: 1s;"></div>
    <div class="marker-pulse-activity-core">${emoji}</div>
  `;
  return el;
}

// ─── NEW: Rich Marker (Zoom > 12 expanded info chip) ────────────────────────

/**
 * Creates an expanded marker with farm name and live status.
 * Replaces the simple dot at high zoom levels for maximum information density.
 */
export function createRichMarker(
  farmName: string,
  status: FarmLiveStatus = "open",
  isPremium = false
): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-rich";

  const iconBg = isPremium
    ? "background: linear-gradient(135deg, #d4a853, #b8912e);"
    : "background: linear-gradient(135deg, #2D5A27, #1f4d35);";

  const icon = isPremium ? "⭐" : "🏡";
  const statusClass = `marker-rich-status--${status}`;
  const statusLabel = STATUS_LABELS[status];

  // Truncate farm name for display
  const displayName =
    farmName.length > 18 ? farmName.slice(0, 16) + "…" : farmName;

  el.innerHTML = `
    <div class="marker-rich-icon" style="${iconBg}">${icon}</div>
    <div class="marker-rich-info">
      <span class="marker-rich-name">${displayName}</span>
      <span class="marker-rich-status ${statusClass}">${statusLabel}</span>
    </div>
  `;

  return el;
}

// ─── NEW: Gold Pioneer Marker (Level 3+ users) ─────────────────────────────

/**
 * Creates a gold-stamped marker for Pioneer Level 3+ users.
 * Features a shimmering gradient and double pulse animation.
 */
export function createGoldMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-gold";
  el.innerHTML = `
    <div class="marker-gold-pulse"></div>
    <div class="marker-gold-core">👑</div>
  `;
  return el;
}
