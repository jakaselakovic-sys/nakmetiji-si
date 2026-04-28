"use client";

// =============================================================================
// NaKmetiji.si — Registracija (Register)
// Supabase Auth — email + geslo + vloga (gost / lastnik)
// =============================================================================

import { useState, useTransition } from "react";
import Link from "next/link";
import { TreePine, Mail, Lock, User, Eye, EyeOff, Loader2, CheckCircle } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import * as Sentry from "@sentry/nextjs";

type Vloga = "gost" | "lastnik";

export default function RegistracijaPage() {
  const [vloga, setVloga] = useState<Vloga>("gost");
  const [ime, setIme] = useState("");
  const [email, setEmail] = useState("");
  const [geslo, setGeslo] = useState("");
  const [pokaziGeslo, setPokazíGeslo] = useState(false);
  const [napaka, setNapaka] = useState<string | null>(null);
  const [uspeh, setUspeh] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNapaka(null);

    if (geslo.length < 8) {
      setNapaka("Geslo mora biti dolgo vsaj 8 znakov.");
      return;
    }

    startTransition(async () => {
      const supabase = createSupabaseBrowser();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: geslo,
        options: {
          data: { ime, vloga },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("already registered")) {
          setNapaka("Ta e-poštni naslov je že registriran.");
        } else {
          setNapaka(error.message);
        }
        return;
      }

      // Posodobi profil z vlogo
      if (data.user) {
        await supabase.from("profili").upsert({
          id: data.user.id,
          email: email.trim(),
          ime,
          vloga,
        });

        // Obvesti admin ob novi registraciji lastnika
        if (vloga === "lastnik") {
          fetch("/api/admin/nova-registracija", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ime, email: email.trim() }),
          }).catch((err) => Sentry.captureException(err, { tags: { feature: "auth", action: "notify_admin_registration" } }));
        }
      }

      setUspeh(true);
    });
  }

  if (uspeh) {
    return (
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl text-center">
        <div className="w-16 h-16 rounded-full bg-forest-500/30 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={32} className="text-forest-300" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Preverite e-pošto</h2>
        <p className="text-white/60 text-sm mb-6">
          Poslali smo vam potrditveno sporočilo na <strong className="text-white">{email}</strong>.
          Kliknite na povezavo v e-pošti za aktivacijo računa.
        </p>
        <Link
          href="/prijava"
          className="inline-block py-3 px-6 bg-forest-500 hover:bg-forest-400 text-white font-semibold rounded-xl transition-colors"
        >
          Na prijavo
        </Link>
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
        <h1 className="text-2xl font-bold text-white mb-1">Ustvari račun</h1>
        <p className="text-white/60 text-sm">Brezplačna registracija</p>
      </div>

      {/* Vloga switcher */}
      <div className="flex gap-2 p-1 bg-white/10 rounded-xl mb-6">
        {(["gost", "lastnik"] as Vloga[]).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVloga(v)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
              vloga === v
                ? "bg-forest-500 text-white shadow"
                : "text-white/50 hover:text-white/80"
            }`}
          >
            {v === "gost" ? "🧳 Gost" : "🌾 Lastnik kmetije"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ime */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-1.5">
            Ime in priimek
          </label>
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={ime}
              onChange={(e) => setIme(e.target.value)}
              required
              autoComplete="name"
              placeholder="Ana Novak"
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400 transition-colors"
            />
          </div>
        </div>

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
              autoComplete="new-password"
              placeholder="Vsaj 8 znakov"
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
          {geslo.length > 0 && geslo.length < 8 && (
            <p className="text-red-300 text-xs mt-1">Geslo mora biti dolgo vsaj 8 znakov.</p>
          )}
        </div>

        {/* Napaka */}
        {napaka && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 text-sm text-red-200">
            {napaka}
          </div>
        )}

        {/* Pogoji */}
        <p className="text-white/40 text-xs">
          Z registracijo se strinjate z{" "}
          <Link href="/pogoji" className="text-forest-300 hover:text-white underline">
            Pogoji uporabe
          </Link>.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 bg-forest-500 hover:bg-forest-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Registriranje...
            </>
          ) : (
            "Ustvari račun"
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="mt-6 text-center space-y-3">
        <p className="text-white/50 text-sm">
          Že imate račun?{" "}
          <Link href="/prijava" className="text-forest-300 hover:text-white font-medium transition-colors">
            Prijava
          </Link>
        </p>
        <Link href="/" className="block text-white/30 hover:text-white/60 text-xs transition-colors">
          ← Nazaj na domačo stran
        </Link>
      </div>
    </div>
  );
}
