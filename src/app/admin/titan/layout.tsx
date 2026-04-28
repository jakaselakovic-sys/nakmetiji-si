// =============================================================================
// NaKmetiji.si — Titan layout (server component)
//
// Edge middleware already verified super_admin + rate-limited this path, so
// the layout only re-checks defensively (belt + braces) and renders the
// mission-control chrome.
// =============================================================================

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Radar, Flame, Users, FileText, LogOut } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";

const nav = [
  { href: "/admin/titan",              label: "Pulse",      icon: Radar },
  { href: "/admin/titan/flags",        label: "Flags",      icon: Flame },
  { href: "/admin/titan/impersonate",  label: "Impersonate", icon: Users },
  { href: "/admin/titan/audit",        label: "Audit log",  icon: FileText },
];

export default async function TitanLayout({ children }: { children: React.ReactNode }) {
  // Defensive re-check: if someone bypasses middleware (local dev, misconfig),
  // do not render Titan UI.
  const hdrs = await headers();
  const mwVloga = hdrs.get("x-titan-vloga");
  if (mwVloga !== "super_admin") {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    const vloga = (user?.app_metadata as { vloga?: string } | null)?.vloga;
    if (vloga !== "super_admin") redirect("/dashboard");
  }

  return (
    <div className="flex h-screen bg-[#0F1115] text-slate-200 overflow-hidden font-sans selection:bg-amber-500/30">
      <aside className="w-60 border-r border-white/10 bg-[#16181D] flex flex-col pt-8 pb-4 relative z-20">
        <div className="px-6 mb-10">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" />
            <h1 className="font-extrabold text-sm tracking-widest text-amber-400 uppercase">Titan</h1>
          </div>
          <p className="text-[11px] text-slate-500 font-medium uppercase tracking-widest mt-1">Zero-trust root</p>
        </div>

        <nav className="flex-1 px-3 space-y-1.5">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-slate-200 transition"
            >
              <item.icon size={16} className="text-slate-500" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-6 mt-auto">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-rose-400 transition"
          >
            <LogOut size={14} />
            Exit Titan
          </Link>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto p-8 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
