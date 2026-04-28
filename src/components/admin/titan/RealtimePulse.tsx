"use client";

// =============================================================================
// NaKmetiji.si — Titan Realtime Pulse
//
// Four lanes, one WebSocket connection per table:
//   1. Revenue velocity     — INSERT on green_stamps (proxy: organic signal)
//   2. Oracle live-stream   — INSERT on oracle_logs
//   3. Security/fraud       — INSERT on security_logs
//   4. Latency ping         — self-measured client→/api/ping RTT every 10s
//
// Each lane is isolated: one failing channel can't block the others, and
// state updates are capped at 20 items per lane to keep memory flat.
// =============================================================================

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { Activity, Brain, ShieldAlert, Gauge, Radio } from "lucide-react";

type StampEvent = { id: string; kmetija_id: string; created_at: string };
type OracleEvent = { id: string; query: string; created_at: string };
type SecurityEvent = { id: string; event_type: string; ip_address: string | null; created_at: string };

const MAX_EVENTS = 20;
const LATENCY_POLL_MS = 10_000;

export function RealtimePulse() {
  const [stamps, setStamps] = useState<StampEvent[]>([]);
  const [oracle, setOracle] = useState<OracleEvent[]>([]);
  const [security, setSecurity] = useState<SecurityEvent[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);

  const supabaseRef = useRef(createSupabaseBrowser());

  useEffect(() => {
    const supabase = supabaseRef.current;

    const stampSub = supabase
      .channel("titan:stamps")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "green_stamps" }, (p) => {
        const r = p.new as Partial<StampEvent>;
        setStamps((prev) => [{ id: String(r.id ?? crypto.randomUUID()), kmetija_id: r.kmetija_id ?? "?", created_at: r.created_at ?? new Date().toISOString() }, ...prev].slice(0, MAX_EVENTS));
      })
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    const oracleSub = supabase
      .channel("titan:oracle")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "oracle_logs" }, (p) => {
        const r = p.new as Partial<OracleEvent>;
        setOracle((prev) => [{ id: String(r.id ?? crypto.randomUUID()), query: (r.query ?? "").slice(0, 120), created_at: r.created_at ?? new Date().toISOString() }, ...prev].slice(0, MAX_EVENTS));
      })
      .subscribe();

    const securitySub = supabase
      .channel("titan:security")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "security_logs" }, (p) => {
        const r = p.new as Partial<SecurityEvent>;
        setSecurity((prev) => [{ id: String(r.id ?? crypto.randomUUID()), event_type: r.event_type ?? "unknown", ip_address: r.ip_address ?? null, created_at: r.created_at ?? new Date().toISOString() }, ...prev].slice(0, MAX_EVENTS));
      })
      .subscribe();

    const pingLatency = async () => {
      const start = performance.now();
      try {
        await fetch("/api/ping", { cache: "no-store" });
        setLatency(Math.round(performance.now() - start));
      } catch {
        setLatency(null);
      }
    };
    pingLatency();
    const interval = setInterval(pingLatency, LATENCY_POLL_MS);

    return () => {
      supabase.removeChannel(stampSub);
      supabase.removeChannel(oracleSub);
      supabase.removeChannel(securitySub);
      clearInterval(interval);
    };
  }, []);

  const latencyColor = latency === null ? "text-slate-500" : latency < 200 ? "text-emerald-400" : latency < 600 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <Lane
        title="Revenue velocity"
        subtitle="Green-stamp claims"
        icon={<Activity size={14} />}
        color="emerald"
        rate={stamps.length}
        rateLabel={`${stamps.length} last`}
      >
        <AnimatePresence initial={false}>
          {stamps.slice(0, 6).map((e) => (
            <EventRow key={e.id} left={`farm ${e.kmetija_id.slice(0, 8)}…`} right={timeAgo(e.created_at)} tone="emerald" />
          ))}
          {stamps.length === 0 && <Empty>Waiting for first stamp…</Empty>}
        </AnimatePresence>
      </Lane>

      <Lane title="Oracle live-stream" subtitle="Last AI queries" icon={<Brain size={14} />} color="purple" rate={oracle.length} rateLabel={`${oracle.length} last`}>
        <AnimatePresence initial={false}>
          {oracle.slice(0, 6).map((e) => (
            <EventRow key={e.id} left={e.query || "(empty)"} right={timeAgo(e.created_at)} tone="purple" />
          ))}
          {oracle.length === 0 && <Empty>No queries yet…</Empty>}
        </AnimatePresence>
      </Lane>

      <Lane title="Security events" subtitle="Spoofing / fraud attempts" icon={<ShieldAlert size={14} />} color="rose" rate={security.length} rateLabel={`${security.length} last`}>
        <AnimatePresence initial={false}>
          {security.slice(0, 6).map((e) => (
            <EventRow key={e.id} left={`${e.event_type} · ${e.ip_address ?? "?"}`} right={timeAgo(e.created_at)} tone="rose" />
          ))}
          {security.length === 0 && <Empty>All clear.</Empty>}
        </AnimatePresence>
      </Lane>

      <Lane title="Edge latency" subtitle="Client → /api/ping round-trip" icon={<Gauge size={14} />} color="indigo" rate={latency ?? 0} rateLabel={latency === null ? "offline" : `${latency}ms`}>
        <div className="flex flex-col items-center justify-center h-full py-6">
          <div className={`text-5xl font-black tracking-tighter tabular-nums ${latencyColor}`}>{latency ?? "—"}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-2 flex items-center gap-1.5">
            <Radio size={10} className={connected ? "text-emerald-400 animate-pulse" : "text-slate-600"} />
            {connected ? "Realtime connected" : "Realtime connecting…"}
          </div>
        </div>
      </Lane>
    </div>
  );
}

// ─── Presentational primitives ─────────────────────────────────────────────
function Lane({ title, subtitle, icon, color, rate, rateLabel, children }: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: "emerald" | "rose" | "purple" | "indigo";
  rate: number;
  rateLabel: string;
  children: React.ReactNode;
}) {
  const ring = {
    emerald: "border-emerald-500/20",
    rose: "border-rose-500/20",
    purple: "border-purple-500/20",
    indigo: "border-indigo-500/20",
  }[color];
  const badge = {
    emerald: "bg-emerald-500/10 text-emerald-300",
    rose: "bg-rose-500/10 text-rose-300",
    purple: "bg-purple-500/10 text-purple-300",
    indigo: "bg-indigo-500/10 text-indigo-300",
  }[color];

  return (
    <div className={`rounded-2xl border ${ring} bg-[#16181D] p-5 min-h-[260px] flex flex-col`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
            {icon}
            {title}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5 uppercase tracking-widest">{subtitle}</div>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${badge} tabular-nums`} aria-label={`rate ${rate}`}>
          {rateLabel}
        </span>
      </div>
      <div className="flex-1 space-y-1.5 overflow-hidden">{children}</div>
    </div>
  );
}

function EventRow({ left, right, tone }: { left: string; right: string; tone: "emerald" | "rose" | "purple" }) {
  const dot = { emerald: "bg-emerald-400", rose: "bg-rose-400", purple: "bg-purple-400" }[tone];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.18 }}
      className="flex items-center gap-3 text-xs px-2 py-1.5 rounded-lg hover:bg-white/5"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot} flex-shrink-0`} />
      <span className="text-slate-300 truncate flex-1">{left}</span>
      <span className="text-slate-500 tabular-nums flex-shrink-0">{right}</span>
    </motion.div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-slate-600 italic px-2 py-4 text-center">{children}</div>;
}

function timeAgo(iso: string): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
