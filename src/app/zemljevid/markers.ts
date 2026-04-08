// =============================================================================
// NaKmetiji.si — Custom Mapbox Marker Factories
// DOM element creators for premium, standard, POI, and user markers
// =============================================================================

import type { ZnamenitostKategorija } from "@/types/landmarks";
import { ZNAMENITOST_IKONE } from "@/types/landmarks";

/** Premium farm marker — gold with pulse animation */
export function createPremiumMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-premium";
  el.innerHTML = `
    <div class="marker-premium-pulse"></div>
    <div class="marker-premium-core">⭐</div>
  `;
  return el;
}

/** Medium tier farm marker — sage silver-green with subtle shine */
export function createMediumMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-medium";
  el.innerHTML = `<div class="marker-medium-core">🏡</div>`;
  return el;
}

/** Standard farm marker — forest green */
export function createStandardMarker(): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "marker-standard";
  el.innerHTML = `<div class="marker-standard-core">🏡</div>`;
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
