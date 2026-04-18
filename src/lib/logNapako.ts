// =============================================================================
// NaKmetiji.si — Server-side error logger → napake_log table
//
// Call logNapako() from any server action or API route to record failures.
// Uses service-role client to bypass RLS (super_admin can't be the writer).
// Fire-and-forget: never await in hot paths.
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";

type NapakaTip = "ai_api" | "email" | "rezervacija" | "sistem";

interface NapakaInput {
  tip: NapakaTip;
  vir: string;          // e.g. "/api/vendor/apple-ify"
  sporocilo: string;
  kontekst?: Record<string, unknown>;
}

let _serviceClient: ReturnType<typeof createClient> | null = null;

function getServiceClient() {
  if (_serviceClient) return _serviceClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _serviceClient = createClient(url, key, { auth: { persistSession: false } });
  return _serviceClient;
}

export async function logNapako(input: NapakaInput): Promise<void> {
  const client = getServiceClient();
  if (!client) {
    // Graceful fallback — don't crash production if env vars missing
    Sentry.captureMessage("[logNapako] Service role key not configured", { level: "warning", extra: { ...input } });
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (client.from("napake_log") as any).insert({
    tip:       input.tip,
    vir:       input.vir,
    sporocilo: input.sporocilo,
    kontekst:  input.kontekst ?? null,
  });

  if (error) {
    // Don't throw — logging failure must never break the caller
    Sentry.captureMessage(`[logNapako] Insert failed: ${error.message}`, "error");
  }
}
