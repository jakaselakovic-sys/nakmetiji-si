// =============================================================================
// NaKmetiji.si — Approximate Slovenian Region Boundaries
// Simplified polygons for map visualization (not precise cadastral data)
// Colors evoke each region's characteristic landscape / identity
// =============================================================================

import type { Region } from "@/types/farm";

export interface RegionStyle {
  color: string;         // fill color
  icon: string;          // emoji representing the region
  description: string;   // short Slovenian description
  labelLng: number;      // label placement longitude
  labelLat: number;      // label placement latitude
}

/** Visual style per region — color chosen to evoke the region's character */
export const REGION_STYLES: Record<Region, RegionStyle> = {
  gorenjska: {
    color: "#7BB3D4",
    icon: "⛰️",
    description: "Julijske Alpe",
    labelLng: 14.15,
    labelLat: 46.32,
  },
  primorska: {
    color: "#D49A3C",
    icon: "🍷",
    description: "Mediteran & vino",
    labelLng: 13.72,
    labelLat: 45.82,
  },
  stajerska: {
    color: "#4A8A5A",
    icon: "🌲",
    description: "Pohorje & vinogorje",
    labelLng: 15.88,
    labelLat: 46.52,
  },
  dolenjska: {
    color: "#9E7E4A",
    icon: "🌳",
    description: "Hrastovi gozdovi",
    labelLng: 15.18,
    labelLat: 45.78,
  },
  koroska: {
    color: "#8FA5C5",
    icon: "🏔️",
    description: "Alpske doline",
    labelLng: 15.12,
    labelLat: 46.56,
  },
  savinjska: {
    color: "#6A9E68",
    icon: "🌿",
    description: "Zelena dolina",
    labelLng: 15.05,
    labelLat: 46.22,
  },
  pomurska: {
    color: "#D4B862",
    icon: "🌾",
    description: "Panonska ravnica",
    labelLng: 16.18,
    labelLat: 46.64,
  },
  notranjska: {
    color: "#A49AB8",
    icon: "🦇",
    description: "Kras & jame",
    labelLng: 14.22,
    labelLat: 45.7,
  },
  zasavska: {
    color: "#8A9BAA",
    icon: "⛏️",
    description: "Zasavska dolina",
    labelLng: 14.98,
    labelLat: 46.12,
  },
  posavska: {
    color: "#5AB8C8",
    icon: "🌊",
    description: "Ob reki Savi",
    labelLng: 15.45,
    labelLat: 45.95,
  },
  jugovzhodna_slovenija: {
    color: "#3D6B4F",
    icon: "🌲",
    description: "Kočevski Rog",
    labelLng: 15.05,
    labelLat: 45.57,
  },
  osrednjeslovenska: {
    color: "#8AAE88",
    icon: "🏙️",
    description: "Ljubljana & okolica",
    labelLng: 14.52,
    labelLat: 45.97,
  },
};

// ─── Approximate polygon coordinates [lng, lat] ──────────────────────────────
// These are simplified for visual effect, not precise administrative boundaries.
// GeoJSON ring must be closed (first = last point).

export const REGIONS_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { regija: "gorenjska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [13.72, 46.10], [14.78, 46.10], [14.78, 46.55],
          [14.25, 46.60], [13.85, 46.50], [13.72, 46.28],
          [13.72, 46.10],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "primorska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [13.38, 45.42], [14.15, 45.42], [14.18, 45.72],
          [14.32, 46.02], [14.10, 46.18], [13.55, 46.18],
          [13.38, 46.00], [13.38, 45.42],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "stajerska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [15.35, 46.15], [16.62, 46.28], [16.62, 46.88],
          [15.82, 46.88], [15.38, 46.55], [15.35, 46.15],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "dolenjska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [14.85, 45.65], [15.55, 45.65], [15.58, 46.05],
          [14.88, 46.05], [14.85, 45.65],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "koroska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [14.82, 46.40], [15.50, 46.38], [15.55, 46.72],
          [14.85, 46.72], [14.82, 46.40],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "savinjska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [14.65, 46.05], [15.48, 46.05], [15.45, 46.42],
          [14.72, 46.42], [14.65, 46.05],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "pomurska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [15.82, 46.40], [16.62, 46.40], [16.62, 46.88],
          [15.82, 46.88], [15.82, 46.40],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "notranjska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [13.80, 45.50], [14.68, 45.50], [14.68, 45.92],
          [14.08, 45.92], [13.82, 45.72], [13.80, 45.50],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "zasavska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [14.87, 46.04], [15.12, 46.04], [15.12, 46.24],
          [14.87, 46.24], [14.87, 46.04],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "posavska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [15.08, 45.82], [15.88, 45.82], [15.88, 46.10],
          [15.08, 46.10], [15.08, 45.82],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "jugovzhodna_slovenija" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [14.55, 45.42], [15.65, 45.42], [15.68, 45.72],
          [14.55, 45.72], [14.55, 45.42],
        ]],
      },
    },
    {
      type: "Feature",
      properties: { regija: "osrednjeslovenska" },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [14.18, 45.88], [14.88, 45.88], [14.88, 46.12],
          [14.42, 46.14], [14.18, 46.02], [14.18, 45.88],
        ]],
      },
    },
  ],
};

/** GeoJSON FeatureCollection of region label points (centroids) */
export const REGION_LABELS_GEOJSON: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: Object.entries(REGION_STYLES).map(([key, style]) => ({
    type: "Feature" as const,
    properties: {
      regija: key,
      ime: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      ikona: style.icon,
      opis: style.description,
      barva: style.color,
    },
    geometry: {
      type: "Point" as const,
      coordinates: [style.labelLng, style.labelLat],
    },
  })),
};
