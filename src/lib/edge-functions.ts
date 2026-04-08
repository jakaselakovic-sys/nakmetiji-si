// =============================================================================
// NaKmetiji.si — Edge Functions Client
// Varno klicanje Supabase Edge Functions s tipiziranimi payloadi
// =============================================================================

import { createSupabaseBrowser } from "@/lib/supabase/client";

// ─── Tipi ──────────────────────────────────────────────────────────────────

export interface BookingEmailPayload {
  type: "novo_povprasevanje" | "potrditev" | "zavrnitev";
  farmName: string;
  farmOwnerEmail: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  dateFrom?: string;
  dateTo?: string;
  guests?: number;
  message?: string;
  reservationId?: string;
}

export interface EdgeFunctionResult<T = unknown> {
  data: T | null;
  error: string | null;
}

// ─── Generic invoker ──────────────────────────────────────────────────────

async function invokeEdgeFunction<TResponse = unknown>(
  functionName: string,
  payload: Record<string, unknown>,
): Promise<EdgeFunctionResult<TResponse>> {
  try {
    const supabase = createSupabaseBrowser();

    const { data, error } = await supabase.functions.invoke<TResponse>(
      functionName,
      { body: payload },
    );

    if (error) {
      console.error(`Edge Function "${functionName}" napaka:`, error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Neznana napaka";
    console.error(`Edge Function "${functionName}" izjema:`, message);
    return { data: null, error: message };
  }
}

// ─── Booking Email ────────────────────────────────────────────────────────

interface SendEmailResponse {
  success: boolean;
  emailId?: string;
}

/**
 * Pošlje email ob novem povpraševanju, potrditvi ali zavrnitvi rezervacije.
 */
export async function sendBookingEmail(
  payload: BookingEmailPayload,
): Promise<EdgeFunctionResult<SendEmailResponse>> {
  return invokeEdgeFunction<SendEmailResponse>(
    "send-booking-email",
    payload as unknown as Record<string, unknown>,
  );
}

/**
 * Pošlje obvestilo lastniku kmetije o novem povpraševanju.
 * Convenience wrapper za najpogostejši use case.
 */
export async function notifyFarmOwner(params: {
  farmName: string;
  farmOwnerEmail: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  dateFrom?: string;
  dateTo?: string;
  guests?: number;
  message?: string;
}): Promise<EdgeFunctionResult<SendEmailResponse>> {
  return sendBookingEmail({
    type: "novo_povprasevanje",
    ...params,
  });
}

/**
 * Pošlje gostu obvestilo o potrditvi ali zavrnitvi rezervacije.
 */
export async function notifyGuest(params: {
  type: "potrditev" | "zavrnitev";
  farmName: string;
  farmOwnerEmail: string;
  guestName: string;
  guestEmail: string;
  dateFrom?: string;
  dateTo?: string;
  reservationId?: string;
}): Promise<EdgeFunctionResult<SendEmailResponse>> {
  return sendBookingEmail(params);
}
