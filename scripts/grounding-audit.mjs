#!/usr/bin/env node
// =============================================================================
// NaKmetiji.si — Grounding Audit
// Cross-references every znamenitost (and optionally every kmetija) against
// Google Places. Produces a CSV report; never writes to the DB unless you
// explicitly pass --apply.
//
// Usage:
//   node scripts/grounding-audit.mjs                    # dry-run, znamenitosti only
//   node scripts/grounding-audit.mjs --tables=both      # both znamenitosti + kmetije
//   node scripts/grounding-audit.mjs --apply            # write back verified status
//   node scripts/grounding-audit.mjs --apply-snap       # also snap coords > 100m off
//   node scripts/grounding-audit.mjs --remove-unverifiable  # mark removed (does NOT DELETE)
//
// Requires:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   GOOGLE_MAPS_API_KEY        (without it: report is generated as "no_key" rows)
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// ── Args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (k) => args.includes(k);
const arg = (k, def) => {
  const m = args.find((a) => a.startsWith(`${k}=`));
  return m ? m.split("=")[1] : def;
};

const TABLES = arg("--tables", "znamenitosti"); // znamenitosti | kmetije | both
const APPLY = flag("--apply");
const APPLY_SNAP = flag("--apply-snap"); // implies --apply
const REMOVE_UNVERIFIABLE = flag("--remove-unverifiable"); // sets status=removed
const LIMIT = parseInt(arg("--limit", "0"), 10) || null;
const SNAP_THRESHOLD_M = parseInt(arg("--snap-threshold", "100"), 10);
const REPORT_PATH = arg("--out", "./grounding-report.csv");

// ── Env ──────────────────────────────────────────────────────────────────
try {
  const env = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
  env.split("\n").forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k && v.length) process.env[k.trim()] = v.join("=").trim();
  });
} catch {
  /* no env file — variables likely set externally */
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✘ Manjka NEXT_PUBLIC_SUPABASE_URL ali SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────
function haversineMeters(aLat, aLng, bLat, bLng) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function googleNearby({ lat, lng, name, radius = 200 }) {
  if (!GOOGLE_KEY) return { status: "no_key" };
  const url = new URL("https://maps.googleapis.com/maps/api/place/nearbysearch/json");
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("key", GOOGLE_KEY);
  if (name) url.searchParams.set("keyword", name);

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 5_000);
    const res = await fetch(url.toString(), { signal: ctrl.signal });
    clearTimeout(to);
    if (res.status === 429) return { status: "rate_limited" };
    if (!res.ok) return { status: "upstream_error", code: res.status };
    const json = await res.json();
    if (json.status === "ZERO_RESULTS" || !json.results?.length) {
      return { status: "not_found" };
    }
    const hit = json.results[0];
    return {
      status: "found",
      name: hit.name,
      lat: hit.geometry.location.lat,
      lng: hit.geometry.location.lng,
      types: hit.types ?? [],
      place_id: hit.place_id,
    };
  } catch (err) {
    return { status: "upstream_error", err: err.message };
  }
}

