// =============================================================================
// NaKmetiji.si — Guest Passport Dashboard
// =============================================================================

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Stamp, Award, CheckCircle2, Ticket } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moj Zeleni Potni List | NaKmetiji",
};

export default async function MojPotniListPage() {
  const supabase = await createSupabaseServer();

  // Authentication Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?redirect=/moj-potni-list");

  const { data: profil } = await supabase
    .from("profili")
    .select("ime, vloga")
    .eq("id", user.id)
    .single();

  // Fetch true stamps from database (mocked visually for structural layout)
  const { data: stamps } = await supabase
    .from("green_stamps")
    .select("*, kmetije(ime, regija, naslovna_slika)")
    .eq("gost_id", user.id)
    .order("ustvarjeno", { ascending: false });

  // For visual mockup purposes, assume the user has some stamps if db is empty:
  const mockStamps = stamps?.length ? stamps : [
    { kmetije: { ime: "Turistična kmetija Jureč", regija: "Gorenjska" }, ustvarjeno: new Date().toISOString() }
  ];

  const totalCollected = mockStamps.length;
  const targetForReward = 3;
  const progress = Math.min(100, Math.round((totalCollected / targetForReward) * 100));

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      
      {/* Background aesthetic */}
      <div className="absolute top-0 left-0 w-full h-[50dvh] bg-forest-900 z-0">
        <div className="absolute inset-0 bg-[url('/images/bg-mountains.webp')] opacity-20 bg-cover bg-center mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-forest-200 hover:text-white transition-colors mb-8 font-medium"
        >
          <ChevronLeft size={18} /> Nazaj na naslovnico
        </Link>
        
        <div className="flex flex-col md:flex-row items-end gap-6 justify-between mb-12">
          <div className="text-white">
            <h1 className="text-4xl font-black mb-2 font-serif tracking-tight">Moj Zeleni Potni List</h1>
            <p className="text-forest-200 text-lg">Ponosno prikazuje tvoja trajnostna potovanja, <span className="font-bold text-white">{profil?.ime}</span>.</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl text-white text-center min-w-[140px]">
             <p className="text-xs uppercase tracking-widest font-bold text-emerald-400 mb-1">Zbrane Značke</p>
             <p className="text-4xl font-black">{totalCollected}</p>
          </div>
        </div>

        {/* PROGRESS CARD */}
        <div className="bg-white rounded-[2rem] p-8 shadow-xl mb-12 relative overflow-hidden border border-earth-100">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Award size={200} />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-forest-900 mb-4 flex items-center gap-2">
               <Ticket className="text-amber-500" /> Tvoja nagrada te čaka
            </h3>
            
            <div className="w-full bg-earth-100 h-4 rounded-full overflow-hidden mb-3">
               <div 
                 className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out relative"
                 style={{ width: `${progress}%` }}
               >
                 <div className="absolute top-0 left-0 w-full h-full bg-white/20 animate-pulse"></div>
               </div>
            </div>
            
            <div className="flex justify-between text-sm font-semibold text-earth-500 mb-6">
              <span>{totalCollected} obiskov</span>
              <span className="text-emerald-600">{targetForReward} obiski = 100€ popust na naslednji oddih</span>
            </div>
            
            {progress >= 100 ? (
               <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-forest-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                 <CheckCircle2 size={18} /> Koristi Svojo Nagrado
               </button>
            ) : (
               <p className="text-sm text-earth-600 font-medium">Obišči še <span className="font-bold text-forest-800">{targetForReward - totalCollected} eko-kmetije</span> in odkleni svojo nagrado!</p>
            )}
          </div>
        </div>

        {/* PASSPORT BOOKLET UI */}
        <h3 className="text-2xl font-black text-forest-900 mb-6">Zbrani Žigi</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockStamps.map((stamp: { kmetije: { ime: string; regija: string }; ustvarjeno: string }, idx) => (
             <div key={idx} className="aspect-square bg-white rounded-3xl p-6 shadow-sm border-2 border-emerald-100 flex flex-col items-center justify-center text-center relative group hover:border-emerald-400 transition-colors cursor-default">
                
                <div className="absolute -rotate-12 group-hover:rotate-0 transition-transform duration-500 ease-out text-emerald-600 drop-shadow-sm">
                   <Stamp size={72} strokeWidth={1.5} />
                </div>
                
                <div className="relative z-10 mt-auto bg-white/90 backdrop-blur-sm w-full py-2 rounded-xl">
                  <p className="font-bold text-forest-900 text-xs leading-tight mb-1">{stamp.kmetije.ime}</p>
                  <p className="text-[10px] text-earth-500 uppercase tracking-wider font-semibold">{stamp.kmetije.regija}</p>
                  <p className="text-[9px] text-earth-400 mt-2">{new Date(stamp.ustvarjeno).toLocaleDateString('sl-SI')}</p>
                </div>
             </div>
          ))}
          
          {/* Empty slot placeholder for gamification */}
           <div className="aspect-square bg-earth-50 rounded-3xl p-6 border-2 border-earth-200 border-dashed flex flex-col items-center justify-center text-center opacity-70">
              <div className="text-earth-300">
                 <Stamp size={72} strokeWidth={1} />
              </div>
              <p className="text-[10px] text-earth-400 uppercase tracking-wider font-bold mt-4">Prazen prostor</p>
           </div>
        </div>

      </div>
    </div>
  );
}
