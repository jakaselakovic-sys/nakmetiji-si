// =============================================================================
// NaKmetiji.si — Kronika: confirm subscription landing page
// /kronika/potrdi?t=TOKEN&e=EMAIL
// Validates the (email, token) pair against kronika_subscribers and flips
// confirmed_at. This is a GET so people can simply click the link in email.
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

async function confirmToken(email: string, token: string): Promise<"ok" | "mismatch" | "error"> {
  const sb = getServiceClient();
  if (!sb) return "error";

  const { data } = await sb
    .from("kronika_subscribers")
    .select("id, email, confirm_token, confirmed_at")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (!data || data.confirm_token !== token) return "mismatch";
  if (data.confirmed_at) return "ok"; // already confirmed — idempotent success

  const { error } = await sb
    .from("kronika_subscribers")
    .update({ confirmed_at: new Date().toISOString() })
    .eq("id", data.id);

  if (error) return "error";
  return "ok";
}

export default async function KronikaConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; e?: string }>;
}) {
  const { t, e } = await searchParams;
  const token = typeof t === "string" ? t : "";
  const email = typeof e === "string" ? e.toLowerCase() : "";

  const status: "ok" | "mismatch" | "error" | "missing" =
    !token || !email ? "missing" : await confirmToken(email, token);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="max-w-md w-full rounded-3xl bg-white border border-earth-200 p-8 text-center shadow-sm">
        {status === "ok" ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} className="text-forest-600" />
            </div>
            <h1 className="font-display text-2xl font-black text-forest-900 mb-2">
              Potrjeno. Se vidimo v nedeljo.
            </h1>
            <p className="text-sm text-earth-600 leading-relaxed mb-6">
              Hvala! Od zdaj naprej bom vsako nedeljo poslal Kroniko — ena kmetija, en pregovor,
              eno zgodbo.
            </p>
            <Link
              href="/"
              className="inline-flex items-center rounded-2xl bg-forest-700 hover:bg-forest-600 text-white font-semibold px-6 py-3 text-sm transition-all"
            >
              Nazaj domov
            </Link>
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
                ? "Povezava je okrnjena. Kliknite jo neposredno iz e-pošte."
                : status === "mismatch"
                ? "Ta povezava se ni ujemala. Morda je zastarela — poskusite se ponovno naročiti."
                : "Prišlo je do napake. Poskusite čez nekaj minut."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center rounded-2xl border border-earth-300 text-forest-800 font-semibold px-6 py-3 text-sm hover:bg-earth-50 transition-all"
            >
              Nazaj domov
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
