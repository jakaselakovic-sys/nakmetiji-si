import { createSupabaseServer } from "@/lib/supabase/server";
import { Users, Store, Stamp, AlertTriangle, TrendingUp, RefreshCcw, Search } from "lucide-react";
import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

 // Always fresh in HQ

// B16: Fetch top Oracle search trends from the last 7 days
async function getOracleTrends(supabase: SupabaseClient) {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data } = await supabase
      .from("oracle_logs")
      .select("query, vibes, regija")
      .gte("created_at", sevenDaysAgo)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!data || data.length === 0) return null;

    // Count vibe frequencies to surface top trends
    const vibeCounts = new Map<string, number>();
    for (const row of data) {
      const vibes = row.vibes as string[] | null;
      if (vibes) {
        for (const v of vibes) {
          vibeCounts.set(v, (vibeCounts.get(v) ?? 0) + 1);
        }
      }
    }

    // Top 5 queries (deduplicated by first 40 chars)
    const seen = new Set<string>();
    const topQueries: { query: string; count: number }[] = [];
    for (const row of data) {
      const key = (row.query as string).slice(0, 40).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        topQueries.push({ query: row.query as string, count: 1 });
      } else {
        const existing = topQueries.find((q) => q.query.slice(0, 40).toLowerCase() === key);
        if (existing) existing.count++;
      }
      if (topQueries.length >= 8) break;
    }

    const topVibes = [...vibeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { totalQueries: data.length, topQueries: topQueries.slice(0, 5), topVibes };
  } catch {
    return null;
  }
}

export default async function HQDashboardPage() {
  const supabase = await createSupabaseServer();
  
  // Fetch from the materialized view
  const { data: stats, error } = await supabase
    .from("admin_master_stats")
    .select("*")
    .single();

  if (error || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <AlertTriangle className="text-rose-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-200">Database View Offline</h2>
        <p className="text-slate-400 mt-2 text-sm text-center max-w-sm">
          Please run the schema-god-mode.sql snippet in your Supabase dashboard to enable the Analytics Engine.
        </p>
      </div>
    );
  }

  // B16: Fetch real Oracle trends
  const trends = await getOracleTrends(supabase);

  const kpis = [
    { label: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10", border: "border-blue-400/20" },
    { label: "Active Vendors", value: stats.total_vendors, icon: Store, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20" },
    { label: "Est. MRR (Premium)", value: `€${stats.mrr_estimate_eur.toFixed(2)}`, icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
    { label: "Green Stamps 24h", value: stats.stamps_last_24h, icon: Stamp, color: "text-indigo-400", bg: "bg-indigo-400/10", border: "border-indigo-400/20" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">The Pulse</h2>
          <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
            Real-time System Overview
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </p>
        </div>
        <Link 
          href="/admin/hq/marketing"
          className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-indigo-500 hover:from-rose-400 hover:to-indigo-400 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)] rounded-xl py-2.5 px-6 font-bold text-sm transition-all"
        >
          Access Marketing Commander
        </Link>
      </header>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className={`p-5 rounded-2xl border bg-white/5 backdrop-blur-md ${kpi.border} flex flex-col`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{kpi.label}</span>
              <div className={`p-2 rounded-lg ${kpi.bg}`}>
                <kpi.icon size={16} className={kpi.color} />
              </div>
            </div>
            <div className="text-3xl font-black text-white tracking-tighter">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Security Module Alert */}
      {stats.security_alerts_7d > 0 && (
        <div className="mt-8 bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center">
              <AlertTriangle className="text-rose-500" size={24} />
            </div>
            <div>
              <h3 className="text-rose-400 font-bold tracking-tight">Security Alert Payload Detected</h3>
              <p className="text-slate-400 text-sm mt-1">
                There have been {stats.security_alerts_7d} spoofing attempts on the Geolocation verification layer in the past 7 days.
              </p>
            </div>
          </div>
          <Link href="/admin/hq/security" className="mt-4 md:mt-0 text-sm font-semibold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 px-5 py-2.5 rounded-xl transition">
            Investigate Logs
          </Link>
        </div>
      )}

      {/* Grid for Activity Logs & Heatmaps (Mock placeholders for UI spec) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#16181D] p-6 min-h-[300px] flex flex-col relative overflow-hidden">
           <h3 className="font-bold text-slate-300 mb-6 flex items-center gap-2">
             <RefreshCcw size={14} className="text-indigo-400" /> Live Behavior Metrics
           </h3>
           <div className="flex-1 flex items-center justify-center opacity-30">
              <div className="w-full h-full border border-dashed border-slate-700 rounded-xl flex items-center justify-center">
                <span className="text-xs uppercase tracking-widest font-mono text-slate-500">Mapbox Analytics Stream Mount Point</span>
              </div>
           </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#16181D] p-6 min-h-[300px]">
           <h3 className="font-bold text-slate-300 mb-6 border-b border-white/10 pb-4 flex items-center gap-2">
             <Search size={14} className="text-purple-400" />
             Oracle Semantic Trends
             {trends && <span className="ml-auto text-xs text-slate-500 font-normal">{trends.totalQueries} poizvedb / 7d</span>}
           </h3>
           {trends ? (
             <div className="space-y-4">
               {trends.topQueries.map((t, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <span className="text-sm font-medium text-slate-400 truncate pr-4">{t.query}</span>
                   <div className="flex items-center text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded flex-shrink-0">
                     <TrendingUp size={12} className="mr-1" />
                     {t.count}x
                   </div>
                 </div>
               ))}
               {trends.topVibes.length > 0 && (
                 <div className="pt-4 border-t border-white/5">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-2">Top Vibes</p>
                   <div className="flex flex-wrap gap-1.5">
                     {trends.topVibes.map(([vibe, count]) => (
                       <span key={vibe} className="text-xs bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">
                         {vibe} ({count})
                       </span>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           ) : (
             <div className="space-y-4">
               {["Vegan breakfast prekmurje", "Pet friendly zidanice", "Glamping s termalno vodo"].map((trend, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <span className="text-sm font-medium text-slate-400 truncate pr-4">{trend}</span>
                   <div className="flex items-center text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                     <TrendingUp size={12} className="mr-1" />
                     {[12.4, 8.7, 15.2][i] ?? 10}%
                   </div>
                 </div>
               ))}
               <p className="text-[10px] text-slate-600 italic mt-2">Mock podatki — oracle_logs tabela ni najdena.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
