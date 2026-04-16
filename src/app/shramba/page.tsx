"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, MapPin, Loader2, Heart, Trash2, Route } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";

interface SavedFarm {
  id: string;
  ime: string;
  regija: string;
}

export default function ShrambaPage() {
  const [farms, setFarms] = useState<SavedFarm[]>([]);
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<string | null>(null);

  useEffect(() => {
    // V resnici bi to prebrali iz Supabase ali localStorage
    // Za demo si izmislimo 3 lokalne, če je prazno (developer preview)
    const stored = localStorage.getItem("nakmetiji_saved");
    if (stored) {
      try { setFarms(JSON.parse(stored)); } catch { setFarms([]); }
    } else {
      setFarms([
        { id: "e1", ime: "Kmetija Štekar", regija: "goriška" },
        { id: "e2", ime: "Turistična kmetija Urška", regija: "savinjska" },
        { id: "e3", ime: "Domačija Firbas", regija: "štajerska" }
      ]);
    }
  }, []);

  const removeFarm = (id: string) => {
    const updated = farms.filter((f) => f.id !== id);
    setFarms(updated);
    localStorage.setItem("nakmetiji_saved", JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (farms.length < 2) return;
    setLoading(true);
    try {
      const res = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmIds: farms.map(f => f.id) })
      });
      const data = await res.json();
      if (data.ok) {
        setItinerary(data.markdown);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Napaka povezave z Jožetom.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-earth-50">
      <div className="max-w-4xl mx-auto px-6">
        <div className="flex items-center gap-3 justify-center mb-10">
          <Heart size={32} className="text-red-500 fill-red-500" />
          <h1 className="text-3xl font-black text-forest-900">Moja Shramba</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Wishlist */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-widest text-earth-500 mb-6">Shranjene Kmetije ({farms.length})</h2>
            <AnimatePresence>
              {farms.length === 0 ? (
                <div className="text-center p-8 bg-white rounded-2xl border border-earth-200 shadow-sm text-earth-500">
                  <p>Vaša shramba je prazna.</p>
                  <Link href="/kmetije" className="text-forest-600 font-bold mt-2 inline-block">Razišči kmetije</Link>
                </div>
              ) : (
                farms.map((f, i) => (
                  <motion.div 
                    key={f.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-earth-200/50"
                  >
                    <div>
                      <h3 className="font-bold text-forest-900">{f.ime}</h3>
                      <p className="text-xs flex items-center gap-1 text-earth-500 mt-1 capitalize"><MapPin size={12}/>{f.regija}</p>
                    </div>
                    <button onClick={() => removeFarm(f.id)} className="p-2 text-earth-400 hover:text-red-500 transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {farms.length >= 2 && (
              <button 
                onClick={handleGenerate}
                disabled={loading}
                className="mt-6 w-full py-4 rounded-xl bg-forest-900 text-white font-bold flex items-center justify-center gap-2 hover:bg-forest-800 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Route size={20} />}
                {loading ? "Jože planira pot..." : "Zgeneriraj Roadtrip plan"}
              </button>
            )}
            {farms.length === 1 && (
              <p className="text-xs text-earth-500 italic text-center mt-4">Za generiranje roadtrip izleta shranite vsaj 2 kmetiji.</p>
            )}
          </div>

          {/* AI Result */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl border border-forest-100">
            {itinerary ? (
              <div className="prose prose-earth prose-sm md:prose-base max-w-none">
                <ReactMarkdown>{itinerary}</ReactMarkdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-earth-400 opacity-60">
                <Map size={48} strokeWidth={1} className="mb-4" />
                <p>Tu se bo izpisal vaš osebni<br/>3-dnevni plan potovanja.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
