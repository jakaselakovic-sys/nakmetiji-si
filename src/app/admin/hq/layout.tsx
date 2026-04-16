"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Users, Store, ShieldAlert, Settings, Rocket, LogOut } from "lucide-react";
import { CommandCenterShell } from "@/components/admin/hq/CommandCenterShell";

const hqMenu = [
  { href: "/admin/hq", label: "Analytics Pulse", icon: Activity },
  { href: "/admin/hq/merchants", label: "Merchants CRM", icon: Store },
  { href: "/admin/hq/oracle", label: "Oracle Brain", icon: Users },
  { href: "/admin/hq/security", label: "Security Guard", icon: ShieldAlert },
  { href: "/admin/hq/marketing", label: "Marketing Blast", icon: Rocket },
  { href: "/admin/hq/system", label: "System HQ", icon: Settings },
];

export default function GodModeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-[#0F1115] text-slate-200 overflow-hidden font-sans selection:bg-emerald-500/30">
      
      {/* ── Mission Control Sidebar ── */}
      <aside className="w-64 border-r border-white/10 bg-[#16181D] flex flex-col pt-8 pb-4 relative z-20">
        <div className="px-6 mb-10 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            <h1 className="font-extrabold text-sm tracking-widest text-emerald-400 uppercase">God Mode</h1>
          </div>
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest">Command Center</p>
        </div>

        <nav className="flex-1 px-3 space-y-1.5">
          {hqMenu.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  active 
                    ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] border border-emerald-500/20" 
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                }`}
              >
                <item.icon size={16} className={active ? "text-emerald-400" : "text-slate-500"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 mt-auto">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-rose-400 transition"
          >
            <LogOut size={14} />
            Exit Command Center
          </Link>
        </div>
      </aside>

      {/* ── Main Dashboard Canvas ── */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#0F1115] relative z-10">
        {/* Supabase Listener Topbar */}
        <CommandCenterShell />

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </main>
      
    </div>
  );
}
