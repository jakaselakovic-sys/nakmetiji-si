#!/usr/bin/env node
// =============================================================================
// NaKmetiji.si — Preveri VSE
// Poženi: npm run check:all
//
// Naredi zapovrstjo:
//   1. ESLint auto-fix
//   2. TypeScript preverjanje
//   3. Production build
//   4. Health check (lokalni server mora teči)
// =============================================================================

import { execSync, spawn } from "child_process";
import { existsSync } from "fs";

const GREEN = "\x1b[32m";
const RED   = "\x1b[31m";
const BLUE  = "\x1b[34m";
const RESET = "\x1b[0m";
const BOLD  = "\x1b[1m";

let passed = 0;
let failed = 0;

function log(icon, msg, color = RESET) {
  console.log(`${color}${icon} ${msg}${RESET}`);
}

function run(label, cmd, options = {}) {
  console.log(`\n${BLUE}${BOLD}▶ ${label}${RESET}`);
  try {
    execSync(cmd, { stdio: "inherit", ...options });
    log("✅", `${label} — OK`, GREEN);
    passed++;
    return true;
  } catch {
    log("❌", `${label} — NEUSPEŠNO`, RED);
    failed++;
    if (options.bail) process.exit(1);
    return false;
  }
}

async function checkHealthEndpoint() {
  console.log(`\n${BLUE}${BOLD}▶ Health check (localhost:3000)${RESET}`);
  try {
    const res = await fetch("http://localhost:3000/api/health", {
      signal: AbortSignal.timeout(5000),
    });
    const data = await res.json();

    if (data.status === "ok") {
      log("✅", `Health check OK — vse storitve delujejo`, GREEN);
      passed++;
    } else {
      log("⚠️", `Health check DEGRADED`, "\x1b[33m");
      data.checks?.filter(c => c.status === "error").forEach(c => {
        log("   →", `${c.name}: ${c.message || "napaka"}`, RED);
      });
      failed++;
    }
  } catch {
    log("ℹ️", "Health check preskočen — dev server ne teče (to je OK)", "\x1b[33m");
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(55)}`);
console.log(`${BOLD}NaKmetiji.si — Popolno preverjanje${RESET}`);
console.log(`${new Date().toLocaleString("sl-SI")}`);
console.log("=".repeat(55));

// 1. ESLint auto-fix
run("ESLint auto-fix", "npx eslint src --ext .ts,.tsx --fix --max-warnings=0", {
  bail: false,
});

// 2. TypeScript
run("TypeScript preverjanje", "npx tsc --noEmit", { bail: false });

// 3. Build
run("Production build", "npm run build", { bail: false });

// 4. Health check
await checkHealthEndpoint();

// ─── Povzetek ──────────────────────────────────────────────────────────────────

console.log(`\n${"=".repeat(55)}`);
if (failed === 0) {
  log("🎉", `VSE OK! (${passed}/${passed + failed} preverjanj uspešnih)`, GREEN + BOLD);
} else {
  log("⚠️", `${failed} preverjanj NEUSPEŠNIH, ${passed} uspešnih`, RED + BOLD);
  console.log(`\nOdpri napake zgoraj in jih popravi, ali poženi posamezne ukaze:`);
  console.log(`  TypeScript:  npx tsc --noEmit`);
  console.log(`  ESLint:      npx eslint src --ext .ts,.tsx --fix`);
  console.log(`  Build:       npm run build`);
}
console.log("=".repeat(55) + "\n");

process.exit(failed > 0 ? 1 : 0);
