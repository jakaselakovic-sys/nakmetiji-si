"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Newspaper, FileOutput, LibraryBig, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { href: "/admin/cms", label: "Pregled CMS", icon: LibraryBig },
  { href: "/admin/cms/zgodbe", label: "Zgodbe (Blog)", icon: FileText },
  { href: "/admin/cms/novice", label: "Novice", icon: Newspaper },
];

export default function CMSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-stone-50 overflow-hidden text-forest-900">
      
      {/* Sidebar Editor Panel */}
      <aside className="w-64 border-r border-earth-200 bg-white shadow-sm flex flex-col pt-8 pb-4">
        <div className="px-6 mb-8 flex items-center gap-2">
          <Sparkles className="text-amber-500" size={20} />
          <h1 className="font-bold text-lg tracking-tight">Vsebinski Urednik</h1>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active 
                    ? "bg-forest-50 text-forest-800" 
                    : "text-earth-600 hover:bg-earth-100 hover:text-forest-900"
                }`}
              >
                <item.icon size={18} className={active ? "text-forest-600" : "text-earth-400"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 mt-auto">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-xs font-semibold text-earth-500 hover:text-forest-700 transition"
          >
            <FileOutput size={14} />
            Nazaj na glavno ploščo
          </Link>
        </div>
      </aside>

      {/* Main CMS Editor Canvas */}
      <main className="flex-1 overflow-y-auto bg-stone-50/50 relative">
        {/* Subtle patterned background inspired by Apple Notes */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,0,0,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        <div className="relative z-10 p-8 h-full max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
      
    </div>
  );
}