function csvEscape(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

// ── Auditor ──────────────────────────────────────────────────────────────
async function auditTable(table) {
  console.log(`\n🔎 Auditing ${table}…`);
  const fields =
    table === "znamenitosti"
      ? "id, ime, lat, lng, regija"
      : "id, slug, ime, lat, lng, regija, obcina";

  let query = sb.from(table).select(fields).not("lat", "is", null).not("lng", "is", null);
  if (LIMIT) query = query.limit(LIMIT);
  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  console.log(`  ${rows.length} rows with coords.`);

  const report = [];
  let i = 0;
  for (const r of rows) {
    i++;
    process.stdout.write(`\r  Checking ${i}/${rows.length}…`);

    const result = await googleNearby({ lat: r.lat, lng: r.lng, name: r.ime });
    let status = result.status;
    let distance_m = null;
    let snapped_lat = null;
    let snapped_lng = null;

    if (result.status === "found") {
      distance_m = Math.round(
        haversineMeters(r.lat, r.lng, result.lat, result.lng),
      );
      if (distance_m <= SNAP_THRESHOLD_M) status = "verified";
      else if (distance_m <= 1000) {
        status = "drift";
        snapped_lat = result.lat;
        snapped_lng = result.lng;
      } else {
        status = "outlier";
        snapped_lat = result.lat;
        snapped_lng = result.lng;
      }
    }

    report.push({
      table,
      id: r.id,
      ime: r.ime,
      slug: r.slug ?? null,
      regija: r.regija ?? null,
      obcina: r.obcina ?? null,
      current_lat: r.lat,
      current_lng: r.lng,
      verified_status: status,
      distance_m,
      verified_name: result.status === "found" ? result.name : null,
      verified_lat: result.status === "found" ? result.lat : null,
      verified_lng: result.status === "found" ? result.lng : null,
      place_types: result.types?.join("|") ?? null,
      place_id: result.place_id ?? null,
    });

    // Throttle: 100ms between requests = 10/sec, well under Places quota.
    await new Promise((r2) => setTimeout(r2, 100));
  }
  process.stdout.write("\n");

  return report;
}

// ── Apply ────────────────────────────────────────────────────────────────
async function applyReport(report) {
  let snapped = 0;
  let verified = 0;
  let removed = 0;

  for (const r of report) {
    if (r.table !== "znamenitosti") continue; // kmetije have lastnik_id; safer to skip auto-write

    const update = {};

    if (r.verified_status === "verified") {
      update.verification_status = "verified";
      update.verification_source = "google_places";
      update.verification_distance_m = r.distance_m;
      update.verified_at = new Date().toISOString();
      verified++;
    } else if (r.verified_status === "drift" && APPLY_SNAP && r.verified_lat && r.verified_lng) {
      update.lat = r.verified_lat;
      update.lng = r.verified_lng;
      update.verification_status = "verified";
      update.verification_source = "google_places_snapped";
      update.verification_distance_m = 0;
      update.verified_at = new Date().toISOString();
      snapped++;
    } else if (
      (r.verified_status === "not_found" || r.verified_status === "outlier") &&
      REMOVE_UNVERIFIABLE
    ) {
      update.verification_status = "removed";
      update.verification_source = "google_places_unverifiable";
      removed++;
    } else if (r.verified_status === "outlier") {
      update.verification_status = "flagged";
      update.verification_source = "google_places_outlier";
      update.verification_distance_m = r.distance_m;
    }

    if (Object.keys(update).length === 0) continue;
    const { error } = await sb.from("znamenitosti").update(update).eq("id", r.id);
    if (error) {
      console.warn(`  ✘ Update ${r.id} failed: ${error.message}`);
    }
  }

  return { snapped, verified, removed };
}

// ── Main ─────────────────────────────────────────────────────────────────
(async () => {
  const tables = TABLES === "both" ? ["znamenitosti", "kmetije"] : [TABLES];
  let allRows = [];
  for (const t of tables) {
    if (!["znamenitosti", "kmetije"].includes(t)) {
      console.error(`✘ Unknown table: ${t}`);
      process.exit(1);
    }
    const part = await auditTable(t);
    allRows = allRows.concat(part);
  }

  // ── Summary ──
  const counts = {};
  for (const r of allRows) counts[r.verified_status] = (counts[r.verified_status] || 0) + 1;
  console.log("\n📊 Summary:");
  for (const [k, v] of Object.entries(counts).sort()) console.log(`  ${k.padEnd(15)} ${v}`);

  // ── CSV ──
  const headers = [
    "table", "id", "ime", "slug", "regija", "obcina",
    "current_lat", "current_lng",
    "verified_status", "distance_m",
    "verified_name", "verified_lat", "verified_lng",
    "place_types", "place_id",
  ];
  const lines = [headers.join(",")];
  for (const r of allRows) {
    lines.push(headers.map((h) => csvEscape(r[h])).join(","));
  }
  writeFileSync(REPORT_PATH, lines.join("\n"), "utf-8");
  console.log(`\n✓ Report: ${REPORT_PATH}`);

  // ── Apply ──
  if (APPLY || APPLY_SNAP || REMOVE_UNVERIFIABLE) {
    if (!GOOGLE_KEY) {
      console.warn("\n⚠ --apply* set but GOOGLE_MAPS_API_KEY missing — nothing to apply.");
      process.exit(0);
    }
    console.log("\n✍ Applying changes…");
    const r = await applyReport(allRows);
    console.log(`  verified: ${r.verified}`);
    console.log(`  snapped:  ${r.snapped}`);
    console.log(`  removed:  ${r.removed}`);
  } else {
    console.log("\n(dry-run only — pass --apply to write verification status)");
  }
})().catch((e) => {
  console.error("\n✘ Error:", e);
  process.exit(1);
});
