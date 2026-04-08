// =============================================================================
// NaKmetiji.si — Footer
// Zeleno-zemeljski footer z lucide ikonami
// =============================================================================

import Link from "next/link";
import { Leaf, Mail, Phone, MapPin, Camera, Globe, Video } from "lucide-react";

const FOOTER_LINKS = {
  razisci: [
    { label: "Vse kmetije", href: "/kmetije" },
    { label: "Po regijah", href: "/regije" },
    { label: "Kulinarika", href: "/kmetije?tip=kulinarika" },
    { label: "Prenočišča", href: "/kmetije?tip=prenocisce" },
    { label: "Vinski turizem", href: "/kmetije?tip=vino" },
  ],
  zaKmetije: [
    { label: "Dodajte svojo kmetijo", href: "/dodaj-kmetijo" },
    { label: "Premium oglasi", href: "/premium" },
    { label: "Pogoji uporabe", href: "/pogoji" },
  ],
} as const;

const SOCIAL_LINKS = [
  { icon: Camera, label: "Instagram", href: "#" },
  { icon: Globe, label: "Facebook", href: "#" },
  { icon: Video, label: "YouTube", href: "#" },
] as const;

export function Footer() {
  return (
    <footer className="bg-forest-900 text-white/80">
      {/* ── Main footer ── */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-white">
                <Leaf size={18} strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                NaKmetiji
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/70 max-w-xs">
              Odkrijte čar slovenskega podeželja. Turistične kmetije, vinska
              doživetja, kulinarika in nepozabne družinske počitnice.
            </p>
          </div>

          {/* Razišči */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/35 mb-5">
              Razišči
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.razisci.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Za kmetije */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/35 mb-5">
              Za kmetije
            </h3>
            <ul className="space-y-3">
              {FOOTER_LINKS.zaKmetije.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/35 mb-5">
              Kontakt
            </h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-center gap-2.5">
                <Mail size={14} className="text-white/35 flex-shrink-0" />
                info@nakmetiji.si
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={14} className="text-white/35 flex-shrink-0" />
                +386 1 234 5678
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={14} className="text-white/35 flex-shrink-0" />
                Ljubljana, Slovenija
              </li>
            </ul>
            <div className="mt-6 flex gap-3">
              {SOCIAL_LINKS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
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
