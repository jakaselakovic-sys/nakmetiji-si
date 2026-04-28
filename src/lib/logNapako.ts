// =============================================================================
// NaKmetiji.si — Server-side error logger → napake_log table
//
// Call logNapako() from any server action or API route to record failures.
// Uses service-role client to bypass RLS (super_admin can't be the writer).
// Fire-and-forget: never await in hot paths.
// =============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";

type NapakaTip = "ai_api" | "email" | "rezervacija" | "sistem";

interface NapakaInput {
  tip: NapakaTip;
  vir: string;          // e.g. "/api/vendor/apple-ify"
  sporocilo: string;
  kontekst?: Record<string, unknown>;
}

interface NapakaLogInsert {
  tip: NapakaTip;
  vir: string;
  sporocilo: string;
  kontekst: Record<string, unknown> | null;
}

let _serviceClient: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient | null {
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
    Sentry.captureMessage("[logNapako] Service role key not configured", { level: "warning", extra: { ...input } });
    return;
  }

  const row: NapakaLogInsert = {
    tip:       input.tip,
    vir:       input.vir,
    sporocilo: input.sporocilo,
    kontekst:  input.kontekst ?? null,
  };

  const { error } = await client.from("napake_log").insert(row);

  if (error) {
    Sentry.captureMessage(`[logNapako] Insert failed: ${error.message}`, "error");
  }
}
