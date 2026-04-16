"use server";

import { Redis } from "@upstash/redis";
import { revalidatePath } from "next/cache";

// Fail-safe initialization
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Retrieves the global maintenance/feature flags from Redis Edge.
 */
export async function getSystemToggles() {
  if (!redis) return { oracle_enabled: true, platform_maintenance: false };
  
  const [oracle, maintenance] = await Promise.all([
    redis.get<boolean>("feature:oracle:enabled"),
    redis.get<boolean>("platform:maintenance"),
  ]);

  return {
    oracle_enabled: oracle ?? true, // default to true if key not set
    platform_maintenance: maintenance ?? false,
  };
}

/**
 * Invokes a Kill Switch by writing immediately to Edge Redis.
 * Forces a re-validation so all cached pages immediately reflect the disabled state.
 */
export async function setKillSwitch(feature: "oracle" | "platform", enabled: boolean) {
  if (!redis) throw new Error("Upstash is not configured.");

  if (feature === "oracle") {
    await redis.set("feature:oracle:enabled", enabled);
  } else if (feature === "platform") {
    await redis.set("platform:maintenance", !enabled); // platform active = !maintenance
  }

  // Nuke caches site-wide so components read the new toggles immediately
  revalidatePath("/", "layout");
  
  return { success: true };
}
