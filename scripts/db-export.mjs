#!/usr/bin/env node
// =============================================================================
// NaKmetiji.si — Database Export Script
// Izvozi vse tabele v JSON in CSV format v mapo exports/
//
// Uporaba:
//   node scripts/db-export.mjs
//
// Zahteva env spremenljivke:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (service role — bypass RLS za popoln izvoz)
//
// Izhod:
//   exports/kmetije-{timestamp}.json + .csv
//   exports/mnenja-{timestamp}.json + .csv
//   exports/rezervacije-{timestamp}.json + .csv
//   exports/znamenitosti-{timestamp}.json
//   exports/export-summary-{timestamp}.json
//
// Za tedenski avtomatski izvoz nastavi GitHub Action ali cron:
//   0 3 * * 1  node /path/to/scripts/db-export.mjs
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// ─── Config ──────────────────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const EXPORTS_DIR = join(PROJECT_ROOT, "exports");

// Load .env.local if running locally (not in CI)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    const { readFileSync } = await import("fs");
    const envFile = readFileSync(join(PROJECT_ROOT, ".env.local"), "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const [key, ...rest] = trimmed.split("=");
      if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim().replace(/^["']|["']$/g, "");
      }
    }
    console.log("✓ Naložene spremenljivke iz .env.local");
  } catch {
    // .env.local ni prisoten — ok v CI okolju
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ Manjkajo env spremenljivke:");
  if (!SUPABASE_URL) console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  if (!SERVICE_KEY) console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  console.error("\nDodajte jih v .env.local ali okolje CI.");
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-")
  .slice(0, 19);

function ensureExportsDir() {
  if (!existsSync(EXPORTS_DIR)) {
    mkdirSync(EXPORTS_DIR, { recursive: true });
    console.log(`✓ Ustvarjena mapa: ${EXPORTS_DIR}`);
  }
}

function toCSV(rows) {
  if (!rows || rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val) => {
    if (val === null || val === undefined) return "";
    const str = typeof val === "object" ? JSON.stringify(val) : String(val);
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ];
  return lines.join("\n");
}

function saveJSON(filename, data) {
  const path = join(EXPORTS_DIR, filename);
  writeFileSync(path, JSON.stringify(data, null, 2), "utf-8");
  return path;
}

function saveCSV(filename, data) {
  const path = join(EXPORTS_DIR, filename);
  writeFileSync(path, toCSV(data), "utf-8");
  return path;
}

// ─── Export logic ─────────────────────────────────────────────────────────────

async function exportTable(supabase, tableName, csvColumns = null) {
  console.log(`  Izvažam ${tableName}...`);

  let query = supabase.from(tableName).select("*").order("ustvarjeno", {
    ascending: false,
  }).limit(10000);

  const { data, error, count } = await query;

  if (error) {
    console.error(`  ✗ Napaka pri ${tableName}:`, error.message);
    return { table: tableName, count: 0, error: error.message };
  }

  const rows = data || [];

  // Save JSON (always full data)
  const jsonFile = `${tableName}-${timestamp}.json`;
  saveJSON(jsonFile, {
    exported_at: new Date().toISOString(),
    table: tableName,
    count: rows.length,
    data: rows,
  });

  // Save CSV (only for tables with flat data)
  let csvFile = null;
  if (csvColumns !== false) {
    const csvData = csvColumns
      ? rows.map((row) =>
          Object.fromEntries(csvColumns.map((col) => [col, row[col]]))
        )
      : rows;
    csvFile = `${tableName}-${timestamp}.csv`;
    saveCSV(csvFile, csvData);
  }

  console.log(`  ✓ ${tableName}: ${rows.length} vrstic`);
  return { table: tableName, count: rows.length, jsonFile, csvFile };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(60));
  console.log("NaKmetiji.si — Izvoz baze podatkov");
  console.log(`Čas: ${new Date().toLocaleString("sl-SI")}`);
  console.log("=".repeat(60));

  ensureExportsDir();

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false },
  });

  const results = [];

  // Test connection
  try {
    const { error } = await supabase.from("kmetije").select("id").limit(1);
    if (error) throw error;
    console.log("✓ Povezava z Supabase uspešna\n");
  } catch (err) {
    console.error("✗ Povezava z Supabase ni uspela:", err.message);
    process.exit(1);
  }

  // Export each table
  results.push(
    await exportTable(supabase, "kmetije", [
      "id", "slug", "ime", "regija", "obcina", "lat", "lng",
      "ocena", "stevilo_ocen", "premium", "aktivna", "ustvarjeno",
    ])
  );

  results.push(
    await exportTable(supabase, "mnenja", [
      "id", "kmetija_id", "uporabnik_ime", "ocena", "odobreno", "datum",
    ])
  );

  results.push(
    await exportTable(supabase, "rezervacije", [
      "id", "kmetija_id", "gost_ime", "gost_email",
      "datum_od", "datum_do", "stevilo_oseb", "status", "ustvarjeno",
    ])
  );

  results.push(
    await exportTable(supabase, "dozivetja", null) // no CSV — small reference table
  );

  // Save summary
  const summary = {
    exported_at: new Date().toISOString(),
    timestamp,
    supabase_url: SUPABASE_URL.replace(/\/\/.*@/, "//***@"),
    tables: results,
    total_rows: results.reduce((s, r) => s + (r.count || 0), 0),
  };
  const summaryPath = saveJSON(`export-summary-${timestamp}.json`, summary);

  console.log("\n" + "=".repeat(60));
  console.log("✓ Izvoz zaključen!");
  console.log(`  Skupaj vrstic: ${summary.total_rows}`);
  console.log(`  Izhod: ${EXPORTS_DIR}`);
  console.log(`  Povzetek: ${summaryPath}`);
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Kritična napaka:", err);
  process.exit(1);
});
