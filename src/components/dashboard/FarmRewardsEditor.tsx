"use client";

// =============================================================================
// NaKmetiji.si — Farm Rewards Editor
// Owner-facing CRUD for per-farm green-passport rewards. Lives in the
// dashboard "Uredi kmetijo" view.
// =============================================================================

import { useEffect, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Loader2, Stamp, Gift, Power, PowerOff } from "lucide-react";
import {
  listFarmRewards,
  addFarmReward,
  toggleFarmReward,
  deleteFarmReward,
  type FarmReward,
} from "@/lib/actions/farm-rewards";

interface Props {
  kmetijaId: string;
}

export function FarmRewardsEditor({ kmetijaId }: Props) {
  const [rewards, setRewards] = useState<FarmReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [ime, setIme] = useState("");
  const [opis, setOpis] = useState("");
  const [minZigi, setMinZigi] = useState(5);

  async function reload() {
    const r = await listFarmRewards(kmetijaId);
    if (r.ok && r.rewards) {
      setRewards(r.rewards);
      setError(null);
    } else {
      setError(r.napaka ?? "Napaka pri nalaganju.");
    }
    setLoading(false);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kmetijaId]);

  function resetForm() {
    setIme("");
    setOpis("");
    setMinZigi(5);
    setShowForm(false);
  }

  function handleAdd() {
    if (!ime.trim()) return;
    startTransition(async () => {
      const r = await addFarmReward({ kmetija_id: kmetijaId, ime, opis, min_zigi: minZigi });
      if (r.ok) { resetForm(); reload(); }
      else setError(r.napaka ?? "Napaka.");
    });
  }

  function handleToggle(id: string, current: boolean) {
    startTransition(async () => {
      await toggleFarmReward(id, !current);
      reload();
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Ali res želite izbrisati to nagrado?")) return;
    startTransition(async () => {
      await deleteFarmReward(id);
      reload();
    });
  }

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-earth-200/60 p-6 flex items-center gap-2 text-earth-500 text-sm">
        <Loader2 size={14} className="animate-spin" /> Nalagam nagrade…
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-lg font-bold text-forest-900 flex items-center gap-2">
            <Gift size={18} className="text-emerald-600" />
            Vaše nagrade za stalne goste
          </h3>
          <p className="text-xs text-earth-500 mt-0.5">
            Določite, kaj vaši gostje dobijo, ko zberejo X žigov pri vas. Žigi se zbirajo z obiski (max 1 na teden).
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-forest-700 hover:bg-forest-600 text-white px-3 py-2 text-xs font-bold transition-colors"
        >
          <Plus size={13} />
          {showForm ? "Prekliči" : "Dodaj nagrado"}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1">
                  Ime nagrade
                </label>
                <input
                  value={ime}
                  onChange={(e) => setIme(e.target.value)}
                  placeholder="npr. 10% popust na nočitev"
                  maxLength={120}
                  className="w-full rounded-lg border border-earth-200 px-3 py-2 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1">
                  Opis (neobvezno)
                </label>
                <textarea
                  value={opis}
                  onChange={(e) => setOpis(e.target.value)}
                  placeholder="Veljajo običajni pogoji rezervacije…"
                  rows={2}
                  maxLength={400}
                  className="w-full rounded-lg border border-earth-200 px-3 py-2 text-sm bg-white resize-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-earth-500 mb-1">
                  Število žigov za odklep: <strong className="text-forest-900">{minZigi}</strong>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={minZigi}
                  onChange={(e) => setMinZigi(parseInt(e.target.value, 10))}
                  className="w-full accent-forest-700"
                />
                <div className="flex justify-between text-[10px] text-earth-400 mt-0.5">
                  <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
                </div>
              </div>
              <button
                onClick={handleAdd}
                disabled={isPending || !ime.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-600 disabled:bg-earth-300 text-white px-4 py-2.5 text-sm font-bold transition-colors"
              >
                {isPending && <Loader2 size={14} className="animate-spin" />}
                Shrani nagrado
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {rewards.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-earth-200 p-6 text-center">
          <Stamp size={28} className="text-earth-300 mx-auto mb-2" />
          <p className="text-sm text-earth-500">Še nimate nobene nagrade.</p>
          <p className="text-xs text-earth-400 mt-1">Dodajte vsaj eno, da spodbudite goste k vrnitvi.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rewards.map((r) => (
            <li
              key={r.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                r.aktivna
                  ? "bg-white border-earth-200"
                  : "bg-earth-50 border-earth-200 opacity-60"
              }`}
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex flex-col items-center justify-center">
                <span className="text-base font-black leading-none">{r.min_zigi}</span>
                <span className="text-[8px] uppercase tracking-wider mt-0.5">žig.</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-forest-900 text-sm truncate">{r.ime}</p>
                {r.opis && <p className="text-xs text-earth-500 line-clamp-2 mt-0.5">{r.opis}</p>}
              </div>
              <button
                onClick={() => handleToggle(r.id, r.aktivna)}
                title={r.aktivna ? "Deaktiviraj" : "Aktiviraj"}
                className={`p-1.5 rounded-lg transition-colors ${
                  r.aktivna ? "text-emerald-600 hover:bg-emerald-50" : "text-earth-400 hover:bg-earth-100"
                }`}
              >
                {r.aktivna ? <Power size={14} /> : <PowerOff size={14} />}
              </button>
              <button
                onClick={() => handleDelete(r.id)}
                title="Izbriši"
                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[10px] text-earth-400 mt-3 leading-relaxed">
        💡 Nasvet: Začnite z nizkim pragom (3–5 žigov) za prvo nagrado, da je dosegljiva.
        Anti-zloraba: vsak gost lahko zbere največ 1 žig pri isti kmetiji na teden.
      </p>
    </div>
  );
}
