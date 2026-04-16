import { Rocket, Target, Users, Zap, CheckCircle2 } from "lucide-react";

export default function MarketingCommanderPage() {
  return (
    <div className="space-y-8 max-w-5xl">
      <header>
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Rocket className="text-indigo-500" size={32} />
          Marketing Commander
        </h2>
        <p className="text-slate-400 font-medium mt-2">
          Orchestrate growth. Blast push notifications and in-app alerts to users based on geographical or behavioral segments.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Campaign Creator Console */}
        <div className="md:col-span-2 bg-[#16181D] border border-white/10 rounded-3xl p-6 flex flex-col">
          <h3 className="font-bold text-slate-200 text-lg mb-6 flex items-center gap-2">
            <Zap size={18} className="text-amber-400" />
            New Blast Campaign
          </h3>

          <div className="space-y-5 flex-1">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Campaign Title (Internal)</label>
              <input 
                type="text" 
                placeholder="E.g., Winter Gorenjska Promo"
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Target Segment</label>
                <select className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none">
                  <option>All Active Users</option>
                  <option>Only Gorenjska Region</option>
                  <option>Users with &lt; 3 Stamps</option>
                  <option>Premium Farm Visitors</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Delivery Method</label>
                <select className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 appearance-none">
                  <option>Push Notification + In-App</option>
                  <option>In-App Toast Only</option>
                  <option>Silent Inbox Drop</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Payload (Message)</label>
              <textarea 
                rows={4}
                placeholder="Only for Gorenjska: 2x points in Bohinj today! Come visit."
                className="w-full bg-[#0F1115] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none"
              />
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-white/10 flex justify-end">
             <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]">
               Deploy Campaign
             </button>
          </div>
        </div>

        {/* Analytics & Active Status */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/20 rounded-3xl p-6">
            <h4 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">Audience Reach</h4>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-extrabold text-white">4,291</span>
              <span className="text-sm text-indigo-300 font-medium mb-1">Opted-in devices</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 w-[78%]" />
            </div>
            <p className="text-[10px] text-slate-500 uppercase mt-2 font-bold tracking-wider text-right">78% Delivery Rate</p>
          </div>

          <div className="bg-[#16181D] border border-white/10 rounded-3xl p-6">
            <h4 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4 flex items-center gap-2">
              <Target size={14} /> Active Campaigns
            </h4>
            
            <div className="space-y-4">
              {/* Campaign Item */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-200 font-semibold truncate">Autumn Wine Probe</span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded uppercase font-bold tracking-widest flex items-center gap-1">
                    <CheckCircle2 size={10} /> Live
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1"><Users size={12}/> 1.2k</span>
                  <span>14% Conv.</span>
                </div>
              </div>
              
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
