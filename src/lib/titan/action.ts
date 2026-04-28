import "server-only";

// =============================================================================
// NaKmetiji.si — TitanAction: secure wrapper for admin Server Actions
//
// Every destructive or privileged mutation flows through `titanAction()` so
// authentication, role check, CSRF, MFA step-up, and audit-log emission are
// handled uniformly. Uses Zod for input validation.
//
//   const updateFlag = titanAction({
//     name: "system_config.update",
//     input: z.object({ key: z.string(), value: z.any() }),
//     requireMfa: true,              // force AAL2 step-up
//     handler: async (input, ctx) => { ... },
//   });
// =============================================================================

import { cookies, headers } from "next/headers";
import { createSupabaseServer } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { z, type ZodSchema } from "zod";
import * as Sentry from "@sentry/nextjs";
import { randomBytes, timingSafeEqual } from "crypto";

// ─── Types ─────────────────────────────────────────────────────────────────
export type Severity = "info" | "warn" | "critical";

export interface TitanCtx {
  user: User;
  supabase: SupabaseClient;
  serviceClient: SupabaseClient; // bypasses RLS — use with care
  ip: string;
  userAgent: string;
  audit: (entry: Partial<AuditEntry>) => Promise<void>;
}

export interface AuditEntry {
  action: string;
  resource?: string;
  severity: Severity;
  metadata: Record<string, unknown>;
}

export class TitanError extends Error {
  code: "unauthorized" | "forbidden" | "mfa_required" | "csrf" | "validation" | "rate_limit" | "unknown";
  status: number;
  constructor(code: TitanError["code"], message: string, status = 403) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

// ─── CSRF ──────────────────────────────────────────────────────────────────
const CSRF_COOKIE = "titan_csrf";

export async function issueCsrfToken(): Promise<string> {
  let token: string;
  try {
    token = randomBytes(32).toString("hex");
  } catch {
    token = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
  }

  try {
    (await cookies()).set(CSRF_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
      maxAge: 60 * 60, // 1 h
    });
  } catch {
    // cookies().set() can fail during prerendering; ignore.
  }
  return token;
}

async function verifyCsrf(provided: string | undefined): Promise<boolean> {
  if (!provided) return false;
  const stored = (await cookies()).get(CSRF_COOKIE)?.value;
  if (!stored) return false;
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(stored, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

// ─── Service client (lazy, server-only) ────────────────────────────────────
let _serviceClient: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new TitanError("unknown", "service role not configured", 500);
  _serviceClient = createClient(url, key, { auth: { persistSession: false } });
  return _serviceClient;
}

// ─── Context factory ───────────────────────────────────────────────────────
async function buildContext(): Promise<TitanCtx> {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new TitanError("unauthorized", "Not signed in", 401);

  const vloga = (user.app_metadata as { vloga?: string } | null)?.vloga;
  if (vloga !== "super_admin") throw new TitanError("forbidden", "Titan access only");

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? "unknown";
  const serviceClient = getServiceClient();

  const audit = async (entry: Partial<AuditEntry>) => {
    const row = {
      actor_id:   user.id,
      actor_role: vloga,
      action:     entry.action ?? "unknown",
      resource:   entry.resource ?? null,
      severity:   entry.severity ?? "info",
      ip_address: ip === "unknown" ? null : ip,
      user_agent: userAgent,
      metadata:   entry.metadata ?? {},
    };
    const { error } = await serviceClient.from("audit_log").insert(row);
    if (error) Sentry.captureMessage(`audit_log insert failed: ${error.message}`, "error");
  };

  return { user, supabase, serviceClient, ip, userAgent, audit };
}

// ─── Options ───────────────────────────────────────────────────────────────
interface TitanActionOptions<TInput, TOutput> {
  name: string;                            // audit action name, e.g. "kmetija.delete"
  input?: ZodSchema<TInput>;
  requireMfa?: boolean;                    // enforce AAL2 recency
  severity?: Severity;
  handler: (input: TInput, ctx: TitanCtx) => Promise<TOutput>;
}

// ─── Factory ───────────────────────────────────────────────────────────────
export function titanAction<TInput, TOutput>(opts: TitanActionOptions<TInput, TOutput>) {
  return async (rawInput: TInput & { _csrf?: string }): Promise<{ ok: true; data: TOutput } | { ok: false; code: TitanError["code"]; message: string }> => {
    try {
      const ctx = await buildContext();

      // CSRF
      if (!(await verifyCsrf(rawInput?._csrf))) {
        await ctx.audit({ action: opts.name, severity: "warn", metadata: { reason: "csrf_failed" } });
        throw new TitanError("csrf", "CSRF token invalid");
      }

      // MFA step-up
      if (opts.requireMfa) {
        const { data, error } = await ctx.serviceClient.rpc("require_recent_mfa", { max_age_seconds: 300 });
        if (error || !data) {
          await ctx.audit({ action: opts.name, severity: "warn", metadata: { reason: "mfa_required" } });
          throw new TitanError("mfa_required", "Destructive action requires recent MFA");
        }
      }

      // Zod validation
      let parsed: TInput = rawInput;
      if (opts.input) {
        const stripped: Record<string, unknown> = { ...(rawInput as Record<string, unknown>) };
        delete stripped._csrf;
        const result = opts.input.safeParse(stripped);
        if (!result.success) {
          await ctx.audit({ action: opts.name, severity: "warn", metadata: { reason: "validation_failed", issues: result.error.issues } });
          throw new TitanError("validation", z.prettifyError(result.error));
        }
        parsed = result.data;
      }

      // Execute
      const out = await opts.handler(parsed, ctx);
      await ctx.audit({
        action:   opts.name,
        severity: opts.severity ?? "info",
        metadata: { ok: true },
      });
      return { ok: true, data: out };
    } catch (err) {
      if (err instanceof TitanError) {
        return { ok: false, code: err.code, message: err.message };
      }
      Sentry.captureException(err, { tags: { titan_action: opts.name } });
      return { ok: false, code: "unknown", message: "Internal error" };
    }
  };
}
