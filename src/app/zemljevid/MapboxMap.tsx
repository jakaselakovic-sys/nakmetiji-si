"use client";

// =============================================================================
// NaKmetiji.si — 3D Mapbox GL JS Map Component
// Google Maps-like navigation, tier-based farm markers, routing, POI
// =============================================================================

import { useEffect, useRef, useCallback, useImperativeHandle } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import type { Farm } from "@/types";
import type { Znamenitost } from "@/types/landmarks";
import { fetchWeather } from "@/lib/weather";
import {
  createPremiumMarker,
  createMediumMarker,
  createStandardMarker,
  createPOIMarker,
  createUserMarker,
} from "./markers";

// ─── Config ────────────────────────────────────────────────────────────────

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
const SLOVENIA_CENTER: [number, number] = [14.99, 46.15];
const SLOVENIA_BOUNDS: mapboxgl.LngLatBoundsLike = [
  [13.3, 45.38],
  [16.65, 46.92],
];

const ROUTE_COLORS: Record<string, string> = {
  driving: "#2D5A27",
  walking: "#D4A04A",
  cycling: "#5B8C5A",
};

// ─── Types ─────────────────────────────────────────────────────────────────

export interface RouteInfo {
  distance: number; // metres
  duration: number; // seconds
  profile: string;
}

export interface MapboxMapHandle {
  flyToFarm: (slug: string) => void;
  flyToUser: (lng: number, lat: number) => void;
  resetView: () => void;
}

