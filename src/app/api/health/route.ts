// =============================================================================
// NaKmetiji.si — Health Check API
// GET /api/health — preveri delovanje vseh sistemov
//
// Checks: Supabase, Mapbox tiles, env vars, runtime
// Side effect: pings Better Stack heartbeat URL if configured
// =============================================================================

import { NextResponse } from "next/server";


interface CheckResult {
  name: string;
  status: "ok" | "error";
  latency?: number;
  message?: string;
}

interface HealthResponse {
  status: "ok" | "degraded" | "down";
  timestamp: string;
  version: string;
  uptime: number;
  checks: CheckResult[];
}

// ─── Individual checks ────────────────────────────────────────────────────────

async function checkSupabase(): Promise<CheckResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return { name: "supabase", status: "error", message: "Manjkajoče env spremenljivke" };
  }

  const t0 = Date.now();
  try {
    const res = await fetch(`${url}/rest/v1/kmetije?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    return {
      name: "supabase",
      status: res.ok ? "ok" : "error",
      latency: Date.now() - t0,
      message: res.ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      name: "supabase",
      status: "error",
      latency: Date.now() - t0,
      message: err instanceof Error ? err.message : "Timeout ali napaka pri povezavi",
    };
  }
}

async function checkMapbox(): Promise<CheckResult> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) {
    return { name: "mapbox", status: "error", message: "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ni nastavljen" };
  }

  const t0 = Date.now();
  try {
    // Ping the Mapbox styles API — lightweight check
    const res = await fetch(
      `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12?access_token=${token}`,
      { signal: AbortSignal.timeout(5000), method: "HEAD" }
    );
    return {
      name: "mapbox",
      status: res.ok || res.status === 405 ? "ok" : "error",
      latency: Date.now() - t0,
      message: res.ok || res.status === 405 ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      name: "mapbox",
      status: "error",
      latency: Date.now() - t0,
      message: err instanceof Error ? err.message : "Timeout ali napaka",
    };
  }
}

async function checkOpenMeteo(): Promise<CheckResult> {
  const t0 = Date.now();
  try {
    // Quick ping to Open-Meteo for Ljubljana — verifies weather API is reachable
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=46.05&longitude=14.51&current=temperature_2m&forecast_days=1",
      { signal: AbortSignal.timeout(5000) }
    );
    const data = res.ok ? await res.json() : null;
    const ok = res.ok && data?.current?.temperature_2m !== undefined;
    return {
      name: "open-meteo",
      status: ok ? "ok" : "error",
      latency: Date.now() - t0,
      message: ok ? undefined : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      name: "open-meteo",
      status: "error",
      latency: Date.now() - t0,
      message: err instanceof Error ? err.message : "Timeout",
    };
  }
}

function checkEnvVars(): CheckResult {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN",
  ];
  const missing = required.filter((v) => !process.env[v]);
  return {
    name: "env-vars",
    status: missing.length === 0 ? "ok" : "error",
    message: missing.length > 0 ? `Manjka: ${missing.join(", ")}` : undefined,
  };
}

function checkRuntime(): CheckResult {
  return {
    name: "runtime",
    status: "ok",
    message: `Node ${process.version} | Next.js ${process.env.npm_package_version ?? "?"}`,
  };
}

// ─── Better Stack heartbeat ping ──────────────────────────────────────────────

async function pingHeartbeat(overallOk: boolean): Promise<void> {
  const url = process.env.BETTER_STACK_HEARTBEAT_URL;
  if (!url) return;

  try {
    // Better Stack expects a GET ping; only ping if healthy
    if (overallOk) {
      await fetch(url, { signal: AbortSignal.timeout(5000) });
    }
  } catch {
    // Heartbeat failures are non-fatal — don't affect health response
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET() {
  // Run all checks in parallel
  const [supabase, mapbox, openMeteo] = await Promise.all([
    checkSupabase(),
    checkMapbox(),
    checkOpenMeteo(),
  ]);

  const checks: CheckResult[] = [
    supabase,
    mapbox,
    openMeteo,
    checkEnvVars(),
    checkRuntime(),
  ];

  const hasError = checks.some((c) => c.status === "error");
  const overallStatus: HealthResponse["status"] = hasError ? "degraded" : "ok";

  // Async side effect — don't await (fire and forget)
  pingHeartbeat(!hasError);

  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    uptime: process.uptime(),
    checks,
  };

  // Always return 200 — monitoring tools (Better Stack) treat non-200 as "down".
  // The JSON body contains the real status ("ok" | "degraded") for detailed checks.
  return NextResponse.json(response, {
    status: 200,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
