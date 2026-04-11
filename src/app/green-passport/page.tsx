// =============================================================================
// NaKmetiji.si — Javno Green Passport Landing Stran
// =============================================================================

import { Metadata } from "next";
import Link from "next/link";
import { Leaf, Award, MapPin, Search, Medal, ChevronRight, QrCode } from "lucide-react";
import Image from "next/image";
import { NavbarClient } from "@/components/NavbarClient";

export const metadata: Metadata = {
  title: "Green Passport | Zbiraj spomine in nagrade",
  description: "Zeleni potni list NaKmetiji. Bivaj na eko kmetijah, skeniraj QR kodo in zbiraj virtualne štampiljke za posebne nagrade.",
};

export default function GreenPassportPage() {
  return (
    <>
      {/* Top Navbar */}
      <NavbarClient navLinks={[]} isPrijavljen={false} vloga={null} />
      
      <main className="min-h-screen pt-24 pb-20 bg-earth-50">
        
        {/* HERO SECTION */}
        <section className="relative px-6 lg:px-12 py-16 lg:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12 group">
          <div className="flex-1 space-y-6 relative z-10 w-full text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/50 border border-emerald-200 text-emerald-800 text-sm font-bold shadow-sm mx-auto md:mx-0">
              <Leaf size={16} /> Prva ekološka turistična igra
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black text-forest-900 leading-[1.1] tracking-tight">
              Raziskuj.<br/>
              <span className="text-emerald-600">Zbiraj.</span> Nagrajuj.
            </h1>
            <p className="text-lg md:text-xl text-earth-600 max-w-xl mx-auto md:mx-0 leading-relaxed font-medium">
              Zeleni potni list je nova dimenzija potovanj. Obišči najlepše slovenske kmetije, skeniraj QR kodo in za svoj doprinos k zelenemu turizmu prejmi popuste ter nagrade.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start">
              <Link
                href="/zemljevid"
                className="w-full sm:w-auto px-8 py-4 bg-forest-900 hover:bg-forest-800 text-white rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                <Search size={18} /> Odkrij kmetije
              </Link>
              <Link
                href="/moj-potni-list"
                className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-forest-900 hover:bg-forest-50 text-forest-900 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
              >
                Moj Potni list <ChevronRight size={18} />
              </Link>
            </div>
          </div>
          
          <div className="flex-1 relative w-full aspect-[4/5] md:aspect-square max-w-md mx-auto">
            {/* 3D-like floating Passport UI elements mock */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100 to-forest-50 rounded-[40px] transform rotate-3 shadow-2xl overflow-hidden border border-emerald-200 relative group-hover:rotate-0 transition-transform duration-700">
               <div className="absolute top-0 left-0 w-full h-1/3 bg-forest-900 p-8 text-white rounded-b-3xl">
                 <p className="text-sm font-bold tracking-widest text-emerald-400 uppercase">Zeleni Potni List</p>
                 <p className="text-2xl mt-1 font-serif opacity-90">Jaka S.</p>
                 <div className="absolute top-6 right-6 opacity-20">
                   <QrCode size={64} />
                 </div>
               </div>
               
               <div className="absolute top-1/3 left-0 w-full h-2/3 p-8">
                 <p className="text-sm font-bold text-earth-400 mb-4 uppercase">Vaše zbrane štampiljke</p>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="aspect-square bg-emerald-50 rounded-2xl flex flex-col items-center justify-center border-2 border-emerald-200 border-dashed text-emerald-500 shadow-sm relative overflow-hidden">
                     <div className="absolute inset-0 flex items-center justify-center opacity-10"><Medal size={80} /></div>
                     <span className="font-bold relative z-10 text-xl font-serif">Kmetija<br/>Pr&apos; DomaK</span>
                     <span className="text-[10px] uppercase font-bold tracking-widest mt-2 relative z-10">Bled</span>
                   </div>
                   <div className="aspect-square bg-white rounded-2xl flex items-center justify-center border-2 border-earth-200 border-dashed text-earth-300">
                     ?
                   </div>
                   <div className="aspect-square bg-white rounded-2xl flex items-center justify-center border-2 border-earth-200 border-dashed text-earth-300">
                     ?
                   </div>
                 </div>
               </div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-forest-900 text-white py-20 px-6 mt-12">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl lg:text-5xl font-black text-center mb-16">Kako deluje?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-[40px] left-[15%] right-[15%] h-1 bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 z-0"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-forest-800 rounded-full flex items-center justify-center border-4 border-emerald-500 mb-6 drop-shadow-xl">
                   <MapPin className="text-emerald-400" size={32} />
                 </div>
                 <h3 className="text-xl font-bold mb-3">1. Rezerviraj eko-kmetijo</h3>
                 <p className="text-forest-200 text-base">Poiščite kmetije z značko trajnostnega razvoja in pri njih preživite vikend.</p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-forest-800 rounded-full flex items-center justify-center border-4 border-emerald-500 mb-6 drop-shadow-xl">
                   <QrCode className="text-emerald-400" size={32} />
                 </div>
                 <h3 className="text-xl font-bold mb-3">2. Skeniraj značko na lokaciji</h3>
                 <p className="text-forest-200 text-base">Ob vašem obisku dobite unikatno QR kodo od gostitelja, ki jo skenirate s telefonom.</p>
              </div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                 <div className="w-20 h-20 bg-forest-800 rounded-full flex items-center justify-center border-4 border-emerald-500 mb-6 drop-shadow-xl">
                   <Award className="text-emerald-400" size={32} />
                 </div>
                 <h3 className="text-xl font-bold mb-3">3. Osvoji popuste in nagrade</h3>
                 <p className="text-forest-200 text-base">Za vsake 3 različne obiske vam ponudimo vikend paket brezplačno in darilni koš z lokalno hrano.</p>
              </div>
            </div>
          </div>
        </section>

        {/* TOP FARMS LEADERBOARD */}
        <section className="px-6 py-24 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-forest-900">Elite 10 – Ambasadorji narave</h2>
            <p className="text-earth-600 mt-3 font-medium">Kmetije, ki so letos izdale največ zelenih vizumov za trajnostno bivanje.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mocked Leaderboard cards */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-4 border border-earth-200/80 shadow-md hover:shadow-xl transition-shadow flex items-center gap-4">
                 <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                    <Image src={`/images/bg-vineyards.webp`} alt="farm" fill className="object-cover" />
                    <div className="absolute top-0 left-0 bg-emerald-500 text-white w-6 h-6 flex items-center justify-center font-bold text-xs rounded-br-lg">{i}</div>
                 </div>
                 <div className="flex-1">
                   <h4 className="font-bold text-forest-900 border-b border-earth-100 pb-1 mb-2">Kmetija Pr&apos; Štefan</h4>
                   <div className="flex items-center justify-between text-xs font-semibold text-emerald-700">
                     <span className="flex items-center gap-1"><Medal size={14} /> 240 Izdaj</span>
                     <span className="text-earth-400">Gorenjska</span>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </>
  );
}
