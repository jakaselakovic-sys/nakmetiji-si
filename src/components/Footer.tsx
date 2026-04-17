// =============================================================================
// NaKmetiji.si — Footer
// Zeleno-zemeljski footer z lucide ikonami
// =============================================================================

import Link from "next/link";
import { Leaf, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-forest-900 text-white/80">
      {/* ── Main footer ── */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white">
                <Leaf size={18} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                NaKmetiji
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/70 max-w-xs">
              Vonj sveže pokošene trave, topel kruh iz krušne peči, ptičje
              petje ob zori. To je Slovenija, ki jo varujemo.
            </p>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/35 mb-5">
              Kontakt
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="text-white/35 flex-shrink-0" />
                <a href="mailto:info@nakmetiji.si" className="hover:text-white transition-colors">
                  info@nakmetiji.si
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={14} className="text-white/35 flex-shrink-0" />
                Ljubljana, Slovenija
              </li>
            </ul>
            <div className="mt-6">
              <Link
                href="/o-nas"
                className="inline-flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors"
              >
                <Phone size={13} className="text-white/30" />
                Kontaktirajte nas
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/8">
        <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} NaKmetiji. Vse pravice pridržane.
          </p>
          <p className="text-xs text-white/30">
            Narejeno z ❤️ v Sloveniji
          </p>
        </div>
      </div>
    </footer>
  );
}