interface MapboxMapProps {
  farms: Farm[];
  landmarks: Znamenitost[];
  activeFarmSlug: string | null;
  onFarmSelect: (slug: string | null) => void;
  onLandmarkSelect: (id: string | null) => void;
  showWeather: boolean;
  userLocation: { lat: number; lng: number } | null;
  mapHandle?: React.MutableRefObject<MapboxMapHandle | null>;
  routeProfile: "driving" | "walking" | "cycling" | null;
  onRouteUpdate: (info: RouteInfo | null) => void;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Reduce base-map label clutter at low zoom levels */
function declutterBaseMap(map: mapboxgl.Map) {
  const hideCompletely = [
    "poi-label",
    "road-number-shield",
    "road-exit-shield",
    "settlement-subdivision-label",
  ];
  const pushToZoom11 = ["settlement-minor-label"];
  const pushToZoom12 = ["road-label"];
  const pushToZoom13 = ["waterway-label", "natural-line-label", "natural-point-label"];

  hideCompletely.forEach((id) => {
    try { map.setLayoutProperty(id, "visibility", "none"); } catch { /* noop */ }
  });
  pushToZoom11.forEach((id) => {
    try { map.setLayerZoomRange(id, 11, 24); } catch { /* noop */ }
  });
  pushToZoom12.forEach((id) => {
    try { map.setLayerZoomRange(id, 12, 24); } catch { /* noop */ }
  });
  pushToZoom13.forEach((id) => {
    try { map.setLayerZoomRange(id, 13, 24); } catch { /* noop */ }
  });
}

/** Fetch a route from Mapbox Directions and draw it on the map */
async function fetchAndDrawRoute(
  map: mapboxgl.Map,
  profile: string,
  userLng: number,
  userLat: number,
  farmLng: number,
  farmLat: number,
  onRouteUpdate: (info: RouteInfo | null) => void
) {
  const url =
    `https://api.mapbox.com/directions/v5/mapbox/${profile}/` +
    `${userLng},${userLat};${farmLng},${farmLat}` +
    `?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) return;
    const data = await resp.json();
    if (!data.routes?.length) return;

    const route = data.routes[0];
    clearRouteFromMap(map);

    map.addSource("route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry: route.geometry },
    });

    map.addLayer({
      id: "route-outline",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: { "line-color": "#ffffff", "line-width": 8, "line-opacity": 0.7 },
    });

    map.addLayer({
      id: "route-line",
      type: "line",
      source: "route",
      layout: { "line-join": "round", "line-cap": "round" },
      paint: {
        "line-color": ROUTE_COLORS[profile] ?? "#2D5A27",
        "line-width": 5,
        "line-opacity": 0.9,
      },
    });

    onRouteUpdate({ distance: route.distance, duration: route.duration, profile });
  } catch {
    // Silent — routing is optional
  }
}

function clearRouteFromMap(map: mapboxgl.Map) {
  ["route-line", "route-outline"].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource("route")) map.removeSource("route");
}

// ─── Component ─────────────────────────────────────────────────────────────

export function MapboxMap({
  farms,
  landmarks,
  activeFarmSlug,
  onFarmSelect,
  onLandmarkSelect,
  showWeather,
  userLocation,
  mapHandle,
  routeProfile,
  onRouteUpdate,
}: MapboxMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const weatherMarkersRef = useRef<mapboxgl.Marker[]>([]);

  useImperativeHandle(mapHandle, () => ({
    flyToFarm(slug: string) {
      const farm = farms.find((f) => f.slug === slug);
      if (!farm?.location || !mapRef.current) return;
      mapRef.current.flyTo({
        center: [farm.location.longitude, farm.location.latitude],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        duration: 1600,
        essential: true,
      });
    },
    flyToUser(lng: number, lat: number) {
      mapRef.current?.flyTo({
        center: [lng, lat],
        zoom: 13,
        pitch: 0,
        bearing: 0,
        duration: 1400,
        essential: true,
      });
    },
    resetView() {
      mapRef.current?.flyTo({
        center: SLOVENIA_CENTER,
        zoom: 8,
        pitch: 0,
        bearing: 0,
        duration: 1400,
        essential: true,
      });
    },
  }));

  // ── Initialize map ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current || !MAPBOX_TOKEN) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: SLOVENIA_CENTER,
      zoom: 8,
      minZoom: 6.5,
      maxZoom: 18,
      maxBounds: SLOVENIA_BOUNDS,
      pitch: 0,
      bearing: 0,
      antialias: true,
      projection: "mercator",
      // Disable rotation — keeps map north-up like Google Maps
      dragRotate: false,
    });

    // Disable touch rotation too
    map.touchZoomRotate.disableRotation();

    // Zoom only — no compass (rotation disabled)
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false, showZoom: true }),
      "top-right"
    );

    // GPS locate button (like Google Maps)
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserHeading: false,
        showAccuracyCircle: false,
      }),
      "top-right"
    );

    map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");

    map.on("style.load", () => {
      // 3D terrain
      map.addSource("mapbox-dem", {
        type: "raster-dem",
        url: "mapbox://mapbox.mapbox-terrain-dem-v1",
        tileSize: 512,
        maxzoom: 14,
      });
      map.setTerrain({ source: "mapbox-dem", exaggeration: 1.2 });

      // Atmosphere/sky
      map.addLayer({
        id: "sky",
        type: "sky",
        paint: {
          "sky-type": "atmosphere",
          "sky-atmosphere-sun": [0.0, 60.0],
          "sky-atmosphere-sun-intensity": 15,
        },
      });

      try { map.setPaintProperty("land", "background-color", "#f0ebe2"); } catch { /* noop */ }

      declutterBaseMap(map);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Update markers on zoom / data change ────────────────────────────

  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    const zoom = map.getZoom();

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    // --- Farm markers (tier-based zoom visibility) ---
    farms.forEach((farm) => {
      if (!farm.location) return;

      const isPremium = farm.isPremium;
      const isMedium = farm.isMedium ?? false;

      // zoom < 8: premium only
      if (zoom < 8 && !isPremium) return;
      // zoom 8-9: premium + medium only
      if (zoom < 9 && !isPremium && !isMedium) return;

      let el: HTMLDivElement;
      if (isPremium) {
        el = createPremiumMarker();
      } else if (isMedium) {
        el = createMediumMarker();
        if (zoom >= 8 && zoom < 9) {
          el.style.opacity = "0";
          el.style.transition = "opacity 0.6s ease-out";
          requestAnimationFrame(() => { el.style.opacity = "1"; });
        }
      } else {
        el = createStandardMarker();
        if (zoom >= 9 && zoom < 10) {
          el.style.opacity = "0";
          el.style.transition = "opacity 0.6s ease-out";
          requestAnimationFrame(() => { el.style.opacity = "1"; });
        }
      }

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([farm.location.longitude, farm.location.latitude])
        .addTo(map);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onFarmSelect(farm.slug);
        map.flyTo({
          center: [farm.location!.longitude, farm.location!.latitude],
          zoom: Math.max(zoom, 12),
          pitch: 0,
          bearing: 0,
          duration: 1000,
        });
      });

      if (farm.slug === activeFarmSlug) {
        el.classList.add("marker-active");
      }

      markersRef.current.set(`farm-${farm.slug}`, marker);
    });

    // --- Landmark markers (zoom 10+) ---
    if (zoom >= 10) {
      landmarks.forEach((lm) => {
        const el = createPOIMarker(lm.kategorija);

        el.style.opacity = "0";
        el.style.transition = "opacity 0.4s ease-out";
        requestAnimationFrame(() => { el.style.opacity = "1"; });

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([lm.lng, lm.lat])
          .addTo(map);

        el.addEventListener("click", (e) => {
          e.stopPropagation();
          onLandmarkSelect(lm.id);
        });

        markersRef.current.set(`poi-${lm.id}`, marker);
      });
    }
  }, [farms, landmarks, activeFarmSlug, onFarmSelect, onLandmarkSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onLoad = () => {
      updateMarkers();
      map.on("zoomend", updateMarkers);
      map.on("moveend", updateMarkers);
    };

    if (map.isStyleLoaded()) {
      onLoad();
    } else {
      map.on("load", onLoad);
    }

    return () => {
      map.off("zoomend", updateMarkers);
      map.off("moveend", updateMarkers);
      map.off("load", onLoad);
    };
  }, [updateMarkers]);

  // ── Fly to active farm ──────────────────────────────────────────────
  useEffect(() => {
    if (!activeFarmSlug || !mapRef.current) return;
    const farm = farms.find((f) => f.slug === activeFarmSlug);
    if (!farm?.location) return;

    mapRef.current.flyTo({
      center: [farm.location.longitude, farm.location.latitude],
      zoom: 14,
      pitch: 0,
      bearing: 0,
      duration: 1600,
      essential: true,
    });
  }, [activeFarmSlug, farms]);

  // ── User location marker ────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const el = createUserMarker();
      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    }
  }, [userLocation]);

  // ── Routing ─────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const run = () => {
      if (!routeProfile || !userLocation) {
        clearRouteFromMap(map);
        onRouteUpdate(null);
        return;
      }

      const farm = farms.find((f) => f.slug === activeFarmSlug);
      if (!farm?.location) {
        clearRouteFromMap(map);
        onRouteUpdate(null);
        return;
      }

      fetchAndDrawRoute(
        map,
        routeProfile,
        userLocation.lng,
        userLocation.lat,
        farm.location.longitude,
        farm.location.latitude,
        onRouteUpdate
      );
    };

    if (map.isStyleLoaded()) {
      run();
    } else {
      map.once("load", run);
    }
  }, [routeProfile, userLocation, activeFarmSlug, farms, onRouteUpdate]);

  // ── Weather badges (Open-Meteo — free, real-time, per farm) ───────────
  useEffect(() => {
    const map = mapRef.current;

    // Clear old badges
    const clearBadges = () => {
      weatherMarkersRef.current.forEach((m) => m.remove());
      weatherMarkersRef.current = [];
    };

    if (!showWeather) {
      clearBadges();
      return;
    }

    let cancelled = false;

    const addBadges = () => {
      clearBadges();
      if (cancelled) return;

      const farmsWithLocation = farms.filter((f) => f.location);

      farmsWithLocation.forEach((farm) => {
        if (!farm.location) return;
        const { latitude, longitude } = farm.location;

        fetchWeather(latitude, longitude).then((w) => {
          if (cancelled || !w || !mapRef.current) return;

          const el = document.createElement("div");
          el.className = `weather-badge${w.current.isGood ? " weather-badge-good" : ""}`;
          el.innerHTML = `
            <span class="weather-badge-emoji">${w.current.emoji}</span>
            <span class="weather-badge-temp">${w.current.temp}°C</span>
          `;

          const marker = new mapboxgl.Marker({ element: el, anchor: "bottom", offset: [0, -44] })
            .setLngLat([longitude, latitude])
            .addTo(mapRef.current);

          weatherMarkersRef.current.push(marker);
        });
      });
    };

    if (map?.isStyleLoaded()) {
      addBadges();
    } else {
      map?.once("load", addBadges);
    }

    return () => {
      cancelled = true;
      clearBadges();
    };
   
  }, [showWeather, farms]);

  // ── Deselect on map click ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handleClick = () => {
      onFarmSelect(null);
      onLandmarkSelect(null);
    };

    map.on("click", handleClick);
    return () => { map.off("click", handleClick); };
  }, [onFarmSelect, onLandmarkSelect]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex-1 h-full w-full flex items-center justify-center bg-earth-100">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto w-16 h-16 bg-earth-200 rounded-full flex items-center justify-center mb-4 text-earth-500 text-2xl">🗺️</div>
          <h3 className="text-lg font-bold text-forest-900 mb-2">Mapbox token ni nastavljen</h3>
          <p className="text-sm text-earth-600">
            Dodajte{" "}
            <code className="bg-earth-200 px-1.5 py-0.5 rounded text-forest-800 text-xs font-mono">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code>{" "}
            v datoteko{" "}
            <code className="bg-earth-200 px-1.5 py-0.5 rounded text-forest-800 text-xs font-mono">.env.local</code>.
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className="flex-1 h-full w-full" />;
}
