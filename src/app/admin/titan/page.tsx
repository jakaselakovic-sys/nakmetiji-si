// =============================================================================
// NaKmetiji.si — Titan AdminHQ dashboard (server component)
//
// Four real-time lanes + kill-switch panel. KPI strip is rendered server-side
// (no loading skeleton for critical numbers), realtime lanes hydrate on
// client connect. CSRF token is minted here and passed to the panel.
// =============================================================================

import { Activity, Users, Store, Stamp, DollarSign } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { issueCsrfToken } from "@/lib/titan/action";
import { readAllFlags } from "@/lib/titan/flags";
import { RealtimePulse } from "@/components/admin/titan/RealtimePulse";
import { KillSwitchPanel } from "@/components/admin/titan/KillSwitchPanel";


interface Kpi {
  label: string;
  value: string | number;
  icon: typeof Activity;
  tone: "emerald" | "amber" | "indigo" | "rose";
}

async function readKpis(): Promise<Kpi[]> {
  const supabase = await createSupabaseServer();
  const since24h = new Date(Date.now() - 86_400_000).toISOString();

  const [usersRes, vendorsRes, stampsRes, bookingsRes] = await Promise.all([
    supabase.from("profili").select("*", { count: "exact", head: true }),
    supabase.from("kmetije").select("*", { count: "exact", head: true }).eq("aktivna", true),
    supabase.from("green_stamps").select("*", { count: "exact", head: true }).gte("created_at", since24h),
    supabase.from("rezervacije").select("*", { count: "exact", head: true }).gte("created_at", since24h),
  ]);

  return [
    { label: "Users", value: usersRes.count ?? 0, icon: Users, tone: "indigo" },
    { label: "Active farms", value: vendorsRes.count ?? 0, icon: Store, tone: "amber" },
    { label: "Stamps · 24h", value: stampsRes.count ?? 0, icon: Stamp, tone: "emerald" },
    { label: "Bookings · 24h", value: bookingsRes.count ?? 0, icon: DollarSign, tone: "rose" },
  ];
}

export default async function TitanHQPage() {
  const [kpis, flags, csrf] = await Promise.all([
    readKpis().catch(() => [] as Kpi[]),
    readAllFlags(),
    issueCsrfToken(),
  ]);

  return (
    <div className="space-y-8 max-w-[1400px]">
      <header className="flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Pulse</h2>
          <p className="text-slate-400 text-xs mt-1 uppercase tracking-widest font-semibold flex items-center gap-2">
            Zero-trust command plane
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
          </p>
        </div>
      </header>

      {/* KPI strip — server rendered, no loading state */}
      {kpis.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      )}

      {/* Realtime lanes */}
      <RealtimePulse />

      {/* Kill-switches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#16181D] p-5 text-xs text-slate-500 leading-relaxed">
          <h3 className="font-bold text-slate-200 text-sm uppercase tracking-widest mb-3">How this works</h3>
          <ul className="space-y-2 list-disc pl-4">
            <li>Every toggle writes to <code className="font-mono text-slate-400">system_config</code> via a Titan-guarded Server Action. Recent AAL2 MFA is required.</li>
            <li>Flips propagate to all clients in ~200ms via Supabase Realtime — no redeploy.</li>
            <li>Every flip is appended to <code className="font-mono text-slate-400">audit_log</code>. The log is append-only: UPDATE/DELETE are blocked at the DB layer.</li>
            <li>Panic cord flips maintenance + disables bookings, signups, and Oracle in one audited call.</li>
          </ul>
        </div>
        <KillSwitchPanel initial={flags} csrfToken={csrf} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, tone }: Kpi) {
  const ring = {
    emerald: "border-emerald-500/20",
    amber: "border-amber-500/20",
    indigo: "border-indigo-500/20",
    rose: "border-rose-500/20",
  }[tone];
  const bg = {
    emerald: "bg-emerald-400/10 text-emerald-400",
    amber: "bg-amber-400/10 text-amber-400",
    indigo: "bg-indigo-400/10 text-indigo-400",
    rose: "bg-rose-400/10 text-rose-400",
  }[tone];
  return (
    <div className={`p-5 rounded-2xl border ${ring} bg-white/5 backdrop-blur-md flex flex-col`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={14} />
        </div>
      </div>
      <div className="text-3xl font-black text-white tracking-tighter tabular-nums">{value}</div>
    </div>
  );
}
