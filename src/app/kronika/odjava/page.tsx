// =============================================================================
// NaKmetiji.si — Kronika: unsubscribe landing page
// /kronika/odjava?t=TOKEN&e=EMAIL  — one-click unsubscribe compatible with
// the List-Unsubscribe / List-Unsubscribe-Post headers we set in send.ts.
// =============================================================================

import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { CheckCircle, AlertTriangle } from "lucide-react";


function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function unsubscribe(email: string, token: string): Promise<"ok" | "mismatch" | "error"> {
  const sb = getServiceClient();
  if (!sb) return "error";

  const { data } = await sb
    .from("kronika_subscribers")
    .select("id, confirm_token, unsubscribed_at")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (!data || data.confirm_token !== token) return "mismatch";
  if (data.unsubscribed_at) return "ok"; // already off the list

  const { error } = await sb
    .from("kronika_subscribers")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("id", data.id);

  return error ? "error" : "ok";
}

export default async function KronikaUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; e?: string }>;
}) {
  const { t, e } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const email = typeof e === "string" ? e.toLowerCase() : "";
  const status: "ok" | "mismatch" | "error" | "missing" =
    !token || !email ? "missing" : await unsubscribe(email, token);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-3xl bg-white border border-earth-200 p-8 text-center shadow-sm">
        {status === "ok" ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} className="text-earth-500" />
            </div>
            <h1 className="font-display text-2xl font-black text-forest-900 mb-2">
              Odjavljeno.
            </h1>
            <p className="text-sm text-earth-600 leading-relaxed mb-6">
              Nič slabega. Ko se boš kdaj vrnil, kmetije stojijo.
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <AlertTriangle size={48} className="text-amber-600" />
            </div>
            <h1 className="font-display text-2xl font-black text-forest-900 mb-2">
              Povezava ni veljavna
            </h1>
            <p className="text-sm text-earth-600 leading-relaxed mb-6">
              {status === "missing"
                ? "Povezava je okrnjena."
                : status === "mismatch"
                ? "Ta povezava se ni ujemala."
                : "Prišlo je do napake."}
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-flex items-center rounded-2xl bg-forest-700 hover:bg-forest-600 text-white font-semibold px-6 py-3 text-sm transition-all"
        >
          Nazaj domov
        </Link>
      </div>
    </div>
  );
}
