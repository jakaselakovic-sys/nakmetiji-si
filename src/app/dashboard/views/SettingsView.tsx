"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { gesloSchema, profilSchema } from "@/lib/schemas/vendor";

interface Props {
  userEmail: string;
  profilIme: string;
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1.5 text-xs text-red-600 font-medium">{msg}</p>;
}

const inputCls = (hasError: boolean) =>
  [
    "w-full px-4 py-2.5 border rounded-xl text-sm text-earth-900",
    "placeholder-earth-400 focus:outline-none transition-colors",
    hasError
      ? "border-red-400 ring-1 ring-red-400 focus:border-red-500"
      : "border-earth-300 focus:border-forest-400 focus:ring-1 focus:ring-forest-400",
  ].join(" ");

export function SettingsView({ userEmail, profilIme }: Props) {
  // Timeout refs — cleared on unmount to prevent setState on unmounted component
  const gesloTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const imeTimerRef   = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(gesloTimerRef.current); clearTimeout(imeTimerRef.current); }, []);

  // ── Password change ────────────────────────────────────────────────────────
  const [novoGeslo, setNovoGeslo]       = useState("");
  const [potrdiGeslo, setPotrdiGeslo]   = useState("");
  const [gesloErrors, setGesloErrors]   = useState<Record<string, string>>({});
  const [gesloUspeh, setGesloUspeh]     = useState(false);
  const [isPendingGeslo, startGeslo]    = useTransition();

  function handleSpremembaGesla(e: React.FormEvent) {
    e.preventDefault();
    setGesloErrors({});
    setGesloUspeh(false);

    const result = gesloSchema.safeParse({ novoGeslo, potrdiGeslo });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!errors[key]) errors[key] = issue.message;
      }
      setGesloErrors(errors);
      return;
    }

    startGeslo(async () => {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: result.data.novoGeslo });
      if (error) {
        setGesloErrors({ novoGeslo: error.message });
      } else {
        setGesloUspeh(true);
        setNovoGeslo("");
        setPotrdiGeslo("");
        clearTimeout(gesloTimerRef.current);
        gesloTimerRef.current = setTimeout(() => setGesloUspeh(false), 4_000);
      }
    });
  }

  // ── Profile name ───────────────────────────────────────────────────────────
  const [ime, setIme]                   = useState(profilIme);
  const [imeErrors, setImeErrors]       = useState<Record<string, string>>({});
  const [imeUspeh, setImeUspeh]         = useState(false);
  const [isPendingIme, startIme]        = useTransition();

  function handleSpremembaImena(e: React.FormEvent) {
    e.preventDefault();
    setImeErrors({});
    setImeUspeh(false);

    const result = profilSchema.safeParse({ ime: ime.trim() });
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[String(issue.path[0])] = issue.message;
      }
      setImeErrors(errors);
      return;
    }

    startIme(async () => {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({
        data: { full_name: result.data.ime },
      });
      if (error) {
        setImeErrors({ ime: error.message });
      } else {
        setImeUspeh(true);
        clearTimeout(imeTimerRef.current);
        imeTimerRef.current = setTimeout(() => setImeUspeh(false), 4_000);
      }
    });
  }

  const labelCls = "block text-xs font-medium text-earth-600 mb-1.5";

  return (
    <div className="space-y-6">

      {/* ── Podatki računa ─────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Podatki računa</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs text-earth-400 mb-0.5">E-poštni naslov</p>
            <p className="text-sm font-semibold text-earth-800">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* ── Ime profila ────────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Ime profila</h3>
        </div>
        <form onSubmit={handleSpremembaImena} className="px-6 py-5 space-y-4" noValidate>
          <div>
            <label className={labelCls}>Prikazno ime</label>
            <input
              type="text"
              value={ime}
              onChange={(e) => setIme(e.target.value)}
              placeholder="Vaše ime"
              className={inputCls(!!imeErrors.ime)}
            />
            <FieldError msg={imeErrors.ime} />
          </div>
          {imeUspeh && (
            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <CheckCircle size={14} /> Ime uspešno posodobljeno.
            </div>
          )}
          <button
            type="submit"
            disabled={isPendingIme}
            className="px-5 py-2.5 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            {isPendingIme && <Loader2 size={14} className="animate-spin" />}
            Shrani ime
          </button>
        </form>
      </div>

      {/* ── Sprememba gesla ────────────────────────────────────────────── */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Spremenite geslo</h3>
        </div>
        <form onSubmit={handleSpremembaGesla} className="px-6 py-5 space-y-4" noValidate>
          <div>
            <label className={labelCls}>Novo geslo</label>
            <input
              type="password"
              value={novoGeslo}
              onChange={(e) => setNovoGeslo(e.target.value)}
              placeholder="Vsaj 8 znakov"
              className={inputCls(!!gesloErrors.novoGeslo)}
              autoComplete="new-password"
            />
            <FieldError msg={gesloErrors.novoGeslo} />
          </div>
          <div>
            <label className={labelCls}>Potrdite novo geslo</label>
            <input
              type="password"
              value={potrdiGeslo}
              onChange={(e) => setPotrdiGeslo(e.target.value)}
              placeholder="Ponovite geslo"
              className={inputCls(!!gesloErrors.potrdiGeslo)}
              autoComplete="new-password"
            />
            <FieldError msg={gesloErrors.potrdiGeslo} />
          </div>
          {gesloUspeh && (
            <div className="flex items-center gap-2 text-sm text-green-700 font-medium">
              <CheckCircle size={14} /> Geslo uspešno spremenjeno.
            </div>
          )}
          <button
            type="submit"
            disabled={isPendingGeslo}
            className="px-5 py-2.5 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            {isPendingGeslo && <Loader2 size={14} className="animate-spin" />}
            {isPendingGeslo ? "Shranjujem..." : "Shrani geslo"}
          </button>
        </form>
      </div>

    </div>
  );
}
