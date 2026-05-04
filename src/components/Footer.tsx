// =============================================================================
// NaKmetiji.si — Footer
// Deep forest footer with paper grain texture, botanical silhouettes and a
// handwritten sign-off. Feels like the last page of a travel journal.
// =============================================================================

import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { KronikaSubscribeWidget } from "@/components/KronikaSubscribeWidget";
import { Logo } from "@/components/Logo";


export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-forest-950 text-white/80 texture-paper">
      {/* Botanical SVG silhouettes */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-50"
        aria-hidden="true"
        style={{
          background:
            "linear-gradient(180deg, transparent, rgba(45,90,39,0.35))",
        }}
      />
      <WheatSilhouette className="pointer-events-none absolute -top-10 right-10 w-44 text-emerald-300/10 hidden md:block" />
      <PineBranchSilhouette className="pointer-events-none absolute bottom-6 left-6 w-56 text-emerald-300/10 hidden md:block" />

      {/* ── Main footer ── */}
      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-sm">
          <div className="mb-4">
            <Logo size="lg" variant="light" href="/" />
          </div>
          <p className="text-sm leading-relaxed text-white/70 mb-6">
            Vonj sveže pokošene trave, topel kruh iz krušne peči, ptičje
            petje ob zori. To je Slovenija, ki jo varujemo.
          </p>
          <p className="handwritten text-2xl text-emerald-200/80 leading-snug mb-6">
            Se vidimo med griči —
            <span className="block text-emerald-300/90">Ekipa NaKmetiji</span>
          </p>
          <KronikaSubscribeWidget variant="dark" />
        </div>

        {/* Contact row */}
        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-emerald-300/70" />
              <a href="mailto:info@nakmetiji.si" className="hover:text-white transition-colors">
                info@nakmetiji.si
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-emerald-300/70" />
              Ljubljana, Slovenija
            </li>
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-emerald-300/70" />
              <Link href="/o-nas" className="hover:text-white transition-colors">
                Kontakt
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">
            © 2026 NaKmetiji. Vse pravice pridržane.
          </p>
          <p className="text-xs text-white/40">
            Narejeno z ljubeznijo v Sloveniji
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Botanical silhouettes ────────────────────────────────────────────────────

function WheatSilhouette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 120 160" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M60 160 L60 30" />
      {[50, 70, 90, 110, 130].map((y, i) => (
        <g key={i}>
          <ellipse cx={48 - i * 1.5} cy={y} rx="6" ry="12" transform={`rotate(-30 ${48 - i * 1.5} ${y})`} />
          <ellipse cx={72 + i * 1.5} cy={y} rx="6" ry="12" transform={`rotate(30 ${72 + i * 1.5} ${y})`} />
        </g>
      ))}
      <ellipse cx="60" cy="20" rx="6" ry="14" />
    </svg>
  );
}

function PineBranchSilhouette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 60 Q80 55 195 58" />
      {Array.from({ length: 14 }).map((_, i) => {
        const x = 15 + i * 13;
        return (
          <g key={i}>
            <path d={`M${x} 58 L${x - 8} ${40 - (i % 2) * 4}`} />
            <path d={`M${x} 60 L${x - 6} ${78 + (i % 2) * 4}`} />
            <path d={`M${x} 58 L${x - 4} ${44}`} />
            <path d={`M${x} 60 L${x - 2} ${74}`} />
          </g>
        );
      })}
    </svg>
  );
}
