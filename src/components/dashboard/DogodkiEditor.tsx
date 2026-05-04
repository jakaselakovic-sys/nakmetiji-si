"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, Trash2, Calendar, Users, Loader2 } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import type { Dogodek } from "@/types/database";

export function DogodkiEditor({ kmetijaId }: { kmetijaId: string }) {
  const [dogodki, setDogodki] = useState<Dogodek[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Form state for new event
  const [showForm, setShowForm] = useState(false);
  const [ime, setIme] = useState("");
  const [opis, setOpis] = useState("");
  const [datumOd, setDatumOd] = useState("");
  const [datumDo, setDatumDo] = useState("");
  const [cena, setCena] = useState("");
  const [maxOseb, setMaxOseb] = useState("");

  useEffect(() => {
    async function fetchDogodki() {
      const supabase = createSupabaseBrowser();
      const { data } = await supabase
        .from("dogodki")
        .select("*")
        .eq("kmetija_id", kmetijaId)
        .order("datum_od", { ascending: true });
      
      if (data) setDogodki(data as Dogodek[]);
      setLoading(false);
    }
    fetchDogodki();
  }, [kmetijaId]);

  async function handleDelete(id: string) {
    if (!confirm("Ali res želite izbrisati ta dogodek?")) return;
    
    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.from("dogodki").delete().eq("id", id);
      if (!error) {
        setDogodki(prev => prev.filter(d => d.id !== id));
      } else {
        alert("Napaka pri brisanju dogodka.");
      }
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!ime || !datumOd || !datumDo) return;

    startTransition(async () => {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase.from("dogodki").insert({
        kmetija_id: kmetijaId,
        ime,
        opis,
        datum_od: new Date(datumOd).toISOString(),
        datum_do: new Date(datumDo).toISOString(),
        cena: cena ? Number(cena) : null,
        max_oseb: maxOseb ? Number(maxOseb) : null,
      }).select().single();

      if (data && !error) {
        setDogodki([...dogodki, data as Dogodek].sort((a, b) => new Date(a.datum_od).getTime() - new Date(b.datum_od).getTime()));
        setShowForm(false);
        setIme(""); setOpis(""); setDatumOd(""); setDatumDo(""); setCena(""); setMaxOseb("");
      } else {
        alert("Napaka pri ustvarjanju dogodka.");
      }
    });
  }

  return (
    <section className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden mt-6">
      <div className="px-6 py-4 border-b border-earth-200/60 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-forest-900">Koledar butičnih dogodkov</h3>
          <p className="text-xs text-earth-500 mt-0.5">Ustvarite posebne dogodke za izvensezonske vikende.</p>
        </div>
        {!showForm && (
          <button 
            type="button" 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-forest-600 rounded-lg hover:bg-forest-500 transition-colors"
          >
            <Plus size={14} /> Nov dogodek
          </button>
        )}
      </div>

      <div className="px-6 py-5">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="animate-spin text-earth-400" /></div>
        ) : showForm ? (
          <form onSubmit={handleCreate} className="bg-earth-50 p-4 rounded-xl border border-earth-200 space-y-4">
            <h4 className="font-bold text-forest-900 text-sm">Dodaj nov dogodek</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-earth-600 mb-1">Ime dogodka *</label>
                <input required type="text" value={ime} onChange={e => setIme(e.target.value)} className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm" placeholder="Npr. Kmečka trgatev" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-earth-600 mb-1">Opis</label>
                <input type="text" value={opis} onChange={e => setOpis(e.target.value)} className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm" placeholder="Kratek opis dogajanja" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-earth-600 mb-1">Začetek *</label>
                <input required type="datetime-local" value={datumOd} onChange={e => setDatumOd(e.target.value)} className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-earth-600 mb-1">Konec *</label>
                <input required type="datetime-local" value={datumDo} onChange={e => setDatumDo(e.target.value)} className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-earth-600 mb-1">Cena (EUR)</label>
                <input type="number" value={cena} onChange={e => setCena(e.target.value)} className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm" placeholder="Brezplačno = prazno" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-earth-600 mb-1">Max oseb</label>
                <input type="number" value={maxOseb} onChange={e => setMaxOseb(e.target.value)} className="w-full px-3 py-2 border border-earth-300 rounded-lg text-sm" placeholder="Prazno = neomejeno" />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-xs font-bold text-earth-600 bg-white border border-earth-300 rounded-lg">Prekliči</button>
              <button type="submit" disabled={isPending} className="px-4 py-2 text-xs font-bold text-white bg-forest-600 rounded-lg disabled:opacity-50">
                {isPending ? "Shranjujem..." : "Shrani dogodek"}
              </button>
            </div>
          </form>
        ) : dogodki.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-earth-200 rounded-xl bg-earth-50/50">
            <p className="text-sm text-earth-500 font-medium">Trenutno nimate razpisanih dogodkov.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dogodki.map(dogodek => (
              <div key={dogodek.id} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-4 border border-earth-200 rounded-xl bg-white shadow-sm hover:border-forest-200 transition-colors">
                <div>
                  <h4 className="font-bold text-forest-900">{dogodek.ime}</h4>
                  <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-earth-500 font-medium">
                    <span className="flex items-center gap-1"><Calendar size={13} className="text-earth-400" /> {new Date(dogodek.datum_od).toLocaleDateString('sl-SI')}</span>
                    {(dogodek.cena ?? 0) > 0 && <span>• {dogodek.cena} €</span>}
                    {dogodek.max_oseb && <span className="flex items-center gap-1">• <Users size={13} className="text-earth-400" /> Max {dogodek.max_oseb}</span>}
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(dogodek.id)}
                  disabled={isPending}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                  title="Izbriši dogodek"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
