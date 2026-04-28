"use client";

// =============================================================================
// NaKmetiji.si — Kill-switch + feature-flag panel
//
// Each toggle calls setFlag() (titanAction). Panic button flips every
// protective flag at once and requires a typed reason ≥ 10 chars. CSRF token
// is issued server-side and passed through in _csrf on each call.
// =============================================================================

import { useState, useTransition } from "react";
import { AlertOctagon, Flame, Check, X, Loader2 } from "lucide-react";
import { setFlag, panicKillSwitch } from "@/lib/titan/flag-actions";
import type { FlagKey } from "@/lib/titan/flags";

const LABELS: Record<FlagKey, { title: string; hint: string }> = {
  maintenance_mode:          { title: "Maintenance mode",          hint: "Disables all non-admin traffic." },
  booking_enabled:           { title: "Booking flow",              hint: "Off = guests see 'temporarily unavailable'." },
  oracle_enabled:            { title: "Oracle (AI search)",        hint: "Off = search falls back to keyword." },
  oracle_anthropic_fallback: { title: "Oracle Anthropic fallback", hint: "If OpenAI fails, try Claude." },
  new_signups_enabled:       { title: "New signups",               hint: "Off = close registration." },
};

export function KillSwitchPanel({
  initial,
  csrfToken,
}: {
  initial: Record<FlagKey, unknown>;
  csrfToken: string;
}) {
  const [flags, setFlags] = useState<Record<FlagKey, unknown>>(initial);
  const [pending, startTransition] = useTransition();
  const [busyKey, setBusyKey] = useState<FlagKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [panicOpen, setPanicOpen] = useState(false);
  const [panicReason, setPanicReason] = useState("");

  const toggle = (key: FlagKey) => {
    const next = !flags[key];
    setBusyKey(key);
    setError(null);
    startTransition(async () => {
      const res = await setFlag({ key, value: next, _csrf: csrfToken });
      if (res.ok) {
        setFlags((f) => ({ ...f, [key]: next }));
      } else {
        setError(`${key}: ${res.message}`);
      }
      setBusyKey(null);
    });
  };

  const panic = () => {
    setError(null);
    startTransition(async () => {
      const res = await panicKillSwitch({ reason: panicReason, _csrf: csrfToken });
      if (res.ok) {
        setFlags((f) => ({
          ...f,
          maintenance_mode: true,
          booking_enabled: false,
          new_signups_enabled: false,
          oracle_enabled: false,
        }));
        setPanicOpen(false);
        setPanicReason("");
      } else {
        setError(`panic: ${res.message}`);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#16181D] p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-200 text-sm uppercase tracking-widest flex items-center gap-2">
            <Flame size={14} className="text-amber-400" />
            Feature kill-switches
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Flips are audited &amp; require recent MFA.</p>
        </div>
        <button
          type="button"
          onClick={() => setPanicOpen((o) => !o)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20 px-3 py-2 rounded-xl transition"
        >
          <AlertOctagon size={14} /> Panic
        </button>
      </div>

      <div className="divide-y divide-white/5">
        {(Object.keys(LABELS) as FlagKey[]).map((key) => {
          const on = flags[key] === true;
          const meta = LABELS[key];
          const isBusy = busyKey === key && pending;
          return (
            <div key={key} className="flex items-center justify-between py-3">
              <div className="pr-4 min-w-0">
                <div className="text-sm font-semibold text-slate-200">{meta.title}</div>
                <div className="text-[11px] text-slate-500 truncate">{meta.hint}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={meta.title}
                disabled={isBusy}
                onClick={() => toggle(key)}
                className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${on ? "bg-emerald-500" : "bg-slate-700"} disabled:opacity-50`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`}
                />
                {isBusy && (
                  <Loader2 size={10} className="absolute inset-0 m-auto animate-spin text-slate-900" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs px-3 py-2 flex items-center gap-2">
          <X size={12} /> {error}
        </div>
      )}

      {panicOpen && (
        <div className="rounded-xl bg-rose-950/40 border border-rose-500/30 p-4 space-y-3">
          <p className="text-xs text-rose-200 leading-relaxed">
            This flips maintenance on, disables bookings, signups, and Oracle. Type a reason (≥ 10 chars) — it is audited as <code className="font-mono">system.panic</code>.
          </p>
          <textarea
            value={panicReason}
            onChange={(e) => setPanicReason(e.target.value)}
            placeholder="Why are we pulling the cord?"
            className="w-full text-xs bg-black/40 border border-rose-500/20 rounded-lg p-2 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500/50"
            rows={3}
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setPanicOpen(false)}
              className="text-xs px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={panicReason.trim().length < 10 || pending}
              onClick={panic}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {pending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              Pull the cord
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
