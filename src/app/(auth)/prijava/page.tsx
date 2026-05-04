"use client";

// =============================================================================
// NaKmetiji.si — Prijava (Login)
// Supabase Auth — email + geslo
// =============================================================================

import { Suspense, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TreePine, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

function PrijavaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [geslo, setGeslo] = useState("");
  const [pokaziGeslo, setPokazíGeslo] = useState(false);
  const [napaka, setNapaka] = useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNapaka(null);

    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: geslo,
      });

      if (error) {
        if (error.message.includes("Invalid login")) {
          setNapaka("Napačen e-poštni naslov ali geslo.");
        } else if (error.message.includes("Email not confirmed")) {
          setNapaka("Prosimo, potrdite e-poštni naslov. Preverite svojo pošto.");
        } else {
          setNapaka(error.message);
        }
        return;
      }

      // Preveri MFA
      const mfa = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfa.data && mfa.data.nextLevel === "aal2" && mfa.data.currentLevel === "aal1") {
        // Račun zahteva MFA
        const factors = await supabase.auth.mfa.listFactors();
        const totpFactor = factors.data?.totp[0];
        if (totpFactor) {
          setFactorId(totpFactor.id);
          setMfaRequired(true);
          return;
        }
      }

      router.push(redirect);
      router.refresh();
    });
  }

  async function handleMfaSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setNapaka(null);

    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      try {
        const challenge = await supabase.auth.mfa.challenge({ factorId });
        if (challenge.error) throw challenge.error;

        const verify = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challenge.data.id,
          code: mfaCode,
        });
        
        if (verify.error) throw verify.error;

        router.push(redirect);
        router.refresh();
      } catch {
        setNapaka("Neveljavna MFA koda.");
      }
    });
  }

  if (mfaRequired) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-forest-500 flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Dvostopenjska prijava</h1>
          <p className="text-white/60 text-sm">Vnesite 6-mestno kodo iz aplikacije</p>
        </div>

        <form onSubmit={handleMfaSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              placeholder="123456"
              className="w-full py-3 text-center text-xl tracking-[0.3em] font-mono bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400"
            />
          </div>

          {napaka && (
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-200 text-center">
              {napaka}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || mfaCode.length < 6}
            className="w-full py-3 bg-forest-500 hover:bg-forest-400 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : "Potrdi kodo"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-10 h-10 rounded-xl bg-forest-500 flex items-center justify-center">
            <TreePine size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white font-display">NaKmetiji</span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Dobrodošli nazaj</h1>
        <p className="text-white/60 text-sm">Prijavite se v vaš račun</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            E-poštni naslov
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="ime@primer.si"
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
            />
          </div>
        </div>

        {/* Geslo */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Geslo
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type={pokaziGeslo ? "text" : "password"}
              value={geslo}
              onChange={(e) => setGeslo(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full pl-10 pr-11 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
            />
            <button
              type="button"
              onClick={() => setPokazíGeslo(!pokaziGeslo)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
            >
              {pokaziGeslo ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Napaka */}
        {napaka && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-200">
            {napaka}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-forest-500 hover:bg-forest-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Prijavljanje...
            </>
          ) : (
            "Prijava"
          )}
        </button>
      </form>

      {/* Footer links */}
      <div className="mt-6 text-center space-y-3">
        <p className="text-white/50 text-sm">
          Še nimate računa?{" "}
          <Link href="/registracija" className="text-forest-300 hover:text-white font-medium transition-colors">
            Registrirajte se
          </Link>
        </p>
        <Link href="/" className="block text-white/30 hover:text-white/60 text-xs transition-colors">
          ← Nazaj na domačo stran
        </Link>
      </div>
    </div>
  );
}

export default function PrijavaPage() {
  return (
    <Suspense fallback={<div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 h-96 animate-pulse" />}>
      <PrijavaForm />
    </Suspense>
  );
}
