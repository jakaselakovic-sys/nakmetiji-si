"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, PartyPopper, X } from "lucide-react";

interface SystemAlert {
  id: string;
  type: "fraud" | "stamp";
  message: string;
  timestamp: Date;
}

/**
 * CommandCenterShell establishes the Supabase Realtime WebSocket connection.
 * It listens for INSERTs on `security_logs` and `green_stamps`.
 */
export function CommandCenterShell() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    // Listen for Fraud / Security Events
    const securitySub = supabase
      .channel('hq_security_monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_logs' },
        (payload: { new: Record<string, unknown> }) => {
          const r = payload.new;
          const newAlert: SystemAlert = {
            id: String(r.id ?? ""),
            type: "fraud",
            message: `⚠ Security Alert: ${r.event_type} at IP ${r.ip_address ?? 'unknown'}`,
            timestamp: new Date()
          };
          setAlerts(prev => [newAlert, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    // Listen for Organic Traffic (Stamps Claimed)
    const stampSub = supabase
      .channel('hq_stamp_monitor')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'green_stamps' },
        (payload: { new: Record<string, unknown> }) => {
          const r = payload.new;
          const newAlert: SystemAlert = {
            id: String(r.id ?? ""),
            type: "stamp",
            message: `🎉 New green stamp collected at farm ${r.kmetija_id}`,
            timestamp: new Date()
          };
          setAlerts(prev => [newAlert, ...prev].slice(0, 5));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(securitySub);
      supabase.removeChannel(stampSub);
    };
  }, [supabase]);

  if (alerts.length === 0) return null;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border backdrop-blur-md min-w-[320px] ${
              alert.type === "fraud" 
                ? "bg-rose-950/80 border-rose-500/50 text-rose-200" 
                : "bg-emerald-950/80 border-emerald-500/50 text-emerald-200"
            }`}
          >
            {alert.type === "fraud" ? <ShieldAlert size={18} className="text-rose-400" /> : <PartyPopper size={18} className="text-emerald-400" />}
            <span className="text-xs font-medium tracking-wide">{alert.message}</span>
            <button 
              onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
              className="ml-auto p-1 opacity-60 hover:opacity-100 transition"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
