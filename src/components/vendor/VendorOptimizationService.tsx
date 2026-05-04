"use client";

import { Sparkles, Camera, PenTool, TrendingUp, Mail } from "lucide-react";

export function VendorOptimizationService() {
  return (
    <div className="max-w-3xl space-y-8">
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Sparkles size={120} />
        </div>
        
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-indigo-200 text-sm font-semibold mb-6">
            <Sparkles size={14} /> Ekskluzivna storitev za partnerje
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
            Profesionalna AI Optimizacija Profila
          </h2>
          <p className="text-indigo-100 text-lg mb-8 max-w-xl leading-relaxed">
            Ne izgubljajte časa z iskanjem pravih besed in obdelavo fotografij. Naša ekipa z uporabo najsodobnejših AI orodij prevzame celotno pripravo vašega profila, da ta takoj začne prinašati več rezervacij.
          </p>
          
          <a
            href="mailto:optimizacija@nakmetiji.si?subject=Naročilo%20AI%20optimizacije%20profila"
            className="inline-flex items-center gap-2 bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-white/10"
          >
            <Mail size={18} /> Naroči optimizacijo – 99 €
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: <Camera size={24} className="text-blue-500" />,
            title: "Izboljšava fotografij",
            desc: "Slabe fotografije so glavni razlog za izgubo gostov. AI sistem analizira in popravi svetlobo, kontrast ter barve vaših slik ('Apple-ify' učinek), da kmetija izgleda sanjsko.",
          },
          {
            icon: <PenTool size={24} className="text-emerald-500" />,
            title: "Pisanje zgodbe",
            desc: "Namesto suhoparnega opisa ustvarimo prodajno naravnano, butično zgodbo (copywriting), ki v bralcu prebudi čustva in željo po obisku vaše kmetije.",
          },
          {
            icon: <TrendingUp size={24} className="text-amber-500" />,
            title: "Cenovni svetovalec",
            desc: "Na podlagi vaše regije, opreme in konkurence z AI algoritmom izračunamo optimalno ceno nočitve, s katero boste maksimizirali dobiček in zasedenost.",
          },
        ].map((feature, i) => (
          <div key={i} className="bg-white rounded-2xl p-6 border border-earth-200/60 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-earth-50 flex items-center justify-center mb-4">
              {feature.icon}
            </div>
            <h3 className="text-forest-900 font-bold mb-2">{feature.title}</h3>
            <p className="text-sm text-earth-600 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>
      
      <div className="bg-earth-100 rounded-2xl p-6 text-center text-sm text-earth-600">
        Po prejetem naročilu vas kontaktiramo v 24 urah. Skupaj pregledamo vaš trenutni profil, vi pa nato zgolj potrdite osnutke in spremembe.
      </div>
    </div>
  );
}
