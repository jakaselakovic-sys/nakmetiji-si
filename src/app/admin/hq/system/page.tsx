"use client";

import { useState, useEffect } from "react";
import { Settings, Power, HardDrive, Wifi, ShieldAlert } from "lucide-react";
import { getSystemToggles, setKillSwitch } from "@/lib/actions/hq-system";

export default function SystemHQPage() {
  const [toggles, setToggles] = useState({ oracle_enabled: true, platform_maintenance: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSystemToggles().then(data => {
      setToggles(data);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (feature: "oracle" | "platform") => {
    const newVal = feature === "oracle" ? !toggles.oracle_enabled : !toggles.platform_maintenance;
    
    // Optimistic UI update
    setToggles(prev => ({
      ...prev,
      [feature === "oracle" ? "oracle_enabled" : "platform_maintenance"]: newVal
    }));

    try {
      // In a real scenario, this writes to Upstash Redis and revalidates paths
      await setKillSwitch(feature, newVal);
    } catch {
       // Rollback on fail
       setToggles(prev => ({
        ...prev,
        [feature === "oracle" ? "oracle_enabled" : "platform_maintenance"]: !newVal
      }));
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-8 max-w-4xl">
      <header>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Settings className="text-slate-500" size={32} />
          System HQ
        </h2>
        <p className="text-slate-400 font-medium mt-2">
          Global stability controls and edge-infrastructure kill switches.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kill Switches */}
        <div className="bg-[#16181D] border border-white/10 rounded-3xl p-6">
          <h3 className="font-bold text-slate-200 text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <Power size={16} className="text-rose-500" />
            Kill Switches (Upstash Edge)
          </h3>

          <div className="space-y-6">
            
            {/* Oracle Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0F1115] border border-white/5">
              <div>
                <h4 className="text-white font-bold text-sm">Jože Oracle AI</h4>
                <p className="text-xs text-slate-500 mt-1">Globally disable the LLM concierge if API limits are breached.</p>
              </div>
              <button 
                onClick={() => handleToggle("oracle")}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${toggles.oracle_enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${toggles.oracle_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Maintenance Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#0F1115] border border-rose-500/30">
              <div>
                <h4 className="text-rose-400 font-bold text-sm flex items-center gap-2">
                   Platform Maintenance
                   <ShieldAlert size={14} />
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Forces the entire user-facing app into an &apos;Under Construction&apos; state.</p>
              </div>
              <button 
                onClick={() => handleToggle("platform")}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${!toggles.platform_maintenance ? 'bg-slate-700' : 'bg-rose-500'}`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!toggles.platform_maintenance ? 'translate-x-0' : 'translate-x-5'}`} />
              </button>
            </div>

          </div>
        </div>

        {/* Latency Monitors (Mocked) */}
        <div className="bg-[#16181D] border border-white/10 rounded-3xl p-6">
          <h3 className="font-bold text-slate-200 text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <Wifi size={16} className="text-emerald-500" />
            Provider Latency
          </h3>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <HardDrive size={14} className="text-slate-500" /> Supabase
              </span>
              <span className="text-emerald-400 font-mono text-sm">24ms</span>
            </div>
            <div className="h-px w-full bg-white/5" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <HardDrive size={14} className="text-slate-500" /> Groq Llama3.3
              </span>
              <span className="text-emerald-400 font-mono text-sm">180ms</span>
            </div>
             <div className="h-px w-full bg-white/5" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <HardDrive size={14} className="text-slate-500" /> Vercel Edge API
              </span>
              <span className="text-emerald-400 font-mono text-sm">12ms</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
