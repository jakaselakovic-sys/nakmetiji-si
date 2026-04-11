"use client";

import { motion } from "framer-motion";
import { Leaf, Award, Share2, Camera, Network, HeartHandshake } from "lucide-react";

export function GreenPassportShare() {
  const BADGES = [
    {
      id: 1,
      title: "Pionir Trajnostnega Turizma",
      desc: "Top 10 najbolj vizualno dovršenih kmetij (Founding Partner).",
      icon: <Award size={32} className="text-emerald-400" />,
      color: "from-emerald-900 to-teal-950",
      ring: "ring-emerald-500/50"
    },
    {
      id: 2,
      title: "Lokalna Povezanost",
      desc: "Sodelovanje z več kot 5 lokalnimi dobavitelji (0-km hrana).",
      icon: <HeartHandshake size={32} className="text-amber-400" />,
      color: "from-amber-900 to-orange-950",
      ring: "ring-amber-500/50"
    },
    {
      id: 3,
      title: "Eko Ambasador 2026",
      desc: "Izpolnjeni vsi NaKmetiji zeleni trajnostni standardi.",
      icon: <Leaf size={32} className="text-green-400" />,
      color: "from-green-900 to-emerald-950",
      ring: "ring-green-500/50"
    }
  ];

  const handleShare = (platform: "ig" | "li") => {
    // In a real app, this would use Web Share API or generate an image blob and prompt to share.
    alert(`Deljenje "Green Passport" kartice na ${platform === "ig" ? "Instagram" : "LinkedIn"}... \n(Ta funkcija ustvari grafiko za objavo in oznako @NaKmetiji)`);
  };

  return (
    <div className="rounded-2xl bg-white border border-earth-200/60 shadow-sm overflow-hidden mt-8">
      <div className="px-6 py-5 border-b border-earth-200/60 flex items-center justify-between bg-earth-50/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <Leaf size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-forest-900">Green Passport</h3>
            <p className="text-xs text-earth-500">Vaši trajnostni dosežki in badges</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BADGES.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 bg-gradient-to-br ${badge.color} text-white overflow-hidden group shadow-lg ring-1 ${badge.ring}`}
            >
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              
              <div className="relative z-10">
                <div className="mb-4">
                  {badge.icon}
                </div>
                <h4 className="font-bold text-lg leading-tight mb-2">{badge.title}</h4>
                <p className="text-xs text-white/70 mb-6 font-medium">{badge.desc}</p>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleShare("ig")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg py-2 text-xs font-semibold transition-colors"
                  >
                    <Camera size={14} /> IG Zgodba
                  </button>
                  <button 
                    onClick={() => handleShare("li")}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg py-2 text-xs font-semibold transition-colors"
                  >
                    <Network size={14} /> LinkedIn
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-6 border-t border-dashed border-earth-200 pt-5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex flex-shrink-0 items-center justify-center text-blue-500">
            <Share2 size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-forest-900">Viralna Akcija!</h4>
            <p className="text-sm text-earth-600 mt-1">
              Delite svoj <span className="font-bold">Green Passport</span> na Instagramu, označite <span className="text-blue-600 font-medium">@NaKmetiji</span> in odklenite 10% popust pri letni premium naročnini ali celotedensko izpostavitev na prvi strani.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
