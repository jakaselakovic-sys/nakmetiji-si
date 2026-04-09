"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";

interface Props {
  userEmail: string;
  profilIme: string;
}

export function SettingsView({ userEmail, profilIme }: Props) {
  const [novoGeslo, setNovoGeslo] = useState("");
  const [potrdiGeslo, setPotrdiGeslo] = useState("");
  const [gesloNapaka, setGesloNapaka] = useState<string | null>(null);
  const [gesloUspeh, setGesloUspeh] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSpremembaGesla(e: React.FormEvent) {
    e.preventDefault();
    setGesloNapaka(null);
    setGesloUspeh(false);

    if (novoGeslo.length < 8) { setGesloNapaka("Geslo mora biti vsaj 8 znakov."); return; }
    if (novoGeslo !== potrdiGeslo) { setGesloNapaka("Gesli se ne ujemata."); return; }

    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.updateUser({ password: novoGeslo });
      if (error) {
        setGesloNapaka(error.message);
      } else {
        setGesloUspeh(true);
        setNovoGeslo("");
        setPotrdiGeslo("");
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Račun info */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Podatki računa</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs text-earth-400 mb-0.5">Ime</p>
            <p className="text-sm font-semibold text-earth-800">{profilIme || "—"}</p>
          </div>
          <div className="border-t border-earth-100" />
          <div>
            <p className="text-xs text-earth-400 mb-0.5">E-poštni naslov</p>
            <p className="text-sm font-semibold text-earth-800">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Sprememba gesla */}
      <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-earth-200/60">
          <h3 className="text-base font-bold text-forest-900">Spremenite geslo</h3>
        </div>
        <form onSubmit={handleSpremembaGesla} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-earth-600 mb-1.5">Novo geslo</label>
            <input
              type="password"
              value={novoGeslo}
              onChange={(e) => setNovoGeslo(e.target.value)}
              placeholder="Vsaj 8 znakov"
              className="w-full px-4 py-2.5 border border-earth-300 rounded-xl text-sm text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-earth-600 mb-1.5">Potrdite novo geslo</label>
            <input
              type="password"
              value={potrdiGeslo}
              onChange={(e) => setPotrdiGeslo(e.target.value)}
              placeholder="Ponovite geslo"
              className="w-full px-4 py-2.5 border border-earth-300 rounded-xl text-sm text-earth-900 placeholder-earth-400 focus:outline-none focus:border-forest-400 focus:ring-1 focus:ring-forest-400"
            />
          </div>
          {gesloNapaka && <p className="text-xs text-red-600">{gesloNapaka}</p>}
          {gesloUspeh && <p className="text-xs text-green-600 font-medium">Geslo uspešno spremenjeno.</p>}
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 bg-forest-600 hover:bg-forest-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />}
            Shrani geslo
          </button>
        </form>
      </div>
    </div>
  );
}
