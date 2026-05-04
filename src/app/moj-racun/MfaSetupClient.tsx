"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Loader2, ShieldCheck, QrCode } from "lucide-react";

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function MfaSetupClient() {
  const [step, setStep] = useState<"idle" | "enroll" | "verify" | "success">("idle");
  const [qrCodeSvg, setQrCodeSvg] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createSupabaseBrowser();

  async function handleEnroll() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;

      setFactorId(data.id);
      setQrCodeSvg(data.totp.qr_code);
      setStep("verify");
    } catch (err: unknown) {
      setError(errorMessage(err, "Napaka pri generiranju MFA."));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!factorId || code.length < 6) return;
    setLoading(true);
    setError(null);
    try {
      const challenge = await supabase.auth.mfa.challenge({ factorId });
      if (challenge.error) throw challenge.error;

      const verify = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.data.id,
        code,
      });
      if (verify.error) throw verify.error;

      setStep("success");
    } catch (err: unknown) {
      setError(errorMessage(err, "Neveljavna koda. Poskusite znova."));
    } finally {
      setLoading(false);
    }
  }

  if (step === "success") {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800">
        <ShieldCheck size={24} className="flex-shrink-0 text-emerald-600" />
        <div>
          <p className="font-bold text-sm">MFA je uspešno aktiviran</p>
          <p className="text-xs mt-0.5">Vaš račun je zdaj zavarovan z dvostopenjsko avtentikacijo.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {step === "idle" && (
        <button
          onClick={handleEnroll}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-forest-700 text-white px-4 py-2 text-xs font-bold hover:bg-forest-600 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
          Nastavi MFA
        </button>
      )}

      {step === "verify" && (
        <div className="p-5 rounded-xl border border-earth-200 bg-white shadow-sm mt-3 animate-in fade-in zoom-in-95 duration-200">
          <h5 className="font-bold text-forest-900 text-sm flex items-center gap-2 mb-3">
            <QrCode size={16} /> Skenirajte QR kodo
          </h5>
          <p className="text-xs text-earth-600 mb-4 leading-relaxed">
            Odprite aplikacijo za avtentikacijo (npr. Google Authenticator) in skenirajte spodnjo kodo.
          </p>
          
          {qrCodeSvg && (
            <div 
              className="bg-white p-3 rounded-lg border border-earth-100 inline-block mb-4 shadow-sm"
              dangerouslySetInnerHTML={{ __html: qrCodeSvg }} 
            />
          )}

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-earth-500 block mb-1">
                Vnesite 6-mestno kodo
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                className="w-full max-w-[160px] rounded-lg border border-earth-200 px-3 py-2 text-sm font-mono tracking-[0.2em] focus:border-forest-500 focus:ring-forest-500"
              />
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <div className="flex gap-2">
              <button
                onClick={handleVerify}
                disabled={loading || code.length < 6}
                className="flex items-center gap-1.5 rounded-lg bg-forest-700 text-white px-4 py-2 text-xs font-bold hover:bg-forest-600 disabled:opacity-50 transition-colors"
              >
                {loading && <Loader2 size={12} className="animate-spin" />}
                Potrdi
              </button>
              <button
                onClick={() => setStep("idle")}
                className="rounded-lg bg-earth-100 text-earth-700 px-4 py-2 text-xs font-bold hover:bg-earth-200 transition-colors"
              >
                Prekliči
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
