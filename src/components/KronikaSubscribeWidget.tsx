"use client";

// =============================================================================
// NaKmetiji.si — Kronika signup widget (footer-friendly)
// Minimal email capture. Posts to /api/kronika/subscribe and flips into a
// "check your inbox" state on success.
// =============================================================================

import { useState } from "react";
import { Loader2, Mail, CheckCircle } from "lucide-react";

export function KronikaSubscribeWidget({
  variant = "dark",
}: {
  variant?: "dark" | "light";
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/kronika/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), locale: "sl" }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error ?? "Prijava ni uspela.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Povezava ni uspela. Poskusite znova.");
    } finally {
      setLoading(false);
    }
  }

  const isDark = variant === "dark";

  if (success) {
    return (
      <div className={`flex items-start gap-2 ${isDark ? "text-emerald-200" : "text-forest-700"}`}>
        <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
        <p className="text-sm leading-relaxed">
          Preveri e-pošto — poslal sem ti povezavo za potrditev.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <p
        className={`text-xs font-bold uppercase tracking-[0.15em] mb-2 ${
          isDark ? "text-emerald-300/70" : "text-forest-600/70"
        }`}
      >
        Jožetova Kronika — tedensko
      </p>
      <p className={`text-sm leading-relaxed mb-3 ${isDark ? "text-white/70" : "text-earth-600"}`}>
        Ena kmetija, en pregovor, ena zgodba — vsako nedeljo.
      </p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail
            size={14}
            className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${
              isDark ? "text-white/40" : "text-earth-400"
            }`}
          />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tvoj@email.si"
            disabled={loading}
            className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-xl transition-all disabled:opacity-50 focus:outline-none focus:ring-2 ${
              isDark
                ? "bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:ring-emerald-400/40 focus:border-emerald-400/60"
                : "bg-white border border-earth-200 text-forest-900 placeholder:text-earth-400 focus:ring-forest-400/30 focus:border-forest-400"
            }`}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !email.trim()}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-all flex items-center justify-center gap-1 ${
            isDark
              ? "bg-emerald-500 hover:bg-emerald-400 text-white"
              : "bg-forest-700 hover:bg-forest-600 text-white"
          }`}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : "Naroči"}
        </button>
      </div>
      {error && (
        <p className={`text-xs ${isDark ? "text-red-300" : "text-red-700"}`}>{error}</p>
      )}
    </form>
  );
}
